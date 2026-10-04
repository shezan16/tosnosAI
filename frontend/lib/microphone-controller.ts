"use client";

import { AudioAnalyzer } from "./audio-analyzer";

export type LanguageMode = "auto" | "en" | "bn";

export interface MicrophoneCallbacks {
  onStart?: () => void;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onComplete?: (finalTranscript: string) => void;
}

/**
 * Clean STT Provider Abstraction interface.
 * Enables adding future multilingual STT providers (e.g. Whisper WebGPU, Vosk, Deepgram, etc.)
 * without changing the UI or AI pipeline.
 */
export interface STTProvider {
  id: string;
  name: string;
  startSession(languageMode: LanguageMode, callbacks: MicrophoneCallbacks): Promise<void>;
  stopSession(): Promise<string>;
  abortSession(): void;
  isSessionActive(): boolean;
}

/**
 * Controller for managing the single Microphone & Speech Recognition session.
 * 
 * Enforces:
 * 1. Only ONE recognition instance per voice session.
 * 2. Never run English and Bangla recognition simultaneously.
 * 3. Never create duplicate event listeners.
 * 4. Controlled auto-submit on sentence end & restart on initial hesitation (max 3 restarts).
 * 5. Properly stop and cleanup recognition and audio tracks.
 * 6. Prevent duplicate AI requests.
 * 7. Prevent race conditions.
 * 8. Single microphone MediaStream (no duplicate streams or AudioContexts).
 */
export class MicrophoneController implements STTProvider {
  private static instance: MicrophoneController | null = null;

  public id = "browser-speech-recognition";
  public name = "Single Browser Speech Recognition Controller";

  private recognition: any = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  private activeSessionId: string | null = null;
  private isListening: boolean = false;
  private hasDispatchedResult: boolean = false;
  private currentTranscript: string = "";
  private currentCallbacks: MicrophoneCallbacks | null = null;
  private restartCount: number = 0;

  private constructor() {}

  public static getInstance(): MicrophoneController {
    if (!MicrophoneController.instance) {
      MicrophoneController.instance = new MicrophoneController();
    }
    return MicrophoneController.instance;
  }

  public isSessionActive(): boolean {
    return this.isListening;
  }

  /**
   * Cleans up existing recognition instance, event listeners, and media stream tracks.
   */
  private cleanup(): void {
    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.abort();
      } catch (e) {
        // Safe catch if already terminated
      }
      this.recognition = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      try {
        this.mediaRecorder.stop();
      } catch (e) {}
    }
    this.mediaRecorder = null;

    AudioAnalyzer.getInstance().disconnectMicrophone();

    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      this.mediaStream = null;
    }

    this.audioChunks = [];
    this.isListening = false;
    this.restartCount = 0;
  }

  /**
   * Starts a SINGLE speech recognition & microphone capture session.
   */
  public async startSession(
    languageMode: LanguageMode,
    callbacks: MicrophoneCallbacks
  ): Promise<void> {
    // 1. Teardown any pre-existing session to prevent duplicate instances
    this.cleanup();

    const sessionId = `stt-session-${Date.now()}`;
    this.activeSessionId = sessionId;
    this.hasDispatchedResult = false;
    this.currentTranscript = "";
    this.currentCallbacks = callbacks;
    this.audioChunks = [];
    this.restartCount = 0;

    // 2. Request single microphone stream for visualizer and audio recording fallback
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices) {
        throw new Error("Microphone API not supported on this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (this.activeSessionId !== sessionId) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      this.mediaStream = stream;
      this.isListening = true;

      // Connect stream to single AudioAnalyzer instance for 3D Orb / AudioWaveform visualization
      AudioAnalyzer.getInstance().connectMicrophoneStream(stream);

      // Setup MediaRecorder on SAME stream as audio fallback for server STT if needed
      if (typeof MediaRecorder !== "undefined") {
        try {
          let recorderOptions: MediaRecorderOptions | undefined = undefined;
          if (MediaRecorder.isTypeSupported("audio/webm")) {
            recorderOptions = { mimeType: "audio/webm" };
          } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
            recorderOptions = { mimeType: "audio/mp4" };
          } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
            recorderOptions = { mimeType: "audio/ogg" };
          }

          const recorder = recorderOptions ? new MediaRecorder(stream, recorderOptions) : new MediaRecorder(stream);
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              this.audioChunks.push(e.data);
            }
          };
          this.mediaRecorder = recorder;
          recorder.start(250);
        } catch (recErr) {
          console.warn("[MicrophoneController] MediaRecorder setup notice:", recErr);
        }
      }
    } catch (err: any) {
      console.warn("[MicrophoneController] Microphone access error:", err);
      if (callbacks.onError) {
        callbacks.onError(err.message || "Microphone permission required");
      }
      this.cleanup();
      return;
    }

    if (callbacks.onStart) {
      callbacks.onStart();
    }

    // 3. Initialize single SpeechRecognition instance
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      console.warn("[MicrophoneController] Web SpeechRecognition API not supported on this browser. Using server audio recorder fallback.");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = true;

    // Set recognition language:
    // English mode -> en-US
    // Bangla mode  -> bn-BD
    // Auto mode    -> bn-BD as primary recognition locale for browser Web Speech
    if (languageMode === "en") {
      recognition.lang = "en-US";
    } else if (languageMode === "bn") {
      recognition.lang = "bn-BD";
    } else {
      recognition.lang = "bn-BD";
    }

    // Event Listeners (Registered ONCE per session)
    recognition.onstart = () => {
      if (this.activeSessionId !== sessionId) return;
      this.isListening = true;
    };

    recognition.onresult = (event: any) => {
      if (this.activeSessionId !== sessionId) return;

      let transcriptAcc = "";
      let isFinal = false;

      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        transcriptAcc += res[0].transcript;
        if (res.isFinal) isFinal = true;
      }

      this.currentTranscript = transcriptAcc;
      if (this.currentCallbacks?.onTranscript) {
        this.currentCallbacks.onTranscript(transcriptAcc, isFinal);
      }
    };

    recognition.onerror = (event: any) => {
      if (this.activeSessionId !== sessionId) return;
      console.warn("[MicrophoneController] Recognition notice:", event.error);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        if (this.currentCallbacks?.onError) {
          this.currentCallbacks.onError("Microphone permission is required.");
        }
      } else if (event.error === "no-speech") {
        if (this.currentCallbacks?.onError) {
          this.currentCallbacks.onError("No speech detected. Please try speaking again.");
        }
      } else if (event.error === "audio-capture") {
        if (this.currentCallbacks?.onError) {
          this.currentCallbacks.onError("Microphone is unavailable or in use.");
        }
      } else if (event.error !== "aborted") {
        if (this.currentCallbacks?.onError) {
          this.currentCallbacks.onError("Speech recognition error occurred.");
        }
      }
    };

    recognition.onend = () => {
      if (this.activeSessionId !== sessionId) return;

      if (this.isListening && !this.hasDispatchedResult) {
        if (this.currentTranscript.trim().length > 0) {
          this.stopSession();
        } else if (this.restartCount < 3) {
          this.restartCount++;
          try {
            this.recognition?.start();
          } catch (e) {
            this.stopSession();
          }
        } else {
          this.stopSession();
        }
      }
    };

    this.recognition = recognition;

    try {
      recognition.start();
    } catch (e: any) {
      if (e.name !== "InvalidStateError") {
        console.warn("[MicrophoneController] recognition.start notice:", e);
      }
    }
  }

  /**
   * Stops the current microphone session cleanly and returns the final transcript.
   * Prevents duplicate completions using `hasDispatchedResult` flag.
   */
  public async stopSession(): Promise<string> {
    const sessionId = this.activeSessionId;
    if (!sessionId || this.hasDispatchedResult) {
      return this.currentTranscript;
    }

    // Mark dispatched to prevent race conditions or duplicate AI requests
    this.hasDispatchedResult = true;
    this.isListening = false;

    // Disconnect stream & recorders immediately
    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.stop();
      } catch (e) {}
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      try {
        this.mediaRecorder.stop();
      } catch (e) {}
    }

    AudioAnalyzer.getInstance().disconnectMicrophone();

    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      this.mediaStream = null;
    }

    let finalText = this.currentTranscript.trim();

    // Fallback: If Web Speech transcript was empty, check recorded audio chunks with server STT (/api/stt)
    if (!finalText && this.audioChunks.length > 0) {
      try {
        const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || "audio/webm" });
        if (audioBlob.size > 1000) {
          const formData = new FormData();
          formData.append("file", audioBlob, "recording.webm");

          const res = await fetch("/api/stt", { method: "POST", body: formData });
          if (res.ok) {
            const data = await res.json();
            if (data.text && data.text.trim()) {
              finalText = data.text.trim();
            }
          }
        }
      } catch (sttErr) {
        console.warn("[MicrophoneController] Server STT fallback notice:", sttErr);
      }
    }

    const callbacks = this.currentCallbacks;
    this.cleanup();
    this.activeSessionId = null;
    this.currentCallbacks = null;

    if (callbacks?.onComplete) {
      callbacks.onComplete(finalText);
    }

    return finalText;
  }

  /**
   * Immediately aborts current microphone session without processing transcript.
   */
  public abortSession(): void {
    this.hasDispatchedResult = true;
    this.activeSessionId = null;
    this.currentCallbacks = null;
    this.currentTranscript = "";
    this.cleanup();
  }
}
