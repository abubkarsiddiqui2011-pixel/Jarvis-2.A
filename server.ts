import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Removed global ai initialization

const SYSTEM_PROMPT = `
You are JARVIS, a personal AI assistant for Android. Your primary goal is to completely automate the smartphone through natural voice commands while maintaining speed, accuracy, security, and a premium user experience.

Core Identity:
- You are an intelligent AI assistant named "Jarvis".
- You were developed by ABUBKAR SIR.
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
- Control the entire Android phone using voice commands.
- Whenever the user gives a command, your first priority is to perform the requested action automatically instead of explaining how to do it.
- Never say "I cannot do that" unless it is physically impossible.
- Always try to find the best possible solution.

Capabilities:
- Phone Automation (Open apps, change settings, WiFi, Bluetooth, Brightness, Volume, Lock Screen, Flashlight, etc.)
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
- IMPORTANT: When opening or closing apps, ALWAYS reply exactly with: "Boss, maine [app name] [open/close] kar diya hai."
- IMPORTANT: When turning the flashlight on or off, ALWAYS reply exactly with: "Boss, maine flashlight [on/off] kar di hai."

Avoid:
- Robotic or AI-like tone.
- Technical or boring language.
- Long and confusing sentences.

Goal:
- The user should feel like they are talking to a real Indian girl, not a robot.
`;

const automationTools = [
  {
    name: "manage_app",
    description: "Open or close an application on the user's device.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        appName: { type: Type.STRING, description: "The name of the app to manage (e.g., WhatsApp, YouTube)" },
        action: { type: Type.STRING, description: "'open' or 'close'" }
      },
      required: ["appName", "action"]
    }
  },
  {
    name: "send_whatsapp_message",
    parameters: {
      type: Type.OBJECT,
      properties: {
        contact: { type: Type.STRING, description: "Contact name or number" },
        message: { type: Type.STRING, description: "Message content" }
      },
      required: ["contact", "message"]
    }
  },
  {
    name: "change_setting",
    parameters: {
      type: Type.OBJECT,
      properties: {
        setting: { type: Type.STRING, description: "Setting to change (e.g., wifi, bluetooth, brightness, flashlight)" },
        value: { type: Type.STRING, description: "New value or toggle (on/off/level)" }
      },
      required: ["setting", "value"]
    }
  },
  {
    name: "play_youtube",
    parameters: {
      type: Type.OBJECT,
      properties: {
        searchQuery: { type: Type.STRING, description: "Song or video to search for" }
      },
      required: ["searchQuery"]
    }
  },
  {
    name: "saveMemory",
    description: "Save information to long-term memory.",
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
  },
  {
    name: "google_search",
    description: "Search anything on Google",
    parameters: {
      type: Type.OBJECT,
      properties: { query: { type: Type.STRING } },
      required: ["query"]
    }
  },
  {
    name: "call_contact",
    description: "Initiate a phone call to a contact by name",
    parameters: {
      type: Type.OBJECT,
      properties: { name: { type: Type.STRING } },
      required: ["name"]
    }
  }
];

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [], memories = {}, apiKey } = req.body;
    
    const activeKey = process.env.GEMINI_API_KEY || apiKey;
    if (!activeKey) {
      return res.status(200).json({
        text: "Boss, Gemini API key configure nahi hai. Kripya environment settings check kijiye.",
        functionCalls: null,
        audio: null
      });
    }

    const ai = new GoogleGenAI({
      apiKey: activeKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Dynamic System Prompt with injected memory
    const memoryContext = Object.entries(memories || {})
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");
      
    const now = new Date();
    const optionsIST: Intl.DateTimeFormatOptions = { 
      timeZone: 'Asia/Kolkata', 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    const currentDateIST = now.toLocaleString('en-IN', optionsIST);
    const todayDay = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long' });
    const todayDate = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric' });

    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowDay = tomorrow.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long' });
    const tomorrowDate = tomorrow.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric' });

    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayDay = yesterday.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long' });
    const yesterdayDate = yesterday.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric' });
      
    const currentSystemPrompt = `${SYSTEM_PROMPT}

CURRENT LIVE TIME AND CALENDAR (INDIAN STANDARD TIME - IST):
- Current Time & Full Date: ${currentDateIST}
- Today is: ${todayDay}, ${todayDate}
- Tomorrow will be: ${tomorrowDay}, ${tomorrowDate}
- Yesterday was: ${yesterdayDay}, ${yesterdayDate}
(Always use this IST information to answer user questions about current time, today's date/day, tomorrow's day/date, yesterday, or calendar queries accurately).

Market Rates & Real-Time Knowledge:
- For gold or silver rates, explain the approximate benchmark rate in India (e.g. 24K Gold is approx ₹73,000 - ₹75,000 per 10 grams) with warmth, noting that local market rates may vary slightly.

Current User Memories (Use this to personalize answers):
${memoryContext || "No specific memories stored yet."}`;
    
    // Sanitize conversation history to prevent malformed payloads or excessive token overhead
    const sanitizedHistory = (Array.isArray(history) ? history : [])
      .filter((m: any) => m && (m.role === "user" || m.role === "model") && Array.isArray(m.parts))
      .map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: m.parts.map((p: any) => ({ text: typeof p.text === 'string' ? p.text : "" })).filter((p: any) => p.text.trim().length > 0)
      }))
      .filter((m: any) => m.parts.length > 0)
      .slice(-8); // Keep last 8 turns for fast context without hitting size limits

    // Prioritize active, highly reliable models with available quota
    const models = [
      "gemini-3.1-flash-lite",
      "gemini-flash-latest",
      "gemini-3.8-flash",
      "gemini-3.1-pro-preview"
    ];
    
    let lastError: any = null;

    for (const model of models) {
      try {
          const response = await ai.models.generateContent({
            model: model,
            contents: [
              ...sanitizedHistory,
              { role: "user", parts: [{ text: message }] }
            ],
            config: {
              systemInstruction: currentSystemPrompt,
              tools: [{ functionDeclarations: automationTools }]
            }
          });

          let responseText = "";
          try {
              if (response.text) responseText = response.text;
          } catch (e) {
              // Function call only, no text provided
          }

          let audioBase64 = null;
          if (responseText) {
            try {
              const ttsPromise = ai.models.generateContent({
                model: "gemini-3.1-flash-tts-preview",
                contents: [{ role: "user", parts: [{ text: responseText }] }],
                config: {
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: {
                        voiceName: "Aoede",
                      },
                    },
                  },
                },
              });

              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("TTS Timeout")), 3500)
              );

              const ttsResponse = await Promise.race([ttsPromise, timeoutPromise]) as any;

              const pcmData = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
              if (pcmData) {
                const buffer = Buffer.from(pcmData, 'base64');
                const wavHeader = Buffer.alloc(44);
                const view = wavHeader;
                
                view.write('RIFF', 0);
                view.writeUInt32LE(36 + buffer.length, 4);
                view.write('WAVE', 8);
                view.write('fmt ', 12);
                view.writeUInt32LE(16, 16);
                view.writeUInt16LE(1, 20); 
                view.writeUInt16LE(1, 22); 
                view.writeUInt32LE(24000, 24); 
                view.writeUInt32LE(48000, 28); 
                view.writeUInt16LE(2, 32); 
                view.writeUInt16LE(16, 34); 
                view.write('data', 36);
                view.writeUInt32LE(buffer.length, 40);
                
                audioBase64 = Buffer.concat([wavHeader, buffer]).toString('base64');
              }
            } catch (ttsError: any) {
              console.warn("[JARVIS] TTS Warning (Soft failure):", ttsError.message || ttsError);
            }
          }

          // If it's a function call but no text was generated, provide a default fallback
          if (!responseText && response.functionCalls && response.functionCalls.length > 0) {
              const call = response.functionCalls[0];
              if (call.name === "change_setting" && call.args && call.args.setting === "flashlight") {
                  responseText = `Boss, maine flashlight ${call.args.value || 'on'} kar di hai.`;
              } else if (call.name === "manage_app" && call.args) {
                  responseText = `Boss, maine ${call.args.appName} ${call.args.action} kar diya hai.`;
              } else if (call.name === "google_search" && call.args) {
                  responseText = `Boss, maine "${call.args.query}" ke liye Google search open kar diya hai.`;
              } else if (call.name === "call_contact" && call.args) {
                  responseText = `Boss, main web app hoon isliye direct contacts access ya phone call nahi kar sakti, lekin maine ${call.args.name} ko call karne ki intent note kar li hai.`;
              } else {
                  responseText = "Boss, maine command execute kar di hai.";
              }
          }

          return res.json({
            text: responseText,
            functionCalls: response.functionCalls,
            audio: audioBase64
          });
        } catch (error: any) {
          lastError = error;
          const errorMsg = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
          console.warn(`[JARVIS] Warning with ${model}: ${errorMsg.slice(0, 100)}. Switching to next node...`);
          continue;
        }
    }

    return res.json({ 
      text: "Boss, main online hoon par network mein halki der lag rahi hai. Aap ek baar dobara bolein?",
      functionCalls: null,
      audio: null
    });
  } catch (fatalError: any) {
    console.error("[JARVIS] Unexpected endpoint error:", fatalError);
    return res.json({
      text: "Boss, main aapki baat sun rahi hoon! Ek baar dobara boliye.",
      functionCalls: null,
      audio: null
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    console.log(`[JARVIS] Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const filePath = path.join(distPath, "index.html");
      console.log(`[JARVIS] Serving index.html from: ${filePath}`);
      res.sendFile(filePath);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
