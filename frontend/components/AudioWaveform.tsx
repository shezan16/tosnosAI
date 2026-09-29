"use client";

import React from "react";
import { motion } from "framer-motion";
import { VoiceState } from "@/hooks/useVoiceConversation";

interface AudioWaveformProps {
  state: VoiceState;
  barCount?: number;
  className?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  state,
  barCount = 32,
  className = ""
}) => {
  const isActive = state === "LISTENING" || state === "SPEAKING" || state === "PROCESSING";

  return (
    <div className={`flex items-center justify-center gap-1 h-10 px-2 ${className}`}>
      {Array.from({ length: barCount }).map((_, index) => {
        const distFromCenter = Math.abs(index - barCount / 2) / (barCount / 2);
        const baseMultiplier = 1 - distFromCenter * 0.45;

        return (
          <motion.div
            key={index}
            animate={{
              height: isActive
                ? [
                    `${Math.max(15, 20 * baseMultiplier)}%`,
                    `${Math.min(95, (45 + (index % 5) * 12) * baseMultiplier)}%`,
                    `${Math.max(10, 15 * baseMultiplier)}%`
                  ]
                : "15%",
              opacity: isActive ? [0.6, 1, 0.6] : 0.4,
            }}
            transition={{
              duration: isActive ? 0.6 + (index % 4) * 0.15 : 1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: (index % 6) * 0.07,
            }}
            className={`w-1 rounded-full ${
              state === "SPEAKING"
                ? "bg-gradient-to-t from-blue-500 to-indigo-600"
                : state === "LISTENING"
                ? "bg-gradient-to-t from-sky-400 via-blue-500 to-indigo-500"
                : state === "PROCESSING" || state === "THINKING"
                ? "bg-gradient-to-t from-amber-400 to-indigo-500"
                : "bg-blue-400/50"
            }`}
          />
        );
      })}
    </div>
  );
};
