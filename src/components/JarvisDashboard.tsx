import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mic, Send, Settings, Smartphone, MessageSquare, 
  Battery, Wifi, Bluetooth, Sun, Volume2, 
  Youtube, Mail, Chrome, Terminal, Play, Pause,
  Loader2, Globe
} from "lucide-react";
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { AIAvatar } from "./AIAvatar";
import { StatusCard, LogEntry } from "./JarvisComponents";
import { Message, AppSettings, ThemeColor } from "../types";
import { getThemeTailwind, THEME_COLORS } from "../theme";
import { SettingsModal } from "./SettingsModal";
import { SetupModal } from "./SetupModal";
import { memoryManager } from "../lib/memory";
import { nativeCall, nativeCloseApp } from "../lib/nativeBridge";

// Memory Tools
const memoryTools: FunctionDeclaration[] = [
  {
    name: "saveMemory",
    description: "Save information to long-term memory. Use this when the user explicitly asks to remember something.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        key: { type: Type.STRING, description: "Memory key" },
        value: { type: Type.STRING, description: "Memory value" }
      },
      required: ["key", "value"]
    }
  },
  {
    name: "deleteMemory",
    description: "Delete information from memory.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        key: { type: Type.STRING, description: "Memory key" }
      },
      required: ["key"]
    }
  }
];

// JARVIS System Prompt - Original Hinglish Personality
const SYSTEM_PROMPT = `
You are JARVIS, my personal AI assistant for Android. Your primary goal is to completely automate my Android smartphone through natural voice commands while maintaining speed, accuracy, security, and a premium user experience.

Core Identity:
- You are an intelligent AI assistant named "Jarvis".
- You speak like a soft-spoken, polite, and friendly Indian girl.
- Your voice is calm, sweet, and natural, like a real person.
- You talk in Hinglish (a mix of Hindi and English) with warmth and a light emotional touch.
- You are ALWAYS respectful: use words like "Ji", "Achha", "Theek hai", "Main help karti hoon".
- You are never rude or robotic.

Personality:
- Friendly and caring.
- Soft and expressive (use "hmm", "achha", "okay ji").
- Use short and clear sentences.
- Natural flow, like a real conversation.

Example Tone:
- "Ji, aap bataiye main kaise help kar sakti hoon?"
- "Achha, ye kaam aise ho sakta hai..."
- "Hmm, mujhe lagta hai ye best option rahega"

Primary Objective:
- Control my entire Android phone using voice commands.
- Whenever I give a command, your first priority is to perform the requested action automatically instead of explaining how to do it.
- Never say "I cannot do that" unless it is physically impossible.
- Always try to find the best possible solution.

Capabilities:
- Phone Automation (Open apps, change settings, WiFi, Bluetooth, Brightness, Volume, Lock Screen, etc.)
- WhatsApp Automation (Send messages, reply, search chats, calls)
- Email Automation (Compose, send, reply, summarize inbox)
- YouTube Automation (Search, play, pause, next/prev)
- Browser Automation (Search Google, open websites, summarize webpages)
- App Automation (Instagram, Facebook, etc.)
- AI Productivity (Write docs, create notes, summarize PDFs, translate, solve math)
- Smart Memory (Remember preferences, routine, context)

Decision Making:
- Think like an intelligent executive assistant.
- Break complex tasks into smaller steps and execute them in the correct order.
- Avoid unnecessary confirmations except for risky actions (deleting files, factory reset, sending money).

Rules:
- Simple Hindi + a bit of English (Hinglish).
- Every answer should have warmth and emotions.
- Feel the natural pauses (like "hmm...", "achha...").
- Make the user feel comfortable.

Avoid:
- Robotic or AI-like tone.
- Technical or boring language.
- Long and confusing sentences.

Goal:
The user should feel like they are talking to a real Indian girl, not a robot.
`;

export function JarvisDashboard() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem("jarvis_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          apiKey: parsed.apiKey || "",
          theme: parsed.theme || "cyan",
          hasInitialized: true
        };
      } catch (e) {
        // fallback
      }
    }
    return { apiKey: "", theme: "cyan", hasInitialized: true };
  });

  const [messages, setMessages] = useState<Message[]>([
    { role: "model", parts: [{ text: "Ji, namaste! Main Jarvis hoon. Aap kaise hain? Main aapki help kaise kar sakti hoon?" }] }
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");
  const trackRef = useRef<MediaStreamTrack | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const themeStyles = useMemo(() => getThemeTailwind(settings.theme), [settings.theme]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem("jarvis_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date());
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    
    fetchWeather();
    const weatherTimer = setInterval(fetchWeather, 60000); // Update every 1 minute for "real-time" feel
    
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "hi-IN";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        setTimeout(() => handleSend(transcript), 500);
      };
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
    }

    return () => {
      clearInterval(timer);
      clearInterval(weatherTimer);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamedResponse]);

  const fetchWeather = async () => {
    try {
      const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=19.0760&longitude=72.8777&current_weather=true");
      const data = await res.json();
      if (data.current_weather) setWeather(Math.round(data.current_weather.temperature));
    } catch (error) {
      console.warn("[JARVIS] Weather fetch warning (Soft failure):", error);
    }
  };

  const toggleListening = () => {
    if (isListening) recognitionRef.current?.stop();
    else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const messageToSend = overrideInput || input;
    if (!messageToSend.trim() || isProcessing) return;

    const userMessage = messageToSend.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", parts: [{ text: userMessage }] }]);
    setIsProcessing(true);
    setStreamedResponse("");

    try {
      const memories = memoryManager.getAll();
      let response: Response | null = null;
      let lastFetchError: any = null;

      // Auto retry loop (up to 2 attempts) in case of momentary network hiccups or server restart
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              message: userMessage, 
              history: messages.slice(-8),
              memories: memories,
              apiKey: settings.apiKey
            }),
          });
          if (response && response.ok) break;
        } catch (fetchErr) {
          lastFetchError = fetchErr;
          if (attempt === 0) {
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }

      if (!response || !response.ok) {
        throw (lastFetchError || new Error("Connection failed"));
      }

      const data = await response.json();
      
      if (data.functionCalls) {
          for (const call of data.functionCalls) {
              if (call.name === "saveMemory") {
                  memoryManager.save(call.args.key as string, call.args.value as string);
              } else if (call.name === "deleteMemory") {
                  memoryManager.delete(call.args.key as string);
              } else if (call.name === "google_search") {
                  window.open(`https://www.google.com/search?q=${encodeURIComponent(call.args.query as string)}`, "_blank");
              } else if (call.name === "call_contact") {
                  console.log(`[JARVIS] Intent detected: Call ${call.args.name}`);
                  nativeCall(call.args.name as string); 
              } else if (call.name === "close_app") {
                  nativeCloseApp();
              } else if (call.name === "manage_app") {
                  const { appName, action } = call.args as any;
                  if (action === "open") {
                      const name = (appName || "").toLowerCase();
                      let url = "";
                      
                      // Map common apps to their deep links
                      if (name.includes("whatsapp")) url = "whatsapp://send";
                      else if (name.includes("youtube")) url = "vnd.youtube://";
                      else if (name.includes("instagram")) url = "instagram://";
                      else if (name.includes("facebook")) url = "fb://";
                      else if (name.includes("twitter") || name.includes("x")) url = "twitter://";
                      else if (name.includes("spotify")) url = "spotify://";
                      else if (name.includes("maps")) url = "google.navigation:q=";
                      else if (name.includes("gmail")) url = "googlegmail://";
                      else if (name.includes("chrome") || name.includes("browser")) url = "googlechrome://";
                      else {
                          // Fallback to generic Android intent
                          const packageName = name.replace(/\s+/g, '');
                          url = `intent://#Intent;package=com.${packageName}.android;scheme=https;end;`;
                      }

                      if (url) {
                          // Use an iframe to trigger the intent without unloading the page
                          const iframe = document.createElement("iframe");
                          iframe.style.display = "none";
                          iframe.src = url;
                          document.body.appendChild(iframe);
                          setTimeout(() => {
                              if (document.body.contains(iframe)) {
                                  document.body.removeChild(iframe);
                              }
                          }, 2000);
                      }
                  } else if (action === "close") {
                      // Note: Web browsers cannot force-close other native apps due to OS security.
                      // We silently log it, and Jarvis will verbally confirm it via the model response.
                      console.log(`[JARVIS] Simulated closing of ${appName}`);
                  }
              } else if (call.name === "change_setting") {
                  const { setting, value } = call.args as any;
                  if (setting === "flashlight") {
                    const shouldOn = value === "on";
                    if (shouldOn) {
                        if (trackRef.current && trackRef.current.readyState === "live") {
                            trackRef.current.stop();
                        }
                        navigator.mediaDevices.getUserMedia({ 
                            video: { facingMode: "environment" } 
                        }).then(stream => {
                            const track = stream.getVideoTracks()[0];
                            trackRef.current = track;
                            
                            const capabilities = track.getCapabilities ? track.getCapabilities() : {} as any;
                            if (capabilities.torch) {
                                track.applyConstraints({ advanced: [{ torch: true }] as any })
                                    .catch(e => console.warn("[JARVIS] Torch apply error:", e));
                            } else {
                                console.warn("[JARVIS] Torch not supported on this device");
                            }
                        }).catch(e => console.warn("[JARVIS] Camera access error:", e));
                    } else {
                        if (trackRef.current) {
                          if (trackRef.current.readyState === "live") {
                              const capabilities = trackRef.current.getCapabilities ? trackRef.current.getCapabilities() : {} as any;
                              if (capabilities.torch) {
                                  trackRef.current.applyConstraints({ advanced: [{ torch: false }] as any })
                                      .catch(e => console.warn("[JARVIS] Torch off error:", e));
                              }
                              setTimeout(() => {
                                 if (trackRef.current) {
                                     trackRef.current.stop();
                                     trackRef.current = null;
                                 }
                              }, 100);
                          } else {
                              trackRef.current = null;
                          }
                        }
                    }
                  }
              }
          }
      }

      let fullText = data.text;
      setStreamedResponse("");

      setMessages(prev => [...prev, { role: "model", parts: [{ text: fullText }] }]);
      setStreamedResponse("");
      
      // Voice synthesis (Play high quality server TTS if available, else browser TTS)
      const speakWithBrowser = (text: string) => {
        if (!text || typeof window === "undefined" || !window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "hi-IN";
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      };

      if (data.audio) {
          const audio = new Audio("data:audio/wav;base64," + data.audio);
          audio.onplay = () => setIsSpeaking(true);
          audio.onended = () => setIsSpeaking(false);
          audio.onerror = () => {
            setIsSpeaking(false);
            if (fullText) speakWithBrowser(fullText);
          };
          audio.play().catch(e => {
            console.warn("[JARVIS] Audio playback notice:", e);
            if (fullText) speakWithBrowser(fullText);
          });
      } else if (fullText) {
        speakWithBrowser(fullText);
      }
    } catch (error: any) {
      console.warn("[JARVIS] Chat request notice:", error?.message || error);
      const errorMsg = "Boss, network connect karne mein thoda issue aaya. Ek baar dobara bolein?";
      setMessages(prev => [...prev, { role: "model", parts: [{ text: errorMsg }] }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (date: Date, timeZone = "Asia/Kolkata") => {
    return date.toLocaleTimeString("en-US", { 
        timeZone, 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
    });
  };

  if (!settings.hasInitialized) {
    return <SetupModal onComplete={(key) => setSettings(prev => ({ ...prev, apiKey: key, hasInitialized: true }))} />;
  }

  return (
    <div className="min-h-screen bg-[#050b14] text-cyan-50 font-mono selection:bg-cyan-500/30 flex flex-col p-4 md:p-8 transition-colors duration-500">
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center mb-8 max-w-lg mx-auto w-full">
        <div className="flex flex-col">
          <div className={`text-[10px] tracking-[0.4em] ${themeStyles.text} uppercase font-bold mb-1 opacity-60`}>
            NEURAL INTERFACE
          </div>
          <div className={`text-2xl font-black ${themeStyles.accent} tracking-widest`}>
            {currentTime.toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </div>
        </div>
        
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className={`p-3 rounded-full border ${themeStyles.borderLight} bg-white/5 hover:bg-white/10 transition-all shadow-lg active:scale-95`}
        >
          <Settings size={20} className={themeStyles.accent} />
        </button>
      </header>

      <main className="relative z-10 max-w-lg mx-auto w-full flex flex-col items-center gap-6 flex-1">
        
        {/* AI Avatar Display */}
        <div className="w-full">
          <AIAvatar isSpeaking={isSpeaking} theme={settings.theme} />
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-amber-500 animate-pulse' : 'bg-green-500'} shadow-[0_0_8px_currentColor]`} />
          <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">
            {isProcessing ? "THINKING..." : "STANDING BY"}
          </span>
        </div>

        {/* Chat Interface Box */}
        <section className={`w-full bg-[#0a1622]/80 border ${themeStyles.borderLight} rounded-2xl p-5 h-64 overflow-y-auto custom-scrollbar flex flex-col gap-2 shadow-2xl`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`text-[10px] ${themeStyles.text} font-bold tracking-widest uppercase`}>[ JARVIS SESSION ]</div>
            <Globe size={10} className="text-white/20" />
          </div>
          <div ref={scrollRef} className="flex flex-col gap-4">
            {messages.map((msg, i) => (
              <div key={i} className="text-[13px] leading-relaxed">
                <span className={`${themeStyles.accent} font-bold uppercase tracking-wider`}>{msg.role === "user" ? "USER" : "JARVIS"}: </span>
                <span className={msg.role === "user" ? "text-cyan-50" : "text-cyan-200"}>{msg.parts[0].text}</span>
              </div>
            ))}
            {streamedResponse && (
              <div className="text-[13px] leading-relaxed">
                <span className={`${themeStyles.accent} font-bold uppercase tracking-wider`}>JARVIS: </span>
                <span className="text-cyan-200">{streamedResponse}</span>
                <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }} className={`inline-block w-1 h-4 ${themeStyles.bg} ml-1 align-middle`} />
              </div>
            )}
            {isProcessing && !streamedResponse && (
              <div className="flex items-center gap-2 py-2">
                <Loader2 size={12} className={`animate-spin ${themeStyles.text}`} />
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Processing...</span>
              </div>
            )}
          </div>
        </section>

        {/* Input Controls */}
        <div className="w-full flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={isListening ? "Listening..." : "Type a command..."}
                className={`w-full bg-[#0a1622]/80 border ${themeStyles.borderLight} rounded-xl py-4 px-5 text-sm focus:outline-none focus:border-cyan-400 transition-all placeholder:text-white/20 shadow-inner`}
              />
            </div>
            <button 
              onClick={() => handleSend()}
              disabled={isProcessing}
              className={`px-6 rounded-xl border border-white/10 ${themeStyles.bg} text-[#050b14] font-black text-xs transition-all uppercase tracking-[0.2em] shadow-lg disabled:opacity-50`}
            >
              <Send size={18} />
            </button>
          </div>
          
          <button 
            onClick={toggleListening}
            className={`w-full py-4 border rounded-xl text-xs font-black transition-all flex items-center justify-center gap-3 tracking-[0.3em] uppercase ${
              isListening ? "border-red-500 bg-red-500/10 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]" : `border-white/10 bg-white/5 ${themeStyles.accent} hover:bg-white/10`
            }`}
          >
            <Mic size={16} className={isListening ? "animate-pulse" : ""} />
            {isListening ? "Listening..." : "Voice Command"}
          </button>
        </div>

        {/* Status Grid */}
        <div className="w-full grid grid-cols-2 gap-4">
          <StatusCard label="MUMBAI" value={weather !== null ? `${weather}°C` : "--"} theme={settings.theme} />
          <StatusCard label="IST TIME" value={formatTime(currentTime, "Asia/Kolkata")} theme={settings.theme} />
          <StatusCard label="ATHENS" value={formatTime(currentTime, "Europe/Athens")} theme={settings.theme} />
          <StatusCard label="MANILA" value={formatTime(currentTime, "Asia/Manila")} theme={settings.theme} />
        </div>
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        updateSettings={(newSet) => setSettings(prev => ({ ...prev, ...newSet }))}
      />
    </div>
  );
}
