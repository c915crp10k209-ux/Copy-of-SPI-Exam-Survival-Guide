
import React, { useEffect, useState } from 'react';

interface TransitionOverlayProps {
  title: string;
  subtitle: string;
  onComplete: () => void;
}

export const TransitionOverlay: React.FC<TransitionOverlayProps> = ({ title, subtitle, onComplete }) => {
  const [glitchTitle, setGlitchTitle] = useState(title);
  
  useEffect(() => {
    const timer = setTimeout(onComplete, 2200);
    
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        const chars = "!<>-_\\/[]{}—=+*^?#________";
        const pos = Math.floor(Math.random() * title.length);
        const next = title.substring(0, pos) + chars[Math.floor(Math.random() * chars.length)] + title.substring(pos + 1);
        setGlitchTitle(next);
        setTimeout(() => setGlitchTitle(title), 50);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      clearInterval(glitchInterval);
    };
  }, [title, onComplete]);

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black overflow-hidden font-mono">
      {/* Background FX */}
      <div className="absolute inset-0 bg-scanline opacity-20 animate-scanline pointer-events-none"></div>
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[2px] bg-gold-500 shadow-[0_0_50px_gold] animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[150vh] w-[2px] bg-gold-500 shadow-[0_0_50px_gold] animate-pulse [animation-delay:0.5s]"></div>
      </div>

      {/* Rotating Geometry */}
      <div className="relative w-64 h-64 md:w-[600px] md:h-[600px] flex items-center justify-center">
        <div className="absolute inset-0 border-[1px] md:border-2 border-gold-500/10 rounded-full animate-spin-slow"></div>
        <div className="absolute inset-10 md:inset-24 border-[1px] md:border-4 border-emerald-500/10 rounded-full animate-reverse-spin-slow"></div>
        
        {/* HUD Brackets */}
        <div className="absolute inset-0 flex items-center justify-center scale-150 opacity-20">
          <div className="w-full h-full border-x-4 border-gold-500 rounded-[5rem] animate-pulse"></div>
        </div>

        <div className="relative z-10 text-center space-y-2 md:space-y-6 px-4">
          <div className="flex items-center justify-center gap-2 md:gap-4 mb-2 md:mb-6">
            <div className="h-[1px] w-12 md:w-32 bg-gradient-to-r from-transparent to-emerald-500"></div>
            <span className="text-[8px] md:text-sm font-black text-emerald-500 uppercase tracking-[0.5em] animate-pulse">
              SYNC_ESTABLISHED
            </span>
            <div className="h-[1px] w-12 md:w-32 bg-gradient-to-l from-transparent to-emerald-500"></div>
          </div>

          <h2 className="text-3xl md:text-8xl lg:text-9xl font-display font-black text-white uppercase italic tracking-tighter gold-text-gradient leading-none animate-slide-up">
            {glitchTitle}
          </h2>
          
          <div className="relative">
             <p className="text-[10px] md:text-4xl text-gold-500 font-light italic tracking-widest uppercase opacity-80">
               {subtitle}
             </p>
             <div className="absolute -bottom-4 md:-bottom-12 left-1/2 -translate-x-1/2 w-48 md:w-96 h-1 bg-white/5 overflow-hidden rounded-full">
                <div className="h-full bg-gold-500 animate-[shimmer_2s_infinite_linear]" style={{ width: '100%' }}></div>
             </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-spin-slow { animation: spin 20s linear infinite; }
        .animate-reverse-spin-slow { animation: spin 15s linear infinite reverse; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
