
import React, { useMemo } from 'react';
import { IdentityProfile, SPIDomain } from '../types';
import { getStats } from '../services/storageService';

interface BlueprintProps {
  profile: IdentityProfile | null;
}

const DOMAINS = [
  { id: SPIDomain.SAFETY, weight: 15, icon: 'fa-shield-alt', color: 'emerald', description: 'Bioeffects, ALARA, and patient care protocols.' },
  { id: SPIDomain.PHYSICS, weight: 15, icon: 'fa-wave-square', color: 'blue', description: 'Sound properties, wave parameters, and tissue interactions.' },
  { id: SPIDomain.TRANSDUCERS, weight: 16, icon: 'fa-satellite-dish', color: 'indigo', description: 'PZT physics, beam formation, and transducer types.' },
  { id: SPIDomain.INSTRUMENTATION, weight: 28, icon: 'fa-tv', color: 'gold', description: 'Instrumentation, receiver functions, and display modes.' },
  { id: SPIDomain.DOPPLER, weight: 26, icon: 'fa-heartbeat', color: 'pink', description: 'Blood flow physics and spectral/color Doppler principles.' }
];

export const Blueprint: React.FC<BlueprintProps> = ({ profile }) => {
  const stats = getStats();
  
  const readiness = useMemo(() => {
     return DOMAINS.map(d => {
        const domainData = stats.domainMatrix[d.id];
        if (!domainData || domainData.total === 0) return 15; // Minimum baseline
        return Math.round((domainData.correct / domainData.total) * 100);
     });
  }, [stats]);

  const sortedByReadiness = useMemo(() => {
      return [...DOMAINS].map((d, i) => ({ ...d, score: readiness[i] }))
          .sort((a, b) => a.score - b.score);
  }, [readiness]);

  const weakestDomain = sortedByReadiness[0];

  return (
    <div className="max-w-[1600px] mx-auto p-6 md:p-24 space-y-16 md:space-y-32 animate-fade-in font-mono pb-48">
      <header className="space-y-6 text-center md:text-left">
        <div className="inline-flex items-center gap-2 bg-gold-500/10 px-4 py-1.5 rounded-full border border-gold-500/30">
          <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse shadow-[0_0_10px_gold]"></span>
          <span className="text-[10px] md:text-sm font-black text-gold-500 uppercase tracking-widest">TACTICAL_EXAM_BLUEPRINT</span>
        </div>
        <h1 className="text-5xl md:text-[10rem] font-display font-black text-white uppercase italic tracking-tighter leading-[0.85] gold-text-gradient">
          The_Matrix
        </h1>
        <p className="text-xl md:text-4xl text-slate-400 italic font-light max-w-3xl border-l-2 border-white/10 pl-8 mx-auto md:mx-0">
          "The SPI Exam is not a test of memory, but a test of system integration. Your current logic synchronization is being mapped in real-time."
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16">
        <div className="lg:col-span-7 space-y-8">
          <div className="glass-card p-8 md:p-16 rounded-[3rem] border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-scanline opacity-[0.03] pointer-events-none"></div>
            <div className="flex justify-between items-center mb-10">
                <h3 className="hud-label text-slate-500 block">SECTOR_SYNC_TELEMETRY</h3>
                <span className="text-[10px] text-emerald-500 font-black animate-pulse">LIVE_MATRIX_UPLINK</span>
            </div>
            
            <div className="space-y-12">
              {DOMAINS.map((domain, i) => {
                const score = readiness[i];
                const isCritical = score < 70;
                const isSync = score >= 85;
                
                return (
                  <div key={i} className="space-y-4 group">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 md:w-16 md:h-16 rounded-xl border flex items-center justify-center transition-all ${isCritical ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' : isSync ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-gold-500/10 border-gold-500/30 text-gold-500'}`}>
                           <i className={`fas ${domain.icon} text-sm md:text-2xl`}></i>
                         </div>
                         <div className="min-w-0">
                           <div className="flex items-center gap-3">
                               <h4 className="text-sm md:text-3xl font-black text-white uppercase italic tracking-tight">{domain.id}</h4>
                               {isCritical && <span className="text-[6px] md:text-[9px] font-black text-red-500 border border-red-500/30 px-1.5 py-0.5 rounded uppercase">Critical</span>}
                               {isSync && <span className="text-[6px] md:text-[9px] font-black text-emerald-500 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase">Synced</span>}
                           </div>
                           <p className="text-[8px] md:text-xs text-slate-600 uppercase tracking-widest truncate">{domain.description}</p>
                         </div>
                      </div>
                      <span className={`text-xl md:text-5xl font-display font-black ${isCritical ? 'text-red-500' : isSync ? 'text-emerald-400' : 'text-gold-500'}`}>{score}%</span>
                    </div>
                    <div className="h-2 md:h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                      <div 
                        className={`h-full transition-all duration-[2s] delay-${i * 100} ${isCritical ? 'bg-gradient-to-r from-slate-900 to-red-600' : isSync ? 'bg-gradient-to-r from-slate-900 to-emerald-500' : 'bg-gradient-to-r from-slate-900 to-gold-500'}`} 
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8 md:space-y-16">
          <div className="glass-card p-10 md:p-20 rounded-[4rem] border-gold-500/20 text-center flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden bg-black/60 shadow-2xl">
            <div className="absolute inset-0 bg-aurora opacity-10 pointer-events-none"></div>
            <h3 className="hud-label text-gold-500 mb-10 z-10">READINESS_RADAR</h3>
            <div className="relative w-64 h-64 md:w-80 md:h-80 z-10">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                    <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                    <circle cx="50" cy="50" r="15" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
                    
                    {/* Web Grid */}
                    {[0, 72, 144, 216, 288].map(angle => {
                        const r = 45;
                        const x = 50 + r * Math.cos(angle * Math.PI / 180);
                        const y = 50 + r * Math.sin(angle * Math.PI / 180);
                        return <line key={angle} x1="50" y1="50" x2={x} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />;
                    })}

                    {/* Readiness Polygon - Animated */}
                    <polygon 
                        points={readiness.map((val, i) => {
                            const angle = i * (360 / DOMAINS.length);
                            const r = (val / 100) * 45;
                            const x = 50 + r * Math.cos(angle * Math.PI / 180);
                            const y = 50 + r * Math.sin(angle * Math.PI / 180);
                            return `${x},${y}`;
                        }).join(' ')}
                        fill="rgba(212, 175, 55, 0.15)"
                        stroke="#d4af37"
                        strokeWidth="2"
                        className="transition-all duration-[2s] ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs md:text-5xl font-display font-black text-white italic">{stats.averageScore}%</span>
                    <span className="hud-label text-[6px] md:text-[10px]">AVG_SYNC</span>
                </div>
            </div>
          </div>

          <div className="glass-card p-10 md:p-16 rounded-[3rem] border-indigo-500/20 bg-indigo-950/5 relative overflow-hidden flex flex-col items-start gap-6">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-2xl md:text-4xl flex-shrink-0">
                    <i className="fas fa-bullseye animate-pulse"></i>
                </div>
                <div>
                    <span className="hud-label text-indigo-400">PRIORITY_ORDERS</span>
                    <h4 className="text-white font-black uppercase text-xs md:text-xl italic">Target: {weakestDomain.id}</h4>
                </div>
            </div>
            <div className="space-y-4">
              <p className="text-xs md:text-2xl text-slate-300 italic font-light leading-snug">
                "Operator, the matrix identifies a logic leak in **{weakestDomain.id}**. This is currently your highest clinical failure point. Prioritize synchronization in this sector before moving to Advanced Tech."
              </p>
              <div className="flex gap-4">
                <span className="text-[7px] md:text-[10px] font-black text-slate-700 uppercase tracking-widest bg-black/40 px-3 py-1 rounded">Vectron_Core_v1.2</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
