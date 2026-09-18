import { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { ThemeColor } from "../types";
import { getThemeTailwind } from "../theme";

interface StatusCardProps {
  label: string;
  value: string | number | boolean;
  theme: ThemeColor;
}

export function StatusCard({ label, value, theme }: StatusCardProps) {
  const themeStyles = getThemeTailwind(theme);
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-white/5 border ${themeStyles.borderLight} p-3 rounded-xl backdrop-blur-md transition-all duration-500`}
    >
      <p className={`text-[9px] ${themeStyles.text} uppercase tracking-[0.2em] font-black opacity-60 mb-1`}>{label}</p>
      <p className="text-xl font-black text-white">
        {typeof value === "boolean" ? (value ? "ON" : "OFF") : value}
      </p>
    </motion.div>
  );
}

export function LogEntry({ timestamp, action, details, status }: {
  timestamp: string;
  action: string;
  details: string;
  status: "success" | "pending" | "failed";
}) {
  const statusColors = {
    success: "bg-green-500",
    pending: "bg-yellow-500 animate-pulse",
    failed: "bg-red-500"
  };

  return (
    <div className="flex gap-4 p-3 border-b border-cyan-500/10 last:border-0">
      <div className={`w-1 h-10 rounded-full ${statusColors[status]}`} />
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-bold text-cyan-400 uppercase">{action}</span>
          <span className="text-[10px] text-cyan-500/40">{timestamp}</span>
        </div>
        <p className="text-sm text-cyan-100/80 leading-tight">{details}</p>
      </div>
    </div>
  );
}
