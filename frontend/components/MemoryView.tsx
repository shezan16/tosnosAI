"use client";

import React, { useState, useEffect } from "react";
import { Brain, Plus, Trash2, Check, Sparkles, ShieldCheck } from "lucide-react";

export const MemoryView: React.FC = () => {
  const [memories, setMemories] = useState<Array<any>>([]);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [category, setCategory] = useState("preference");
  const [isMemoryEnabled, setIsMemoryEnabled] = useState(true);

  useEffect(() => {
    fetch("/api/memory")
      .then(res => res.json())
      .then(data => {
        if (data.memories) setMemories(data.memories);
      })
      .catch(err => console.error("Failed to load memory:", err));
  }, []);

  const handleAddMemory = async () => {
    if (!newKey.trim() || !newValue.trim()) return;

    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newKey, value: newValue, category })
      });
      const data = await res.json();
      if (data.memory) {
        setMemories(prev => [...prev, data.memory]);
        setNewKey("");
        setNewValue("");
      }
    } catch (e) {
      console.error("Add memory error:", e);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await fetch(`/api/memory?id=${id}`, { method: "DELETE" });
      setMemories(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      console.error("Delete memory error:", e);
    }
  };

  return (
    <div className="flex-1 h-full bg-slate-950 p-6 overflow-y-auto text-slate-100 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-white/10 mb-6">
        <Brain className="w-8 h-8 text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">User Memory System</h1>
          <p className="text-xs text-slate-400">View, edit, or delete personal preferences remembered by TosnosAI</p>
        </div>
      </div>

      {/* Memory Enabled Toggle */}
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">Memory Enabled</h3>
            <p className="text-xs text-slate-400">Allow TosnosAI to recall user preferences across conversations</p>
          </div>
        </div>
        <button
          onClick={() => setIsMemoryEnabled(!isMemoryEnabled)}
          className={`w-12 h-6 rounded-full transition-colors p-0.5 ${isMemoryEnabled ? "bg-indigo-600" : "bg-slate-700"}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isMemoryEnabled ? "translate-x-6" : "translate-x-0"}`} />
        </button>
      </div>

      {/* Add New Memory Card */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 mb-6">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-indigo-400" /> Add Custom Preference
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input
            type="text"
            placeholder="Preference Title (e.g., Simple Explanations)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
          />
          <input
            type="text"
            placeholder="Details (e.g., Explain complex topics with bullet points)"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
          />
        </div>
        <button
          onClick={handleAddMemory}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors"
        >
          Save Memory
        </button>
      </div>

      {/* Stored Memory Items List */}
      <div className="space-y-3">
        {memories.map((mem) => (
          <div key={mem.id} className="bg-slate-900 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-300">{mem.key}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
                  {mem.category}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">{mem.value}</p>
            </div>
            <button
              onClick={() => handleDeleteMemory(mem.id)}
              className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
