
import React, { useEffect, useState } from 'react';
import { HarveyBot } from './HarveyBot';
import { SFX } from '../services/audioService';

interface IntelPulseProps {
  message: string;
  onClose: () => void;
}

export const IntelPulse: React.FC<IntelPulseProps> = ({ message, onClose }) => {
  const [stage, setStage] = useState<'WARNING' | 'MESSAGE'>('WARNING');

  useEffect(() => {
    SFX.playBlip(110, 'sawtooth', 0.5);
    const timer = setTimeout(() => {
      setStage('MESSAGE');
      SFX.playSweep();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 font-mono">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl animate-fade-in" onClick={onClose}></div>
      
      {stage === 'WARNING' ? (
        <div className="relative text-center space-y-8 animate-pulse">
          <div className="w-32 h-32 md:w-64 md:h-64 rounded-full border-4 border-red-600 flex items-center justify-center text-red-600 text-4xl md:text-8xl shadow-[0_0_50px_red]">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h2 className="text-3xl md:text-7xl font-display font-black text-red-500 uppercase italic tracking-tighter">System_Interruption</h2>
          <p className="text-red-400 hud-label text-[10px] md:text-xl tracking-[0.5em]">PRIORITY_OVERRIDE_ACTIVE</p>
        </div>
      ) : (
        <div className="relative w-full max-w-4xl glass-card p-10 md:p-20 rounded-[3rem] border-red-500/30 bg-black/60 shadow-[0_0_150px_rgba(239,68,68,0.2)] flex flex-col items-center gap-12 animate-slide-up">
           <HarveyBot size="lg" isTalking={true} state="WARNING" statusText="PRIORITY_TX" />
           
           <div className="space-y-6 text-center">
              <h3 className="text-red-500 font-display font-black uppercase text-xl md:text-4xl italic tracking-widest leading-none">Vectron_Intel_Pulse</h3>
              <p className="text-xl md:text-5xl text-white font-light italic leading-snug tracking-tight border-l-4 border-red-500/50 pl-8">
                "{message}"
              </p>
           </div>

           <button 
             onClick={onClose}
             className="w-full md:w-auto px-16 py-6 bg-red-600 text-white font-black uppercase text-sm tracking-[0.6em] rounded-xl shadow-2xl active:scale-95 transition-all italic border-b-4 border-red-900"
           >
             Acknowledge_Intel
           </button>
        </div>
      )}
    </div>
  );
};
