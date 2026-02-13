
import React from 'react';
import { AppView, Topic } from '../types';

interface SystemsHubProps {
  onNavigate: (view: AppView, topic?: Topic) => void;
  onClose: () => void;
}

const SYSTEM_GROUPS = [
  {
    category: "CORE_ENGINE",
    items: [
      { id: AppView.HOME, label: "Command Center", icon: "fa-th-large", desc: "Main operational dashboard." },
      { id: AppView.BRIDGE, label: "Neural Bridge", icon: "fa-satellite-dish", desc: "Vibrational signature analysis." },
      { id: AppView.BLUEPRINT, label: "Exam Matrix", icon: "fa-microchip", desc: "Official SPI domain weighting." },
      { id: AppView.EVOLUTION, label: "Sim Explorer", icon: "fa-atom", desc: "Interactive physics laboratory." },
    ]
  },
  {
    category: "STRATEGIC_TRAINING",
    items: [
      { id: AppView.CURRICULUM, label: "Sector Mapping", icon: "fa-map-marked-alt", desc: "Structured learning modules." },
      { id: AppView.PROTOCOL, label: "Flash Protocol", icon: "fa-bolt", desc: "High-speed neural re-wiring." },
      { id: AppView.MISSIONS, label: "Field Missions", icon: "fa-crosshairs", desc: "Case-based sector analysis." },
    ]
  },
  {
    category: "INTEL_&_VAULT",
    items: [
      { id: AppView.INTEL, label: "Intel Bureau", icon: "fa-folder-open", desc: "Legendary-grade archives." },
      { id: AppView.VAULT, label: "Tactical Vault", icon: "fa-vault", desc: "Saved notes and script packets." },
    ]
  },
  {
    category: "OPERATOR_DATA",
    items: [
      { id: AppView.PROFILE, label: "Operator Profile", icon: "fa-user-astronaut", desc: "Performance history and rank." },
      { id: AppView.ADMIN, label: "System Architect", icon: "fa-shield-virus", desc: "Content override terminal.", restricted: true },
    ]
  }
];

export const SystemsHub: React.FC<SystemsHubProps> = ({ onNavigate, onClose }) => {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-12 animate-fade-in font-mono">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={onClose}></div>
      
      {/* Background HUD Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10 md:opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] border-[1px] border-emerald-500/20 rounded-full animate-spin-slow"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] border-[1px] border-gold-500/20 rounded-full animate-reverse-spin-slow"></div>
          <div className="absolute inset-0 bg-scanline opacity-10 animate-scanline"></div>
      </div>

      <div className="relative w-full max-w-[1600px] h-full flex flex-col pt-safe pb-safe">
        <header className="flex justify-between items-center mb-6 md:mb-12 border-b border-white/10 pb-4 md:pb-8">
            <div className="space-y-1 md:space-y-2">
                <div className="flex items-center gap-2 md:gap-4">
                    <div className="w-1.5 h-1.5 md:w-3 md:h-3 rounded-full bg-gold-500 shadow-[0_0_15px_gold] animate-pulse"></div>
                    <span className="hud-label text-gold-500 text-[8px] md:text-sm tracking-[0.2em] md:tracking-[0.5em]">SYSTEM_MATRIX_HUB</span>
                </div>
                <h2 className="text-2xl xs:text-3xl md:text-7xl font-display font-black text-white uppercase italic tracking-tighter gold-text-gradient leading-none">Core_Systems</h2>
            </div>
            <button 
                onClick={onClose}
                className="w-10 h-10 md:w-20 md:h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all active:scale-90 shadow-2xl"
            >
                <i className="fas fa-times text-lg md:text-4xl"></i>
            </button>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 pb-32">
            {SYSTEM_GROUPS.map((group, gIdx) => (
                <div key={gIdx} className="space-y-4 md:space-y-6">
                    <h3 className="hud-label text-slate-700 border-l-2 border-white/10 pl-3 md:pl-4 text-[7px] md:text-[10px]">{group.category}</h3>
                    <div className="space-y-3 md:space-y-4">
                        {group.items.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => { onNavigate(item.id); onClose(); }}
                                className="w-full text-left p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-gold-500/10 hover:border-gold-500/30 transition-all group relative overflow-hidden flex flex-col gap-2 md:gap-4 active:scale-[0.98]"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:text-gold-500 group-hover:border-gold-500/50 transition-all shadow-inner">
                                        <i className={`fas ${item.icon} text-sm md:text-xl`}></i>
                                    </div>
                                    <i className="fas fa-chevron-right text-[8px] md:text-[10px] text-white/10 group-hover:text-gold-500 transition-colors"></i>
                                </div>
                                <div>
                                    <h4 className="text-sm md:text-xl font-display font-black text-white uppercase italic tracking-tight group-hover:text-gold-400 transition-colors leading-none mb-1 md:mb-2">{item.label}</h4>
                                    <p className="text-[7px] md:text-[10px] text-slate-600 italic leading-tight group-hover:text-slate-400 transition-colors line-clamp-1">{item.desc}</p>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-tr from-gold-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>

        <footer className="mt-auto p-4 md:p-8 flex justify-between items-center opacity-30 border-t border-white/5 bg-black/40 backdrop-blur-xl">
            <span className="text-[6px] md:text-[10px] uppercase font-black tracking-[0.2em] md:tracking-[0.5em] text-slate-500">RAV_OS_v1.0.4</span>
            <div className="flex gap-2">
                {[1,2].map(i => <div key={i} className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: `${i*0.2}s` }}></div>)}
            </div>
        </footer>
      </div>
    </div>
  );
};
