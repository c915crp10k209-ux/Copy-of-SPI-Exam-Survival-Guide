
import React, { useState, useEffect } from 'react';

interface JarvisMascotProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isThinking?: boolean;
  isTalking?: boolean;
  statusText?: string;
  className?: string;
}

export const JarvisMascot: React.FC<JarvisMascotProps> = ({ 
  size = 'md', 
  isThinking = false, 
  isTalking = false, 
  statusText = "SYSTEM_ONLINE",
  className = ""
}) => {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => (p + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const sizes = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-64 h-64',
    xl: 'w-80 h-80'
  };

  const activeColor = isThinking ? 'text-amber-500' : isTalking ? 'text-emerald-400' : 'text-cyan-400';
  const glowColor = isThinking ? 'rgba(245, 158, 11, 0.4)' : isTalking ? 'rgba(16, 185, 129, 0.4)' : 'rgba(34, 211, 238, 0.4)';

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* HUD Rings */}
      <div className={`relative ${sizes[size]} transition-all duration-700`}>
        
        {/* Outer Tech Ring */}
        <div className="absolute inset-0 border-2 border-white/5 rounded-full animate-spin-slow"></div>
        <div className="absolute inset-0 border-t-2 border-cyan-500/30 rounded-full animate-spin-slow"></div>
        
        {/* Middle Bracket Ring */}
        <div className={`absolute inset-4 border border-dashed rounded-full transition-colors duration-500 ${activeColor} opacity-20 animate-reverse-spin-slow`}></div>
        
        {/* Inner Pulsing Core */}
        <div className="absolute inset-10 flex items-center justify-center">
            <div 
              className={`w-full h-full rounded-full transition-all duration-300 relative`}
              style={{ 
                background: isThinking ? 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' : 'radial-gradient(circle, #22d3ee 0%, transparent 70%)',
                boxShadow: `0 0 ${20 + (isTalking ? Math.sin(pulse) * 40 : 0)}px ${glowColor}`,
                transform: `scale(${1 + (isTalking ? Math.sin(pulse) * 0.1 : 0)})`
              }}
            >
              {/* Central Processor Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                  <i className={`fas ${isThinking ? 'fa-sync-alt fa-spin' : 'fa-atom'} text-white text-3xl opacity-80 shadow-2xl`}></i>
              </div>
            </div>
        </div>

        {/* Floating Data Brackets */}
        <div className="absolute -inset-4 flex items-center justify-between px-2 pointer-events-none opacity-40">
           <div className="w-1 h-8 bg-cyan-500 rounded-full"></div>
           <div className="w-1 h-8 bg-cyan-500 rounded-full"></div>
        </div>
      </div>

      {/* Status HUD Text */}
      <div className="mt-8 flex flex-col items-center gap-1">
        <div className="flex items-center gap-2 px-3 py-1 bg-black/60 rounded-full border border-white/10">
           <div className={`w-1.5 h-1.5 rounded-full ${isThinking ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></div>
           <span className="text-[8px] font-black uppercase tracking-[0.3em] font-mono text-white/70 italic">
              {statusText}
           </span>
        </div>
        <span className={`text-xl font-display font-black tracking-tighter uppercase italic transition-colors duration-500 ${activeColor}`}>
           J.A.R.V.I.S.
        </span>
      </div>

      <style>{`
        .animate-spin-slow { animation: spin 10s linear infinite; }
        .animate-reverse-spin-slow { animation: spin 15s linear infinite reverse; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
