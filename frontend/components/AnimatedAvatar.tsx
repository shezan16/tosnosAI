"use client";

import React from "react";
import { VoiceState } from "@/hooks/useVoiceConversation";
import { Orb3DVisualizer } from "./Orb3DVisualizer";

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
  size = "xl",
  className = "",
}) => {
  const pixelSize = {
    sm: { w: 180, h: 130 },
    md: { w: 240, h: 160 },
    lg: { w: 280, h: 180 },
    xl: { w: 330, h: 200 },
  }[size];

  return (
    <div className={`orb-container relative w-full max-w-[340px] h-[180px] sm:h-[200px] mx-auto flex items-center justify-center overflow-hidden shrink-0 z-10 ${className}`}>
      <Orb3DVisualizer
        state={state}
        emotion={emotion}
        width={pixelSize.w}
        height={pixelSize.h}
      />
    </div>
  );
};

