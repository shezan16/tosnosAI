"use client";

import React, { useState, useEffect } from "react";
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
  ChevronDown, 
  Check 
} from "lucide-react";

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
  onSendMessage: (text: string) => void;
  languageMode: string;
  setLanguageMode: (mode: string) => void;
  personality: string;
  setPersonality: (p: string) => void;
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
  setPersonality
}) => {
  const [seconds, setSeconds] = useState(12);
  const [showPersonalityDropdown, setShowPersonalityDropdown] = useState(false);

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
    switch (state) {
      case "LISTENING": return "“I'm listening...”";
      case "PROCESSING": return "Processing audio...";
      case "THINKING": return "TosnosAI is thinking...";
      case "SPEAKING": return "TosnosAI speaking...";
      case "INTERRUPTED": return "Conversation interrupted";
      case "ERROR": return "Connection retry required";
      default: return "Tap mic to speak";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-full h-full flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-[28px] p-6 shadow-2xl relative overflow-hidden text-slate-800 dark:text-slate-100">
      
      {/* Soft Top Ambient Radial Glow matching screenshot */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-80 h-80 bg-gradient-to-br from-blue-300/30 via-indigo-300/20 to-sky-200/20 blur-3xl pointer-events-none rounded-full" />

      {/* 1. Header Controls matching screenshot */}
      <div className="flex items-center justify-between z-10">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500">
            <MoreHorizontal className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Avatar & Title matching screenshot */}
      <div className="flex flex-col items-center justify-center my-auto py-2 z-10">
        
        {/* Animated Avatar Core */}
        <AnimatedAvatar state={state} emotion={emotion?.emotion} size="xl" />

        {/* Title Badge */}
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">
              TosnosAI
            </span>
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5 font-medium">
            Voice Conversation
          </p>
        </div>

        {/* Language & Personality Pills Row matching screenshot */}
        <div className="flex items-center justify-center gap-2 my-4 z-10 flex-wrap">
          {[
            { id: "auto", label: "🌐 Auto" },
            { id: "bn", label: "বাংলা" },
            { id: "en", label: "English" },
          ].map((lang) => (
            <button
              key={lang.id}
              onClick={() => setLanguageMode(lang.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                languageMode === lang.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105"
                  : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200/80 dark:border-white/10"
              }`}
            >
              {lang.label}
            </button>
          ))}

          {/* Personality Pill Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPersonalityDropdown(!showPersonalityDropdown)}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200/80 dark:border-white/10 flex items-center gap-1 capitalize"
            >
              {personality} <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {showPersonalityDropdown && (
              <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/15 rounded-2xl shadow-2xl z-50 py-1">
                {["casual", "companion", "teacher", "coding", "study", "playful"].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPersonality(p);
                      setShowPersonalityDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-indigo-600/30 hover:text-blue-600 capitalize flex items-center justify-between"
                  >
                    {p}
                    {personality === p && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Emotion Pill Feedback */}
        <AnimatePresence>
          {emotion && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-xs mb-2"
            >
              <span>{emotion.suggested_emoji?.[0] || "✨"}</span>
              <span className="capitalize">{emotion.emotion}</span>
              <span className="text-slate-400">·</span>
              <span className="text-blue-600 font-mono">{Math.round(emotion.intensity * 100)}%</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Listening State & Live Transcript */}
        <div className="text-center my-2">
          <p className="text-slate-900 dark:text-slate-100 text-base font-extrabold tracking-tight">
            {getStatusText()}
          </p>
          {transcript && (
            <p className="mt-2 text-xs text-slate-500 italic max-w-xs mx-auto line-clamp-2 bg-slate-50 dark:bg-black/30 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-white/5">
              “{transcript}”
            </p>
          )}
        </div>

        {/* Sound Waveform & Timer matching screenshot */}
        <div className="w-full max-w-xs flex flex-col items-center mt-2">
          <AudioWaveform state={state} />
          <span className="text-xs font-mono font-medium text-slate-500 mt-2">{formatTimer(seconds)}</span>
        </div>

      </div>

      {/* 3. Main Action Controls Row matching screenshot */}
      <div className="flex items-center justify-evenly py-2 z-10">
        
        {/* Mute Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onToggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${
              isMuted 
                ? "bg-amber-500/20 text-amber-600 border-amber-500/40" 
                : "bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-white/10 hover:bg-slate-200"
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <span className="text-[11px] font-medium text-slate-500">Mute</span>
        </div>

        {/* Big Central Stop Button matching screenshot */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => {
              if (state === "SPEAKING") {
                onInterrupt();
              } else if (state === "LISTENING") {
                onStopListening();
              } else {
                onStartListening();
              }
            }}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all transform active:scale-95 shadow-lg ${
              state === "LISTENING" || state === "SPEAKING"
                ? "bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-rose-500/30 ring-4 ring-rose-200/50 animate-pulse"
                : "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/30 hover:scale-105"
            }`}
          >
            {state === "LISTENING" || state === "SPEAKING" ? (
              <Square className="w-6 h-6 fill-white" />
            ) : (
              <Mic className="w-7 h-7" />
            )}
          </button>
          <span className="text-[11px] font-medium text-slate-500">
            {state === "LISTENING" || state === "SPEAKING" ? "Tap to stop" : "Tap to talk"}
          </span>
        </div>

        {/* Keyboard Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 hover:bg-slate-200 transition-all flex items-center justify-center"
          >
            <Keyboard className="w-5 h-5" />
          </button>
          <span className="text-[11px] font-medium text-slate-500">Keyboard</span>
        </div>

      </div>

      {/* 4. Bottom Tip Card matching screenshot */}
      <div className="mt-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-3.5 flex items-center gap-3 z-10">
        <Sparkles className="w-4 h-4 text-blue-600 dark:text-indigo-400 shrink-0" />
        <p className="text-xs text-indigo-900 dark:text-indigo-200 font-medium leading-relaxed">
          Feel free to talk about anything... Your thoughts, questions, or just a casual chat. 💙
        </p>
      </div>

    </div>
  );
};
