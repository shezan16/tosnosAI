"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { VoiceMatcher, VoiceGender } from "@/lib/voice-matcher";
import { AudioAnalyzer } from "@/lib/audio-analyzer";
import { MicrophoneController, MicrophoneCallbacks, LanguageMode } from "@/lib/microphone-controller";

export type VoiceState = 
  | "IDLE" 
  | "LISTENING"
  | "PROCESSING" 
  | "THINKING" 
  | "SPEAKING" 
  | "INTERRUPTED" 
  | "ERROR";

export interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  emotion?: {
    language: string;
    emotion: string;
    intensity: number;
    confidence: number;
    tone: string;
    suggested_emoji: string[];
  };
  provider?: string;
  model?: string;
  timestamp: string;
}

export interface UseVoiceOptions {
  personality?: string;
  languageMode?: string; // "auto" | "bn" | "en"
  voiceGender?: VoiceGender;
  onEmotionDetect?: (emotion: any) => void;
}

export function useVoiceConversation(options: UseVoiceOptions = {}) {
  const [voiceState, setVoiceState] = useState<VoiceState>("IDLE");
  const [transcript, setTranscript] = useState<string>("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<any>(null);
  const [activeProvider, setActiveProvider] = useState<string>("groq");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [debugPipelineInfo, setDebugPipelineInfo] = useState<any>(null);

  // Speed & Mode Controls
  const [isContinuousMode, setIsContinuousMode] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const speechRateRef = useRef<number>(1.0);

  useEffect(() => {
    speechRateRef.current = speechRate;
  }, [speechRate]);

  // Persistent Voice Gender Preference
  const [voiceGender, setVoiceGenderState] = useState<VoiceGender>("auto");

  useEffect(() => {
    const saved = VoiceMatcher.getSavedGenderPreference();
    setVoiceGenderState(saved);
  }, []);

  const setVoiceGender = (gender: VoiceGender) => {
    setVoiceGenderState(gender);
    VoiceMatcher.saveGenderPreference(gender);
  };

  // Refs for tracking active TTS objects
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const fallbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const queueRef = useRef<string[]>([]);
  const isQueueActiveRef = useRef<boolean>(false);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      isQueueActiveRef.current = false;
      queueRef.current = [];
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (fallbackAudioRef.current) {
        fallbackAudioRef.current.pause();
        fallbackAudioRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Interruption Engine (Stop TTS Playback)
  const interrupt = useCallback(() => {
    isQueueActiveRef.current = false;
    queueRef.current = [];

    try {
      MicrophoneController.getInstance().abortSession();
    } catch (e) {}

    try {
      AudioAnalyzer.getInstance().setSyntheticSpeaking(false);
    } catch (e) {}

    // Cancel SpeechSynthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (fallbackAudioRef.current) {
      fallbackAudioRef.current.pause();
      fallbackAudioRef.current = null;
    }

    // Abort pending API request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setVoiceState("IDLE");
  }, []);

  // TTS Engine (Text-to-Speech)
  const speakResponse = useCallback((text: string, emotionObj?: any) => {
    if (isMuted) {
      setVoiceState("IDLE");
      return;
    }

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      console.warn("[TTS] SpeechSynthesis not available in browser.");
      setVoiceState("IDLE");
      return;
    }

    const sanitized = VoiceMatcher.sanitizeTextForSpeech(text) || text;
    if (!sanitized || !sanitized.trim()) {
      setVoiceState("IDLE");
      return;
    }

    console.log("[TTS] text:", sanitized);

    const chunks = VoiceMatcher.splitTextIntoSpeechChunks(sanitized, 170);
    const speechChunks = chunks && chunks.length > 0 ? chunks : [sanitized];

    queueRef.current = speechChunks;
    isQueueActiveRef.current = true;

    const playChunkIndex = (index: number) => {
      if (!isQueueActiveRef.current || index >= queueRef.current.length) {
        isQueueActiveRef.current = false;
        queueRef.current = [];
        try {
          AudioAnalyzer.getInstance().setSyntheticSpeaking(false);
        } catch (e) {}
        setVoiceState("IDLE");
        return;
      }

      const chunkText = queueRef.current[index];
      if (!chunkText || !chunkText.trim()) {
        playChunkIndex(index + 1);
        return;
      }

      const isBangla = /[\u0980-\u09FF]/.test(chunkText) || (emotionObj?.language === "bn" || emotionObj?.language === "banglish");
      const targetLang = isBangla ? "bn-BD" : "en-US";
      console.log("[TTS] language:", targetLang);

      const genderPref = options.voiceGender || voiceGender;
      const voiceResult = VoiceMatcher.findBestVoice(chunkText, genderPref, targetLang);
      const selectedVoice = voiceResult.voice;
      console.log("[TTS] voice:", selectedVoice ? selectedVoice.name : "default");

      if (isBangla && !voiceResult.hasNativeVoice) {
        try {
          const audioUrl = `/api/tts?text=${encodeURIComponent(chunkText)}&lang=bn`;
          const audio = new Audio(audioUrl);
          fallbackAudioRef.current = audio;

          try {
            AudioAnalyzer.getInstance().connectAudioElement(audio);
          } catch (e) {}

          audio.onplay = () => {
            console.log("[TTS] started");
            setVoiceState("SPEAKING");
          };
          audio.onended = () => {
            console.log("[TTS] ended");
            if (isQueueActiveRef.current) playChunkIndex(index + 1);
          };
          audio.onerror = (e) => {
            console.error("[TTS] error:", e);
            speakWebSpeechUtterance(chunkText, targetLang, selectedVoice, index);
          };

          audio.play().catch((err) => {
            console.warn("[TTS] fallback audio play notice:", err);
            speakWebSpeechUtterance(chunkText, targetLang, selectedVoice, index);
          });
          return;
        } catch (err) {
          console.warn("[TTS] fallback audio init notice:", err);
        }
      }

      speakWebSpeechUtterance(chunkText, targetLang, selectedVoice, index);
    };

    const speakWebSpeechUtterance = (chunkText: string, targetLang: string, voice: SpeechSynthesisVoice | null, index: number) => {
      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(chunkText);
        utterance.lang = targetLang;

        if (voice) {
          utterance.voice = voice;
        }

        const currentRate = speechRateRef.current || 1.0;
        utterance.rate = Math.max(0.5, Math.min(2.0, currentRate));
        utterance.pitch = (options.voiceGender || voiceGender) === "female" ? 1.1 : (options.voiceGender || voiceGender) === "male" ? 0.9 : 1.0;

        utterance.onstart = () => {
          console.log("[TTS] started");
          try {
            AudioAnalyzer.getInstance().setSyntheticSpeaking(true);
          } catch (e) {}
          setVoiceState("SPEAKING");
        };

        utterance.onend = () => {
          console.log("[TTS] ended");
          try {
            AudioAnalyzer.getInstance().setSyntheticSpeaking(false);
          } catch (e) {}
          if (isQueueActiveRef.current) {
            playChunkIndex(index + 1);
          }
        };

        utterance.onerror = (event) => {
          console.error("[TTS] error", event);
          try {
            AudioAnalyzer.getInstance().setSyntheticSpeaking(false);
          } catch (e) {}
          if (isQueueActiveRef.current) {
            playChunkIndex(index + 1);
          }
        };

        synthesisRef.current = utterance;
        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("[TTS] error", err);
        try {
          AudioAnalyzer.getInstance().setSyntheticSpeaking(false);
        } catch (e) {}
        if (isQueueActiveRef.current) {
          playChunkIndex(index + 1);
        }
      }
    };

    playChunkIndex(0);
  }, [isMuted, voiceGender, options.voiceGender]);

  // Keyboard Message Submission -> AI API -> TTS
  const sendMessage = useCallback(async (userText: string, fileAttachments?: any[], skipVoice?: boolean) => {
    if (!userText.trim() && (!fileAttachments || fileAttachments.length === 0)) return;

    if (voiceState === "SPEAKING") {
      interrupt();
    }

    setVoiceState("THINKING");
    const userMsg: MessageItem = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);

    console.log("[AI] request", userText);

    try {
      abortControllerRef.current = new AbortController();

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          message: userText,
          language: options.languageMode || "auto",
          personality: options.personality || "casual",
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          fileAttachments
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const responseText = data.response;
      
      if (!responseText || !responseText.trim()) {
        throw new Error("Empty AI response received");
      }

      console.log("[AI] response", responseText);

      if (data.emotion) {
        setCurrentEmotion(data.emotion);
        if (options.onEmotionDetect) options.onEmotionDetect(data.emotion);
      }

      if (data.provider) setActiveProvider(data.provider);

      const assistantMsg: MessageItem = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: responseText,
        emotion: data.emotion,
        provider: data.provider,
        model: data.model,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (skipVoice) {
        setVoiceState("IDLE");
      } else {
        speakResponse(responseText, data.emotion);
      }

    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("[TosnosAI Voice] Fetch aborted by user interruption");
        return;
      }
      console.error("[TosnosAI Voice] Conversation error:", err);
      setErrorMsg("Failed to connect to AI engine");
      setVoiceState("ERROR");
    }
  }, [voiceState, interrupt, options.languageMode, options.personality, options.onEmotionDetect, messages, speakResponse]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const startListening = useCallback(async (customCallbacks?: MicrophoneCallbacks) => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

    if (!SpeechRecognitionClass && !hasGetUserMedia) {
      const msg = "Speech recognition is not supported in this browser.";
      setErrorMsg(msg);
      if (customCallbacks?.onError) customCallbacks.onError(msg);
      return;
    }

    if (voiceState === "SPEAKING") {
      interrupt();
    }

    setVoiceState("LISTENING");
    setErrorMsg(null);
    setTranscript("");

    const langMode = (options.languageMode as LanguageMode) || "auto";

    try {
      await MicrophoneController.getInstance().startSession(langMode, {
        onStart: () => {
          setVoiceState("LISTENING");
          if (customCallbacks?.onStart) customCallbacks.onStart();
        },
        onTranscript: (text, isFinal) => {
          setTranscript(text);
          if (customCallbacks?.onTranscript) customCallbacks.onTranscript(text, isFinal);
        },
        onError: (err) => {
          console.warn("[STT Error]", err);
          let friendlyError = err;
          if (err.includes("permission") || err.includes("not-allowed") || err.includes("Denied")) {
            friendlyError = "Microphone permission is required.";
          } else if (err.includes("not supported")) {
            friendlyError = "Speech recognition is not supported in this browser.";
          } else if (err.includes("no-speech")) {
            friendlyError = "No speech detected. Please try speaking again.";
          }
          setErrorMsg(friendlyError);
          setVoiceState("IDLE");
          if (customCallbacks?.onError) customCallbacks.onError(friendlyError);
        },
        onComplete: (finalText) => {
          setTranscript(finalText);
          setVoiceState("IDLE");
          if (customCallbacks?.onComplete) customCallbacks.onComplete(finalText);
        }
      });
    } catch (err: any) {
      console.error("[Microphone] Error starting session:", err);
      let friendlyError = "Microphone is unavailable or in use.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        friendlyError = "Microphone permission is required.";
      }
      setErrorMsg(friendlyError);
      setVoiceState("IDLE");
      if (customCallbacks?.onError) customCallbacks.onError(friendlyError);
    }
  }, [voiceState, interrupt, options.languageMode]);

  const stopListening = useCallback(async () => {
    try {
      const finalText = await MicrophoneController.getInstance().stopSession();
      setTranscript(finalText);
      setVoiceState("IDLE");
      return finalText;
    } catch (err) {
      setVoiceState("IDLE");
      return "";
    }
  }, []);

  return {
    voiceState,
    setVoiceState,
    transcript,
    setTranscript,
    messages,
    setMessages,
    clearMessages,
    currentEmotion,
    activeProvider,
    isMuted,
    toggleMute,
    errorMsg,
    voiceGender,
    setVoiceGender,
    isContinuousMode,
    setIsContinuousMode,
    speechRate,
    setSpeechRate,
    debugPipelineInfo,
    setDebugPipelineInfo,
    startListening,
    stopListening,
    interrupt,
    sendMessage,
    speakResponse
  };
}
