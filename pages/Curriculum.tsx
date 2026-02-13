
import React, { useState, useEffect } from 'react';
import { AppView, Topic } from '../types';
import { TOPICS } from '../constants';
import { getProfile } from '../services/storageService';
import { SFX } from '../services/audioService';

interface CurriculumProps {
  onNavigate: (view: AppView, topic?: Topic, subTopicId?: string) => void;
}

export const Curriculum: React.FC<CurriculumProps> = ({ onNavigate }) => {
  const profile = getProfile();
  const topicList = Object.values(TOPICS).filter(t => t.id !== Topic.FULL_MOCK);
  const [isSyncing, setIsSyncing] = useState(true);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState('Initializing Map...');
  const [selectedTopicId, setSelectedTopicId] = useState<Topic>(Topic.MODULE_1);

  useEffect(() => {
    const statuses = ['Scanning...', 'Mapping...', 'Syncing...', 'Ready'];
    SFX.playSweep();
    const timer = setInterval(() => {
      setSyncProgress(prev => {
        const next = prev + 5;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => setIsSyncing(false), 300);
          return 100;
        }
        const statusIdx = Math.floor((next / 100) * statuses.length);
        if (statuses[statusIdx] !== syncStatus) setSyncStatus(statuses[statusIdx]);
        return next;
      });
    }, 20);
    return () => clearInterval(timer);
  }, [syncStatus]);

  const getTopicStats = (topicId: Topic) => {
    const topicMeta = TOPICS[topicId];
    const progress = profile.progress?.topicProgress || {};
    const lastSub = progress[topicId as string];
    const completion = lastSub 
        ? Math.round(((topicMeta.subTopics.findIndex(st => st.id === lastSub) + 1) / (topicMeta.subTopics.length || 1)) * 100)
        : 0;
    
    // Calculate average score for this specific topic
    const topicResults = profile.results.filter(r => r.topic === topicId);
    const avgScore = topicResults.length > 0 
        ? Math.round(topicResults.reduce((acc, r) => acc + (r.score/r.totalQuestions), 0) / topicResults.length * 100)
        : 100;

    return { completion, avgScore, isPriority: avgScore < 70 && topicResults.length > 0 };
  };

  const selectedTopic = TOPICS[selectedTopicId];

  const handleSelect = (tid: Topic) => {
    SFX.playBlip(660, 'sine', 0.05);
    setSelectedTopicId(tid);
  };

  if (isSyncing) {
    return (
      <div className="fixed inset-0 z-[100] bg-space-950 flex flex-col items-center justify-center p-6 overflow-hidden font-mono">
        <div className="relative w-40 h-40 md:w-[450px] md:h-[450px] mb-8 flex items-center justify-center">
            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(234,179,8,0.2)_360deg)] rounded-full animate-radar-sweep"></div>
            <div className="relative z-10 w-20 h-20 md:w-56 md:h-56 bg-space-1000 border border-gold-500/30 rounded-full flex items-center justify-center">
                <i className="fas fa-network-wired text-2xl md:text-8xl text-gold-500"></i>
            </div>
        </div>
        <div className="space-y-4 text-center max-w-xs w-full">
          <h2 className="text-[10px] md:text-3xl font-display font-black text-white uppercase tracking-widest italic gold-text-gradient">{syncStatus}</h2>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-gold-500" style={{ width: `${syncProgress}%` }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row bg-transparent overflow-hidden relative font-mono">
      
      {/* Sector Explorer Sidebar */}
      <aside className="w-full lg:w-[380px] xl:w-[450px] lg:border-r border-white/10 bg-black/80 backdrop-blur-3xl flex flex-col z-20 shadow-xl">
        <div className="p-4 md:p-10 border-b border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-3">
                <div className="w-1 h-6 md:h-12 bg-gold-500 rounded-full shadow-[0_0_10px_gold]"></div>
                <div>
                  <h2 className="text-lg md:text-6xl font-display font-black text-white uppercase italic tracking-tighter gold-text-gradient leading-none">Matrix</h2>
                  <p className="text-[7px] md:text-[10px] font-black text-slate-700 uppercase tracking-widest mt-1">MAP_COORD_v4.8</p>
                </div>
            </div>
        </div>
        
        <nav className="flex-1 overflow-x-auto lg:overflow-y-auto custom-scrollbar p-3 md:p-6 flex lg:flex-col gap-2 no-scrollbar pb-10 lg:pb-32">
          {topicList.map((topic) => {
            const isSelected = selectedTopicId === topic.id;
            const { completion, isPriority } = getTopicStats(topic.id as Topic);
            const isCompleted = completion === 100;
            return (
              <button
                key={topic.id}
                onClick={() => handleSelect(topic.id as Topic)}
                className={`flex-shrink-0 w-12 h-12 lg:w-full lg:h-auto transition-all rounded-xl lg:rounded-3xl border flex items-center justify-center lg:justify-start lg:gap-4 lg:p-4 active:scale-95 relative
                  ${isSelected ? 'bg-gold-500/10 border-gold-500/40 shadow-lg' : isPriority ? 'border-red-500/30 bg-red-500/5' : 'bg-white/[0.01] border-white/5'}`}
              >
                {isPriority && <div className="absolute inset-0 bg-red-500/5 animate-pulse rounded-xl lg:rounded-3xl pointer-events-none"></div>}
                <div className={`w-8 h-8 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl border flex items-center justify-center transition-all flex-shrink-0
                  ${isSelected ? 'bg-gold-500 text-black border-gold-300' : isCompleted ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : isPriority ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-space-1000 border-white/10 text-slate-800'}`}>
                  <i className={`fas ${isPriority && !isSelected ? 'fa-triangle-exclamation' : isCompleted && !isSelected ? 'fa-check' : topic.icon} text-xs lg:text-xl`}></i>
                </div>
                <div className="hidden lg:block text-left flex-1 min-w-0">
                  <div className="flex justify-between items-end mb-1">
                    <h4 className={`text-sm xl:text-lg font-display font-black uppercase truncate italic ${isSelected ? 'text-white' : isPriority ? 'text-red-400' : 'text-slate-700'}`}>{topic.id?.split(' ')[0] || 'Sector'}</h4>
                    <span className={`text-[8px] font-mono font-black ${isSelected ? 'text-gold-500' : isPriority ? 'text-red-500' : 'text-slate-900'}`}>{completion}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                     <div className={`h-full transition-all duration-1000 ${isSelected ? 'bg-gold-500' : isPriority ? 'bg-red-500' : 'bg-slate-900'}`} style={{ width: `${completion}%` }}></div>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Sector View */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-16 lg:p-24 pb-48 relative z-10 no-scrollbar">
        <div className="max-w-[1400px] mx-auto space-y-8 md:space-y-32 animate-fade-in" key={selectedTopicId}>
          
          <div className="space-y-4 md:space-y-8">
              <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 md:gap-10">
                  <div className="space-y-2 md:space-y-4 text-center lg:text-left flex-1 min-w-0">
                      <div className="inline-flex items-center gap-2 bg-gold-500/5 px-3 py-1 rounded-full border border-gold-500/20 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse"></span>
                        <span className="text-[7px] md:text-[10px] font-black text-gold-400 uppercase tracking-widest font-mono italic">SECTOR_{selectedTopicId?.split(' ')[0].toUpperCase()}</span>
                      </div>
                      <h1 className="text-3xl md:text-8xl lg:text-9xl xl:text-[10rem] font-display font-black text-white tracking-tighter uppercase italic leading-none gold-text-gradient truncate">
                        {selectedTopic.id}
                      </h1>
                  </div>
                  <div className="w-20 h-20 md:w-56 md:h-56 rounded-[1.5rem] md:rounded-[4.5rem] bg-gold-500/5 border border-gold-500/10 flex items-center justify-center text-gold-500 text-3xl md:text-9xl shadow-2xl">
                      <i className={`fas ${selectedTopic.icon} animate-float`}></i>
                  </div>
              </div>
              <p className="text-slate-400 text-xs md:text-3xl lg:text-5xl font-light italic leading-relaxed opacity-80 border-l-2 border-gold-500/20 pl-4 md:pl-10 max-w-4xl">
                "{selectedTopic.description}"
              </p>
          </div>

          {getTopicStats(selectedTopicId).isPriority && (
              <div className="bg-red-600/10 border border-red-500/30 p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] animate-pulse flex items-center gap-6">
                 <div className="w-12 h-12 md:w-20 md:h-20 bg-red-500 text-white rounded-2xl flex items-center justify-center text-xl md:text-4xl shadow-[0_0_20px_red]">
                    <i className="fas fa-triangle-exclamation"></i>
                 </div>
                 <div>
                    <h3 className="text-red-500 font-display font-black uppercase text-sm md:text-3xl italic">NEURAL_DEGRADATION_DETECTED</h3>
                    <p className="text-red-400 italic text-xs md:text-xl">Operator accuracy is below acceptable threshold for this sector. Prioritize re-synchronization.</p>
                 </div>
              </div>
          )}

          <div className="space-y-6 md:space-y-12">
            <div className="flex items-center gap-4">
                <h3 className="text-[7px] md:text-[11px] font-black text-slate-800 uppercase tracking-widest font-mono italic">NODES</h3>
                <div className="flex-1 h-px bg-white/5"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-10">
              {selectedTopic.subTopics.map((st) => {
                const isSynced = profile.progress?.topicProgress[selectedTopicId as string] === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => { SFX.playBlip(880, 'square', 0.05); onNavigate(AppView.TOPIC, selectedTopicId, st.id); }}
                    className={`p-5 md:p-10 rounded-[1.5rem] md:rounded-[3rem] border border-white/5 hover:border-gold-500/30 transition-all text-left relative overflow-hidden active:scale-95 group bg-white/[0.01] flex flex-col h-full
                      ${isSynced ? 'bg-gold-500/[0.03] ring-1 ring-gold-500/10' : ''}`}
                  >
                      {isSynced && (
                          <div className="absolute top-3 right-5 flex items-center gap-1.5">
                              <span className="text-[6px] font-black text-emerald-500 uppercase">SYNC</span>
                              <i className="fas fa-check text-emerald-500 text-[6px]"></i>
                          </div>
                      )}
                      <div className="flex items-center gap-4 mb-4 md:mb-8">
                         <div className="w-10 h-10 md:w-16 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-gold-500 group-hover:text-black transition-all">
                            <span className="text-xs md:text-2xl font-display font-black italic">{st.id.split('-')[1]}</span>
                         </div>
                         <h4 className="text-sm md:text-3xl font-black text-white uppercase italic tracking-tight group-hover:text-gold-400 transition-colors truncate">{st.title}</h4>
                      </div>
                      <p className="text-slate-600 text-[10px] md:text-xl font-light leading-relaxed italic mb-6 group-hover:text-slate-400 flex-1">
                        {st.description}
                      </p>
                      <div className="pt-4 border-t border-white/5 flex justify-between items-center mt-auto">
                          <span className="text-[7px] md:text-[10px] text-gold-500/40 uppercase font-mono tracking-widest italic group-hover:text-gold-500">Access_Seq</span>
                          <i className="fas fa-chevron-right text-[8px] text-gold-500 group-hover:translate-x-1 transition-transform"></i>
                      </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button 
            onClick={() => { SFX.playSweep(); onNavigate(AppView.QUIZ, selectedTopicId); }}
            className="w-full p-6 md:p-20 rounded-[2rem] md:rounded-[6rem] bg-indigo-950/20 border border-indigo-500/20 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 transition-all active:scale-[0.98] group relative overflow-hidden"
          >
            <div className="w-14 h-14 md:w-40 aspect-square rounded-2xl md:rounded-[3rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-2xl md:text-8xl shadow-xl group-hover:scale-110 duration-700">
              <i className="fas fa-bolt"></i>
            </div>
            <div className="text-center md:text-left space-y-1.5 md:space-y-4 flex-1">
                <h4 className="text-xl md:text-8xl font-display font-black text-white uppercase italic gold-text-gradient leading-none">Diagnostic</h4>
                <p className="text-[8px] md:text-2xl text-slate-700 font-mono uppercase tracking-widest italic">Sync_Verification</p>
            </div>
          </button>

        </div>
      </main>
    </div>
  );
};
