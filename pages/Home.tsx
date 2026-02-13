
import React, { useState, useEffect, useMemo } from 'react';
import { AppView, Topic, TacticalBounty, FleetMember, TacticalScript, LogEntry } from '../types';
import { getProfile, getActiveQuiz, getStats, handleDailyCheckIn, getDailyInsightCache, saveDailyInsight, claimBounty, getFleetStandings, getSession } from '../services/storageService';
import { getDailyInsight } from '../services/geminiService';
import { TOPICS } from '../constants';
import { NeuralWheel } from '../components/NeuralWheel';
import { DopamineOverlay } from '../components/DopamineOverlay';
import { HarveyLiveLink } from '../components/HarveyLiveLink';

export const Home: React.FC<{ onNavigate: (view: AppView, topic?: Topic) => void, onOpenLexicon: () => void }> = ({ onNavigate, onOpenLexicon }) => {
  const [profile, setProfile] = useState(getProfile());
  const stats = getStats();
  const activeQuiz = getActiveQuiz();
  
  const [insight, setInsight] = useState<string>('');
  const [insightLoading, setInsightLoading] = useState(true);
  const [timeUntilRefresh, setTimeUntilRefresh] = useState<string>('');
  const [showWheel, setShowWheel] = useState(false);
  const [showLiveLink, setShowLiveLink] = useState(false);
  const [dopamine, setDopamine] = useState<{ xp?: number, level?: number } | null>(null);

  useEffect(() => {
    handleDailyCheckIn();
    
    const fetchInsight = async () => {
      const cached = getDailyInsightCache();
      if (cached) {
        setInsight(cached);
        setInsightLoading(false);
        return;
      }
      setInsightLoading(true);
      const text = await getDailyInsight();
      setInsight(text);
      saveDailyInsight(text);
      setInsightLoading(false);
    };
    fetchInsight();

    const updateCountdown = () => {
        const session = getSession();
        const lastTime = session.progress.dailyInsightTimestamp || Date.now();
        const diff = (24 * 60 * 60 * 1000) - (Date.now() - lastTime);
        if (diff <= 0) {
            setTimeUntilRefresh('EXPIRING...');
            return;
        }
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeUntilRefresh(`${hours}H ${mins}M`);
    };
    updateCountdown();
    const countdownTimer = setInterval(updateCountdown, 60000);
    return () => clearInterval(countdownTimer);
  }, []);

  const topicList = Object.values(TOPICS).filter(t => t.id !== Topic.FULL_MOCK);
  
  const lastActiveTopicId = useMemo(() => {
    const keys = Object.keys(profile?.progress?.topicProgress || {});
    return (keys.pop() as Topic) || Topic.MODULE_1;
  }, [profile]);

  return (
    <div className="w-full py-6 md:py-12 px-4 md:px-12 lg:px-16 max-w-[2200px] mx-auto overflow-x-hidden animate-fade-in pb-48 font-mono">
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 md:gap-16 mb-12 md:mb-24">
        <div className="space-y-6 md:space-y-10 w-full flex-1">
            <h1 className="text-4xl xs:text-5xl sm:text-7xl md:text-9xl lg:text-[11rem] xl:text-[13rem] font-display font-black text-white uppercase italic tracking-tighter leading-tight lg:leading-[0.85] gold-text-gradient select-none truncate">
                {(profile?.name || 'Operator')}
            </h1>
            <div className="flex flex-wrap gap-4">
               <button 
                  onClick={() => onNavigate(AppView.TOPIC, lastActiveTopicId)}
                  className="px-6 md:px-10 py-3 md:py-4 bg-emerald-600 text-black font-black uppercase rounded-xl shadow-xl active:scale-95 transition-all italic flex items-center gap-3 text-xs md:text-base"
               >
                  <i className="fas fa-play-circle text-lg md:text-xl"></i> RESUME_SECTOR
               </button>
               <button 
                  onClick={() => onNavigate(AppView.CURRICULUM)}
                  className="px-6 md:px-10 py-3 md:py-4 bg-white/5 text-gold-500 border border-gold-500/30 font-black uppercase rounded-xl hover:bg-gold-500 hover:text-black transition-all italic text-xs md:text-base"
               >
                  MAP_NEW_SECTOR
               </button>
            </div>
        </div>
        
        <div className="flex w-full lg:w-auto gap-8 relative z-20">
            <button onClick={() => setShowWheel(true)} className="flex-1 lg:flex-none p-6 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] border border-gold-500/20 bg-gold-950/10 hover:bg-gold-500 hover:text-black transition-all group active:scale-95 shadow-2xl relative overflow-hidden tactical-bracket">
                <i className="fas fa-dharmachakra text-3xl md:text-6xl group-hover:rotate-180 duration-1000"></i>
                <span className="hud-label block mt-3 md:mt-4 text-gold-500 group-hover:text-black tracking-[0.2em] md:tracking-[0.5em] text-[7px] md:text-xs">SYNC_REWARD</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        <div className="lg:col-span-8 space-y-8 md:space-y-12">
            <div className="glass-card p-6 md:p-14 rounded-[2rem] md:rounded-[3.5rem] flex flex-col min-h-[250px] md:min-h-[400px] relative overflow-hidden group border-emerald-500/10">
                <div className="flex items-center justify-between mb-8 md:mb-16 opacity-60">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                            <i className="fas fa-satellite-dish text-[10px] md:text-sm"></i>
                        </div>
                        <span className="hud-label text-white tracking-[0.2em] md:tracking-[0.4em] text-[7px] md:text-xs">UPLINK_INTEL</span>
                    </div>
                    <div className="px-2 py-0.5 md:px-3 md:py-1 bg-black/40 rounded border border-white/5">
                        <span className="text-[6px] md:text-[9px] font-mono text-emerald-500 font-black uppercase italic">Refresh: {timeUntilRefresh}</span>
                    </div>
                </div>
                <p className="text-slate-100 text-xl md:text-5xl lg:text-6xl italic font-light leading-snug tracking-tight font-display drop-shadow-2xl">
                    {insightLoading ? 'DECRYPTING...' : `"${insight}"`}
                </p>
                <div className="absolute -bottom-8 -right-8 opacity-[0.01] md:opacity-[0.02] group-hover:opacity-[0.08] transition-all duration-1000 scale-100 md:scale-150 rotate-12 pointer-events-none">
                    <i className="fas fa-brain text-[10rem] md:text-[25rem]"></i>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div className="glass-card p-4 md:p-8 rounded-2xl md:rounded-[2rem] border-white/5 text-center">
                    <p className="hud-label text-slate-700 text-[6px] md:text-[9px] mb-1">XP_CORE</p>
                    <p className="text-xl md:text-4xl font-display font-black text-white italic">{stats.xp.toLocaleString()}</p>
                </div>
                <div className="glass-card p-4 md:p-8 rounded-2xl md:rounded-[2rem] border-white/5 text-center">
                    <p className="hud-label text-slate-700 text-[6px] md:text-[9px] mb-1">RANK_TIER</p>
                    <p className="text-xl md:text-4xl font-display font-black text-gold-500 italic">{stats.rank}</p>
                </div>
                <div className="glass-card p-4 md:p-8 rounded-2xl md:rounded-[2rem] border-white/5 text-center">
                    <p className="hud-label text-slate-700 text-[6px] md:text-[9px] mb-1">ACC_SYMB</p>
                    <p className="text-xl md:text-4xl font-display font-black text-emerald-500 italic">{stats.averageScore}%</p>
                </div>
                <div className="glass-card p-4 md:p-8 rounded-2xl md:rounded-[2rem] border-white/5 text-center">
                    <p className="hud-label text-slate-700 text-[6px] md:text-[9px] mb-1">LVL_CAP</p>
                    <p className="text-xl md:text-4xl font-display font-black text-indigo-500 italic">{stats.level}</p>
                </div>
            </div>
        </div>
      </div>

      {showWheel && <NeuralWheel onClose={() => setShowWheel(false)} />}
      {showLiveLink && <HarveyLiveLink topic={lastActiveTopicId} onClose={() => setShowLiveLink(false)} />}
      {dopamine && <DopamineOverlay xpGained={dopamine.xp} onComplete={() => setDopamine(null)} />}
    </div>
  );
};
