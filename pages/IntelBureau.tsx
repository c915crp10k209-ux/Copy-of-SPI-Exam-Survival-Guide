
import React, { useState } from 'react';
import { AppView, IntelArchive, Topic } from '../types';
import { INTEL_ARCHIVES } from '../constants';
import { VisualExplainer } from '../components/VisualExplainer';
import { getStats } from '../services/storageService';
import ReactMarkdown from 'react-markdown';

export const IntelBureau: React.FC<{ onNavigate: (view: AppView, topic?: Topic) => void }> = ({ onNavigate }) => {
  const [activeIntel, setActiveIntel] = useState<IntelArchive | null>(null);
  const stats = getStats();

  return (
    <div className="max-w-[1800px] mx-auto p-4 md:p-16 space-y-12 animate-fade-in font-mono relative">
      <header className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12">
        <div className="space-y-4">
           <h1 className="text-5xl md:text-[8rem] font-display font-black text-white uppercase italic tracking-tighter gold-text-gradient leading-none">Intel_Bureau</h1>
           <p className="text-emerald-500/60 text-xs md:text-2xl italic tracking-widest border-l-4 border-gold-500/30 pl-6 uppercase">Legendary_Grade_Archives</p>
        </div>
        <div className="flex gap-4">
            <div className="px-6 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 hud-label text-emerald-400 flex items-center gap-3">
               <i className="fas fa-microchip animate-spin-slow"></i>
               ACCESS_LEVEL: {stats.level >= 5 ? 'DIRECTOR' : 'ASSET'}
            </div>
        </div>
      </header>

      {!activeIntel ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
           {INTEL_ARCHIVES.map(intel => {
             const isLocked = stats.xp < intel.unlockXp;
             return (
               <button 
                 key={intel.id}
                 disabled={isLocked}
                 onClick={() => setActiveIntel(intel)}
                 className={`glass-card p-10 rounded-[3rem] text-left group transition-all relative overflow-hidden flex flex-col h-full active:scale-95 ${isLocked ? 'opacity-40 grayscale pointer-events-none' : 'hover:border-emerald-500/40'}`}
               >
                  <div className="absolute inset-0 bg-scanline opacity-[0.03] pointer-events-none"></div>
                  <div className="flex justify-between items-start mb-12">
                     <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform ${isLocked ? 'bg-slate-800 text-slate-600' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500'}`}>
                        <i className={`fas ${isLocked ? 'fa-lock' : 'fa-folder-open'}`}></i>
                     </div>
                     <span className="text-[10px] font-black text-emerald-500/40 uppercase tracking-widest">{intel.sector}</span>
                  </div>
                  <h3 className="text-3xl font-display font-black text-white uppercase italic mb-6 group-hover:text-emerald-400 transition-colors">{intel.title}</h3>
                  <p className="text-slate-500 italic text-lg leading-relaxed mb-10 flex-1">{intel.summary}</p>
                  
                  {isLocked ? (
                    <div className="pt-6 border-t border-white/5 flex items-center justify-between text-red-500">
                       <span className="hud-label">UNLOCK: {intel.unlockXp} XP</span>
                       <i className="fas fa-lock"></i>
                    </div>
                  ) : (
                    <div className="pt-6 border-t border-white/5 flex items-center justify-between text-emerald-500">
                       <span className="hud-label">DECRYPT_READY</span>
                       <i className="fas fa-arrow-right"></i>
                    </div>
                  )}
               </button>
             );
           })}
        </div>
      ) : (
        <div className="space-y-12 animate-slide-up pb-32">
           <button 
             onClick={() => setActiveIntel(null)}
             className="flex items-center gap-3 text-emerald-500 hover:text-white transition-colors uppercase font-black text-xs md:text-xl italic mb-10"
           >
              <i className="fas fa-chevron-left"></i> CLOSE_ARCHIVE
           </button>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-24">
              <div className="lg:col-span-8 space-y-12">
                 <div className="glass-card p-10 md:p-24 rounded-[4rem] border-emerald-500/20 bg-black/60 backdrop-blur-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5">
                       <i className="fas fa-microchip text-[15rem]"></i>
                    </div>
                    <div className="prose prose-invert prose-xl md:prose-2xl max-w-none">
                       {/* Fix: Wrapped ReactMarkdown in a div as className is not supported on the component directly */}
                       <div className="text-slate-200 font-light italic leading-relaxed font-display">
                          <ReactMarkdown>
                             {activeIntel.content}
                          </ReactMarkdown>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="lg:col-span-4 space-y-12">
                 <div className="aspect-square bg-black rounded-[4rem] border border-white/10 overflow-hidden relative shadow-3xl tactical-bracket group">
                    <VisualExplainer topic={Topic.MODULE_1} visualId={activeIntel.visualId} hideControls={false} />
                    <div className="absolute top-8 left-8 flex items-center gap-3 bg-black/80 px-6 py-2 rounded-full border border-emerald-500/30 backdrop-blur-xl z-20">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                       <span className="hud-label text-white">ARCHIVE_VISUAL</span>
                    </div>
                 </div>

                 <div className="glass-card p-12 rounded-[4rem] border-white/5 bg-white/[0.01]">
                    <h4 className="hud-label text-slate-600 mb-6">INTEL_SOURCE</h4>
                    <p className="text-sm md:text-lg text-slate-500 italic leading-relaxed">
                       This intelligence packet was synthesized from over 4,000 clinical cases. Ensure logic synchronization before practical deployment.
                    </p>
                    <button 
                      onClick={() => onNavigate(AppView.VAULT)}
                      className="w-full py-5 mt-10 bg-white/5 border border-white/10 rounded-2xl text-slate-400 font-black uppercase text-[10px] hover:bg-emerald-500 hover:text-black transition-all italic"
                    >
                       SAVE_TO_VAULT
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
