import { motion, AnimatePresence } from "motion/react";

import { ThemeColor } from "../types";
import { THEME_COLORS } from "../theme";

interface AIAvatarProps {
  isSpeaking: boolean;
  theme: ThemeColor;
}

// User-provided video paths - Upload your videos to /public/videos/
const IDLE_VIDEO_URL = "/videos/idle.mp4";
const TALKING_VIDEO_URL = "/videos/talking.mp4";

export function AIAvatar({ isSpeaking, theme }: AIAvatarProps) {
  const colors = THEME_COLORS[theme];

  return (
    <div 
      className="relative w-[280px] h-[280px] mx-auto rounded-full overflow-hidden border-4 bg-black/40 backdrop-blur-sm group transition-all duration-500"
      style={{ 
        borderColor: colors.secondary,
        boxShadow: `0 0 50px ${colors.glow}`
      }}
    >
      {/* Futuritstic Circle Frame Overlays */}
      <div 
        className="absolute inset-0 pointer-events-none z-20 rounded-full border" 
        style={{ borderColor: colors.primary + "33" }}
      />
      
      {/* Rotating Ring Effect */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 border-t-2 border-r-2 rounded-full z-20"
        style={{ borderColor: colors.primary + "4D" }}
      />

      {/* Scanning Line Effect (Curved/Circular scan) */}
      <motion.div 
        animate={{ top: ["-10%", "110%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-0 right-0 h-[2px] z-20"
        style={{ 
          backgroundColor: colors.primary + "4D",
          boxShadow: `0 0 15px ${colors.primary}99`
        }}
      />

      <AnimatePresence mode="wait">
        {!isSpeaking ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <video
              src={IDLE_VIDEO_URL}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover object-top"
            />
          </motion.div>
        ) : (
          <motion.div
            key="talking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <video
              src={TALKING_VIDEO_URL}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover object-top"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glow Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-cyan-500/20 to-transparent z-10" />
    </div>
  );
}
