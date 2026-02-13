
import React, { useEffect, useState } from 'react';
import { getTacticalDirective } from '../services/geminiService';
import { TOPICS } from '../constants';
import { getProfile } from '../services/storageService';
import { Topic } from '../types';

export const Bridge: React.FC<{ profile: any }> = ({ profile }) => {
  const [directive, setDirective] = useState('FETCHING_PROTOCOL...');
  const [activeNode, setActiveNode] = useState(0);
  const [hoverSector, setHoverSector] = useState<string | null>(null);

  useEffect(() => {
    getTacticalDirective(profile).then(setDirective);
  }, [profile]);

  const numerologyNodes = [
    { label: 'LIFE_PATH', value: profile.numerology.lifePath, desc: 'Core Destiny Coordinate' },
    { label: 'EXPRESSION', value: profile.numerology.expression, desc: 'Outer Potential Frequency' },
    { label: 'SOUL_URGE', value: profile.numerology.soulUrge, desc: 'Inner Motivational Resonance' },
  ];

  const getSectorCompletion = (topicId: string) => {
    const topicMeta = TOPICS[topicId as Topic];
    if (!topicMeta) return 0;
    const progress = profile.progress?.topicProgress || {};
    const lastSub = progress[topicId];
    if (!lastSub) return 0;
    const lastIdx = topicMeta.subTopics.findIndex(st => st.id === lastSub);
    return Math.round(((lastIdx + 1) / (topicMeta.subTopics.length || 1)) * 100);
  };

  const sectors = Object.keys(TOPICS).filter(k => k !== Topic.FULL_MOCK);

  return (
    <div className="max-w-[2200px] mx-auto p-4 md:p-16 space-y-12 animate-fade-in font-mono pb-64">
      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-12 relative">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-gold-500/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="space-y-6 flex-1 z-10">
            <div className="flex flex-wrap items-center gap-4">
               <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full text-emerald-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black">SIGNATURE_STABLE</span>
               </div>
               <span className="hud-label bg-gold-500/10 border border-gold-500/30 px-3 py-1 rounded text-gold-500">AUTH: {profile.tier}</span>
            </div>
            <h1 className="text-5xl xs:text-6xl md:text-[12rem] font-display font-black text-white uppercase italic tracking-tighter gold-text-gradient leading-none">
              {profile.type}
            </h1>
            <p className="text-xl md:text-5xl text-slate-400 italic font-light max-w-4xl border-l-4 border-gold-500/20 pl-8">
              "{profile.signature}"
            </p>
        </div>

        <div className="w-full lg:w-[600px] glass-card p-10 md:p-16 rounded-[3rem] border-gold-500/20 relative overflow-hidden group shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
            <div className="absolute inset-0 bg-scanline opacity-[0.05] pointer-events-none group-hover:opacity-[0.1] transition-opacity"></div>
            <div className="relative z-10 space-y-6">
               <div className="flex items-center justify-between">
                  <span className="hud-label text-gold-500 flex items-center gap-2"><i className="fas fa-terminal animate-pulse"></i> QUICK_WIN_DIRECTIVE</span>
                  <span className="text-[8px] text-slate-700">COORD: ${profile.numerology.lifePath}.${profile.numerology.expression}</span>
               </div>
               <p className="text-2xl md:text-4xl text-white font-bold leading-tight italic tracking-tight shimmer-text">
                  {directive}
               </p>
            </div>
        </div>
      </div>

      {/* Neural Connectivity Map (NEW) */}
      <div className="glass-panel p-10 md:p-20 rounded-[4rem] border-white/5 bg-black/40 relative overflow-hidden flex flex-col lg:flex-row gap-12 items-center">
        <div className="absolute inset-0 pointer-events-none opacity-20">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] border-[1px] border-gold-500/5 rounded-full animate-spin-slow"></div>
        </div>

        <div className="flex-1 w-full max-w-3xl relative aspect-square">
            <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                {/* Connection lines */}
                {sectors.map((s, i) => {
                    const angle = (i / sectors.length) * Math.PI * 2;
                    const nextAngle = ((i + 1) % sectors.length) / sectors.length * Math.PI * 2;
                    const x1 = 200 + 140 * Math.cos(angle);
                    const y1 = 200 + 140 * Math.sin(angle);
                    const x2 = 200 + 140 * Math.cos(nextAngle);
                    const y2 = 200 + 140 * Math.sin(nextAngle);
                    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
                })}
                
                {/* Sector Nodes */}
                {sectors.map((s, i) => {
                    const angle = (i / sectors.length) * Math.PI * 2;
                    const x = 200 + 140 * Math.cos(angle);
                    const y = 200 + 140 * Math.sin(angle);
                    const completion = getSectorCompletion(s);
                    const isActive = hoverSector === s;
                    
                    return (
                        <g key={s} className="cursor-pointer" onMouseEnter={() => setHoverSector(s)} onMouseLeave={() => setHoverSector(null)}>
                            <circle 
                                cx={x} cy={y} r={isActive ? 22 : 18} 
                                className={`transition-all duration-500 ${completion === 100 ? 'fill-emerald-500' : completion > 0 ? 'fill-gold-500' : 'fill-slate-800'}`}
                                opacity={isActive ? 1 : 0.6}
                            />
                            <circle cx={x} cy={y} r={isActive ? 26 : 22} fill="none" className="stroke-white/10" strokeWidth="1" strokeDasharray="5,5" />
                            {isActive && <circle cx={x} cy={y} r={32} fill="none" className="stroke-gold-500 animate-ping" strokeWidth="0.5" />}
                            <text x={x} y={y + 5} className="fill-black font-black text-[10px] text-center" textAnchor="middle">{i + 1}</text>
                        </g>
                    );
                })}
                
                {/* Central Brain Core */}
                <circle cx="200" cy="200" r="40" className="fill-black stroke-gold-500/20" strokeWidth="2" />
                <path d="M190,190 L210,210 M190,210 L210,190" stroke="#f59e0b" strokeWidth="2" opacity="0.4" />
                <circle cx="200" cy="200" r="45" className="fill-none stroke-gold-500/10 animate-spin-slow" strokeWidth="1" strokeDasharray="10,5" />
            </svg>
        </div>

        <div className="lg:w-[400px] space-y-8 z-10">
            <div className="space-y-2">
                <span className="hud-label text-gold-500">NEURAL_MAP_INTEL</span>
                <h3 className="text-4xl font-display font-black text-white italic gold-text-gradient uppercase leading-none">Sector_Status</h3>
            </div>
            
            {hoverSector ? (
                <div className="animate-fade-in space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center text-gold-500 border border-gold-500/30">
                            <i className={`fas ${TOPICS[hoverSector as Topic]?.icon || 'fa-microchip'}`}></i>
                        </div>
                        <div>
                            <h4 className="text-2xl font-black text-white italic uppercase tracking-tight leading-none">{hoverSector}</h4>
                            <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest mt-1">MAP_SYNC: {getSectorCompletion(hoverSector)}%</p>
                        </div>
                    </div>
                    <p className="text-slate-400 italic text-sm leading-relaxed border-l-2 border-gold-500/20 pl-4">
                        {TOPICS[hoverSector as Topic]?.description}
                    </p>
                </div>
            ) : (
                <div className="opacity-30 italic text-slate-500 text-sm animate-pulse">
                    Hover over a neural node to decrypt sector summary and tactical preparedness levels.
                </div>
            )}
        </div>
      </div>

      {/* Main Bridge Systems */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
         {/* Vibrational Nodes */}
         <div className="lg:col-span-4 space-y-6 md:space-y-10">
            <div className="flex items-center gap-4">
               <h3 className="hud-label text-slate-700">VIBRATIONAL_DATA_NODES</h3>
               <div className="flex-1 h-px bg-white/5"></div>
            </div>
            <div className="space-y-4">
               {numerologyNodes.map((node, i) => (
                  <button 
                     key={i}
                     onClick={() => setActiveNode(i)}
                     className={`w-full p-8 md:p-12 rounded-[2.5rem] border transition-all duration-500 text-left flex items-center justify-between group relative overflow-hidden active:scale-[0.98]
                       ${activeNode === i ? 'bg-gold-500/10 border-gold-500 shadow-[0_0_40px_rgba(245,158,11,0.15)]' : 'bg-white/[0.01] border-white/5 hover:border-gold-500/30'}`}
                  >
                     <div className="relative z-10 space-y-1">
                        <p className={`hud-label text-[8px] md:text-[10px] ${activeNode === i ? 'text-gold-500' : 'text-slate-700'}`}>{node.label}</p>
                        <h4 className={`text-xl md:text-4xl font-display font-black uppercase italic ${activeNode === i ? 'text-white' : 'text-slate-500'}`}>{node.desc}</h4>
                     </div>
                     <span className={`text-3xl md:text-7xl font-display font-black italic relative z-10 ${activeNode === i ? 'text-gold-500' : 'text-slate-800'}`}>
                        {node.value}
                     </span>
                     {activeNode === i && <div className="absolute inset-0 bg-gradient-to-r from-gold-500/5 to-transparent"></div>}
                  </button>
               ))}
            </div>
         </div>

         {/* Outlook Telemetry */}
         <div className="lg:col-span-8 glass-card p-10 md:p-20 rounded-[4rem] min-h-[600px] relative border-white/5 bg-gradient-to-br from-space-900 via-black to-space-1000 overflow-hidden">
            <div className="absolute inset-0 bg-scanline opacity-[0.03] pointer-events-none"></div>
            <div className="flex justify-between items-center mb-16">
               <div className="space-y-1">
                  <span className="hud-label text-slate-500">BIORHYTHM_ENERGY_TELEMETRY</span>
                  <h3 className="text-xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter gold-text-gradient">7-Day_Out_Sync</h3>
               </div>
               <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2 rounded-full backdrop-blur-xl">
                  <i className="fas fa-chart-line text-emerald-500"></i>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Projection: <span className="text-emerald-400">Optimal</span></span>
               </div>
            </div>

            <div className="w-full h-96 flex items-end justify-between gap-3 md:gap-8 px-4 relative">
               <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.03]">
                  {[1,2,3,4].map(i => <div key={i} className="w-full h-px bg-white"></div>)}
               </div>
               
               {[65, 42, 98, 75, 33, 88, 55].map((val, i) => (
                 <div key={i} className="flex-1 group relative h-full flex flex-col justify-end items-center">
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-500 mb-2">
                       <span className="text-xs md:text-xl font-display font-black text-gold-500 italic">{val}%</span>
                    </div>
                    <div 
                      className={`w-full rounded-t-2xl transition-all duration-[2000ms] ease-out shadow-[0_0_30px_rgba(0,0,0,1)] group-hover:scale-x-105 group-hover:brightness-125 
                        ${val > 80 ? 'bg-gradient-to-t from-emerald-900 to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-gradient-to-t from-gold-900 to-gold-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]'}`}
                      style={{ height: `${val}%` }}
                    >
                       <div className="w-full h-full shimmer-text opacity-10"></div>
                    </div>
                    <div className="mt-8 flex flex-col items-center">
                       <span className="text-[8px] md:text-[10px] text-slate-700 font-black uppercase italic group-hover:text-white transition-colors">Phase_0{i+1}</span>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};
