
import React, { useState, useRef } from 'react';
import { recordDailySpin } from '../services/storageService';

interface NeuralWheelProps {
  onClose: () => void;
}

const REWARDS = [
  { label: '500 XP', value: 500, color: '#f59e0b' },
  { label: '200 XP', value: 200, color: '#fbbf24' },
  { label: '750 XP', value: 750, color: '#d97706' },
  { label: '100 XP', value: 100, color: '#fde68a' },
  { label: '1000 XP', value: 1000, color: '#78350f' },
  { label: '300 XP', value: 300, color: '#b45309' },
  { label: '50 XP', value: 5, color: '#fef3c7' },
  { label: 'JACKPOT', value: 2500, color: '#ffffff' }
];

export const NeuralWheel: React.FC<NeuralWheelProps> = ({ onClose }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [reward, setReward] = useState<typeof REWARDS[0] | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    
    const extraSpins = 5 + Math.floor(Math.random() * 5);
    const randomStop = Math.floor(Math.random() * 360);
    const newRotation = rotation + (extraSpins * 360) + randomStop;
    
    setRotation(newRotation);

    setTimeout(() => {
      const finalAngle = (360 - (newRotation % 360)) % 360;
      const index = Math.floor(finalAngle / (360 / REWARDS.length));
      const win = REWARDS[index];
      setReward(win);
      recordDailySpin(win.value);
      setIsSpinning(false);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-space-950/95 backdrop-blur-2xl animate-fade-in">
      <div className="max-w-md w-full glass-panel p-10 rounded-[4rem] border-gold-500/20 text-center relative overflow-hidden flex flex-col items-center gap-8 shadow-[0_50px_150px_rgba(0,0,0,1)]">
        
        <div className="absolute inset-0 bg-aurora opacity-10 pointer-events-none"></div>
        
        <div className="relative z-10 space-y-2">
            <h2 className="text-3xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter gold-gradient-text leading-tight">Neural Sync Wheel</h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] font-mono">Daily Hardware Re-Calibration</p>
        </div>

        <div className="relative w-72 h-72 md:w-96 md:h-96 my-8 flex items-center justify-center scale-90 md:scale-100">
            {/* The Wheel Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 w-8 h-8 bg-red-500 shadow-[0_0_20px_red] clip-triangle z-40 rotate-180"></div>
            
            <div 
              ref={wheelRef}
              className="w-full h-full rounded-full border-8 border-gold-500/40 relative overflow-hidden transition-transform duration-[4000ms] cubic-bezier(0.15, 0, 0.15, 1) shadow-2xl"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
                {REWARDS.map((r, i) => {
                    const angle = 360 / REWARDS.length;
                    return (
                        <div 
                          key={i} 
                          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 origin-bottom border-r border-gold-500/10"
                          style={{ 
                            transform: `rotate(${i * angle}deg)`,
                            background: i % 2 === 0 ? 'rgba(234, 179, 8, 0.05)' : 'rgba(255,255,255,0.02)'
                          }}
                        >
                            <div className="mt-8 flex flex-col items-center">
                                <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: r.color }}>{r.label}</span>
                                <i className="fas fa-microchip mt-2 opacity-30 text-[10px]"></i>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Central Hub */}
            <div className="absolute w-24 h-24 bg-space-950 border-4 border-gold-500 rounded-full flex items-center justify-center z-50 shadow-2xl">
               <div className="w-16 h-16 bg-gold-500 text-black rounded-full flex items-center justify-center text-2xl shadow-[inset_0_0_15px_rgba(0,0,0,0.4)]">
                   <i className="fas fa-dna animate-spin-slow"></i>
               </div>
            </div>
        </div>

        {reward ? (
           <div className="relative z-10 animate-fade-in text-center space-y-6">
              <div className="space-y-1">
                <p className="text-emerald-400 font-black text-xs uppercase tracking-widest animate-pulse">RE-CALIBRATION_SUCCESS</p>
                <h3 className="text-5xl font-display font-black text-white italic gold-gradient-text">+{reward.value} XP</h3>
              </div>
              <button 
                onClick={onClose}
                className="w-full py-5 bg-gold-500 text-black font-black uppercase text-xs tracking-[0.5em] rounded-2xl shadow-3xl hover:scale-105 active:scale-95 transition-all italic font-mono"
              >
                Sync_Data_Packet
              </button>
           </div>
        ) : (
            <button 
                onClick={spinWheel}
                disabled={isSpinning}
                className="relative z-10 w-full py-8 bg-gold-500 text-black font-black uppercase text-sm tracking-[0.8em] rounded-3xl shadow-[0_20px_60px_rgba(234,179,8,0.4)] hover:bg-gold-400 active:scale-95 transition-all italic font-mono animate-pulse"
            >
                {isSpinning ? 'RE-CALIBRATING...' : 'INITIALIZE_SPIN'}
            </button>
        )}

      </div>

      <style>{`
        .clip-triangle {
            clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }
      `}</style>
    </div>
  );
};
