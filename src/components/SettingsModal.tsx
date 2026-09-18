import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Settings, Check, Key, Trash2, ShieldCheck, Palette, Info } from "lucide-react";
import { AppSettings, ThemeColor } from "../types";
import { THEME_COLORS, getThemeTailwind } from "../theme";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

export function SettingsModal({ isOpen, onClose, settings, updateSettings }: SettingsModalProps) {
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const themeStyles = getThemeTailwind(settings.theme);

  const testKey = async () => {
    setTestStatus("Testing...");
    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + settings.apiKey);
      if (response.ok) setTestStatus("Success: Key is valid");
      else setTestStatus("Error: Invalid API Key");
    } catch (e) {
      setTestStatus("Error: Connection failed");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#0a1622] border border-cyan-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-cyan-500/10 flex justify-between items-center bg-[#0d1c2b]">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-cyan-500/10 ${themeStyles.text}`}>
                    <Settings size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-white">JARVIS SETTINGS</h2>
                    <p className="text-[10px] uppercase tracking-widest text-cyan-500/40 font-bold">Neural Configuration</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} className="text-white/40 hover:text-white" />
                </button>
              </div>

              <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
                {/* API Key Section */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Key size={16} className={themeStyles.text} />
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">API KEY</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="relative">
                      <input 
                        type={showKey ? "text" : "password"}
                        value={settings.apiKey}
                        onChange={(e) => updateSettings({ apiKey: e.target.value })}
                        placeholder="Enter Gemini API Key"
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500/50 transition-all text-cyan-50 font-mono pr-20"
                      />
                      <button 
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/30 hover:text-white transition-colors"
                      >
                        {showKey ? "HIDE" : "SHOW"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={testKey}
                        className="flex-1 py-2 px-4 rounded-lg border border-white/5 bg-white/5 text-[10px] font-bold tracking-widest uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                      >
                        <ShieldCheck size={12} /> Test Key
                      </button>
                      <button 
                        onClick={() => updateSettings({ apiKey: "" })}
                        className="flex-1 py-2 px-4 rounded-lg border border-red-500/20 bg-red-500/5 text-[10px] font-bold tracking-widest uppercase text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                    {testStatus && (
                      <p className={`text-[10px] font-bold text-center ${testStatus.includes("Success") ? "text-green-400" : "text-red-400"}`}>
                        {testStatus}
                      </p>
                    )}
                  </div>
                </section>

                {/* UI Theme Section */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Palette size={16} className={themeStyles.text} />
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">UI THEME</h3>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-3">
                    {(["pink", "yellow", "cyan", "purple"] as ThemeColor[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => updateSettings({ theme: t })}
                        className={`relative aspect-square rounded-xl border-2 transition-all flex items-center justify-center ${
                          settings.theme === t 
                            ? `border-${t}-500/60 bg-${t}-500/10` 
                            : "border-white/5 bg-white/5 hover:border-white/10"
                        }`}
                        style={{ borderColor: settings.theme === t ? THEME_COLORS[t].primary : undefined }}
                      >
                        <div 
                          className="w-4 h-4 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)]" 
                          style={{ backgroundColor: THEME_COLORS[t].primary }}
                        />
                        {settings.theme === t && (
                          <motion.div layoutId="activeTheme" className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-lg">
                            <Check size={10} className="text-[#0a1622]" />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </section>

                {/* About Section */}
                <section className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Info size={14} className="text-white/40" />
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">ABOUT</span>
                  </div>
                  <p className="text-xs font-medium text-white/80">JARVIS AI Assistant</p>
                  <p className="text-[10px] text-white/30 font-bold">Version 2.0.0-Neural</p>
                </section>
              </div>

              {/* Footer */}
              <div className="p-6 bg-[#0d1c2b] border-t border-cyan-500/10">
                <button 
                  onClick={onClose}
                  className={`w-full py-3 rounded-xl font-bold tracking-widest uppercase transition-all shadow-lg ${themeStyles.bg} text-[#0a1622] hover:opacity-90 active:scale-[0.98]`}
                >
                  Save & Apply
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
