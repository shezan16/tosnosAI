"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedAvatar } from "./AnimatedAvatar";
import { AudioWaveform } from "./AudioWaveform";
import { VoiceState } from "@/hooks/useVoiceConversation";
import { 
  Mic, 
  MicOff, 
  Square, 
  Keyboard, 
  Sparkles, 
  ArrowLeft, 
  MoreHorizontal, 
  Maximize2,
  ChevronRight,
  Check,
  Send,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  X
} from "lucide-react";
import { VoiceMatcher, VoiceGender } from "@/lib/voice-matcher";

interface VoicePanelProps {
  isOpen: boolean;
  onClose: () => void;
  state: VoiceState;
  transcript: string;
  emotion?: any;
  activeProvider?: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onInterrupt: () => void;
  onSendMessage: (text: string, files?: any[], skipVoice?: boolean) => void;
  languageMode: string;
  setLanguageMode: (mode: string) => void;
  personality: string;
  setPersonality: (p: string) => void;
  voiceGender?: VoiceGender;
  setVoiceGender?: (g: VoiceGender) => void;
  isContinuousMode?: boolean;
  setIsContinuousMode?: (c: boolean | ((prev: boolean) => boolean)) => void;
  speechRate?: number;
  setSpeechRate?: (r: number) => void;
  debugPipelineInfo?: any;
}

export const VoicePanel: React.FC<VoicePanelProps> = ({
  isOpen,
  onClose,
  state,
  transcript,
  emotion,
  activeProvider = "groq",
  isMuted,
  onToggleMute,
  onStartListening,
  onStopListening,
  onInterrupt,
  onSendMessage,
  languageMode,
  setLanguageMode,
  personality,
  setPersonality,
  voiceGender = "auto",
  setVoiceGender,
  isContinuousMode = false,
  setIsContinuousMode,
  speechRate = 1.0,
  setSpeechRate,
  debugPipelineInfo
}) => {
  const [seconds, setSeconds] = useState(0);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showKeyboardInput, setShowKeyboardInput] = useState(true);
  const [inputText, setInputText] = useState("");
  const [isDebugMode, setIsDebugMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const settingsSheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsSheetRef.current && !settingsSheetRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoreMenu]);

  useEffect(() => {
    let interval: any = null;
    if (state === "LISTENING" || state === "SPEAKING") {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (state === "IDLE") {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [state]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (state as string) {
      case "THINKING": return "✨ TosnosAI is thinking...";
      case "SPEAKING": return "🔊 TosnosAI speaking...";
      case "INTERRUPTED": return "Conversation interrupted";
      case "ERROR": return "Connection retry required";
      default: return "Type message below to chat & speak";
    }
  };

  const handleKeyboardSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText, undefined, false);
    setInputText("");
  };

  const focusKeyboardInput = () => {
    setShowKeyboardInput(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleGenderSelect = (gender: VoiceGender) => {
    if (setVoiceGender) {
      setVoiceGender(gender);
    }
    VoiceMatcher.saveGenderPreference(gender);
    VoiceMatcher.previewVoice(gender, languageMode === "bn" || languageMode === "auto");
  };

  if (!isOpen) return null;

  return (
    <div className="w-full h-full flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-[28px] p-4 sm:p-5 shadow-2xl relative overflow-hidden text-slate-800 dark:text-slate-100">
      
      {/* Ambient Top Glow */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-80 h-80 bg-gradient-to-br from-blue-300/30 via-indigo-300/20 to-sky-200/20 blur-3xl pointer-events-none rounded-full" />

      {/* 1. Header Section */}
      <div className="flex items-center justify-between z-20 shrink-0 mb-1">
        <button 
          onClick={onClose} 
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          title="Close Panel"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>

        <div className="flex items-center gap-2">
          {/* Developer ML Debug Mode Toggle */}
          <button
            onClick={() => setIsDebugMode(!isDebugMode)}
            title="Toggle Developer ML Debug Mode"
            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all border ${
              isDebugMode
                ? "bg-indigo-600 text-white border-indigo-400 shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-white/10 hover:text-slate-900"
            }`}
          >
            🐞 ML Debug
          </button>

          {/* Settings Trigger Button */}
          <button 
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`p-2 rounded-full transition-all ${
              showMoreMenu 
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/30" 
                : "hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500"
            }`}
            title="Voice Selection & Settings"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main Center Body (Orb Area + Branding Area) */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto py-1 z-10 overflow-hidden">
        
        {/* A. Constrained 3D Orb Area */}
        <div className="orb-area shrink-0 flex items-center justify-center my-1 z-10">
          <AnimatedAvatar state={state} emotion={emotion?.emotion} size="xl" />
        </div>

        {/* B. TosnosAI Branding Area (Never overlapped) */}
        <div className="branding-area shrink-0 flex flex-col items-center justify-center text-center mt-1 z-20">
          <div className="flex items-center justify-center gap-1.5">
            <span className="font-black text-2xl text-slate-900 dark:text-white tracking-tight">
              TosnosAI
            </span>
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5 font-medium">
            Voice & Keyboard Conversation
          </p>

          {/* Floating Glass Pill Status Badge */}
          <div className="mt-2.5 mb-1 px-4 py-1.5 rounded-full bg-blue-50/90 dark:bg-slate-800/90 border border-blue-200/80 dark:border-cyan-500/30 flex items-center justify-center gap-2 shadow-sm backdrop-blur-md">
            <AudioWaveform state={state} barCount={6} className="h-3.5 px-0" />
            <span className="text-xs font-bold text-blue-900 dark:text-cyan-200">
              {getStatusText()}
            </span>
          </div>

          {/* Quick Voice & Settings Pill Row */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className="mt-2 px-3 py-1 rounded-full bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 hover:border-blue-400 transition-all flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300 shadow-2xs hover:scale-102"
          >
            <span className="flex items-center gap-1 text-indigo-600 dark:text-cyan-300 font-bold">
              {languageMode === "bn" ? "🇧🇩 Bangla" : languageMode === "en" ? "🇺🇸 English" : "✨ Auto Lang"}
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="flex items-center gap-1 text-blue-600 dark:text-cyan-400 font-bold">
              <Volume2 className="w-3.5 h-3.5" />
              {voiceGender === "female" ? "👩 Female" : voiceGender === "male" ? "👨 Male" : "🤖 Auto Voice"}
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span>{isContinuousMode ? "🔄 Loop On" : "🔄 Loop Off"}</span>
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>
        </div>

        {/* C. Transcript / Debug Output */}
        <div className="text-center my-1 z-10 shrink-0">
          {transcript && (
            <p className="mt-1 text-xs text-slate-500 italic max-w-xs mx-auto line-clamp-2 bg-slate-50 dark:bg-black/30 px-3 py-1 rounded-xl border border-slate-200/60 dark:border-white/5">
              “{transcript}”
            </p>
          )}

          {/* Developer ML Debug Card */}
          {isDebugMode && (
            <div className="mt-2 p-3 rounded-2xl bg-slate-900/95 text-slate-200 text-[10px] font-mono border border-indigo-500/30 text-left shadow-lg space-y-1">
              <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-1">
                <span className="text-indigo-400 font-bold flex items-center gap-1">🐞 Single STT Multilingual Pipeline</span>
                <span className="text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  {state === "LISTENING" ? "🎙️ LISTENING" : state === "PROCESSING" ? "⚙️ PROCESSING" : "READY"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <div className="col-span-2">Transcript: <span className="text-amber-300 font-semibold truncate block">{debugPipelineInfo?.transcript || transcript || "Waiting..."}</span></div>
                <div>STT Provider: <span className="text-indigo-300 font-semibold">{debugPipelineInfo?.sttProvider || "Single STT"}</span></div>
                <div>Detected Lang: <span className="text-cyan-300 font-bold">{debugPipelineInfo?.detectedLang || emotion?.language || "Auto"}</span></div>
                <div>Response Lang: <span className="text-emerald-300 font-bold">{debugPipelineInfo?.responseLang || "English/Bangla"}</span></div>
                <div>TTS Voice: <span className="text-purple-300 font-bold">{debugPipelineInfo?.ttsVoice || "Auto Voice"}</span></div>
                <div>Latency: <span className="text-rose-300 font-bold">{debugPipelineInfo?.latencyMs ? `${debugPipelineInfo.latencyMs} ms` : "< 300 ms"}</span></div>
                <div>Confidence: <span className="text-blue-300 font-semibold">{Math.round((emotion?.confidence || 0.95) * 100)}%</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Timer Display */}
        <div className="w-full max-w-xs flex flex-col items-center mt-0.5 shrink-0 z-10">
          <span className="text-[11px] font-mono font-medium text-slate-400">{formatTimer(seconds)}</span>
        </div>

      </div>

      {/* 3. Voice Selection & Settings Bottom Sheet Panel */}
      <AnimatePresence>
        {showMoreMenu && (
          <motion.div
            ref={settingsSheetRef}
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-slate-200 dark:border-white/15 rounded-t-[28px] p-5 shadow-2xl z-[100] max-h-[80vh] overflow-y-auto flex flex-col gap-4 text-slate-800 dark:text-slate-100"
          >
            {/* Sheet Handle & Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <span className="font-bold text-sm tracking-wide uppercase text-slate-900 dark:text-white">
                  Voice & Language Settings
                </span>
              </div>
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Language Mode Selection (AUTO / ENGLISH / BANGLA) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                🌐 Speech Recognition Language Mode
              </label>
              <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10">
                {[
                  { id: "auto", label: "✨ AUTO" },
                  { id: "bn", label: "🇧🇩 BANGLA" },
                  { id: "en", label: "🇺🇸 ENGLISH" },
                ].map((l) => {
                  const isSelected = languageMode === l.id;
                  return (
                    <button
                      key={l.id}
                      onClick={() => setLanguageMode(l.id)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                        isSelected
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 scale-102"
                          : "text-slate-700 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-white/10"
                      }`}
                    >
                      {l.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 1. Voice Selection (Auto / Female / Male) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-blue-500" /> Voice Selection
              </label>
              <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10">
                {[
                  { id: "auto", label: "🤖 Auto" },
                  { id: "female", label: "👩 Female" },
                  { id: "male", label: "👨 Male" },
                ].map((v) => {
                  const isSelected = voiceGender === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleGenderSelect(v.id as VoiceGender)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                        isSelected
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 scale-102"
                          : "text-slate-700 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-white/10"
                      }`}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Auto Listen / Continuous Loop */}
            {setIsContinuousMode && (
              <div className="flex items-center justify-between bg-slate-100/80 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-white/10">
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Auto Listen</span>
                  <span className="text-[11px] text-slate-400">Listen automatically after speaking</span>
                </div>
                <button
                  onClick={() => setIsContinuousMode(prev => !prev)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    isContinuousMode
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-white/10"
                  }`}
                >
                  {isContinuousMode ? "On" : "Off"}
                </button>
              </div>
            )}

            {/* 3. Speech Speed */}
            {setSpeechRate && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Speech Speed
                </label>
                <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10">
                  {[0.8, 1.0, 1.2].map((r) => (
                    <button
                      key={r}
                      onClick={() => setSpeechRate(r)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                        speechRate === r
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-white/10"
                      }`}
                    >
                      {r}x
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. AI Personality */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                AI Personality
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10">
                {["casual", "companion", "teacher", "coding", "study", "playful"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPersonality(p)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium capitalize text-left transition-all flex items-center justify-between ${
                      personality === p
                        ? "bg-blue-600 text-white font-bold shadow-sm"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/10"
                    }`}
                  >
                    {p}
                    {personality === p && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Done / Close Button */}
            <button
              onClick={() => setShowMoreMenu(false)}
              className="w-full mt-1 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-blue-500/25 hover:opacity-95 transition-opacity"
            >
              Done & Save Settings
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Keyboard Chat Input Field */}
      <div className="w-full my-2 z-20 shrink-0">
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-white/15 focus-within:border-blue-500 rounded-2xl p-1.5 shadow-sm transition-all">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleKeyboardSend()}
            placeholder="Type your message with keyboard..."
            className="flex-1 bg-transparent px-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none font-medium"
          />
          <button
            onClick={handleKeyboardSend}
            className="w-8 h-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm"
            title="Send Message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5. Bottom Control Buttons Bar */}
      <div className="flex items-center justify-evenly py-1 z-20 shrink-0">
        
        {/* Mute Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onToggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${
              isMuted 
                ? "bg-amber-500/20 text-amber-600 border border-amber-500/40" 
                : "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 border-slate-200/80 dark:border-white/10"
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <span className="text-[10px] font-semibold text-slate-500">Mute TTS</span>
        </div>

        {/* Big Central Action Button (Stop Audio when speaking / Send when typing) */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => {
              if (state === "SPEAKING") {
                onInterrupt();
              } else {
                handleKeyboardSend();
              }
            }}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all transform active:scale-95 shadow-xl ${
              state === "SPEAKING"
                ? "bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-rose-500/30 ring-4 ring-rose-200/50 animate-pulse"
                : "bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white shadow-blue-500/40 hover:scale-105"
            }`}
          >
            {state === "SPEAKING" ? (
              <Square className="w-5 h-5 fill-white" />
            ) : (
              <Send className="w-6 h-6" />
            )}
          </button>
          <span className="text-[10px] font-semibold text-slate-500">
            {state === "SPEAKING" ? "Stop Voice" : "Send & Speak"}
          </span>
        </div>

        {/* Keyboard Focus Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={focusKeyboardInput}
            className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 hover:bg-slate-200 transition-all flex items-center justify-center"
          >
            <Keyboard className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-semibold text-slate-500">Keyboard</span>
        </div>

      </div>

      {/* 6. Bottom Tip Card */}
      <div
        onClick={focusKeyboardInput}
        className="mt-1 bg-blue-50/80 dark:bg-indigo-950/40 border border-blue-100 dark:border-indigo-500/20 rounded-2xl p-3 flex items-center justify-between z-10 shrink-0 cursor-pointer hover:bg-blue-100/80 transition-colors"
      >
        <div className="flex items-center gap-2 truncate">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-indigo-400 shrink-0" />
          <p className="text-xs text-blue-900 dark:text-indigo-200 font-medium truncate">
            Feel free to talk or type about anything...
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-blue-600 dark:text-indigo-400 shrink-0" />
      </div>

    </div>
  );
};
