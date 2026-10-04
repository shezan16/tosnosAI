"use client";

import React, { useState, useEffect } from "react";
import { Settings, Cpu, Mic, Volume2, Key, Play } from "lucide-react";
import { VoiceMatcher, VoiceGender } from "@/lib/voice-matcher";

export const SettingsView: React.FC = () => {
  const [geminiModel, setGeminiModel] = useState("gemini-2.5-flash");
  const [groqModel, setGroqModel] = useState("llama-3.3-70b-versatile");
  const [sttProvider, setSttProvider] = useState("web-speech");
  const [ttsProvider, setTtsProvider] = useState("web-speech");

  // Voice Preference State (localStorage)
  const [selectedGender, setSelectedGender] = useState<VoiceGender>("auto");
  const [testLang, setTestLang] = useState<"bn" | "en">("bn");

  useEffect(() => {
    const saved = VoiceMatcher.getSavedGenderPreference();
    setSelectedGender(saved);
  }, []);

  const handleGenderChange = (gender: VoiceGender) => {
    setSelectedGender(gender);
    VoiceMatcher.saveGenderPreference(gender);
  };

  const handlePreviewVoice = (gender: VoiceGender) => {
    VoiceMatcher.previewVoice(gender, testLang === "bn");
  };

  return (
    <div className="flex-1 h-full bg-slate-950 p-6 overflow-y-auto text-slate-100 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-white/10 mb-6">
        <Settings className="w-8 h-8 text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
          <p className="text-xs text-slate-400">Configure AI Router, Voice Selector, and API integrations</p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Voice Selector Card matching requirement #1 & #9 */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Volume2 className="w-5 h-5 text-blue-400" />
              <span>🔊 Voice Selection</span>
            </div>

            {/* Test Language Switcher */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/10 text-xs font-semibold">
              <button
                onClick={() => setTestLang("bn")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  testLang === "bn" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                বাংলা
              </button>
              <button
                onClick={() => setTestLang("en")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  testLang === "en" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                English
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            Select preferred AI voice gender for Bangla (bn-BD) and English (en-US) responses. Saved automatically to your browser.
          </p>

          {/* Voice Gender Options Grid */}
          <div className="space-y-3">
            {[
              { id: "auto", label: "Auto", emoji: "🤖", desc: "Automatically select best available voice per language" },
              { id: "female", label: "Female", emoji: "👩", desc: "Use Bengali or English Female voice (bn-BD / en-US)" },
              { id: "male", label: "Male", emoji: "👨", desc: "Use Bengali or English Male voice (bn-BD / en-US)" },
            ].map((option) => {
              const isSelected = selectedGender === option.id;
              return (
                <div
                  key={option.id}
                  onClick={() => handleGenderChange(option.id as VoiceGender)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-blue-950/40 border-blue-500 text-white shadow-md shadow-blue-500/10"
                      : "bg-slate-950/60 border-white/10 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="voiceGender"
                      checked={isSelected}
                      onChange={() => handleGenderChange(option.id as VoiceGender)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {option.emoji} {option.label}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-mono font-semibold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md border border-blue-500/30">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{option.desc}</p>
                    </div>
                  </div>

                  {/* Preview Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewVoice(option.id as VoiceGender);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-semibold transition-all shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>▶ Preview</span>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Saved Key: <code className="text-blue-300 font-mono">tosnosai_voice_preference = "{selectedGender}"</code></span>
            <button
              onClick={() => handlePreviewVoice(selectedGender)}
              className="text-blue-400 hover:underline font-semibold"
            >
              ▶ Test Current Selection
            </button>
          </div>
        </div>

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
