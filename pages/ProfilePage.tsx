
import React, { useEffect, useState, useMemo } from 'react';
import { AppView, Topic, ExamResult, IntelNote, FleetMember } from '../types';
import { getStats, getProfile, updateUserName, clearAllData, updateNote, deleteNote, triggerNotification, getWeaknessReportCache, saveWeaknessReport, getFleetStandings } from '../services/storageService';
import { chatWithTutor } from '../services/geminiService';
import { JarvisMascot } from '../components/JarvisMascot';
import ReactMarkdown from 'react-markdown';

interface ProfilePageProps {
  onNavigate: (view: AppView, topic?: Topic) => void;
  onTriggerIntro: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate, onTriggerIntro }) => {
  const [profile, setProfile] = useState(getProfile());
  const stats = getStats();
  const fleet = getFleetStandings();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(profile.name || 'Operator');
  const [weaknessReport, setWeaknessReport] = useState<string>(() => getWeaknessReportCache() || '');
  const [reportLoading, setReportLoading] = useState(false);
  
  const [activeRightTab, setActiveRightTab] = useState<'HISTORY' | 'LOGS' | 'FLEET'>('HISTORY');

  const handleSaveName = () => {
    updateUserName(newName);
    setProfile(getProfile());
    setIsEditing(false);
  };

  const handleRunAnalysis = async () => {
    if (reportLoading) return;
    setReportLoading(true);
    const historyText = (profile.results || []).map(r => `${r.topic}: ${Math.round((r.score/r.totalQuestions)*100)}%`).join(', ');
    const prompt = `I am an ultrasound student. My learning style is ${profile.learningStyle}. My results: ${historyText || 'None'}. Provide a J.A.R.V.I.S. style tactical "Weakness Analysis Protocol". 100 words max.`;
    const analysis = await chatWithTutor(Topic.MODULE_1, prompt);
    setWeaknessReport(analysis);
    saveWeaknessReport(analysis);
    setReportLoading(false);
  };

  const learningStyleData = [
    { label: 'Visual', value: profile.styleScores?.Visual || 0, color: 'bg-cyan-500' },
    { label: 'Auditory', value: profile.styleScores?.Auditory || 0, color: 'bg-emerald-500' },
    { label: 'Reading', value: profile.styleScores?.Reading || 0, color: 'bg-indigo-500' },
    { label: 'Kinesthetic', value: profile.styleScores?.Kinesthetic || 0, color: 'bg-amber-500' },
  ];

  return (
    <div className="max-w-[1700px] mx-auto p-4 md:p-16 h-full overflow-y-auto pb-48 no-scrollbar custom-scrollbar relative font-mono">
      
      <div className="glass-panel p-5 md:p-20 rounded-2xl md:rounded-[5rem] mb-6 md:mb-16 flex flex-col lg:flex-row items-center lg:space-x-16 relative overflow-hidden group shadow-xl border-cyan-500/20">
         <div className="absolute inset-0 bg-scanline opacity-[0.03] pointer-events-none"></div>
         
         <div className="relative mb-6 lg:mb-0 flex-shrink-0">
            <JarvisMascot size="lg" statusText="PROFILE_SYNCED" />
         </div>

         <div className="flex-1 text-center lg:text-left w-full z-10 space-y-2 md:space-y-6">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
               <span className="text-[7px] md:text-[10px] font-black text-cyan-400 uppercase tracking-widest">Cognitive_Dossier</span>
            </div>
            {isEditing ? (
              <div className="flex items-center justify-center lg:justify-start gap-2">
                 <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="text-2xl md:text-7xl font-display font-black bg-transparent text-white border-b-2 border-cyan-500 outline-none w-full max-w-lg uppercase italic" autoFocus />
                 <button onClick={handleSaveName} className="w-8 h-8 rounded-lg bg-emerald-500 text-white shadow-md active:scale-90 transition-all"><i className="fas fa-check text-sm"></i></button>
              </div>
            ) : (
              <h2 className="text-3xl md:text-[9rem] font-display font-black text-white uppercase italic tracking-tighter cursor-pointer leading-none gold-text-gradient truncate w-full" onClick={() => setIsEditing(true)}>
                {profile.name || 'Operator'}
              </h2>
            )}
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-8">
                <p className="text-cyan-400 font-black text-sm md:text-3xl uppercase tracking-widest italic font-display">{profile.learningStyle}_Learner</p>
                <button onClick={handleRunAnalysis} className="text-emerald-500 font-black text-[8px] md:text-base uppercase tracking-widest font-mono italic flex items-center gap-2">
                    <i className="fas fa-microchip"></i> Sync_Vectron_Analysis
                </button>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-4 md:gap-12 mt-6 lg:mt-0 w-full lg:w-auto z-10 bg-black/40 p-5 md:p-10 rounded-2xl md:rounded-[3rem] border border-white/5">
             <div className="text-center lg:text-right">
                 <p className="text-[6px] md:text-xs uppercase text-slate-700 font-black tracking-widest font-mono">Exp</p>
                 <p className="text-xl md:text-7xl font-display font-black text-white gold-text-gradient">{stats.xp.toLocaleString()}</p>
             </div>
             <div className="text-center lg:text-right">
                 <p className="text-xl md:text-7xl font-display font-black text-cyan-500">{stats.averageScore}%</p>
                 <p className="text-[6px] md:text-xs uppercase text-slate-700 font-black tracking-widest font-mono">Acc</p>
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-14">
         <div className="lg:col-span-4 space-y-6">
            
            {/* Learning Style Matrix */}
            <div className="glass-panel p-5 md:p-10 rounded-2xl md:rounded-[3rem] border-white/5 shadow-xl relative overflow-hidden bg-black/60">
                <h3 className="font-black text-white mb-6 md:mb-10 text-[8px] md:text-base uppercase tracking-widest italic opacity-50">Cognitive_Matrix</h3>
                <div className="space-y-6">
                    {learningStyleData.map(style => (
                        <div key={style.label} className="space-y-2">
                           <div className="flex justify-between items-end">
                              <span className="text-[10px] md:text-sm font-black text-slate-400 uppercase tracking-widest">{style.label}</span>
                              <span className="text-[8px] md:text-xs font-mono text-cyan-500">{style.value} Pts</span>
                           </div>
                           <div className="h-1.5 md:h-3 w-full bg-white/5 rounded-full overflow-hidden">
                              <div className={`h-full ${style.color} transition-all duration-1000`} style={{ width: `${(style.value / 3) * 100}%` }}></div>
                           </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Strategic Intel */}
            <div className="glass-panel p-5 md:p-10 rounded-2xl md:rounded-[3rem] border-cyan-500/20 bg-cyan-950/5 shadow-xl relative overflow-hidden group">
                <h3 className="font-black text-white text-[8px] md:text-base uppercase tracking-widest italic opacity-50 mb-6 md:mb-10">J.A.R.V.I.S. Briefing</h3>
                <div className="prose prose-invert mb-4 min-h-[100px]">
                    {reportLoading ? (
                       <div className="space-y-2"><div className="h-3 bg-cyan-400/20 rounded-full w-full animate-pulse"></div><div className="h-3 bg-cyan-400/20 rounded-full w-4/5 animate-pulse"></div></div>
                    ) : weaknessReport ? (
                       <div className="text-slate-300 italic font-light text-[10px] md:text-xl font-display pr-2 border-l border-cyan-500/30 pl-3">
                         <ReactMarkdown>{weaknessReport}</ReactMarkdown>
                       </div>
                    ) : (
                       <div className="flex flex-col items-center justify-center py-10 opacity-30 text-center space-y-4">
                           <i className="fas fa-user-secret text-4xl"></i>
                           <p className="text-slate-700 text-[8px] md:text-sm italic tracking-widest uppercase">Protocol_Standby</p>
                       </div>
                    )}
                </div>
            </div>
         </div>

         <div className="lg:col-span-8 space-y-6">
            <div className="glass-panel p-5 md:p-12 rounded-2xl md:rounded-[4rem] border-white/5 shadow-xl overflow-hidden relative min-h-[600px] flex flex-col">
               <div className="flex justify-between items-center mb-10">
                    <div className="flex gap-4 md:gap-10">
                        <button onClick={() => setActiveRightTab('HISTORY')} className={`text-[8px] md:text-base uppercase tracking-widest italic font-black transition-all ${activeRightTab === 'HISTORY' ? 'text-white border-b-2 border-cyan-500' : 'text-slate-700 hover:text-slate-400'}`}>Sync_History</button>
                        <button onClick={() => setActiveRightTab('FLEET')} className={`text-[8px] md:text-base uppercase tracking-widest italic font-black transition-all ${activeRightTab === 'FLEET' ? 'text-white border-b-2 border-emerald-500' : 'text-slate-700 hover:text-slate-400'}`}>Fleet_Leaderboard</button>
                    </div>
               </div>

               <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 md:space-y-6">
                  {activeRightTab === 'HISTORY' ? (
                    <>
                        {(profile.results || []).slice().reverse().map((result, i) => (
                            <div key={i} className="p-6 md:p-8 bg-white/5 rounded-2xl md:rounded-[2.5rem] border border-white/10 flex items-center justify-between group hover:border-cyan-500/30 transition-all">
                                <div>
                                    <p className="hud-label text-slate-700">{new Date(result.date).toLocaleDateString()}</p>
                                    <h4 className="text-sm md:text-3xl font-display font-black text-white uppercase italic">{(result.topic || '').split(' ')[0]}</h4>
                                </div>
                                <div className="text-right">
                                    <p className="hud-label text-cyan-500">{Math.round((result.score/result.totalQuestions)*100)}% ACCURACY</p>
                                    <p className="text-[10px] md:text-xl font-black text-slate-400 italic">+{result.score * 10} XP</p>
                                </div>
                            </div>
                        ))}
                    </>
                  ) : (
                    <div className="space-y-3">
                        {fleet.map((member, i) => (
                            <div key={i} className={`p-5 md:p-8 rounded-2xl border flex items-center justify-between transition-all ${member.isUser ? 'bg-cyan-500/10 border-cyan-500 shadow-lg' : 'bg-black/40 border-white/5 hover:bg-white/[0.02]'}`}>
                                <div className="flex items-center gap-4">
                                    <div className="text-[10px] md:text-2xl font-black text-slate-800 w-6 md:w-10">#{i + 1}</div>
                                    <div>
                                        <h4 className={`text-sm md:text-2xl font-display font-black uppercase italic ${member.isUser ? 'text-white' : 'text-slate-400'}`}>{member.name} {member.isUser && '(YOU)'}</h4>
                                        <p className="text-[7px] md:text-xs text-slate-600 font-black uppercase">{member.rank}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-xs md:text-3xl font-display font-black italic ${member.isUser ? 'text-cyan-500' : 'text-slate-500'}`}>{member.xp.toLocaleString()} XP</p>
                                </div>
                            </div>
                        ))}
                    </div>
                  )}
               </div>
            </div>
         </div>
      </div>

      <div className="pt-20 flex flex-col items-center gap-4 opacity-30">
         <button onClick={() => {if(confirm('Purge Identity?')) { clearAllData(); window.location.reload(); }}} className="text-[7px] md:text-sm font-black text-red-600 uppercase tracking-widest italic">Manual_Identity_Purge</button>
      </div>
    </div>
  );
};
