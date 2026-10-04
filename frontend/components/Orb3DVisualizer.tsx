"use client";

import React, { useEffect, useRef } from "react";
import { VoiceState } from "@/hooks/useVoiceConversation";
import { AudioAnalyzer } from "@/lib/audio-analyzer";

interface Orb3DVisualizerProps {
  state: VoiceState;
  emotion?: string;
  width?: number;
  height?: number;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  size: number;
  angle: number;
  speed: number;
  radius: number;
  alpha: number;
}

export const Orb3DVisualizer: React.FC<Orb3DVisualizerProps> = ({
  state,
  emotion = "neutral",
  width = 380,
  height = 300,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle High-DPI screens
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Initialize 3D Particle Field
    const particleCount = 45;
    const particles: Particle[] = Array.from({ length: particleCount }, () => {
      return {
        x: (Math.random() - 0.5) * width,
        y: (Math.random() - 0.5) * height,
        z: Math.random() * 200 - 100,
        size: Math.random() * 2.5 + 1,
        angle: Math.random() * Math.PI * 2,
        speed: (Math.random() * 0.015 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
        radius: Math.random() * 70 + 75,
        alpha: Math.random() * 0.7 + 0.3,
      };
    });

    const analyzer = AudioAnalyzer.getInstance();

    // Mouse movement parallax listener
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      mousePosRef.current.targetX = (e.clientX - centerX) / (rect.width / 2);
      mousePosRef.current.targetY = (e.clientY - centerY) / (rect.height / 2);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("mousemove", handleMouseMove);
    }

    // Main 60 FPS Render Loop
    const render = () => {
      timeRef.current += 0.025;
      const time = timeRef.current;

      // Smooth mouse parallax interpolation (lerp)
      mousePosRef.current.x += (mousePosRef.current.targetX - mousePosRef.current.x) * 0.08;
      mousePosRef.current.y += (mousePosRef.current.targetY - mousePosRef.current.y) * 0.08;
      const tiltX = mousePosRef.current.x * 20; // max deg
      const tiltY = mousePosRef.current.y * 20;

      // Fetch Real-Time Audio Frequency Data
      const { frequencyData, volume, bass, mid, high } = analyzer.getFrequencyData();

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2 - 5;
      const maxDimension = Math.min(width, height);
      const baseRadius = Math.max(36, Math.min(58, maxDimension * 0.22));
      const audioPulse = state === "SPEAKING" ? volume * 20 + bass * 12 : state === "LISTENING" ? volume * 12 + 3 : 0;
      const currentRadius = baseRadius + audioPulse + Math.sin(time * 2) * 2;

      ctx.save();
      ctx.translate(centerX, centerY);

      // 1. Draw Outer Ambient Volumetric Glow
      const ambientGlow = ctx.createRadialGradient(0, 0, currentRadius * 0.4, 0, 0, currentRadius * 1.8);
      if (state === "SPEAKING") {
        ambientGlow.addColorStop(0, "rgba(56, 189, 248, 0.45)");
        ambientGlow.addColorStop(0.5, "rgba(79, 70, 229, 0.22)");
        ambientGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else if (state === "LISTENING") {
        ambientGlow.addColorStop(0, "rgba(34, 211, 238, 0.5)");
        ambientGlow.addColorStop(0.6, "rgba(14, 165, 233, 0.2)");
        ambientGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else if (state === "THINKING") {
        ambientGlow.addColorStop(0, "rgba(168, 85, 247, 0.4)");
        ambientGlow.addColorStop(0.6, "rgba(99, 102, 241, 0.2)");
        ambientGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else {
        ambientGlow.addColorStop(0, "rgba(56, 189, 248, 0.25)");
        ambientGlow.addColorStop(0.6, "rgba(59, 130, 246, 0.1)");
        ambientGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      }
      ctx.fillStyle = ambientGlow;
      ctx.beginPath();
      ctx.arc(0, 0, currentRadius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // 2. Render Mirrored Horizontal Frequency Waveform (Bounded within canvas width)
      const isWaveActive = state === "SPEAKING" || state === "LISTENING";
      const maxWaveWidth = Math.max(15, (width / 2) - currentRadius - 22);
      const waveBarCount = Math.min(22, Math.floor(maxWaveWidth / 3.5));
      const waveSpacing = waveBarCount > 0 ? maxWaveWidth / waveBarCount : 3.5;
      const startDist = currentRadius + 14;

      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < waveBarCount; i++) {
          const binIdx = Math.floor((i / waveBarCount) * frequencyData.length * 0.7);
          const freqVal = frequencyData[binIdx] || 0;
          const normFreq = freqVal / 255;

          // Gaussian bell distribution weight
          const distFactor = Math.sin((i / waveBarCount) * Math.PI);
          let barHeight = isWaveActive
            ? Math.max(3, normFreq * (height * 0.18) * distFactor + (side === 1 ? bass : mid) * 12 * distFactor)
            : Math.max(2, Math.sin(time * 3 + i * 0.3) * 4 * distFactor + 2);

          const posX = side * (startDist + i * waveSpacing);
          const posY = Math.sin(time * 2 + i * 0.2) * 2;

          // Prevent waveform from exceeding canvas boundaries
          if (Math.abs(posX) > (width / 2) - 4) continue;

          const barGrad = ctx.createLinearGradient(0, -barHeight, 0, barHeight);
          barGrad.addColorStop(0, "rgba(56, 189, 248, 0.95)");
          barGrad.addColorStop(0.5, "rgba(99, 102, 241, 0.85)");
          barGrad.addColorStop(1, "rgba(168, 85, 247, 0.95)");

          ctx.fillStyle = barGrad;
          ctx.beginPath();
          ctx.roundRect(posX - 1, posY - barHeight / 2, 2.2, barHeight, 2);
          ctx.fill();
        }
      }

      // 3. Render 3D Concentric Energy Rings with Depth & Perspective Rotation
      const drawRing = (rx: number, ry: number, rz: number, radius: number, strokeStyle: string, lineWidth: number, dash?: number[]) => {
        ctx.save();
        ctx.rotate((rz * Math.PI) / 180);
        ctx.scale(1, Math.cos((rx * Math.PI) / 180));
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        if (dash) ctx.setLineDash(dash);
        ctx.stroke();
        ctx.restore();
      };

      const ringPulse = (volume * 10) + (bass * 6);

      // Outer ring 1 (cyan dashed)
      const ring1Rot = time * 20 + tiltX;
      drawRing(65, 0, ring1Rot, currentRadius + Math.min(14, maxDimension * 0.05) + ringPulse, "rgba(34, 211, 238, 0.65)", 1.5, [4, 6]);

      // Outer ring 2 (electric blue solid)
      const ring2Rot = -time * 30 + tiltY;
      drawRing(72, 20, ring2Rot, currentRadius + Math.min(22, maxDimension * 0.08) + ringPulse * 1.1, "rgba(99, 102, 241, 0.55)", 1.2);

      // Outer ring 3 (soft white rim)
      const ring3Rot = time * 12;
      drawRing(80, -10, ring3Rot, currentRadius + Math.min(28, maxDimension * 0.1) + ringPulse * 0.8, "rgba(255, 255, 255, 0.35)", 1, [2, 10]);

      // 4. Radial Frequency Ticks Ring around Orb Perimeter
      const tickCount = 40;
      for (let i = 0; i < tickCount; i++) {
        const tickAngle = (i / tickCount) * Math.PI * 2 + time * 0.1;
        const binIdx = Math.floor((i / tickCount) * (frequencyData.length / 2));
        const freqVal = frequencyData[binIdx] || 0;
        const tickLen = isWaveActive ? 2 + (freqVal / 255) * 12 : 2 + Math.sin(time * 3 + i) * 2;

        const innerR = currentRadius + 3;
        const outerR = innerR + tickLen;

        const x1 = Math.cos(tickAngle) * innerR;
        const y1 = Math.sin(tickAngle) * innerR;
        const x2 = Math.cos(tickAngle) * outerR;
        const y2 = Math.sin(tickAngle) * outerR;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = i % 2 === 0 ? "rgba(56, 189, 248, 0.75)" : "rgba(168, 85, 247, 0.55)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // 5. 3D Floating Particle Orbit Field
      particles.forEach((p) => {
        p.angle += p.speed * (1 + volume * 2);
        const pAudioDist = Math.min(p.radius * (maxDimension / 380), (width / 2) - 15) + (bass * 15);
        const px = Math.cos(p.angle) * pAudioDist + (tiltX * 0.3);
        const py = Math.sin(p.angle) * (pAudioDist * 0.45) + (tiltY * 0.3);
        const sizeFactor = (p.z + 100) / 200;
        const pSize = Math.max(0.8, p.size * sizeFactor * (1 + volume * 0.8));

        ctx.fillStyle = `rgba(${Math.floor(100 + volume * 155)}, 211, 238, ${p.alpha * sizeFactor})`;
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();

        if (pSize > 1.8) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
          ctx.beginPath();
          ctx.arc(px, py, pSize * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 6. Deep Dark Navy 3D Inner Sphere Core
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
      ctx.clip();

      const innerSphereGrad = ctx.createRadialGradient(
        -currentRadius * 0.3 + tiltX * 0.4,
        -currentRadius * 0.3 + tiltY * 0.4,
        currentRadius * 0.05,
        0,
        0,
        currentRadius
      );
      innerSphereGrad.addColorStop(0, "#0b152d");
      innerSphereGrad.addColorStop(0.5, "#060b18");
      innerSphereGrad.addColorStop(1, "#020409");

      ctx.fillStyle = innerSphereGrad;
      ctx.fillRect(-currentRadius, -currentRadius, currentRadius * 2, currentRadius * 2);

      // Inner Neural Spline Threads / Energy Ripples inside sphere
      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.lineWidth = 1.5;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        const threadAngle = time * (0.8 + k * 0.3) + k * 2;
        const waveAmp = (8 + volume * 15) * (k % 2 === 0 ? 1 : -1);
        ctx.moveTo(-currentRadius, Math.sin(threadAngle) * waveAmp);
        ctx.bezierCurveTo(
          -currentRadius * 0.4,
          Math.cos(threadAngle * 1.5) * waveAmp * 1.5,
          currentRadius * 0.4,
          Math.sin(threadAngle * 2) * waveAmp * 1.5,
          currentRadius,
          -Math.sin(threadAngle) * waveAmp
        );
        ctx.stroke();
      }

      // Inner Glowing Core 'T' Logo
      const logoScale = 1 + volume * 0.2 + bass * 0.15;
      ctx.save();
      ctx.scale(logoScale, logoScale);

      // Glow behind 'T'
      const logoGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
      logoGlow.addColorStop(0, "rgba(56, 189, 248, 0.95)");
      logoGlow.addColorStop(0.6, "rgba(79, 70, 229, 0.6)");
      logoGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = logoGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();

      // Stylized Bright Futuristic 'T' Logo Text
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 22px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(56, 189, 248, 1)";
      ctx.shadowBlur = 12;
      ctx.fillText("T", 0, 1);
      ctx.restore();

      ctx.restore(); // end clip

      // 7. Outer Glass Sphere Highlight & Specular Rim Light
      const glassSheen = ctx.createLinearGradient(
        -currentRadius,
        -currentRadius,
        currentRadius,
        currentRadius
      );
      glassSheen.addColorStop(0, "rgba(255, 255, 255, 0.55)");
      glassSheen.addColorStop(0.3, "rgba(255, 255, 255, 0.1)");
      glassSheen.addColorStop(0.7, "rgba(56, 189, 248, 0.05)");
      glassSheen.addColorStop(1, "rgba(34, 211, 238, 0.45)");

      ctx.beginPath();
      ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
      ctx.strokeStyle = glassSheen;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (typeof window !== "undefined") {
        window.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, [state, emotion, width, height]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <canvas ref={canvasRef} style={{ width: `${width}px`, height: `${height}px` }} />
    </div>
  );
};
