import { motion } from "motion/react";

export function ArcReactor({ isActive }: { isActive: boolean }) {
  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
        {/* Outer Ring Segments */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-[3px] border-cyan-500/20 rounded-full"
        />
        
        {/* Rotating Arcs */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 border-t-[4px] border-l-[4px] border-cyan-400 rounded-full opacity-60"
        />
        
        <motion.div
          animate={{ rotate: 180 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-6 border-b-[3px] border-r-[3px] border-cyan-500/40 rounded-full"
        />

        {/* Inner Glowing Core */}
        <motion.div
          animate={{
            scale: isActive ? [1, 1.05, 1] : 1,
            opacity: isActive ? [0.8, 1, 0.8] : 0.6,
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative w-24 h-24 md:w-28 md:h-28 flex items-center justify-center"
        >
          {/* Main Glow */}
          <div className="absolute inset-0 rounded-full bg-cyan-400 blur-xl opacity-40 shadow-[0_0_40px_rgba(34,211,238,0.6)]" />
          
          {/* Core Orb */}
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white shadow-[0_0_30px_rgba(255,255,255,0.8)] z-10" />
          <div className="absolute w-20 h-20 md:w-24 md:h-24 rounded-full bg-cyan-300/30 blur-md" />
        </motion.div>
      </div>

      {/* Status Indicator */}
      <div className="mt-8 flex items-center gap-3">
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"
        />
        <span className="text-[14px] font-mono tracking-[0.2em] text-cyan-100 uppercase">
          {isActive ? "Processing" : "Standing By"}
        </span>
      </div>
    </div>
  );
}
