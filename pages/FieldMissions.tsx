
import React, { useState, useEffect } from 'react';
import { FieldMission, AppView, LabState } from '../types';
import { FIELD_MISSIONS } from '../constants';
import { VisualExplainer } from '../components/VisualExplainer';
import { triggerNotification, addSystemLog, recordDailySpin, getProfile, saveProfile } from '../services/storageService';

export const FieldMissions: React.FC<{ onNavigate: (view: AppView) => void }> = ({ onNavigate }) => {
  const [activeMission, setActiveMission] = useState<FieldMission | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [syncPct, setSyncPct] = useState(0);
  const [missionComplete, setMissionComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const profile = getProfile();
  const completedMissions = profile.progress.completedMissions || [];

  const handleDeploy = (m: FieldMission) => {
    setActiveMission(m);
    setIsDeploying(true);
    setSyncPct(0);
    setMissionComplete(false);
    setShowHint(false);
    addSystemLog(`DEPLOYING_TO_SECTOR: ${m.title}`, 'INFO');
  };

  const calculateSync = (currentState: LabState) => {
    if (!activeMission || !activeMission.targetState) return;
    
    const targets = activeMission.targetState;
    let totalDiff = 0;
    let keys = Object.keys(targets);
    
    keys.forEach(key => {
      const targetVal = (targets as any)[key];
      const currentVal = (currentState as any)[key];
      const diff = Math.abs(targetVal - currentVal);
      // Normalized difference (assuming 0-150 range for most things for simplicity)
      totalDiff += Math.min(1, diff / 50); 
    });

    const averageDiff = totalDiff / keys.length;
    const newSync = Math.round(Math.max(0, 1 - averageDiff) * 100);
    setSyncPct(newSync);

    if (newSync >= 98 && !missionComplete) {
      handleMissionSuccess();
    }
  };

  const handleMissionSuccess = () => {
    setMissionComplete(true);
    triggerNotification('MISSION_STABLE: DIAGNOSTIC_LOCK_ACHIEVED', 'fa-check-circle');
    addSystemLog(`MISSION_SUCCESS: ${activeMission?.title}`, 'SUCCESS');
    recordDailySpin(200); // 20 XP reward
    
    // Persist completion
    const p = getProfile();
    if (!p.progress.completedMissions) p.progress.completedMissions = [];
    if (!p.progress.completedMissions.includes(activeMission!.id)) {
        p.progress.completedMissions.push(activeMission!.id);
        saveProfile(p);
    }
  };

  useEffect(() => {
    const handleLabUpdate = (e: any) => {
      if (isDeploying && activeMission) {
          calculateSync(e.detail.state);
      }
    };
    window.addEventListener('rav_lab_state_changed', handleLabUpdate);
    return () => window.removeEventListener('rav_lab_state_changed', handleLabUpdate);
  }, [isDeploying, activeMission, missionComplete]);

  return (
    <div className="max-w-[1800px] mx-auto p-4 md:p-16 space-y-12 animate-fade-in font-mono relative pb-48">
      <header className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12">
        <div className="space-y-4">
           <h1 className="text-5xl md:text-[8rem] font-display font-black text-white uppercase italic tracking-tighter gold-text-gradient leading-none">Field_Missions</h1>
           <p className="text-gold-500/60 text-xs md:text-2xl italic tracking-widest border-l-4 border-gold-500/30 pl-6 uppercase">Tactical_Clinical_Scenarios</p>
        </div>
        <div className="flex gap-4">
            <div className="px-6 py-2 rounded-full border border-white/10 bg-white/5 hud-label text-slate-400">STATUS: {isDeploying ? 'IN_COMBAT' : 'AWAITING_ORDERS'}</div>
        </div>
      </header>

      {!activeMission ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {FIELD_MISSIONS.map(m => {
             const isDone = completedMissions.includes(m.id);
             return (
               <button 
                 key={m.id}
                 onClick={() => handleDeploy(m)}
                 className={`glass-card p-10 rounded-[3rem] text-left group transition-all relative overflow-hidden flex flex-col h-full active:scale-95 ${isDone ? 'border-emerald-500/40 opacity-80' : 'hover:border-gold-500/40'}`}
               >
                  <div className="absolute inset-0 bg-scanline opacity-[0.03] pointer-events-none"></div>
                  {isDone && (
                      <div className="absolute top-4 right-8 bg-emerald-500 text-black px-3 py-1 rounded-full text-[8px] font-black uppercase shadow-lg shadow-emerald-500/20">
                          SUCCESS_VERIFIED
                      </div>
                  )}
                  <div className="flex justify-between items-start mb-10">
                     <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center text-3xl group-hover:scale-110 transition-transform ${isDone ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-gold-500/10 border-gold-500/30 text-gold-500'}`}>
                        <i className={`fas ${isDone ? 'fa-check-circle' : 'fa-crosshairs'}`}></i>
                     </div>
                     <span className="text-[10px] font-black text-gold-500/40 uppercase tracking-widest">{m.difficulty}</span>
                  </div>
                  <h3 className="text-3xl font-display font-black text-white uppercase italic mb-4 group-hover:text-gold-500 transition-colors">{m.title}</h3>
                  <p className="text-slate-500 italic text-lg leading-relaxed mb-10 flex-1">{m.description}</p>
                  <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                     <span className="hud-label text-slate-700">COORD: {m.topic.split(' ')[0]}</span>
                     <div className="flex items-center gap-2 text-gold-500 font-black text-[10px] uppercase">
                         <span>Deploy</span>
                         <i className="fas fa-arrow-right"></i>
                     </div>
                  </div>
               </button>
             );
           })}
        </div>
      ) : (
        <div className="space-y-12 animate-slide-up">
           <div className="flex items-center justify-between mb-10">
                <button 
                  onClick={() => setActiveMission(null)}
                  className="flex items-center gap-3 text-gold-500 hover:text-white transition-colors uppercase font-black text-xs md:text-xl italic"
                >
                    <i className="fas fa-chevron-left"></i> ABORT_MISSION
                </button>
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="hud-label text-emerald-500">SYNC_COORDINATION</span>
                        <div className="w-48 md:w-64 h-2 bg-white/5 rounded-full overflow-hidden mt-1 border border-white/10 shadow-inner">
                            <div className={`h-full transition-all duration-300 ${syncPct > 90 ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-gold-500'}`} style={{ width: `${syncPct}%` }}></div>
                        </div>
                    </div>
                    <span className={`text-xl md:text-4xl font-display font-black italic ${syncPct > 90 ? 'text-emerald-400' : 'text-white'}`}>{syncPct}%</span>
                </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-7 space-y-8">
                 <div className={`aspect-video bg-black rounded-[4rem] border-2 overflow-hidden relative shadow-3xl transition-all duration-700 ${missionComplete ? 'border-emerald-500 shadow-[0_0_100px_rgba(16,185,129,0.2)]' : 'border-white/10'}`}>
                    <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-black/60 to-transparent"></div>
                    <VisualExplainer topic={activeMission.topic} visualId={activeMission.visualId} hideControls={false} />
                    
                    <div className="absolute top-8 left-8 flex items-center gap-3 bg-black/80 px-6 py-2 rounded-full border border-emerald-500/30 backdrop-blur-xl z-20">
                       <div className={`w-2 h-2 rounded-full ${missionComplete ? 'bg-emerald-500' : 'bg-red-500 animate-ping'}`}></div>
                       <span className="hud-label text-white">{missionComplete ? 'DIAGNOSTIC_LOCKED' : 'LIVE_MISSION_FEED'}</span>
                    </div>

                    {missionComplete && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-emerald-500/10 backdrop-blur-sm animate-fade-in">
                            <div className="text-center space-y-4 md:space-y-8 animate-slide-up">
                                <div className="w-24 h-24 md:w-48 md:h-48 rounded-full bg-emerald-500 flex items-center justify-center text-black text-4xl md:text-8xl shadow-[0_0_50px_#10b981] mx-auto">
                                    <i className="fas fa-lock"></i>
                                </div>
                                <h3 className="text-3xl md:text-8xl font-display font-black text-white italic uppercase gold-text-gradient leading-none">Diagnostic_Lock</h3>
                                <p className="text-emerald-400 hud-label text-[10px] md:text-xl tracking-[0.5em]">SYSTEM_CALIBRATED_XP_AWARDED</p>
                            </div>
                        </div>
                    )}
                 </div>
                 
                 <div className="p-8 md:p-14 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                    <h4 className="hud-label text-gold-500">OPERATIONAL_ORDERS:</h4>
                    <p className="text-slate-400 text-lg md:text-3xl font-light italic leading-relaxed">
                        Adjust the system parameters using the simulation controls until you reach the target diagnostic resonance. Match the frequency and energy signatures described in the objective.
                    </p>
                 </div>
              </div>

              <div className="lg:col-span-5 space-y-8">
                 <div className="glass-card p-12 rounded-[4rem] bg-indigo-950/10 border-indigo-500/20 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-scanline opacity-[0.05] pointer-events-none"></div>
                    <h4 className="hud-label text-indigo-400 mb-8 flex items-center gap-4 uppercase">
                       <i className="fas fa-bullseye"></i> Sector_Target
                    </h4>
                    <p className="text-2xl md:text-4xl text-slate-100 font-light italic leading-tight mb-10">
                       "{activeMission.objective}"
                    </p>
                    <div className="flex gap-4">
                       <button 
                         onClick={() => setShowHint(!showHint)}
                         className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 font-black uppercase text-xs hover:bg-white/10 active:scale-95 transition-all italic"
                       >
                          {showHint ? 'HIDE_HINT' : 'REVEAL_HINT'}
                       </button>
                    </div>
                 </div>

                 {showHint && (
                   <div className="p-8 rounded-[3rem] border border-white/10 bg-white/5 animate-fade-in relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gold-500/30"></div>
                      <p className="text-lg md:text-xl text-slate-400 italic">"Harvey whispers: {activeMission.hint}"</p>
                   </div>
                 )}

                 <div className={`glass-card p-12 rounded-[4rem] border transition-all duration-700 ${missionComplete ? 'border-emerald-500/40 bg-emerald-950/5' : 'border-white/5 opacity-20'}`}>
                    <h4 className={`hud-label mb-6 uppercase italic ${missionComplete ? 'text-emerald-500' : 'text-slate-700'}`}>MISSION_DEBRIEF</h4>
                    <p className={`text-xl md:text-2xl italic leading-relaxed ${missionComplete ? 'text-slate-200' : 'text-slate-700'}`}>
                       {missionComplete ? activeMission.solution : 'Decrypting outcome coordinates...'}
                    </p>
                    {missionComplete && (
                        <button onClick={() => setActiveMission(null)} className="w-full mt-10 py-5 bg-emerald-600 text-white font-black uppercase rounded-2xl shadow-xl hover:bg-emerald-500 transition-all italic">Next_Mission</button>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
