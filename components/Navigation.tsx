
import React, { useRef, useEffect } from 'react';
import { AppView, Topic } from '../types';
import { TOPICS } from '../constants';
import { getProfile } from '../services/storageService';

interface NavigationProps {
  currentView: AppView;
  currentTopic: Topic | null;
  onNavigate: (view: AppView, topic?: Topic) => void;
  onOpenLexicon: () => void;
  onOpenHub: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, currentTopic, onNavigate, onOpenLexicon, onOpenHub }) => {
  const steps = Object.values(TOPICS).filter(t => t.id !== Topic.FULL_MOCK);
  const profile = getProfile();
  const reelRef = useRef<HTMLDivElement>(null);
  
  const getModuleProgress = (topicId: Topic) => {
    const topicMeta = TOPICS[topicId];
    const savedSubTopicId = profile.progress?.topicProgress[topicId];
    if (!savedSubTopicId) return 0;
    const index = topicMeta.subTopics.findIndex(st => st.id === savedSubTopicId);
    return Math.round(((index + 1) / (topicMeta.subTopics.length || 1)) * 100);
  };

  useEffect(() => {
    if (reelRef.current && currentTopic) {
      const activeBtn = reelRef.current.querySelector(`[data-topic="${currentTopic}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentTopic]);

  return (
    <div className="fixed bottom-0 left-0 w-full px-2 pb-2 xs:px-4 xs:pb-4 md:px-12 md:pb-12 lg:px-16 lg:pb-16 z-[200] pointer-events-none">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-2 xs:gap-4 md:gap-10 items-center">
        
        {/* Cinematic HUD Context Badge - Responsive visibility */}
        <div className="pointer-events-auto flex gap-3 xs:gap-5 md:gap-12 px-4 xs:px-6 md:px-14 py-1.5 xs:py-2 md:py-4 bg-black/90 border border-white/10 rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.9)] animate-fade-in backdrop-blur-3xl relative overflow-hidden group border-t-gold-500/20">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent group-hover:translate-x-full transition-transform duration-[2.5s]"></div>
            <div className="flex items-center gap-2 xs:gap-3">
                <div className="w-1.5 xs:w-2 h-1.5 xs:h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981] animate-pulse"></div>
                <span className="hud-label text-slate-400 text-[6px] xs:text-[8px] md:text-[10px] tracking-[0.3em] xs:tracking-[0.5em]">STATUS: STABLE</span>
            </div>
            <div className="w-[1px] xs:w-[2px] h-3 xs:h-4 bg-white/10 self-center"></div>
            <span className="hud-label text-gold-500 truncate max-w-[80px] xs:max-w-[100px] md:max-w-none text-[6px] xs:text-[8px] md:text-[10px] tracking-[0.3em] xs:tracking-[0.4em] font-black italic">
                LOC_NODE: {currentTopic ? `${currentTopic.toUpperCase()}` : currentView}
            </span>
        </div>

        {/* Master Refined Dock - Optimized for mobile width */}
        <div className="pointer-events-auto relative flex items-center gap-1.5 xs:gap-2 md:gap-5 p-1.5 xs:p-2 md:p-4 bg-gradient-to-b from-slate-900 to-space-1000 border border-white/10 rounded-[1.5rem] xs:rounded-[2rem] md:rounded-[3.5rem] shadow-[0_40px_120px_rgba(0,0,0,1)] w-full sm:w-auto overflow-hidden backdrop-blur-3xl tactical-bracket font-mono">
          
          <button 
              onClick={onOpenHub}
              className="flex-shrink-0 w-8 h-8 xs:w-10 xs:h-10 md:w-16 md:h-16 rounded-lg xs:rounded-xl md:rounded-[1.8rem] flex items-center justify-center transition-all active:scale-90 border-2 bg-gold-500/10 border-gold-500/30 text-gold-500 hover:bg-gold-500 hover:text-black shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              title="Systems Hub"
          >
              <i className="fas fa-th text-[10px] xs:text-sm md:text-2xl"></i>
          </button>

          <div ref={reelRef} className="flex-1 flex items-center min-w-0 overflow-x-auto no-scrollbar snap-x snap-mandatory gap-1.5 xs:gap-2 md:gap-4 py-1 xs:py-1.5 px-1.5 xs:px-2 md:px-5 bg-black/60 rounded-lg xs:rounded-xl md:rounded-[2.2rem] border border-white/5 shadow-inner">
            {steps.map((topic) => {
              const isActive = currentTopic === topic.id && currentView === AppView.TOPIC;
              const progress = getModuleProgress(topic.id as Topic);
              const isCompleted = progress === 100;
              
              return (
                <button 
                  key={topic.id}
                  data-topic={topic.id}
                  onClick={() => onNavigate(AppView.TOPIC, topic.id as Topic)}
                  className={`flex-shrink-0 w-7 h-7 xs:w-9 xs:h-9 md:w-15 md:h-15 rounded-md xs:rounded-lg md:rounded-[1.4rem] flex items-center justify-center border transition-all duration-500 snap-center relative
                    ${isActive 
                      ? 'bg-white text-black border-gold-500 shadow-[0_0_30px_rgba(255,255,255,0.3)] z-10 scale-110' 
                      : isCompleted
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                        : 'bg-white/[0.05] border-white/5 text-slate-700 hover:text-slate-400'}`}
                  title={topic.id}
                >
                  <i className={`fas ${isCompleted && !isActive ? 'fa-check-circle' : topic.icon} text-[10px] xs:text-xs md:text-xl`}></i>
                  {isCompleted && !isActive && <div className="absolute -top-1 -right-1 xs:-top-1.5 xs:-right-1.5 w-1.5 xs:w-2 h-1.5 xs:h-2 bg-emerald-500 rounded-full shadow-[0_0_12px_#10b981] animate-pulse"></div>}
                </button>
              );
            })}
          </div>

          <div className="flex gap-1 xs:gap-1.5 md:gap-4 pl-1.5 xs:pl-2 md:pl-5 border-l border-white/10 items-center">
            <button 
              onClick={() => onNavigate(AppView.HOME)}
              className={`w-7 h-7 xs:w-9 xs:h-9 md:w-15 md:h-15 rounded-md xs:rounded-lg md:rounded-[1.4rem] flex items-center justify-center transition-all active:scale-90 border-2
                ${currentView === AppView.HOME 
                  ? 'bg-emerald-500 text-black border-white shadow-[0_0_30px_rgba(16,185,129,0.4)] scale-105' 
                  : 'bg-white/[0.04] border-white/5 text-slate-600 hover:text-white hover:bg-white/10'}`}
              title="Command Center"
            >
                <i className="fas fa-home text-[10px] xs:text-xs md:text-xl"></i>
            </button>
            <button 
              onClick={() => onNavigate(AppView.VAULT)}
              className={`w-7 h-7 xs:w-9 xs:h-9 md:w-15 md:h-15 rounded-md xs:rounded-lg md:rounded-[1.4rem] flex items-center justify-center transition-all active:scale-90 border-2
                ${currentView === AppView.VAULT 
                  ? 'bg-gold-500 text-black border-white shadow-[0_0_30px_rgba(245,158,11,0.4)] scale-105' 
                  : 'bg-white/[0.04] border-white/5 text-slate-600 hover:text-white hover:bg-white/10'}`}
              title="Tactical Vault"
            >
                <i className="fas fa-vault text-[10px] xs:text-xs md:text-xl"></i>
            </button>
            <button 
              onClick={() => onNavigate(AppView.PROFILE)} 
              className={`w-7 h-7 xs:w-9 xs:h-9 md:w-15 md:h-15 rounded-md xs:rounded-lg md:rounded-[1.4rem] flex items-center justify-center transition-all active:scale-90 border-2
                ${currentView === AppView.PROFILE 
                  ? 'bg-white text-black border-gold-500 shadow-[0_0_30px_rgba(255,255,255,0.3)] scale-105' 
                  : 'bg-white/[0.04] border-white/5 text-slate-600 hover:text-white hover:bg-white/10'}`}
              title="Operator Profile"
            >
                <i className="fas fa-user-astronaut text-[10px] xs:text-xs md:text-xl"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
