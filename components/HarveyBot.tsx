
import React, { useState, useEffect, useRef } from 'react';

interface HarveyBotProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isTalking?: boolean;
  statusText?: string;
  className?: string;
  state?: 'NORMAL' | 'THINKING' | 'EXCITED' | 'WARNING';
  gesture?: 'NONE' | 'LEFT' | 'RIGHT' | 'DOWN' | 'SCAN';
}

export const HarveyBot: React.FC<HarveyBotProps> = ({ 
  size = 'md', 
  isTalking = false, 
  statusText = "TUTOR LINK ACTIVE",
  className = "",
  state = 'NORMAL',
  gesture = 'NONE'
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [pulse, setPulse] = useState(0);
  const botRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!botRef.current) return;
      const rect = botRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const dx = (e.clientX - centerX) / (window.innerWidth / 2);
      const dy = (e.clientY - centerY) / (window.innerHeight / 2);
      
      setMousePos({ 
        x: Math.max(-1, Math.min(1, dx)), 
        y: Math.max(-1, Math.min(1, dy)) 
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (isTalking) {
      const interval = setInterval(() => setPulse(p => (p + 1) % 10), 100);
      return () => clearInterval(interval);
    }
  }, [isTalking]);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64 md:w-80 md:h-80'
  };

  const stateColors = {
    NORMAL: 'gold',
    THINKING: 'indigo',
    EXCITED: 'emerald',
    WARNING: 'red'
  };

  const colorHex = {
    gold: '#fbbf24',
    indigo: '#6366f1',
    emerald: '#10b981',
    red: '#ef4444'
  };

  const activeColor = stateColors[state];
  const activeHex = colorHex[activeColor as keyof typeof colorHex];

  const gestureStyles: Record<string, string> = {
    NONE: 'rotateX(0deg) rotateY(0deg)',
    LEFT: 'rotateY(-25deg) rotateX(10deg)',
    RIGHT: 'rotateY(25deg) rotateX(10deg)',
    DOWN: 'rotateX(25deg) scale(1.05)',
    SCAN: `rotateX(15deg) rotateY(${Math.sin(Date.now() / 200) * 15}deg)`
  };

  return (
    <div ref={botRef} className={`relative flex flex-col items-center justify-center ${className} perspective-1000`}>
      <div 
        className={`relative ${sizeClasses[size]} flex items-center justify-center transition-all duration-700 ease-out`}
        style={{ transform: `${gestureStyles[gesture]} translateY(${isTalking ? '-12px' : '0'})` }}
      >
        {/* Holographic "Data Projection" Beam */}
        {(isTalking || gesture === 'SCAN') && (
          <div className="absolute top-[80%] left-1/2 -translate-x-1/2 z-0 pointer-events-none origin-top">
             <div 
                className="w-[120px] md:w-[300px] h-[400px] opacity-10 animate-pulse"
                style={{ 
                    background: `conic-gradient(from 180deg at 50% 0%, transparent 160deg, ${activeHex} 180deg, transparent 200deg)`,
                    transform: `rotate(${mousePos.x * 10}deg) perspective(500px) rotateX(45deg)`
                }}
             ></div>
             {/* Scrolling Data Bitstream in projection */}
             <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full flex flex-col items-center gap-2 opacity-20">
                {[1,2,3].map(i => (
                  <div key={i} className="h-[1px] bg-white animate-shimmer" style={{ width: `${30 + (i*20)}%`, animationDelay: `${i*0.5}s` }}></div>
                ))}
             </div>
          </div>
        )}

        {/* Core Shadow/Glow */}
        <div 
            className={`absolute inset-0 blur-[60px] rounded-full transition-all duration-1000 ${isTalking ? 'opacity-90 scale-150' : 'opacity-20 scale-100'}`}
            style={{ backgroundColor: `${activeHex}44` }}
        ></div>

        {/* Floating Ring Orbits */}
        <div className={`absolute inset-[-15%] border border-white/5 rounded-full animate-spin-slow pointer-events-none transition-opacity duration-1000 ${state === 'NORMAL' ? 'opacity-20' : 'opacity-60'}`}>
          <div className="absolute top-0 left-1/2 w-1.5 h-1.5 rounded-full shadow-[0_0_15px_white]" style={{ backgroundColor: activeHex }}></div>
        </div>

        {/* The Chassis */}
        <div 
            className={`relative w-[85%] aspect-[1.1/1] border-2 md:border-[3px] rounded-[2.5rem] shadow-[0_0_60px_rgba(0,0,0,0.8)] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center transition-all duration-500 ${isTalking ? 'animate-talking-vibrate border-t-white/30' : 'hover:scale-105 border-t-white/10'}`}
            style={{ 
                borderColor: activeHex, 
                boxShadow: isTalking ? `0 0 60px ${activeHex}33` : `0 0 30px ${activeHex}11`,
                transform: `rotateY(${mousePos.x * 20}deg) rotateX(${-mousePos.y * 20}deg)`
            }}
        >
          {/* Hardware Details */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1/3 h-1.5 rounded-t-full opacity-60" style={{ backgroundColor: activeHex }}></div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-1 rounded-b-full opacity-40 bg-white/20"></div>

          <div className="w-full h-full relative p-4 md:p-6 flex flex-col items-center justify-center gap-4 md:gap-6">
            {/* Expressive Eyes with Pupil Tracking */}
            <div className="flex justify-around w-full px-2">
              {[0, 1].map((i) => (
                <div key={i} className="relative w-5 h-5 md:w-10 md:h-10 overflow-hidden bg-black/40 rounded-full border border-white/5 shadow-inner">
                  <div 
                      className={`absolute inset-0 rounded-full animate-blink transition-all duration-300`}
                      style={{ 
                        backgroundColor: `${activeHex}22`,
                      }}
                  />
                  {/* Pupil */}
                  <div 
                    className="absolute w-3 h-3 md:w-6 md:h-6 rounded-full transition-transform duration-200"
                    style={{ 
                        backgroundColor: activeHex,
                        boxShadow: `0 0 20px ${activeHex}`,
                        transform: `translate(${2 + mousePos.x * 4}px, ${2 + mousePos.y * 4}px) scale(${state === 'EXCITED' ? 1.4 : 1})`,
                        left: '15%', top: '15%'
                    }}
                  >
                      <div className="absolute top-1 left-1 w-1 h-1 bg-white/90 rounded-full blur-[0.5px]"></div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Mouth/Speaker Port */}
            <div className={`relative w-[65%] h-3 md:h-8 flex items-center justify-center gap-1.5`}>
                {isTalking ? (
                   <div className="flex items-center gap-1">
                     {[1,2,3,4,5,6,7].map(i => (
                        <div 
                          key={i} 
                          className="w-1 md:w-1.5 bg-white rounded-full transition-all duration-150"
                          style={{ 
                            height: `${30 + Math.sin((pulse + i) * 0.8) * 70}%`,
                            backgroundColor: activeHex,
                            boxShadow: `0 0 10px ${activeHex}88`
                          }}
                        ></div>
                     ))}
                   </div>
                ) : (
                    <div 
                        className={`w-full h-[1px] md:h-[2px] rounded-full transition-all duration-1000 ${state === 'WARNING' ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-white/20'}`}
                    ></div>
                )}
            </div>
          </div>

          {/* Glitch Overlay for WARNING state */}
          {state === 'WARNING' && (
            <div className="absolute inset-0 rounded-[2.5rem] bg-red-600/10 animate-pulse pointer-events-none border border-red-500/50"></div>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 bg-black/60 px-4 py-1.5 rounded-full border border-white/10 shadow-xl">
            <div className={`w-1.5 h-1.5 rounded-full ${isTalking ? 'animate-ping' : 'animate-pulse'}`} style={{ backgroundColor: activeHex }}></div>
            <span className="text-[7px] md:text-[9px] font-black tracking-[0.4em] uppercase font-mono italic" style={{ color: activeHex }}>
              {statusText}
            </span>
        </div>
        <span className="text-xl md:text-3xl font-display font-black text-white italic tracking-tighter uppercase gold-text-gradient leading-none">
          {state === 'WARNING' ? 'SYSTEM_ALERT' : 'Harvey'}
        </span>
      </div>
    </div>
  );
};
