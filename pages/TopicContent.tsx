
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppView, Topic, IntelNote, TacticalScript } from '../types';
import { TOPICS } from '../constants';
import { VisualExplainer } from '../components/VisualExplainer';
import { ModuleCinematicIntro } from '../components/ModuleCinematicIntro';
import { TacticalLecture } from '../components/TacticalLecture';
import { generateSpeech, getHarveyScript, getMnemonics } from '../services/geminiService';
import { getTopicProgress, updateTopicSubState, hasSeenModuleIntro, markModuleIntroSeen, getSessionAudio, setSessionAudio, vaultScript, triggerNotification } from '../services/storageService';
import { HarveyBot } from '../components/HarveyBot';

interface TopicContentProps {
  topic: Topic;
  onNavigate: (view: AppView, topic?: Topic) => void;
  onOpenLexicon: (term: string) => void;
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const TopicContent: React.FC<TopicContentProps> = ({ topic, onNavigate, onOpenLexicon }) => {
  const metadata = TOPICS[topic];
  const [introSeen, setIntroSeen] = useState(() => hasSeenModuleIntro(topic));
  const [activeSubTopicId, setActiveSubTopicId] = useState<string>(() => {
    const saved = getTopicProgress(topic);
    return (saved && metadata.subTopics.find(st => st.id === saved)) ? saved : (metadata.subTopics[0]?.id || '');
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [harveyState, setHarveyState] = useState<'NORMAL' | 'THINKING' | 'EXCITED' | 'WARNING'>('NORMAL');
  const [revealIndex, setRevealIndex] = useState(0);
  const [isLectureActive, setIsLectureActive] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);

  const activeSubTopic = useMemo(() => {
    return metadata.subTopics.find(st => st.id === activeSubTopicId) || metadata.subTopics[0];
  }, [activeSubTopicId, metadata]);
  
  const lesson = activeSubTopic?.content;

  useEffect(() => {
    const saved = getTopicProgress(topic);
    const initialId = (saved && metadata.subTopics.find(st => st.id === saved)) ? saved : (metadata.subTopics[0]?.id || '');
    setActiveSubTopicId(initialId);
    setRevealIndex(0);
    stopAudio();
    setIntroSeen(hasSeenModuleIntro(topic));
  }, [topic]);

  useEffect(() => {
    if (activeSubTopicId) updateTopicSubState(topic, activeSubTopicId);
  }, [activeSubTopicId, topic]);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch(e) {}
      audioSourceRef.current = null;
    }
    setIsPlaying(false);
    setHarveyState('NORMAL');
  };

  const handleNarrateSection = async (text: string) => {
    if (isPlaying) { stopAudio(); return; }
    
    const cacheKey = `narration_${activeSubTopicId}_${revealIndex}`;
    let base64Audio = getSessionAudio(cacheKey);

    if (!base64Audio) {
      setAudioLoading(true);
      setHarveyState('THINKING');
      try {
        const scriptText = await getHarveyScript(activeSubTopic?.title || '', text);
        base64Audio = await generateSpeech(scriptText, 'Charon');
        if (base64Audio) setSessionAudio(cacheKey, base64Audio);
      } catch (err) {
        setHarveyState('WARNING');
        return;
      } finally {
        setAudioLoading(false);
      }
    }

    if (base64Audio) {
      try {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();
        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => { setIsPlaying(false); setHarveyState('NORMAL'); };
        source.start(0);
        audioSourceRef.current = source;
        setIsPlaying(true);
        setHarveyState('EXCITED');
      } catch (e) { console.error(e); }
    }
  };

  const nextSection = () => { 
    if (revealIndex < 5) {
      setRevealIndex(prev => prev + 1);
      setTimeout(() => mainScrollRef.current?.scrollBy({ top: 300, behavior: 'smooth' }), 100);
    } 
  };

  const highlightText = (text: string) => {
    if (!activeSubTopic.keywords) return text;
    let highlighted = text;
    activeSubTopic.keywords.forEach(word => {
        const regex = new RegExp(`(${word})`, 'gi');
        const activeClass = isPlaying ? "text-gold-400 font-black shadow-[0_0_10px_gold]" : "text-gold-500/80 underline decoration-gold-500/30";
        highlighted = highlighted.replace(regex, `<span class="transition-all cursor-pointer ${activeClass} underline-offset-4">$1</span>`);
    });
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  if (!activeSubTopic) return null;
  if (!introSeen) return <ModuleCinematicIntro metadata={metadata} onComplete={() => { markModuleIntroSeen(topic); setIntroSeen(true); }} />;

  return (
    <div ref={mainScrollRef} className="flex-1 overflow-y-auto no-scrollbar custom-scrollbar bg-space-1000 relative pb-[20rem]">
      
      {isLectureActive && activeSubTopic.lecture && (
          <TacticalLecture 
            topic={topic} 
            lecture={activeSubTopic.lecture} 
            onComplete={() => { setIsLectureActive(false); setRevealIndex(5); }} 
            onClose={() => setIsLectureActive(false)}
          />
      )}

      <header className="px-4 py-3 md:px-12 md:py-6 bg-black/90 border-b border-white/10 flex items-center justify-between sticky top-0 z-[100] backdrop-blur-2xl">
          <div className="flex items-center gap-4 min-w-0">
              <button onClick={() => onNavigate(AppView.CURRICULUM)} className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 border border-white/10 active:scale-90 flex-shrink-0">
                <i className="fas fa-chevron-left text-sm"></i>
              </button>
              <div className="min-w-0">
                  <span className="hud-label text-emerald-500 block truncate">NODE_{activeSubTopic.id}</span>
                  <h2 className="text-sm md:text-3xl font-display font-black text-white italic gold-text-gradient truncate uppercase">{activeSubTopic.title}</h2>
              </div>
          </div>
          {activeSubTopic.lecture && (
             <button onClick={() => setIsLectureActive(true)} className="px-6 py-4 bg-gold-600 text-black font-black rounded-xl text-[10px] md:text-xs italic tracking-widest animate-pulse shadow-lg">
                CINEMATIC_STORY
             </button>
          )}
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-8 space-y-20 pt-10">
            <div className="flex flex-col items-center justify-center py-6">
                <HarveyBot size="md" isTalking={isPlaying} state={harveyState} statusText={isPlaying ? 'SCANNING_INTEL' : 'WAITING_ON_SYNC'} />
            </div>

            {/* Stage 1: The Hook */}
            <section className={`space-y-10 transition-all duration-700 ${revealIndex === 0 ? 'opacity-100 scale-100' : 'opacity-10 scale-95 blur-[2px]'}`}>
                <h4 className="text-3xl md:text-8xl font-display font-black italic gold-text-gradient text-center uppercase leading-tight">
                    {highlightText(lesson.hook)}
                </h4>
                <div className="flex flex-col items-center gap-10">
                    <button onClick={() => handleNarrateSection(lesson.hook)} className={`narration-prominent w-32 h-32 md:w-64 md:h-64 rounded-full border-4 md:border-[12px] flex items-center justify-center transition-all ${isPlaying ? 'active' : ''}`}>
                        <i className={`fas ${audioLoading ? 'fa-circle-notch fa-spin' : isPlaying ? 'fa-stop-circle' : 'fa-play-circle'} text-4xl md:text-[10rem]`}></i>
                    </button>
                    <span className="hud-label text-gold-500/40 text-[8px] md:text-sm">ACTIVATE_VOICE_TX</span>
                </div>
                {revealIndex === 0 && (
                    <button onClick={nextSection} className="w-full py-8 md:py-12 bg-gold-500 text-black font-black uppercase text-sm md:text-3xl rounded-3xl shadow-3xl active:scale-95 animate-bounce">
                        SYNCHRONIZE_VISUAL_MATRIX
                    </button>
                )}
            </section>

            {/* Stage 2: Simulation */}
            {revealIndex >= 1 && (
              <section className={`space-y-12 transition-all duration-700 ${revealIndex === 1 ? 'opacity-100 scale-100' : 'opacity-10 scale-95 blur-[2px]'}`}>
                  <div className="aspect-video rounded-[3rem] overflow-hidden border-2 border-white/10 bg-black shadow-2xl relative group tactical-bracket">
                      <VisualExplainer topic={topic} visualId={activeSubTopic.visualId} />
                  </div>
                  <div className="p-8 md:p-16 bg-white/5 rounded-3xl border border-white/10 italic text-slate-400 text-sm md:text-4xl leading-relaxed relative">
                      <div className="absolute -top-4 -left-4 w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-gold-500 text-black flex items-center justify-center shadow-xl"><i className="fas fa-info-circle text-lg md:text-4xl"></i></div>
                      {highlightText(activeSubTopic.description)}
                  </div>
                  {revealIndex === 1 && (
                    <button onClick={nextSection} className="w-full py-8 md:py-12 bg-gold-500 text-black font-black uppercase text-sm md:text-3xl rounded-3xl shadow-3xl active:scale-95 animate-bounce">
                        DECRYPT_STRATEGIC_LOGIC
                    </button>
                  )}
              </section>
            )}

            {/* Stage 3: The Verification */}
            {revealIndex >= 5 && (
              <section className="space-y-12 pb-32">
                  <div className="glass-card p-10 md:p-20 rounded-[4rem] border-gold-500/20 bg-black/60 relative overflow-hidden shadow-2xl">
                      <h5 className="hud-label text-gold-500 mb-12 text-sm md:text-2xl flex items-center gap-6 italic">
                         <i className="fas fa-fingerprint text-xl md:text-5xl"></i>
                         NEURAL_VALIDATION_PROTOCOL
                      </h5>
                      <div className="space-y-8 md:space-y-16">
                          {lesson.assessment.map((q, i) => (
                              <div key={i} className="flex gap-6 md:gap-14 p-10 bg-white/5 rounded-[3rem] border border-white/10 group hover:bg-gold-500/5 transition-all active:scale-[0.98]">
                                  <span className="w-16 h-16 md:w-32 md:h-32 rounded-2xl bg-gold-500 text-black font-black flex items-center justify-center shrink-0 text-xl md:text-8xl italic shadow-2xl">{i+1}</span>
                                  <p className="text-xl md:text-7xl text-slate-100 font-bold italic uppercase tracking-tighter group-hover:text-gold-400 leading-tight flex-1">{highlightText(q)}</p>
                              </div>
                          ))}
                      </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <button onClick={() => onNavigate(AppView.QUIZ, topic)} className="py-12 md:py-24 bg-indigo-600 text-white font-black rounded-[4rem] text-xl md:text-7xl uppercase italic shadow-3xl hover:bg-indigo-500 active:scale-95 transition-all">INIT_EXAM</button>
                      <button onClick={() => onNavigate(AppView.CURRICULUM)} className="py-12 md:py-24 bg-white/5 border-2 border-white/10 text-slate-500 font-black rounded-[4rem] text-xl md:text-5xl uppercase italic hover:bg-white/10 active:scale-95 transition-all">RETURN_MAP</button>
                  </div>
              </section>
            )}
      </div>
    </div>
  );
};
