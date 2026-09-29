"use client";

import React, { useState } from "react";
import { Settings, Cpu, Mic, Volume2, Shield, Key } from "lucide-react";

export const SettingsView: React.FC = () => {
  const [geminiModel, setGeminiModel] = useState("gemini-2.5-flash");
  const [groqModel, setGroqModel] = useState("llama-3.3-70b-versatile");
  const [sttProvider, setSttProvider] = useState("web-speech");
  const [ttsProvider, setTtsProvider] = useState("web-speech");

  return (
    <div className="flex-1 h-full bg-slate-950 p-6 overflow-y-auto text-slate-100 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-white/10 mb-6">
        <Settings className="w-8 h-8 text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
          <p className="text-xs text-slate-400">Configure AI Router, Voice Pipeline, and API integrations</p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* AI Router Configuration */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-white">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <span>AI Provider & Models Configuration</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Gemini Model (Complex Reasoning & Multimodal)</label>
              <select
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Groq Model (Low-Latency Real-Time Voice)</label>
              <select
                value={groqModel}
                onChange={(e) => setGroqModel(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
              >
                <option value="llama-3.3-70b-versatile">LLaMA 3.3 70B Versatile (Groq)</option>
                <option value="llama-3.1-8b-instant">LLaMA 3.1 8B Instant (Groq)</option>
                <option value="mixtral-8x7b-32768">Mixtral 8x7b (Groq)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Voice Pipeline Providers */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-white">
            <Mic className="w-5 h-5 text-emerald-400" />
            <span>Voice Pipeline Providers</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">STT Provider (Speech-To-Text)</label>
              <select
                value={sttProvider}
                onChange={(e) => setSttProvider(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
              >
                <option value="web-speech">Web Speech API (Built-in Multilingual)</option>
                <option value="groq-whisper">Groq Whisper API (Cloud)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">TTS Provider (Text-To-Speech)</label>
              <select
                value={ttsProvider}
                onChange={(e) => setTtsProvider(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
              >
                <option value="web-speech">Web Speech Synthesis (Emotion Modulated)</option>
                <option value="elevenlabs">ElevenLabs Multilingual (Cloud)</option>
                <option value="edge-tts">Edge TTS Multilingual (Cloud)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security & Secrets Note */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Environment Secrets</h3>
              <p className="text-xs text-slate-400">API Keys are securely maintained in server environment variables (.env)</p>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
            Protected
          </span>
        </div>

      </div>
    </div>
  );
};
