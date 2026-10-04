"use client";

import React from "react";
import { 
  Plus, 
  Home, 
  Compass, 
  Mic, 
  Wrench, 
  Folder, 
  Brain, 
  Settings, 
  MessageSquare, 
  ChevronDown,
  Sparkles,
  Trash2
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenVoiceMode: () => void;
  onNewChat: () => void;
  conversations: Array<{ id: string; title: string; updatedAt: string; pinned?: boolean }>;
  currentConvId?: string;
  onSelectConv: (id: string) => void;
  onDeleteConv: (id: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenVoiceMode,
  onNewChat,
  conversations,
  currentConvId,
  onSelectConv,
  onDeleteConv,
  isOpenMobile,
  onCloseMobile
}) => {
  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "explore", label: "Explore", icon: Compass },
    { id: "voice", label: "Voice Mode", icon: Mic, action: onOpenVoiceMode },
    { id: "tools", label: "AI Tools", icon: Wrench },
    { id: "projects", label: "Projects", icon: Folder },
    { id: "memory", label: "Memory", icon: Brain },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside
      className={`fixed lg:relative z-40 top-0 left-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200/70 dark:border-white/10 p-4 flex flex-col justify-between transition-transform duration-300 shadow-sm ${
        isOpenMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="flex flex-col h-full overflow-hidden">
        
        {/* 1. Brand Logo Header matching screenshot media_1790714067116.png */}
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          {/* TOSNOS Metallic Circular Emblem from uploaded image */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-200 via-slate-100 to-slate-400 p-[2px] shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center relative overflow-hidden">
              <img
                src="/tosnos-logo.jpg"
                alt="TosnosAI Metallic Logo"
                className="w-full h-full object-cover rounded-full select-none"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                TosnosAI
              </span>
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-indigo-400" />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Type and talk
            </p>
          </div>
        </div>

        {/* 2. New Chat Button Pill */}
        <button
          onClick={onNewChat}
          className="w-full py-2.5 px-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-semibold text-xs flex items-center gap-2.5 border border-slate-200/80 dark:border-white/10 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm group my-2"
        >
          <Plus className="w-4 h-4 text-blue-600 dark:text-indigo-400 group-hover:rotate-90 transition-transform" />
          <span>New chat</span>
        </button>

        {/* 3. Main Navigation Items */}
        <nav className="flex flex-col gap-1 my-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else {
                    setActiveTab(item.id);
                  }
                  onCloseMobile();
                }}
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-blue-50 dark:bg-indigo-600/30 text-blue-600 dark:text-indigo-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {/* Active Left Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-600 dark:bg-indigo-500" />
                )}
                <Icon className={`w-4 h-4 ${isActive ? "text-blue-600 dark:text-indigo-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* 4. Recent Conversations */}
        <div className="flex-1 overflow-y-auto min-h-0 my-2 pr-1 space-y-1 border-t border-slate-200/70 dark:border-white/10 pt-3">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Recent conversations
            </span>
            <span className="text-[11px] text-blue-600 dark:text-indigo-400 font-semibold cursor-pointer hover:underline">
              See all →
            </span>
          </div>

          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelectConv(conv.id)}
              className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                currentConvId === conv.id
                  ? "bg-blue-50/70 dark:bg-indigo-600/20 text-slate-900 dark:text-white font-semibold border border-blue-200/60 dark:border-indigo-500/30"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div className="truncate">
                  <p className="truncate text-xs text-slate-700 dark:text-slate-200">{conv.title}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{conv.updatedAt}</p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConv(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* 5. User Profile Card at Bottom */}
        <div className="pt-3 border-t border-slate-200/70 dark:border-white/10">
          <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer border border-slate-200/60 dark:border-transparent">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                R
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Ridwan</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Free Plan</p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
        </div>

      </div>
    </aside>
  );
};
