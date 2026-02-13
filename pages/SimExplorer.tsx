
import React, { useState } from 'react';
import { Topic } from '../types';
import { VisualExplainer } from '../components/VisualExplainer';

const SIM_CATALOG = [
  { id: 'LongitudinalWaveVisual', title: 'Particle Kinetics', category: 'WAVE', icon: 'fa-wave-square', sector: '01' },
  { id: 'WaveParametersVisual', title: 'Acoustic Sine', category: 'WAVE', icon: 'fa-signature', sector: '01' },
  { id: 'TransducerAnatomyVisual', title: 'PZT Dynamics', category: 'HARDWARE', icon: 'fa-satellite-dish', sector: '02' },
  { id: 'PulseParametersVisual', title: 'Pulse Timing', category: 'PULSE', icon: 'fa-stopwatch', sector: '03' },
  { id: 'DopplerModesVisual', title: 'Shift Matrix', category: 'DOPPLER', icon: 'fa-heartbeat', sector: '04' },
  { id: 'FlowPatternsVisual', title: 'Hemodynamics', category: 'HEMO', icon: 'fa-tint', sector: '07' },
  { id: 'PropagationArtifactsVisual', title: 'Artifact Loops', category: 'ARTIFACTS', icon: 'fa-ghost', sector: '05' },
  { id: 'AxialResolutionVisual', title: 'Spatial Sep.', category: 'RESOLUTION', icon: 'fa-compress-arrows-alt', sector: '09' },
  { id: 'BioeffectMechanismsVisual', title: 'Cavitation', category: 'SAFETY', icon: 'fa-shield-alt', sector: '06' },
  { id: 'QaPhantomVisual', title: 'Calibration', category: 'QA', icon: 'fa-ruler-combined', sector: '08' },
  { id: 'HarmonicImagingVisual', title: 'Non-Linear', category: 'HARMONICS', icon: 'fa-music', sector: '10' },
  { id: 'ReceiverFunctionsVisual', title: 'Console Signal', category: 'INSTR.', icon: 'fa-tv', sector: '11' }
];

export const SimExplorer: React.FC = () => {
  const [activeSimId, setActiveSimId] = useState(SIM_CATALOG[0].id);
  const [showCatalog, setShowCatalog] = useState(false);

  const activeSim = SIM_CATALOG.find(s => s.id === activeSimId);

  return (
    <div className="h-full bg-space-1000 flex flex-col overflow-hidden animate-fade-in relative font-mono">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] border-[1px] border-white/5 rounded-full animate-spin-slow"></div>
          <div className="absolute inset-0 bg-scanline opacity-[0.05] animate-scanline"></div>
      </div>

      <div className="flex-1 p-4 md:p-12 lg:p-20 flex flex-col items-center justify-center relative z-10">
          {/* Main Simulation Viewport */}
          <div className="w-full h-full max-w-[1900px] rounded-[2rem] md:rounded-[5rem] overflow-hidden border-2 border-white/10 shadow-[0_60px_150px_rgba(0,0,0,1)] relative bg-black tactical-bracket flex flex-col">
            <div className="flex-1 relative">
               <VisualExplainer topic={Topic.MODULE_1} visualId={activeSimId} />
               
               {/* Sim HUD Header */}
               <div className="absolute top-6 left-6 md:top-12 md:left-12 flex flex-col gap-2 z-30">
                  <div className="flex items-center gap-3 bg-black/80 px-4 py-1.5 rounded-full border border-emerald-500/30 backdrop-blur-xl">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_15px_#10b981] animate-pulse"></div>
                      <span className="text-[7px] md:text-xs font-black text-white uppercase tracking-widest">LIVE_EVO_UPLINK</span>
                  </div>
                  <h2 className="text-xl md:text-6xl font-display font-black text-white uppercase italic tracking-tighter gold-text-gradient leading-none">
                    {activeSim?.title}
                  </h2>
               </div>

               {/* Right Side Info Bar */}
               <div className="absolute top-6 right-6 md:top-12 md:right-12 flex flex-col gap-4 items-end z-30">
                  <button 
                    onClick={() => setShowCatalog(true)}
                    className="flex flex-col items-center justify-center gap-2 p-4 md:p-8 bg-gold-500 text-black rounded-2xl md:rounded-3xl shadow-2xl active:scale-95 transition-all group"
                  >
                    <i className="fas fa-microchip text-xl md:text-4xl group-hover:rotate-180 duration-500"></i>
                    <span className="text-[7px] md:text-xs font-black uppercase tracking-widest font-mono">SIM_NODES</span>
                  </button>
                  <div className="hidden md:flex flex-col items-end gap-1 opacity-40">
                      <span className="text-[8px] text-slate-500 uppercase font-black tracking-[0.4em]">SECTOR: {activeSim?.sector}</span>
                      <span className="text-[8px] text-slate-500 uppercase font-black tracking-[0.4em]">CAT: {activeSim?.category}</span>
                  </div>
               </div>
            </div>

            {/* Bottom Telemetry Bar */}
            <div className="h-16 md:h-24 bg-black/80 border-t border-white/10 backdrop-blur-3xl px-8 flex items-center justify-between">
                <div className="flex gap-10">
                   <div className="space-y-1">
                      <p className="hud-label text-[6px] md:text-[8px]">PROCESSING_STRENGTH</p>
                      <div className="flex gap-1">
                         {[1,2,3,4,5,6,7,8,9,10].map(i => (
                            <div key={i} className={`w-1 md:w-2 h-2 md:h-3 rounded-full ${i <= 7 ? 'bg-emerald-500' : 'bg-white/10'}`}></div>
                         ))}
                      </div>
                   </div>
                   <div className="hidden md:block space-y-1">
                      <p className="hud-label text-[8px]">CORE_SYNC_LEVEL</p>
                      <p className="text-xs text-white font-black uppercase tracking-widest italic">VECTRON_ALPHA_v4.2</p>
                   </div>
                </div>
                <div className="flex gap-6">
                    <div className="flex flex-col items-end">
                       <p className="hud-label text-slate-700 text-[6px] md:text-[8px]">SYSTEM_LOAD</p>
                       <p className="text-xs md:text-xl font-display font-black text-emerald-500 italic">42.2_PFS</p>
                    </div>
                </div>
            </div>
          </div>
      </div>

      {/* Catalog Overlay */}
      {showCatalog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-20 animate-fade-in">
           <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={() => setShowCatalog(false)}></div>
           <div className="relative w-full max-w-7xl h-full flex flex-col bg-space-950 border border-white/10 rounded-[3rem] shadow-[0_0_150px_rgba(0,0,0,1)] overflow-hidden">
              <header className="p-8 md:p-14 border-b border-white/5 flex justify-between items-center bg-black/40">
                  <div className="space-y-2">
                     <span className="hud-label text-gold-500">SIM_CATALOG_SELECT</span>
                     <h3 className="text-3xl md:text-7xl font-display font-black text-white uppercase italic tracking-tighter gold-text-gradient">Logic_Nodes</h3>
                  </div>
                  <button onClick={() => setShowCatalog(false)} className="w-12 h-12 md:w-24 md:h-24 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all">
                     <i className="fas fa-times text-xl md:text-5xl"></i>
                  </button>
              </header>
              <div className="flex-1 overflow-y-auto p-6 md:p-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 no-scrollbar custom-scrollbar">
                  {SIM_CATALOG.map(sim => {
                     const isActive = activeSimId === sim.id;
                     return (
                        <button 
                           key={sim.id}
                           onClick={() => { setActiveSimId(sim.id); setShowCatalog(false); }}
                           className={`p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] text-left border transition-all duration-500 active:scale-95 group relative overflow-hidden flex flex-col gap-6
                             ${isActive ? 'bg-gold-500/10 border-gold-500 shadow-2xl scale-105' : 'bg-white/[0.01] border-white/10 hover:border-gold-500/50 hover:bg-white/[0.03]'}`}
                        >
                           <div className="flex justify-between items-start">
                              <div className={`w-14 h-14 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-2xl md:text-5xl transition-all duration-500
                                ${isActive ? 'bg-gold-500 text-black shadow-[0_0_30px_gold]' : 'bg-black border border-white/10 text-slate-700 group-hover:text-gold-500'}`}>
                                 <i className={`fas ${sim.icon}`}></i>
                              </div>
                              <span className="hud-label text-slate-800 text-[8px] md:text-xs">SEC_{sim.sector}</span>
                           </div>
                           <div className="space-y-1">
                              <p className="hud-label text-slate-700 opacity-50">{sim.category}</p>
                              <h4 className="text-xl md:text-4xl font-display font-black text-white italic uppercase tracking-tight">{sim.title}</h4>
                           </div>
                           {isActive && <div className="absolute -bottom-6 -right-6 text-gold-500 opacity-20"><i className="fas fa-check-circle text-[8rem]"></i></div>}
                        </button>
                     );
                  })}
              </div>
              <footer className="p-8 border-t border-white/5 bg-black/20 text-center opacity-30">
                  <p className="text-[8px] md:text-sm font-mono tracking-[0.4em] uppercase">Vectron_Simulation_Catalog_V4</p>
              </footer>
           </div>
        </div>
      )}

      <style>{`
        .animate-spin-slow { animation: spin 40s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
