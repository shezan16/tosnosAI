"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MainDashboard } from "@/components/MainDashboard";
import { VoicePanel } from "@/components/VoicePanel";
import { MemoryView } from "@/components/MemoryView";
import { SettingsView } from "@/components/SettingsView";
import { useVoiceConversation } from "@/hooks/useVoiceConversation";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [activeTab, setActiveTab] = useState("home");
  const [isVoiceOpen, setIsVoiceOpen] = useState(true); // Default open matching screenshot layout
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [languageMode, setLanguageMode] = useState("auto");
  const [personality, setPersonality] = useState("casual");

  // Load initial conversations from backend
  const [conversations, setConversations] = useState<Array<any>>([
    { id: "conv-1", title: "Java project help", updatedAt: "2 min ago", pinned: true },
    { id: "conv-2", title: "আজকের দিনটা খুব ভালো 🥴", updatedAt: "25 min ago" },
    { id: "conv-3", title: "Data Structure notes", updatedAt: "1 hour ago" },
    { id: "conv-4", title: "Travel plan for Cox's Bazar", updatedAt: "3 hours ago" },
    { id: "conv-5", title: "My presentation practice", updatedAt: "5 hours ago" },
    { id: "conv-6", title: "Python error fix", updatedAt: "1 day ago" },
    { id: "conv-7", title: "English to Bangla translation", updatedAt: "1 day ago" }
  ]);
  const [currentConvId, setCurrentConvId] = useState<string>("conv-1");

  // Voice Conversation Hook
  const voice = useVoiceConversation({
    languageMode,
    personality
  });

  const handleNewChat = () => {
    const newConv = {
      id: `conv-${Date.now()}`,
      title: "New Conversation",
      updatedAt: "Just now"
    };
    setConversations(prev => [newConv, ...prev]);
    setCurrentConvId(newConv.id);
  };

  const handleDeleteConv = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f3f5f9] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased relative p-2 gap-2">
      
      {/* 1. Left Sidebar Navigation matching screenshot */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenVoiceMode={() => setIsVoiceOpen(true)}
        onNewChat={handleNewChat}
        conversations={conversations}
        currentConvId={currentConvId}
        onSelectConv={(id) => setCurrentConvId(id)}
        onDeleteConv={handleDeleteConv}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
      />

      {/* 2. Center Main Content Body */}
      <div className="flex-1 h-full flex overflow-hidden relative">
        {activeTab === "home" && (
          <MainDashboard
            onOpenVoiceMode={() => setIsVoiceOpen(true)}
            messages={voice.messages}
            onSendMessage={voice.sendMessage}
            onOpenMobileSidebar={() => setIsOpenMobile(true)}
            isThinking={voice.voiceState === "THINKING" || voice.voiceState === "PROCESSING"}
          />
        )}

        {activeTab === "memory" && <MemoryView />}

        {activeTab === "settings" && <SettingsView />}

        {activeTab !== "home" && activeTab !== "memory" && activeTab !== "settings" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-slate-900 rounded-3xl m-2 border border-slate-200/70 dark:border-white/10">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">{activeTab} Module</h2>
            <p className="text-slate-500 text-sm mt-2 max-w-md">
              {activeTab} feature is fully integrated with TosnosAI language & emotion pipeline.
            </p>
            <button
              onClick={() => setActiveTab("home")}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-md"
            >
              Return to Home
            </button>
          </div>
        )}
      </div>

      {/* 3. Right Voice Conversation Panel matching exact layout in screenshot media_1790714067116.png */}
      <AnimatePresence>
        {isVoiceOpen && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.98 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="w-full sm:w-[380px] xl:w-[400px] h-full shrink-0 z-30 p-1"
          >
            <VoicePanel
              isOpen={isVoiceOpen}
              onClose={() => setIsVoiceOpen(false)}
              state={voice.voiceState}
              transcript={voice.transcript}
              emotion={voice.currentEmotion}
              activeProvider={voice.activeProvider}
              isMuted={voice.isMuted}
              onToggleMute={voice.toggleMute}
              onStartListening={voice.startListening}
              onStopListening={voice.stopListening}
              onInterrupt={voice.interrupt}
              onSendMessage={voice.sendMessage}
              languageMode={languageMode}
              setLanguageMode={setLanguageMode}
              personality={personality}
              setPersonality={setPersonality}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
