import { ThemeColor } from "./types";

export const THEME_COLORS: Record<ThemeColor, { primary: string; secondary: string; glow: string }> = {
  pink: {
    primary: "rgb(255, 79, 163)",
    secondary: "rgba(255, 79, 163, 0.4)",
    glow: "rgba(255, 79, 163, 0.2)"
  },
  yellow: {
    primary: "rgb(255, 212, 59)",
    secondary: "rgba(255, 212, 59, 0.4)",
    glow: "rgba(255, 212, 59, 0.2)"
  },
  cyan: {
    primary: "rgb(0, 217, 255)",
    secondary: "rgba(0, 217, 255, 0.4)",
    glow: "rgba(0, 217, 255, 0.2)"
  },
  purple: {
    primary: "rgb(168, 85, 247)",
    secondary: "rgba(168, 85, 247, 0.4)",
    glow: "rgba(168, 85, 247, 0.2)"
  }
};

export const getThemeTailwind = (theme: ThemeColor) => {
  switch (theme) {
    case "pink": return { text: "text-pink-500", border: "border-pink-500", bg: "bg-pink-500", shadow: "shadow-pink-500/40", accent: "text-pink-400", borderLight: "border-pink-500/30" };
    case "yellow": return { text: "text-yellow-500", border: "border-yellow-500", bg: "bg-yellow-500", shadow: "shadow-yellow-500/40", accent: "text-yellow-400", borderLight: "border-yellow-500/30" };
    case "cyan": return { text: "text-cyan-500", border: "border-cyan-500", bg: "bg-cyan-500", shadow: "shadow-cyan-500/40", accent: "text-cyan-400", borderLight: "border-cyan-500/30" };
    case "purple": return { text: "text-purple-500", border: "border-purple-500", bg: "bg-purple-500", shadow: "shadow-purple-500/40", accent: "text-purple-400", borderLight: "border-purple-500/30" };
  }
};
