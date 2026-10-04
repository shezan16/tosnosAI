"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Mic, 
  Paperclip, 
  Image as ImageIcon, 
  Send, 
  Search, 
  Grid, 
  Lightbulb, 
  Code2, 
  FileText, 
  GraduationCap, 
  MessageCircle, 
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Menu,
  Plus,
  Volume2,
  VolumeX
} from "lucide-react";
import { MessageItem } from "@/hooks/useVoiceConversation";

interface MainDashboardProps {
  onOpenVoiceMode: () => void;
  messages: MessageItem[];
  onSendMessage: (text: string, files?: any[], skipVoice?: boolean) => void;
  onOpenMobileSidebar: () => void;
  isThinking: boolean;
  activeMode?: "chat" | "voice" | "create" | "tools";
  onSelectMode?: (mode: "chat" | "voice" | "create" | "tools") => void;
  onSpeakText?: (text: string, emotion?: any) => void;
  voiceState?: string;
  onStartListening?: (callbacks?: any) => void;
  onStopListening?: () => Promise<string> | void;
  transcript?: string;
  errorMsg?: string | null;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  onOpenVoiceMode,
  messages,
  onSendMessage,
  onOpenMobileSidebar,
  isThinking,
  activeMode = "voice",
  onSelectMode,
  onSpeakText,
  voiceState = "IDLE",
  onStartListening,
  onStopListening,
  transcript,
  errorMsg
}) => {
  const [inputText, setInputText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedFile, setSelectedFile] = useState<{ name: string; data: string; mimeType: string } | null>(null);
  const [isAutoReadEnabled, setIsAutoReadEnabled] = useState<boolean>(true);
  const [micError, setMicError] = useState<string | null>(null);
  const initialInputRef = useRef<string>("");

  const isListening = voiceState === "LISTENING";

  const handleMicToggle = async () => {
    if (isListening) {
      if (onStopListening) {
        await onStopListening();
      }
    } else {
      setMicError(null);
      initialInputRef.current = inputText;

      if (onStartListening) {
        onStartListening({
          onStart: () => {
            setMicError(null);
          },
          onTranscript: (text: string) => {
            const base = initialInputRef.current;
            const combined = base ? (base.trim() + " " + text) : text;
            setInputText(combined);
          },
          onComplete: (finalText: string) => {
            const base = initialInputRef.current;
            const combined = base ? (base.trim() + " " + finalText) : finalText;
            if (combined) {
              setInputText(combined);
            }
          },
          onError: (err: string) => {
            setMicError(err);
          }
        });
      }
    }
  };

  // Auto scroll to bottom as new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSend = (textOverride?: string) => {
    const textToSend = textOverride || inputText;
    if (!textToSend.trim() && !selectedFile) return;
    const files = selectedFile ? [{ mimeType: selectedFile.mimeType, data: selectedFile.data }] : undefined;
    
    // In Chat mode, default to silent (skipVoice = true) unless user enabled Auto-Read 🔊
    const skipVoice = activeMode === "chat" ? !isAutoReadEnabled : false;
    onSendMessage(textToSend, files, skipVoice);
    setInputText("");
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const base64Data = result.split(',')[1] || result;
        setSelectedFile({
          name: file.name,
          data: base64Data,
          mimeType: file.type || "application/octet-stream"
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTabClick = (mode: "chat" | "voice" | "create" | "tools") => {
    if (onSelectMode) {
      onSelectMode(mode);
    } else if (mode === "voice") {
      onOpenVoiceMode();
    }
  };

  const quickCards = [
    {
      icon: Lightbulb,
      iconColor: "text-amber-500 bg-amber-50 dark:bg-amber-500/10",
      title: "Explain a concept",
      subtitle: "in simple words",
      prompt: "Explain how AI Voice models process audio and language in simple terms."
    },
    {
      icon: Code2,
      iconColor: "text-blue-600 bg-blue-50 dark:bg-blue-500/10",
      title: "Help me with code",
      subtitle: "Debug, optimize, refactor",
      prompt: "I have a backend problem in my project. Can you help me debug?"
    },
    {
      icon: FileText,
      iconColor: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10",
      title: "Summarize a document",
      subtitle: "PDF, notes, articles",
      prompt: "Summarize the key principles of data structures and algorithms."
    },
    {
      icon: GraduationCap,
      iconColor: "text-sky-600 bg-sky-50 dark:bg-sky-500/10",
      title: "Plan my study",
      subtitle: "Create a personalized plan",
      prompt: "Create a 7-day study plan for computer science exams."
    },
    {
      icon: ImageIcon,
      iconColor: "text-purple-600 bg-purple-50 dark:bg-purple-500/10",
      title: "Analyze an image",
      subtitle: "Screenshots, diagrams",
      prompt: "I will upload a screenshot, please help me analyze what's wrong."
    },
    {
      icon: MessageCircle,
      iconColor: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10",
      title: "Let's just talk",
      subtitle: "Open voice conversation",
      action: () => handleTabClick("voice")
    }
  ];

  return (
    <main className="flex-1 h-full flex flex-col justify-between bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 md:p-6 overflow-y-auto relative rounded-3xl m-2 shadow-sm border border-slate-200/60 dark:border-white/10">
      
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf,.txt,.docx"
      />

      {/* Top Header Navigation Bar matching screenshot media_1790721709020.png */}
      <header className="flex items-center justify-between pb-4">
        
        <div className="flex items-center gap-3">
          <button onClick={onOpenMobileSidebar} className="lg:hidden p-2 text-slate-500 hover:text-slate-900">
            <Menu className="w-6 h-6" />
          </button>
          
          {/* Top Pill Segmented Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-900 p-1.5 rounded-full border border-slate-200/70 dark:border-white/10 text-xs font-semibold">
            <button
              onClick={() => handleTabClick("chat")}
              className={`px-4 py-1.5 rounded-full transition-all ${
                activeMode === "chat"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => handleTabClick("voice")}
              className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                activeMode === "voice"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              Voice
            </button>
            <button
              onClick={() => handleTabClick("create")}
              className={`px-4 py-1.5 rounded-full transition-all ${
                activeMode === "create"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Create
            </button>
            <button
              onClick={() => handleTabClick("tools")}
              className={`px-4 py-1.5 rounded-full transition-all ${
                activeMode === "tools"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Tools
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Auto-Read Toggle Button */}
          <button
            onClick={() => setIsAutoReadEnabled(!isAutoReadEnabled)}
            title={isAutoReadEnabled ? "Voice Auto-Read Enabled" : "Silent Text Chat Mode (Voice Muted)"}
            className={`px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 text-xs font-semibold ${
              isAutoReadEnabled
                ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                : "bg-slate-100/80 dark:bg-slate-900 border-slate-200/70 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {isAutoReadEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isAutoReadEnabled ? "Voice On" : "Silent"}</span>
          </button>

          <button className="p-2.5 rounded-full bg-slate-100/80 dark:bg-slate-900 border border-slate-200/70 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <Search className="w-4 h-4" />
          </button>
          <button className="p-2.5 rounded-full bg-slate-100/80 dark:bg-slate-900 border border-slate-200/70 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 my-2 flex flex-col justify-between max-w-3xl w-full mx-auto relative z-10 overflow-hidden">
        
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 my-auto overflow-y-auto pr-1">
            
            {/* Center Greeting Headline matching screenshot */}
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Hello, <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Ridwan</span>
              </h1>
              <p className="text-slate-400 dark:text-slate-400 text-lg md:text-xl font-normal">
                What's on your mind today, my friend?
              </p>
            </div>

            {/* Prompt Action Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl">
              {["🌐 Deep Research", "💡 Think", "🖼️ Create Image", "⬆️ Upload File", "⊞ More"].map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (pill.includes("Upload")) fileInputRef.current?.click();
                  }}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 hover:border-blue-400 hover:bg-slate-100 transition-all shadow-2xs"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* 6 Quick Action Grid Cards matching screenshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full mt-4 text-left">
              {quickCards.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (card.action) {
                        card.action();
                      } else if (card.prompt) {
                        handleSend(card.prompt);
                      }
                    }}
                    className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 hover:border-blue-300 dark:hover:border-indigo-500/40 hover:bg-white dark:hover:bg-slate-900 transition-all cursor-pointer group shadow-2xs flex flex-col justify-between h-32"
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.iconColor} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-indigo-300 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">{card.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        ) : (
          /* Active Chat Stream */
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-sm ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 p-[2px] shrink-0 mt-1">
                    <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
                      <img src="/tosnos-logo.jpg" alt="TosnosAI" className="w-full h-full object-cover rounded-full" />
                    </div>
                  </div>
                )}

                <div className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-500/20"
                    : "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-bl-none shadow-sm"
                }`}>
                  


                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                  <div className="flex items-center justify-between mt-3 pt-2 text-[10px] text-slate-400 border-t border-slate-200/60 dark:border-white/5">
                    <span>{msg.timestamp}</span>
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2">
                        {onSpeakText && (
                          <button
                            onClick={() => onSpeakText(msg.content, msg.emotion)}
                            title="Listen to response voice"
                            className="hover:text-blue-600 dark:hover:text-indigo-400 transition-colors p-0.5"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => copyToClipboard(msg.id, msg.content)} className="hover:text-slate-700 dark:hover:text-white p-0.5">
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => handleSend(msg.content)} className="hover:text-slate-700 dark:hover:text-white p-0.5">
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex gap-3 text-sm justify-start items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 p-[2px] animate-spin">
                  <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center font-bold text-white text-xs">
                    T
                  </div>
                </div>
                <div className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-500 text-xs flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                  TosnosAI is analyzing context & generating response...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* ALWAYS VISIBLE Persistent Prompt Text Input Box Bar */}
        <div className="w-full max-w-3xl mx-auto pt-2 pb-1 z-20 shrink-0">
          
          {selectedFile && (
            <div className="mb-2 p-2 bg-blue-50 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-white/10">
              <span className="truncate">Attached File: <strong>{selectedFile.name}</strong></span>
              <button onClick={() => setSelectedFile(null)} className="font-bold text-rose-500 ml-2">✕</button>
            </div>
          )}

          {/* Error Message Toast/Banner */}
          {(micError || errorMsg) && (
            <div className="mb-2 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30 flex items-center justify-between text-xs text-rose-600 dark:text-rose-300 shadow-sm animate-fadeIn">
              <span className="flex items-center gap-1.5 font-medium">
                <span>⚠️</span> {micError || errorMsg}
              </span>
              <button onClick={() => setMicError(null)} className="ml-2 font-bold text-rose-400 hover:text-rose-600">✕</button>
            </div>
          )}

          {/* Listening State Banner */}
          {isListening && (
            <div className="mb-2 px-3 py-2 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 flex items-center justify-between text-xs text-rose-600 dark:text-rose-300 font-semibold shadow-sm animate-pulse">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <span>Listening... / শুনছি...</span>
              </div>
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">Speak now (Click mic to stop)</span>
            </div>
          )}

          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/15 rounded-full p-2 shadow-lg shadow-slate-200/50 dark:shadow-none focus-within:border-blue-500 transition-all">
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors ml-1"
              title="Add Attachment"
            >
              <Plus className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isListening ? "Listening... speak now" : "Ask TosnosAI anything... (Type or use mic)"}
              className="flex-1 bg-transparent px-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 outline-none font-medium"
            />

            {/* 🎤 Microphone Voice Input Button */}
            <button
              type="button"
              onClick={handleMicToggle}
              className={`p-2 rounded-full transition-all flex items-center justify-center shrink-0 ${
                isListening
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/30 animate-pulse ring-4 ring-rose-300/40"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title={isListening ? "Stop listening (বন্ধ করুন)" : "Voice input (মুখে বলুন)"}
            >
              <Mic className="w-5 h-5" />
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              title="Attach Image"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              title="Attach File"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Glowing Blue Circular Send / Voice Mode Button */}
            <button
              onClick={() => {
                if (inputText.trim() || selectedFile) {
                  handleSend();
                } else {
                  onOpenVoiceMode();
                }
              }}
              className="ml-2 w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all shrink-0"
              title={inputText.trim() || selectedFile ? "Send Message" : "Open Voice Response Panel"}
            >
              {inputText.trim() || selectedFile ? <Send className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

          </div>
        </div>

      </div>

      {/* Footer Tagline matching screenshot */}
      <div className="text-center text-[11px] text-slate-400 dark:text-slate-400 mt-1 font-medium z-10 shrink-0">
        Don't just search. Talk, learn, create, and explore — with <span className="text-slate-900 dark:text-white font-bold">TosnosAI</span>.
      </div>

      {/* Soft Bottom Wave Background Accent */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-blue-50/50 via-purple-50/20 to-transparent dark:from-indigo-950/20 pointer-events-none rounded-b-3xl" />

    </main>
  );
};
