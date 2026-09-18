import React, { useState } from "react";
import { motion } from "motion/react";
import { Shield, Sparkles, Key } from "lucide-react";
import { ThemeColor } from "../types";
import { THEME_COLORS } from "../theme";

interface SetupModalProps {
  onComplete: (apiKey: string) => void;
}

export function SetupModal({ onComplete }: SetupModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError("Please enter a valid API Key");
      return;
    }
    onComplete(apiKey.trim());
  };

  return (
    <div className="fixed inset-0 bg-[#050b14] z-[100] flex items-center justify-center p-4">
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#0a1622] border border-cyan-500/30 rounded-3xl p-8 shadow-[0_0_100px_rgba(6,182,212,0.15)] relative overflow-hidden"
      >
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 blur-[80px]" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 blur-[80px]" />

        <div className="relative z-10 space-y-8 text-center">
          <div className="flex justify-center">
            <div className="p-4 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
              <Sparkles className="w-10 h-10 text-cyan-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Setup JARVIS</h1>
            <p className="text-xs font-bold text-cyan-500/50 uppercase tracking-[0.3em]">Neural Interface Initialization</p>
          </div>

          <div className="text-[13px] leading-relaxed text-cyan-50/60 font-medium">
            To activate JARVIS, please enter your <span className="text-cyan-400 font-bold">Google Gemini API Key</span>. This key will be stored securely on your device and used only for your local assistant requests.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500/40">
                  <Key size={18} />
                </div>
                <input 
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter Gemini API Key..."
                  className="w-full bg-black/40 border border-cyan-500/20 rounded-2xl py-4 pl-12 pr-16 text-sm focus:outline-none focus:border-cyan-400 transition-all text-cyan-50 font-mono shadow-inner"
                />
                <button 
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-cyan-500/40 hover:text-cyan-400 transition-colors uppercase tracking-widest"
                >
                  {showKey ? "Hide" : "Show"}
                </button>
              </div>
              {error && <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">{error}</p>}
            </div>

            <button 
              type="submit"
              className="w-full bg-cyan-500 py-4 rounded-2xl text-cyan-950 font-black tracking-[0.2em] uppercase hover:bg-cyan-400 transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] active:scale-[0.98]"
            >
              Initialize
            </button>
          </form>

          <div className="pt-4 flex items-center justify-center gap-2 text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">
            <Shield size={10} />
            Encrypted Local Storage Only
          </div>
        </div>
      </motion.div>
    </div>
  );
}
