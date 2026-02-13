
import React, { useState, useMemo } from 'react';
import { Topic, Flashcard, AppView } from '../types';

const FLASHCARDS: Flashcard[] = [
  { id: '1', topic: Topic.MODULE_1, difficulty: 'EASY', question: "Is sound a longitudinal or transverse wave?", answer: "Longitudinal (it oscillates parallel to the direction of travel)." },
  { id: '2', topic: Topic.MODULE_1, difficulty: 'MEDIUM', question: "What is the propagation speed of sound in soft tissue?", answer: "1540 m/s (or 1.54 mm/µs)." },
  { id: '3', topic: Topic.MODULE_2, difficulty: 'HARD', question: "What is the thickness of the matching layer?", answer: "1/4 of the wavelength (1/4 λ)." },
  { id: '4', topic: Topic.MODULE_3, difficulty: 'MEDIUM', question: "How does damping affect the bandwidth?", answer: "It increases bandwidth (shorter pulses have more frequencies)." },
  { id: '5', topic: Topic.MODULE_4, difficulty: 'HARD', question: "What happens to the Doppler shift if the angle is 90 degrees?", answer: "It becomes zero (cosine of 90 is 0)." },
  { id: '6', topic: Topic.MODULE_5, difficulty: 'EASY', question: "Which artifact results in lateral misregistration?", answer: "Refraction." },
  { id: '7', topic: Topic.MODULE_6, difficulty: 'HARD', question: "What does SPTA intensity relate to most closely?", answer: "Bioeffects (specifically Thermal Index)." },
  { id: '8', topic: Topic.MODULE_7, difficulty: 'MEDIUM', question: "What is the primary driver of blood flow?", answer: "Pressure Gradient (Energy Gradient)." },
  { id: '9', topic: Topic.MODULE_9, difficulty: 'HARD', question: "Formula for Lateral Resolution?", answer: "Lateral Res = Beam Diameter (Width)." },
  { id: '10', topic: Topic.MODULE_11, difficulty: 'MEDIUM', question: "What is the function of the Log Amplifier?", answer: "Compression (mapping high signals to a smaller range for display)." },
  { id: '11', topic: Topic.MODULE_4, difficulty: 'MEDIUM', question: "Formula for the Nyquist Limit?", answer: "Nyquist Limit = PRF / 2." },
  { id: '12', topic: Topic.MODULE_10, difficulty: 'EASY', question: "What is the 2nd harmonic of a 3MHz fundamental?", answer: "6 MHz." }
];

export const Protocol: React.FC<{ onNavigate: (v: AppView) => void }> = ({ onNavigate }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filter, setFilter] = useState<Topic | 'ALL'>('ALL');

  const filteredCards = useMemo(() => {
    return filter === 'ALL' ? FLASHCARDS : FLASHCARDS.filter(c => c.topic === filter);
  }, [filter]);

  const card = filteredCards[currentIndex % filteredCards.length];

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex(prev => (prev + 1) % filteredCards.length), 150);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-24 space-y-12 md:space-y-24 animate-fade-in font-mono">
      <header className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-4xl md:text-8xl font-display font-black text-white italic uppercase tracking-tighter gold-text-gradient">Protocol_Flash</h2>
          <p className="hud-label text-gold-500/60 tracking-[0.5em]">High-Speed Neural Re-Wiring</p>
        </div>
        <select 
          value={filter} 
          onChange={(e) => { setFilter(e.target.value as any); setCurrentIndex(0); }}
          className="bg-black/60 border border-white/10 rounded-xl px-6 py-3 text-gold-500 text-xs md:text-xl font-black uppercase outline-none focus:border-gold-500"
        >
          <option value="ALL">ALL_SECTORS</option>
          {Object.values(Topic).filter(t => t !== Topic.FULL_MOCK).map(t => (
            <option key={t} value={t}>{t.toUpperCase()}</option>
          ))}
        </select>
      </header>

      <div className="flex flex-col items-center gap-12">
        {filteredCards.length > 0 ? (
            <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative w-full max-w-3xl aspect-[4/3] cursor-pointer perspective-1000 group"
            >
            <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                {/* Front */}
                <div className="absolute inset-0 backface-hidden glass-card p-12 md:p-24 rounded-[3rem] border-gold-500/20 flex flex-col items-center justify-center text-center space-y-8">
                <span className="hud-label text-slate-700">PROBE_QUERY</span>
                <p className="text-2xl md:text-6xl font-display font-black text-white italic leading-tight uppercase tracking-tight">
                    {card.question}
                </p>
                <p className="text-[10px] md:text-sm text-gold-500/40 animate-pulse mt-12">TOUCH_TO_DECRYPT_ANSWER</p>
                </div>
                {/* Back */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 glass-card p-12 md:p-24 rounded-[3rem] border-emerald-500/20 bg-emerald-950/5 flex flex-col items-center justify-center text-center space-y-8">
                <span className="hud-label text-emerald-500">DECRYPTED_LOG</span>
                <p className="text-2xl md:text-5xl font-display font-bold text-slate-100 leading-relaxed italic">
                    {card.answer}
                </p>
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <i className="fas fa-check-double"></i>
                </div>
                </div>
            </div>
            </div>
        ) : (
            <div className="glass-card p-24 rounded-[3rem] border-white/5 text-center italic opacity-30 text-4xl uppercase">No nodes found in this sector.</div>
        )}

        {filteredCards.length > 0 && (
            <div className="flex gap-6 w-full max-w-lg">
                <button 
                onClick={nextCard}
                className="flex-1 py-6 md:py-10 bg-gold-500 text-black font-black uppercase text-xs md:text-2xl rounded-2xl md:rounded-[2.5rem] shadow-xl hover:bg-white active:scale-95 transition-all italic flex items-center justify-center gap-4"
                >
                    <span>NEXT_NODE</span>
                    <i className="fas fa-arrow-right"></i>
                </button>
            </div>
        )}
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .animate-dash {
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
            animation: dash 3s ease-in-out forwards;
        }
        @keyframes dash {
            to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
};
