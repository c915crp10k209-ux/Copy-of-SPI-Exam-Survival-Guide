
import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  velocity: { x: number; y: number };
  color: string;
}

interface DopamineOverlayProps {
  xpGained?: number;
  newLevel?: number;
  type?: 'success' | 'level' | 'glitch';
  onComplete: () => void;
}

export const DopamineOverlay: React.FC<DopamineOverlayProps> = ({ xpGained, newLevel, type = 'success', onComplete }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(!!newLevel);

  useEffect(() => {
    if (xpGained || type === 'glitch') {
      const isMobile = window.innerWidth < 640;
      const count = isMobile ? 15 : 40;
      const colors = type === 'glitch' ? ['#ef4444', '#7f1d1d'] : ['#f59e0b', '#fbbf24', '#ffffff'];
      
      const newParticles: Particle[] = Array.from({ length: count }).map((_, i) => ({
        id: Math.random(),
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        rotation: Math.random() * 360,
        scale: 0.4 + Math.random() * 0.8,
        velocity: {
          x: (Math.random() - 0.5) * (type === 'glitch' ? 30 : 20),
          y: (Math.random() - 0.5) * (type === 'glitch' ? 30 : 20) - 5
        },
        color: colors[Math.floor(Math.random() * colors.length)]
      }));
      setParticles(newParticles);

      const timer = setInterval(() => {
        setParticles(prev => prev.map(p => ({
          ...p,
          x: p.x + p.velocity.x,
          y: p.y + p.velocity.y,
          velocity: { x: p.velocity.x, y: p.velocity.y + (type === 'glitch' ? 0.2 : 0.6) },
          rotation: p.rotation + 10
        })).filter(p => p.y < window.innerHeight + 50));
      }, 16);

      setTimeout(() => {
        clearInterval(timer);
        if (!newLevel) onComplete();
      }, type === 'glitch' ? 800 : 1800);

      return () => clearInterval(timer);
    }
  }, [xpGained, type]);

  if (showLevelUp) {
    return (
      <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/95 backdrop-blur-3xl animate-fade-in p-4 overflow-hidden">
        <div className="relative text-center space-y-6 md:space-y-10 w-full max-w-lg flex flex-col items-center">
          <div className="relative">
             <div className="w-32 h-32 md:w-72 md:h-72 rounded-full bg-gold-500 flex items-center justify-center text-black text-4xl md:text-9xl shadow-2xl animate-bounce">
               <i className="fas fa-medal"></i>
             </div>
             <div className="absolute -inset-4 md:-inset-12 border-2 md:border-4 border-gold-500/20 rounded-full animate-ping"></div>
          </div>
          <div className="space-y-2 md:space-y-4">
            <p className="text-gold-500 font-black uppercase tracking-widest text-[8px] md:text-xl italic">LEVEL_UP</p>
            <h2 className="text-4xl md:text-9xl font-display font-black text-white uppercase italic tracking-tighter gold-text-gradient leading-none">Tier_{newLevel}</h2>
            <p className="text-slate-400 text-[10px] md:text-3xl font-light italic leading-tight">Sector mapping enhanced!</p>
          </div>
          <button onClick={onComplete} className="w-full py-4 md:py-6 bg-gold-500 text-black font-black uppercase text-[10px] md:text-sm tracking-widest rounded-xl shadow-xl active:scale-95 italic">Accept_Clearance</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[600] overflow-hidden">
      {particles.map(p => (
        <div 
          key={p.id}
          className="absolute w-4 h-4 md:w-8 md:h-8 flex items-center justify-center"
          style={{
            transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg) scale(${p.scale})`,
            color: p.color,
            opacity: 1 - (p.y / (window.innerHeight + 100))
          }}
        >
          <i className="fas fa-certificate"></i>
        </div>
      ))}
      {xpGained && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
           <span className="text-4xl md:text-[12rem] font-display font-black gold-text-gradient italic">+{xpGained}_XP</span>
        </div>
      )}
    </div>
  );
};
