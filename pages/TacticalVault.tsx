
import React, { useState, useRef } from 'react';
import { AppView, FormulaNode, IntelNote, TacticalScript, Topic } from '../types';
import { SPI_FORMULAS } from '../constants';
import { getProfile, deleteNote, deleteScript, updateNote, getSessionAudio, setSessionAudio } from '../services/storageService';
import { generateSpeech } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

export const TacticalVault: React.FC<{ onNavigate: (view: AppView, topic?: Topic) => void }> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'FORMULAS' | 'INTEL' | 'SCRIPTS'>('FORMULAS');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState('');
  const [editNoteTitle, setEditNoteTitle] = useState('');
  const [playingScriptId, setPlayingScriptId] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const profile = getProfile();
  const notes = profile.progress.notes || [];
  const scripts = profile.progress.vaultedScripts || [];

  const handleStartEdit = (note: IntelNote) => {
    setEditingNoteId(note.id);
    setEditNoteContent(note.content);
    setEditNoteTitle(note.title);
  };

  const handleSaveEdit = (id: string) => {
    updateNote(id, { title: editNoteTitle, content: editNoteContent });
    setEditingNoteId(null);
    window.location.reload();
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch(e) {}
      audioSourceRef.current = null;
    }
    setPlayingScriptId(null);
  };

  const playScript = async (script: TacticalScript) => {
    if (playingScriptId === script.id) { stopAudio(); return; }
    stopAudio();

    const cacheKey = `vault_audio_${script.id}`;
    let base64 = getSessionAudio(cacheKey);

    if (!base64) {
        setPlayingScriptId(script.id); // Show loading state
        base64 = await generateSpeech(`System Powerup Protocol: ${script.title}. ${script.content}`, 'Puck');
        if (base64) setSessionAudio(cacheKey, base64);
    }

    if (base64) {
        try {
            if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
            const ctx = audioContextRef.current;
            const dataInt16 = new Int16Array(new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0))).buffer);
            const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
            buffer.getChannelData(0).set(Array.from(dataInt16).map(v => v / 32768.0));
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.onended = () => setPlayingScriptId(null);
            source.start(0);
            audioSourceRef.current = source;
            setPlayingScriptId(script.id);
        } catch(e) { setPlayingScriptId(null); }
    }
  };

  return (
    <div className="max-w-[1800px] mx-auto p-4 md:p-16 space-y-12 animate-fade-in font-mono relative pb-64">
      <header className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12">
        <div className="space-y-4">
           <h1 className="text-5xl md:text-[8rem] font-display font-black text-white uppercase italic tracking-tighter gold-text-gradient leading-none">Tactical_Vault</h1>
           <p className="text-gold-500/60 text-xs md:text-2xl italic tracking-widest border-l-4 border-gold-500/30 pl-6 uppercase">Asset_Knowledge_Storage</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 shadow-inner overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('FORMULAS')}
              className={`px-4 py-2 md:px-8 md:py-4 rounded-xl text-[8px] md:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'FORMULAS' ? 'bg-gold-500 text-black shadow-lg shadow-gold-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Formulas
            </button>
            <button 
              onClick={() => setActiveTab('INTEL')}
              className={`px-4 py-2 md:px-8 md:py-4 rounded-xl text-[8px] md:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'INTEL' ? 'bg-gold-500 text-black shadow-lg shadow-gold-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Intel_Notes
            </button>
            <button 
              onClick={() => setActiveTab('SCRIPTS')}
              className={`px-4 py-2 md:px-8 md:py-4 rounded-xl text-[8px] md:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'SCRIPTS' ? 'bg-gold-500 text-black shadow-lg shadow-gold-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Powerups
            </button>
        </div>
      </header>

      {activeTab === 'FORMULAS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {SPI_FORMULAS.map(f => (
             <div key={f.id} className="glass-card p-10 rounded-[3rem] border-white/10 hover:border-gold-500/30 group transition-all relative overflow-hidden tactical-bracket">
                <div className="absolute inset-0 bg-scanline opacity-[0.03] pointer-events-none"></div>
                <div className="flex justify-between items-start mb-10">
                   <span className="text-[9px] font-black text-gold-500/40 uppercase tracking-[0.3em] font-mono">{f.category}</span>
                   <i className="fas fa-microchip text-gold-500/20 text-2xl group-hover:text-gold-500/50 transition-colors"></i>
                </div>
                <h3 className="text-3xl font-display font-black text-white uppercase italic mb-6 group-hover:text-gold-500 transition-colors">{f.title}</h3>
                <div className="bg-black/60 p-6 rounded-2xl border border-white/5 mb-8 flex items-center justify-center min-h-[100px]">
                   <p className="text-2xl md:text-4xl font-mono text-emerald-400 text-center glow-text-emerald">{f.equation}</p>
                </div>
                <p className="text-slate-500 italic text-sm md:text-lg mb-8 leading-relaxed">"{f.description}"</p>
                <div className="space-y-3 pt-6 border-t border-white/5">
                   <p className="hud-label text-[8px] text-slate-700">Variable_Matrix:</p>
                   <div className="grid grid-cols-2 gap-2">
                      {Object.entries(f.variables).map(([key, val]) => (
                        <div key={key} className="flex gap-2 items-center">
                           <span className="font-mono text-gold-500 font-black text-[10px]">{key}:</span>
                           <span className="text-[9px] text-slate-600 uppercase tracking-tighter truncate">{val}</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}

      {activeTab === 'INTEL' && (
        <div className="space-y-6">
           {notes.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {notes.map(n => (
                  <div key={n.id} className="glass-card p-10 rounded-[3rem] border-emerald-500/10 hover:border-emerald-500/40 transition-all relative overflow-hidden group">
                     {editingNoteId === n.id ? (
                        <div className="space-y-6 animate-fade-in">
                           <div className="flex justify-between items-center">
                              <span className="hud-label text-gold-500">Edit_Mode</span>
                              <div className="flex gap-2">
                                 <button onClick={() => handleSaveEdit(n.id)} className="w-10 h-10 rounded-lg bg-emerald-500 text-black flex items-center justify-center active:scale-90 transition-all"><i className="fas fa-save"></i></button>
                                 <button onClick={() => setEditingNoteId(null)} className="w-10 h-10 rounded-lg bg-white/5 text-slate-500 flex items-center justify-center active:scale-90 transition-all"><i className="fas fa-times"></i></button>
                              </div>
                           </div>
                           <input 
                              type="text" 
                              value={editNoteTitle} 
                              onChange={e => setEditNoteTitle(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white font-display font-black uppercase italic outline-none focus:border-gold-500"
                           />
                           <textarea 
                              value={editNoteContent} 
                              onChange={e => setEditNoteContent(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-slate-300 italic font-light h-48 outline-none focus:border-gold-500"
                           />
                        </div>
                     ) : (
                        <>
                           <div className="flex justify-between items-start mb-6">
                              <div>
                                <span className="hud-label text-emerald-500/60 block mb-1">DATE: {new Date(n.date).toLocaleDateString()}</span>
                                <h3 className="text-xl md:text-3xl font-display font-black text-white uppercase italic">{n.title}</h3>
                              </div>
                              <div className="flex gap-2">
                                 <button 
                                   onClick={() => handleStartEdit(n)}
                                   className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gold-500 hover:bg-gold-500 hover:text-black transition-all"
                                 >
                                   <i className="fas fa-edit text-xs"></i>
                                 </button>
                                 <button 
                                   onClick={() => { if(confirm('Neural purge this note?')) { deleteNote(n.id); window.location.reload(); } }}
                                   className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-black transition-all"
                                 >
                                   <i className="fas fa-trash-alt text-xs"></i>
                                 </button>
                              </div>
                           </div>
                           <p className="text-slate-300 italic text-sm md:text-lg leading-relaxed border-l-2 border-emerald-500/20 pl-6 py-2 mb-8">
                              {n.content}
                           </p>
                           <div className="flex justify-between items-center pt-6 border-t border-white/5">
                              <span className="hud-label text-slate-700">COORD: {n.topic}</span>
                              <button onClick={() => onNavigate(AppView.TOPIC, n.topic)} className="text-[10px] font-black text-gold-500 uppercase italic hover:text-white transition-colors">Return_to_Sector</button>
                           </div>
                        </>
                     )}
                  </div>
                ))}
             </div>
           ) : (
             <div className="p-32 text-center glass-card rounded-[4rem] border-white/5">
                <div className="w-24 h-24 md:w-48 md:h-48 rounded-full border-4 border-dashed border-white/5 flex items-center justify-center text-white/5 text-4xl md:text-9xl mx-auto mb-12">
                   <i className="fas fa-sticky-note"></i>
                </div>
                <h3 className="text-xl md:text-6xl font-display font-black text-slate-800 uppercase italic tracking-tighter">Vault_Empty</h3>
                <p className="text-slate-900 hud-label mt-4">Save intel nodes during your sector mappings to populate the vault.</p>
             </div>
           )}
        </div>
      )}

      {activeTab === 'SCRIPTS' && (
        <div className="space-y-6">
           {scripts.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {scripts.slice().reverse().map(s => (
                  <div key={s.id} className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-gold-500 via-emerald-500 to-indigo-600 rounded-[2.5rem] opacity-20 group-hover:opacity-60 transition-all duration-700 blur-[2px]"></div>
                    <div className="relative glass-card p-10 rounded-[2.5rem] bg-black/90 border-white/10 flex flex-col h-full overflow-hidden">
                        <div className="flex justify-between items-start mb-8">
                           <div>
                             <span className="text-[7px] md:text-[9px] font-black text-gold-500 uppercase tracking-[0.4em] block mb-1">TACTICAL_POWERUP</span>
                             <h3 className="text-xl md:text-3xl font-display font-black text-white uppercase italic leading-tight">{s.title}</h3>
                           </div>
                           <button 
                             onClick={() => { if(confirm('Neural purge this powerup?')) { deleteScript(s.id); window.location.reload(); } }}
                             className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-red-600/10 text-red-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all border border-red-500/20"
                           >
                             <i className="fas fa-times text-xs"></i>
                           </button>
                        </div>

                        <div className="flex-1 bg-white/[0.03] p-6 rounded-2xl border border-white/5 mb-8 relative group/card">
                           <div className="absolute top-4 right-4 opacity-5 group-hover/card:opacity-20 transition-opacity">
                              <i className="fas fa-bolt text-5xl"></i>
                           </div>
                           <div className="prose prose-invert prose-xs">
                             <div className="text-slate-300 italic font-light text-sm md:text-xl leading-relaxed whitespace-pre-wrap">
                               <ReactMarkdown>{s.content}</ReactMarkdown>
                             </div>
                           </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                           <button 
                             onClick={() => playScript(s)}
                             className={`narration-prominent px-6 py-3 rounded-xl text-[8px] md:text-sm font-black uppercase transition-all flex items-center gap-3 ${playingScriptId === s.id ? 'active' : ''}`}
                           >
                             <i className={`fas ${playingScriptId === s.id ? 'fa-stop-circle' : 'fa-play-circle'} text-base md:text-2xl`}></i>
                             {playingScriptId === s.id ? 'TX_ACTIVE' : 'READ_PROTOCOL'}
                           </button>
                           <span className="text-[6px] md:text-[9px] text-slate-700 font-mono italic">SIG: {profile.vibrationalSignature}</span>
                        </div>
                    </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="p-32 text-center glass-card rounded-[4rem] border-white/5">
                <div className="w-24 h-24 md:w-48 md:h-48 rounded-full border-4 border-dashed border-white/5 flex items-center justify-center text-white/5 text-4xl md:text-9xl mx-auto mb-12">
                   <i className="fas fa-scroll"></i>
                </div>
                <h3 className="text-xl md:text-6xl font-display font-black text-slate-800 uppercase italic tracking-tighter">No_Powerups_Found</h3>
                <p className="text-slate-900 hud-label mt-4">Generate 'Tactical Powerups' during lessons to populate your mnemonic matrix.</p>
             </div>
           )}
        </div>
      )}

      <style>{`
        .glow-text-emerald {
            text-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
        }
      `}</style>
    </div>
  );
};
