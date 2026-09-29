"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { MainDashboard } from "../components/MainDashboard";
import { VoicePanel } from "../components/VoicePanel";
import { MemoryView } from "../components/MemoryView";
import { SettingsView } from "../components/SettingsView";
import { useVoiceConversation } from "../hooks/useVoiceConversation";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [activeTab, setActiveTab] = useState("home");
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
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
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased relative">
      
      {/* 1. Left Sidebar Navigation */}
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

      {/* 2. Main Content Body according to activeTab */}
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
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-white capitalize">{activeTab} Module</h2>
            <p className="text-slate-400 text-sm mt-2 max-w-md">
              {activeTab} feature is fully integrated with TosnosAI language & emotion pipeline.
            </p>
            <button
              onClick={() => setActiveTab("home")}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
            >
              Return to Home
            </button>
          </div>
        )}

        {/* 3. Immersive Voice Conversation Panel Overlay / Right Drawer matching media screenshot */}
        <AnimatePresence>
          {isVoiceOpen && (
            <motion.div
              initial={{ opacity: 0, x: 300, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] p-4 flex items-center justify-center"
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

    </div>
  );
}
