
import React, { useState, useMemo, useEffect } from 'react';
import { GLOSSARY_TERMS } from '../constants';
import { GlossaryTerm, Topic } from '../types';
import { VisualExplainer } from './VisualExplainer';

interface VisualLexiconProps {
  initialTerm?: string;
  onClose: () => void;
}

export const VisualLexicon: React.FC<VisualLexiconProps> = ({ initialTerm, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTermKey, setSelectedTermKey] = useState<string | null>(
    initialTerm && GLOSSARY_TERMS[initialTerm] ? initialTerm : null
  );
  const [isMobileDetail, setIsMobileDetail] = useState(!!initialTerm);

  const filteredTerms = useMemo(() => {
    return Object.keys(GLOSSARY_TERMS).filter(key => 
      key.toLowerCase().includes(searchTerm.toLowerCase()) || 
      GLOSSARY_TERMS[key].category.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort();
  }, [searchTerm]);

  const selectedTerm = selectedTermKey ? GLOSSARY_TERMS[selectedTermKey] : null;

  const handleSelectTerm = (key: string) => {
    setSelectedTermKey(key);
    setIsMobileDetail(true);
  };

  const handleBackToList = () => {
    setIsMobileDetail(false);
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-6 lg:p-12 animate-fade-in backdrop-blur-sm">
      <div className="absolute inset-0 bg-space-950/95 backdrop-blur-2xl" onClick={onClose}></div>
      
      <div className="relative w-full h-full md:max-w-[1800px] md:h-[92vh] bg-space-900 border md:border-2 border-white/10 md:rounded-3xl shadow-2xl flex flex-col overflow-hidden glass-panel pt-safe pb-safe md:pt-0 md:pb-0">
        
        <div className="px-4 py-3 md:px-16 md:py-10 border-b border-white/10 flex items-center justify-between bg-black/60 backdrop-blur-3xl sticky top-0 z-50">
            <div className="flex items-center gap-3 md:gap-10">
                {isMobileDetail && (
                  <button onClick={handleBackToList} className="md:hidden w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-gold-400 border border-white/10 active:scale-90">
                    <i className="fas fa-chevron-left text-xs"></i>
                  </button>
                )}
                <div className="w-9 h-9 md:w-24 md:h-24 rounded-lg md:rounded-3xl bg-gold-500/10 flex items-center justify-center text-gold-500 border border-gold-500/30">
                    <i className="fas fa-dna text-sm md:text-6xl"></i>
                </div>
                <div className="min-w-0">
                    <h2 className="text-sm md:text-6xl font-display font-black text-white uppercase italic tracking-tighter leading-none truncate">
                      {isMobileDetail && selectedTerm ? selectedTerm.term : 'Registry'}
                    </h2>
                </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 md:w-20 md:h-20 rounded-full flex items-center justify-center text-slate-500 active:scale-90">
                <i className="fas fa-times text-lg md:text-5xl"></i>
            </button>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
            
            {/* Sidebar */}
            <div className={`
              absolute inset-0 z-10 bg-space-1000/98 transition-transform duration-300 md:relative md:translate-x-0 md:w-80 lg:w-[450px] md:border-r border-white/10 flex flex-col
              ${isMobileDetail ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
            `}>
                <div className="p-4 md:p-14 border-b border-white/5 bg-white/[0.01]">
                    <div className="relative group">
                        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-gold-500 transition-colors"></i>
                        <input 
                            type="text" 
                            placeholder="Search concepts..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-xs md:text-xl text-white outline-none font-mono italic focus:border-gold-500/50"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto px-2 md:px-12 pb-24 space-y-2 md:space-y-4 no-scrollbar custom-scrollbar pt-4">
                    {filteredTerms.map(key => (
                        <button 
                            key={key}
                            onClick={() => handleSelectTerm(key)}
                            className={`w-full text-left p-4 md:p-8 rounded-xl md:rounded-3xl transition-all border group active:scale-95 duration-300 ${
                                selectedTermKey === key 
                                ? 'bg-gold-500/10 border-gold-500/40 text-gold-400' 
                                : 'text-slate-600 border-transparent hover:bg-white/[0.02]'
                            }`}
                        >
                            <span className="text-[8px] md:text-[10px] font-mono font-black uppercase tracking-widest block opacity-40 mb-1">{GLOSSARY_TERMS[key].category}</span>
                            <span className="text-sm md:text-4xl font-display font-black italic tracking-tighter uppercase leading-none">{key}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Detail Deck */}
            <div className={`
              flex-1 flex flex-col overflow-hidden bg-space-1000/40 transition-transform duration-300 relative
              ${!isMobileDetail ? 'translate-x-full md:translate-x-0' : 'translate-x-0'}
            `}>
                {selectedTerm ? (
                    <div className="flex-1 overflow-y-auto p-4 md:p-24 lg:p-36 no-scrollbar custom-scrollbar">
                        <div className="animate-slide-up max-w-5xl mx-auto pb-48 space-y-8 md:space-y-32">
                            <div className="space-y-4 md:space-y-12">
                                <div className="flex items-center gap-4 bg-gold-500/10 px-4 py-2 rounded-full border border-gold-500/20 self-start inline-flex">
                                   <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse"></span>
                                   <span className="hud-label text-gold-500">{selectedTerm.category.toUpperCase()}_NODE</span>
                                </div>
                                <h3 className="text-3xl md:text-[10rem] font-display font-black text-white leading-tight uppercase italic tracking-tighter gold-text-gradient">
                                  {selectedTerm.term}
                                </h3>
                                <p className="text-lg md:text-6xl text-slate-200 font-light italic leading-snug tracking-tight border-l-4 border-gold-500/30 pl-8">
                                    {selectedTerm.definition}
                                </p>
                            </div>

                            <div className="rounded-[2rem] md:rounded-[4rem] overflow-hidden border border-white/10 shadow-2xl bg-black aspect-video relative group tactical-bracket">
                                <div className="absolute inset-0 bg-scanline opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-opacity"></div>
                                <VisualExplainer 
                                  topic={Topic.MODULE_1} 
                                  visualId={selectedTerm.visualId} 
                                  hideControls={false} 
                                  termName={selectedTerm.term}
                                />
                            </div>

                            <section className="p-8 md:p-32 rounded-[2rem] md:rounded-[6rem] border border-white/10 bg-emerald-500/[0.02] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-5">
                                   <i className="fas fa-stethoscope text-[12rem]"></i>
                                </div>
                                <h4 className="hud-label text-emerald-500 mb-6 md:mb-16">CLINICAL_SIGNIFICANCE:</h4>
                                <p className="text-xl md:text-7xl text-slate-300 italic font-light leading-snug">
                                    "{selectedTerm.clinicalSignificance}"
                                </p>
                            </section>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-fade-in bg-space-1000/20">
                        <div className="w-24 h-24 md:w-64 md:h-64 rounded-full border-4 border-dashed border-white/5 flex items-center justify-center text-white/5 text-4xl md:text-9xl mb-12">
                           <i className="fas fa-dna"></i>
                        </div>
                        <h3 className="text-xl md:text-8xl font-display font-black text-slate-800 uppercase italic tracking-tighter">Select_Node_To_Map</h3>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
