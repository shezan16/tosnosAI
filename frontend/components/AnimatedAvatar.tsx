"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceState } from "@/hooks/useVoiceConversation";
import { Sparkles, Mic, Volume2, AlertTriangle } from "lucide-react";

interface AnimatedAvatarProps {
  state: VoiceState;
  emotion?: string;
  intensity?: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const AnimatedAvatar: React.FC<AnimatedAvatarProps> = ({
  state,
  emotion = "neutral",
  intensity = 0.8,
  size = "md",
  className = "",
}) => {
  const dimensions = {
    sm: "w-16 h-16",
    md: "w-28 h-28",
    lg: "w-44 h-44",
    xl: "w-56 h-56",
  }[size];

  // Emotion-driven soft ambient glow gradients matching screenshot
  const getGlowGradient = () => {
    switch (emotion) {
      case "happy":
      case "excited":
        return "from-amber-300 via-rose-300 to-sky-300 shadow-amber-400/30";
      case "sad":
      case "worried":
        return "from-sky-300 via-blue-400 to-indigo-400 shadow-blue-400/30";
      case "romantic":
      case "playful":
        return "from-pink-300 via-purple-300 to-indigo-400 shadow-pink-400/30";
      default:
        return "from-sky-300 via-blue-400 to-indigo-300 shadow-blue-400/30";
    }
  };

  return (
    <div className={`relative flex items-center justify-center ${dimensions} ${className}`}>
      
      {/* 1. Outer Liquid Ambient Orb Layer matching screenshot */}
      <motion.div
        animate={{
          scale: state === "SPEAKING" ? [1, 1.15, 1.05, 1.2, 1] : state === "LISTENING" ? [1, 1.1, 1] : [1, 1.05, 1],
          opacity: state === "SPEAKING" ? [0.7, 0.95, 0.7] : state === "LISTENING" ? [0.8, 1, 0.8] : 0.6,
          rotate: state === "THINKING" ? 360 : 0,
        }}
        transition={{
          duration: state === "THINKING" ? 2.5 : state === "SPEAKING" ? 1.2 : 3.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute inset-0 rounded-full bg-gradient-to-tr ${getGlowGradient()} blur-2xl opacity-70`}
      />

      {/* 2. Concentric Wave Rings for Speaking & Listening */}
      <AnimatePresence>
        {(state === "SPEAKING" || state === "LISTENING") && (
          <>
            <motion.div
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ scale: 1.35, opacity: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border-2 border-blue-400/40"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0.6 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 1.8, delay: 0.5, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border-2 border-indigo-400/30"
            />
          </>
        )}
      </AnimatePresence>

      {/* 3. Metallic 3D TOSNOS Emblem Orb Core */}
      <motion.div
        animate={{
          y: state === "THINKING" ? [-3, 3, -3] : [0, -5, 0],
          scale: state === "INTERRUPTED" ? [1, 0.92, 1] : 1,
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 w-full h-full rounded-full p-[4px] bg-gradient-to-tr from-slate-200 via-slate-100 to-slate-400 shadow-2xl flex items-center justify-center overflow-hidden border border-white"
      >
        {/* Metallic Emblem Interior Container */}
        <div className="w-full h-full rounded-full bg-gradient-to-b from-slate-900 via-slate-950 to-black p-3 flex flex-col items-center justify-center relative overflow-hidden">
          
          {/* Subtle Background Glow */}
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/40 via-indigo-500/10 to-transparent animate-pulse-slow" />

          {/* TOSNOS Metallic Emblem SVG rendition matching media screenshot */}
          <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
            <svg viewBox="0 0 100 100" className="w-4/5 h-4/5 drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]">
              <defs>
                <linearGradient id="metalGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="50%" stopColor="#cbd5e1" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
              </defs>

              {/* Outer Metallic Ring */}
              <circle cx="50" cy="50" r="45" fill="none" stroke="url(#metalGradLight)" strokeWidth="4" />
              <circle cx="50" cy="50" r="41" fill="none" stroke="#334155" strokeWidth="1" />

              {/* Stylized TOSNOS Geometric Lettering */}
              <path
                d="M30 30 L50 30 L50 70 M40 45 L60 45 M65 30 C75 30 75 45 65 45 C55 45 55 65 70 65"
                fill="none"
                stroke="url(#metalGradLight)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="50" cy="50" r="5" fill="url(#metalGradLight)" />
            </svg>

            {/* State Icon Indicator Overlay */}
            <div className="absolute -bottom-1 flex items-center justify-center bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20">
              {state === "LISTENING" && <Mic className="w-3 h-3 text-emerald-400 animate-pulse" />}
              {state === "SPEAKING" && <Volume2 className="w-3 h-3 text-sky-400 animate-bounce" />}
              {state === "THINKING" && <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />}
              {state === "ERROR" && <AlertTriangle className="w-3 h-3 text-rose-400" />}
              {state === "IDLE" && <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
