"use client";

import React, { useState, useRef } from "react";
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
  Plus
} from "lucide-react";
import { MessageItem } from "@/hooks/useVoiceConversation";

interface MainDashboardProps {
  onOpenVoiceMode: () => void;
  messages: MessageItem[];
  onSendMessage: (text: string, files?: any[]) => void;
  onOpenMobileSidebar: () => void;
  isThinking: boolean;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  onOpenVoiceMode,
  messages,
  onSendMessage,
  onOpenMobileSidebar,
  isThinking
}) => {
  const [inputText, setInputText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<{ name: string; data: string; mimeType: string } | null>(null);

  const handleSend = () => {
    if (!inputText.trim() && !selectedFile) return;
    const files = selectedFile ? [{ mimeType: selectedFile.mimeType, data: selectedFile.data }] : undefined;
    onSendMessage(inputText, files);
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
      action: onOpenVoiceMode
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

      {/* Top Header Navigation Bar matching screenshot media_1790714067116.png */}
      <header className="flex items-center justify-between pb-4">
        
        <div className="flex items-center gap-3">
          <button onClick={onOpenMobileSidebar} className="lg:hidden p-2 text-slate-500 hover:text-slate-900">
            <Menu className="w-6 h-6" />
          </button>
          
          {/* Top Tabs */}
          <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-900 p-1.5 rounded-full border border-slate-200/70 dark:border-white/10 text-xs font-semibold">
            <button className="px-4 py-1.5 rounded-full text-slate-600 dark:text-slate-400 hover:text-slate-900 transition-colors">Chat</button>
            <button
              onClick={onOpenVoiceMode}
              className="px-4 py-1.5 rounded-full bg-blue-600 text-white shadow-md shadow-blue-500/30 flex items-center gap-1.5"
            >
              <Mic className="w-3.5 h-3.5" />
              Voice
            </button>
            <button className="px-4 py-1.5 rounded-full text-slate-600 dark:text-slate-400 hover:text-slate-900 transition-colors">Create</button>
            <button className="px-4 py-1.5 rounded-full text-slate-600 dark:text-slate-400 hover:text-slate-900 transition-colors">Tools</button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2.5 rounded-full bg-slate-100/80 dark:bg-slate-900 border border-slate-200/70 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <Search className="w-4 h-4" />
          </button>
          <button className="p-2.5 rounded-full bg-slate-100/80 dark:bg-slate-900 border border-slate-200/70 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 my-4 flex flex-col justify-center max-w-3xl w-full mx-auto relative z-10">
        
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center space-y-6 my-auto">
            
            {/* Center Greeting Headline matching screenshot */}
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Hello, <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Ridwan</span>
              </h1>
              <p className="text-slate-400 dark:text-slate-400 text-lg md:text-xl font-normal">
                How can I help you today?
              </p>
            </div>

            {/* Prompt Search Input Box matching exact visual in screenshot */}
            <div className="w-full max-w-2xl relative">
              <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/15 rounded-full p-2 shadow-lg shadow-slate-200/50 dark:shadow-none focus-within:border-blue-500 transition-all">
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors ml-1"
                >
                  <Plus className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask TosnosAI anything..."
                  className="flex-1 bg-transparent px-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 outline-none font-medium"
                />

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

                {/* Glowing Blue Circular Mic Button */}
                <button
                  onClick={() => {
                    if (inputText.trim() || selectedFile) {
                      handleSend();
                    } else {
                      onOpenVoiceMode();
                    }
                  }}
                  className="ml-2 w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all"
                >
                  {inputText.trim() || selectedFile ? (
                    <Send className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>

              </div>
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
                        onSendMessage(card.prompt);
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
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-sm ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 p-[2px] shrink-0 mt-1">
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-white text-xs">
                      T
                    </div>
                  </div>
                )}

                <div className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-500/20"
                    : "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-bl-none shadow-sm"
                }`}>
                  
                  {msg.role === "assistant" && (
                    <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-200 dark:border-white/10 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-indigo-400" />
                        <span className="font-mono text-[10px] uppercase bg-blue-50 dark:bg-indigo-500/20 text-blue-600 dark:text-indigo-300 px-2 py-0.5 rounded-md border border-blue-200 dark:border-indigo-500/30">
                          {msg.provider || "groq"} · {msg.model || "auto"}
                        </span>
                      </div>

                      {msg.emotion && (
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/10 text-[11px] text-slate-700 dark:text-slate-300">
                          <span>{msg.emotion.suggested_emoji?.[0] || "😊"}</span>
                          <span className="capitalize">{msg.emotion.emotion}</span>
                          <span className="text-blue-600 font-mono">{Math.round(msg.emotion.intensity * 100)}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                  <div className="flex items-center justify-between mt-3 pt-2 text-[10px] text-slate-400 border-t border-slate-200/60 dark:border-white/5">
                    <span>{msg.timestamp}</span>
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => copyToClipboard(msg.id, msg.content)} className="hover:text-slate-700 dark:hover:text-white">
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => onSendMessage(msg.content)} className="hover:text-slate-700 dark:hover:text-white">
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
          </div>
        )}

      </div>

      {/* Footer Tagline matching screenshot */}
      <div className="text-center text-xs text-slate-400 dark:text-slate-400 mt-2 font-medium z-10">
        Don't just search. Talk, learn, create, and explore — with <span className="text-slate-900 dark:text-white font-bold">TosnosAI</span>.
      </div>

      {/* Soft Bottom Wave Background Accent */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-blue-50/50 via-purple-50/20 to-transparent dark:from-indigo-950/20 pointer-events-none rounded-b-3xl" />

    </main>
  );
};
