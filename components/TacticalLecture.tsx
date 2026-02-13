
import React, { useState, useEffect, useRef } from 'react';
import { Lecture, Topic, StoryNode } from '../types';
import { generateSpeech } from '../services/geminiService';
import { HarveyBot } from './HarveyBot';
import { VisualExplainer } from './VisualExplainer';

interface TacticalLectureProps {
  topic: Topic;
  lecture: Lecture;
  onComplete: () => void;
  onClose: () => void;
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
  return buffer;
}

export const TacticalLecture: React.FC<TacticalLectureProps> = ({ topic, lecture, onComplete, onClose }) => {
  const [currentNodeIdx, setCurrentNodeIdx] = useState(0);
  const [isTalking, setIsTalking] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const activeNode: StoryNode = lecture.nodes[currentNodeIdx];

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch(e) {}
      audioSourceRef.current = null;
    }
    setIsTalking(false);
  };

  const playNode = async (idx: number) => {
    stopAudio();
    setCurrentNodeIdx(idx);
    setAudioLoading(true);
    
    const node = lecture.nodes[idx];
    
    try {
      const base64 = await generateSpeech(node.narrative, node.voice);
      if (base64) {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();
        const buffer = await decodeAudioData(decode(base64), ctx);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => {
          setIsTalking(false);
          // Auto-advance logic could go here, but manual choice is usually better for learning.
        };
        source.start(0);
        audioSourceRef.current = source;
        setIsTalking(true);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setAudioLoading(false);
    }
  };

  useEffect(() => {
    playNode(0);
    return () => stopAudio();
  }, []);

  const getBotState = () => {
      if (audioLoading) return 'THINKING';
      if (activeNode.voice === 'Puck') return 'EXCITED';
      if (activeNode.voice === 'Fenrir') return 'WARNING';
      return 'NORMAL';
  };

  const getStepIcon = (type: StoryNode['type']) => {
      switch(type) {
          case 'ROADMAP': return 'fa-map';
          case 'NEGATION': return 'fa-times-circle';
          case 'MNEMONIC': return 'fa-bolt';
          case 'ANALOGY': return 'fa-dna';
          case 'PRACTICAL': return 'fa-vial';
          case 'ASSESSMENT': return 'fa-shield-alt';
          default: return 'fa-book';
      }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-black flex flex-col font-mono overflow-hidden animate-fade-in">
      {/* Background Visualization Sync */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none scale-110 grayscale blur-[2px]">
         <VisualExplainer topic={topic} visualId={activeNode.visualId} hideControls={true} />
      </div>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-3xl z-10"></div>
      <div className="absolute inset-0 bg-scanline opacity-[0.05] animate-scanline z-20 pointer-events-none"></div>

      <header className="relative z-30 px-6 py-6 md:px-20 md:py-8 border-b border-white/5 flex justify-between items-center bg-black/40">
        <div className="space-y-1">
            <div className="flex items-center gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
                <span className="hud-label text-emerald-500">STORYBOARD_TX_v1.0</span>
            </div>
            <h2 className="text-xl md:text-4xl font-display font-black text-white italic gold-text-gradient uppercase leading-none truncate max-w-lg">
                {lecture.title}
            </h2>
        </div>
        <button onClick={onClose} className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all active:scale-90">
            <i className="fas fa-times text-lg md:text-3xl"></i>
        </button>
      </header>

      <main className="relative z-30 flex-1 overflow-y-auto no-scrollbar pt-6 pb-40 px-6 md:px-20">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-10 md:gap-16">
            
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 w-full">
                <div className="relative flex-shrink-0">
                    <div className={`absolute -inset-10 rounded-full blur-[80px] transition-all duration-1000 ${isTalking ? 'bg-gold-500/20 scale-125 opacity-100' : 'bg-gold-500/5 scale-100 opacity-20'}`}></div>
                    <HarveyBot size="lg" isTalking={isTalking} state={getBotState()} statusText={activeNode.voice.toUpperCase()} />
                </div>

                <div className="flex-1 space-y-6 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-4">
                        <div className="px-3 py-1 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-500 text-[10px] font-black uppercase tracking-widest italic">
                            NODE_{currentNodeIdx + 1}/{lecture.nodes.length}
                        </div>
                        <h3 className="text-xl md:text-3xl font-display font-black text-white uppercase italic tracking-widest">{activeNode.chapterTitle}</h3>
                    </div>
                    
                    <div className="glass-panel p-6 md:p-12 rounded-[2.5rem] border-white/10 bg-white/[0.02] relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gold-500/50"></div>
                        <p className="text-xl md:text-5xl font-display font-black italic text-slate-100 leading-tight tracking-tight uppercase transition-all duration-500 animate-slide-up">
                            {audioLoading ? 'DECRYPTING_NEURAL_NODE...' : activeNode.narrative}
                        </p>
                    </div>
                </div>
            </div>

            {/* Visual Progress Map */}
            <div className="w-full grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-4">
                {lecture.nodes.map((node, i) => (
                    <button 
                        key={i} 
                        onClick={() => playNode(i)}
                        className={`aspect-square rounded-xl border transition-all flex flex-col items-center justify-center gap-2 active:scale-95 group
                          ${currentNodeIdx === i ? 'bg-gold-500 border-gold-300 text-black shadow-xl scale-105 z-10' : 'bg-white/5 border-white/10 text-slate-600 hover:text-white hover:bg-white/10'}`}
                    >
                        <i className={`fas ${getStepIcon(node.type)} text-lg md:text-xl`}></i>
                        <span className="text-[6px] font-black uppercase hidden md:block">CH_{i+1}</span>
                    </button>
                ))}
            </div>
        </div>
      </main>

      <footer className="relative z-40 bg-black/90 backdrop-blur-3xl border-t border-white/10 px-6 py-6 md:px-20 md:py-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="w-full md:w-1/3 flex flex-col gap-2">
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <span>Logic_Progression</span>
                  <span className="text-gold-500">{Math.round(((currentNodeIdx + 1) / lecture.nodes.length) * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gold-500 transition-all duration-700 shadow-[0_0_10px_gold]" style={{ width: `${((currentNodeIdx + 1) / lecture.nodes.length) * 100}%` }}></div>
              </div>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
              <button 
                disabled={currentNodeIdx === 0}
                onClick={() => playNode(currentNodeIdx - 1)}
                className="flex-1 md:flex-none px-8 py-5 bg-white/5 text-slate-400 font-black uppercase text-xs rounded-xl border border-white/10 hover:text-white transition-all italic active:scale-95 disabled:opacity-0"
              >
                PREV_NODE
              </button>
              
              {currentNodeIdx < lecture.nodes.length - 1 ? (
                <button 
                  onClick={() => playNode(currentNodeIdx + 1)}
                  className="flex-1 md:flex-none px-12 py-5 bg-gold-500 text-black font-black uppercase text-xs rounded-xl shadow-2xl active:scale-95 transition-all italic animate-pulse"
                >
                  NEXT_NODE
                </button>
              ) : (
                <button 
                  onClick={onComplete}
                  className="flex-1 md:flex-none px-12 py-5 bg-emerald-600 text-white font-black uppercase text-xs rounded-xl shadow-2xl active:scale-95 transition-all italic"
                >
                  COMPLETE_MISSION
                </button>
              )}
          </div>
      </footer>
    </div>
  );
};
