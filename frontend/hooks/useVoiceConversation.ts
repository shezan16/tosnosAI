"use client";

import { useState, useRef, useCallback, useEffect } from "react";

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
  languageMode?: string; // "auto" | "bn" | "en" | "casual"
  onTranscriptChange?: (text: string) => void;
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

  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // 1. Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = options.languageMode === "bn" ? "bn-BD" : "en-US";

        recognition.onstart = () => {
          setVoiceState("LISTENING");
          setErrorMsg(null);
        };

        recognition.onresult = (event: any) => {
          let currentText = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript;
          }
          setTranscript(currentText);
          if (options.onTranscriptChange) {
            options.onTranscriptChange(currentText);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition notice:", event.error);
          if (event.error !== "no-speech") {
            setErrorMsg(`Mic input error: ${event.error}`);
            setVoiceState("ERROR");
          }
        };

        recognition.onend = () => {
          // If we finished listening and have text, trigger processing
        };

        recognitionRef.current = recognition;
      }
    }
  }, [options.languageMode]);

  // 2. Immediate Interruption Engine
  const interrupt = useCallback(() => {
    // A. Stop active TTS synthesis
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // B. Abort ongoing network stream fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // C. Transition state to INTERRUPTED then back to LISTENING
    setVoiceState("INTERRUPTED");
    setTimeout(() => {
      setVoiceState("LISTENING");
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) {}
      }
    }, 400);
  }, []);

  // 3. Text-to-Speech with Emotion Voice Modulation
  const speakResponse = useCallback((text: string, emotionObj?: any) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || isMuted) {
      setVoiceState("IDLE");
      return;
    }

    window.speechSynthesis.cancel(); // Clear queue

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set pitch & rate based on emotion
    const emotion = emotionObj?.emotion || "neutral";
    if (emotion === "happy" || emotion === "excited") {
      utterance.pitch = 1.25;
      utterance.rate = 1.1;
    } else if (emotion === "sad" || emotion === "worried") {
      utterance.pitch = 0.85;
      utterance.rate = 0.9;
    } else if (emotion === "romantic" || emotion === "affectionate") {
      utterance.pitch = 1.05;
      utterance.rate = 0.95;
    } else {
      utterance.pitch = 1.0;
      utterance.rate = 1.0;
    }

    // Select language voice matching output
    const lang = emotionObj?.language || "bn";
    if (lang === "bn" || lang === "banglish") {
      utterance.lang = "bn-BD";
    } else {
      utterance.lang = "en-US";
    }

    utterance.onstart = () => {
      setVoiceState("SPEAKING");
    };

    utterance.onend = () => {
      setVoiceState("IDLE");
    };

    utterance.onerror = (e) => {
      console.warn("TTS utterance notice:", e);
      setVoiceState("IDLE");
    };

    synthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  // 4. Send message to AI & handle emotion, routing, streaming
  const sendMessage = useCallback(async (userText: string, fileAttachments?: any[]) => {
    if (!userText.trim() && (!fileAttachments || fileAttachments.length === 0)) return;

    // If AI is currently speaking, user interupts
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
    setTranscript("");

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
      
      if (data.emotion) {
        setCurrentEmotion(data.emotion);
        if (options.onEmotionDetect) options.onEmotionDetect(data.emotion);
      }

      if (data.provider) setActiveProvider(data.provider);

      const assistantMsg: MessageItem = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: data.response,
        emotion: data.emotion,
        provider: data.provider,
        model: data.model,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
      speakResponse(data.response, data.emotion);

    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Fetch aborted by interruption");
        return;
      }
      console.error("Voice conversation error:", err);
      setErrorMsg("Failed to connect to AI engine");
      setVoiceState("ERROR");
    }
  }, [voiceState, interrupt, options.languageMode, options.personality, messages, speakResponse, options.onEmotionDetect]);

  // 5. Start / Stop listening controls
  const startListening = useCallback(() => {
    if (voiceState === "SPEAKING") {
      interrupt();
      return;
    }
    setTranscript("");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        setVoiceState("LISTENING");
      }
    } else {
      setVoiceState("LISTENING");
    }
  }, [voiceState, interrupt]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (transcript.trim()) {
      sendMessage(transcript);
    } else {
      setVoiceState("IDLE");
    }
  }, [transcript, sendMessage]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return {
    voiceState,
    setVoiceState,
    transcript,
    setTranscript,
    messages,
    currentEmotion,
    activeProvider,
    isMuted,
    toggleMute,
    errorMsg,
    startListening,
    stopListening,
    interrupt,
    sendMessage
  };
}
