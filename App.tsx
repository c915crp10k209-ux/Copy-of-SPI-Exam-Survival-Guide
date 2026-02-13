
import React, { useState, useEffect, useCallback } from 'react';
import { ConvexProvider } from "convex/react";
import { convex } from "./services/convexClient";
import { Calibration } from './pages/Calibration';
import { Bridge } from './pages/Bridge';
import { Blueprint } from './pages/Blueprint';
import { Protocol } from './pages/Protocol';
import { Home } from './pages/Home';
import { Curriculum } from './pages/Curriculum';
import { TopicContent } from './pages/TopicContent';
import { QuizPage } from './pages/QuizPage';
import { ProfilePage } from './pages/ProfilePage';
import { SimExplorer } from './pages/SimExplorer';
import { AdminDashboard } from './pages/AdminDashboard';
import { FieldMissions } from './pages/FieldMissions';
import { TacticalVault } from './pages/TacticalVault';
import { IntelBureau } from './pages/IntelBureau';
import { Navigation } from './components/Navigation';
import { OmniSearch } from './components/OmniSearch';
import { VisualLexicon } from './components/VisualLexicon';
import { TransitionOverlay } from './components/TransitionOverlay';
import { SystemsHub } from './components/SystemsHub';
import { IntelPulse } from './components/IntelPulse';
import { AppView, Topic, RAV_Session, Achievement } from './types';
import { getSession, saveSession, checkAchievements, getStats, addSystemLog, syncWithCloud } from './services/storageService';
import { SFX } from './services/audioService';

const MainApp: React.FC = () => {
  const [session, setSession] = useState<RAV_Session>(getSession());
  const [currentView, setCurrentView] = useState<AppView>(() => 
    session.progress.calibrationComplete 
      ? (session.progress.lastView || AppView.HOME) 
      : AppView.CALIBRATION
  );
  const [activeTopic, setActiveTopic] = useState<Topic | null>(() => session.progress.activeTopic || null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [activeLexiconTerm, setActiveLexiconTerm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string; icon: string; isGeneric?: boolean } | null>(null);
  const [activeIntelPulse, setActiveIntelPulse] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [transition, setTransition] = useState<{ active: boolean; title: string; subtitle: string }>({ 
    active: false, 
    title: '', 
    subtitle: '' 
  });

  const stats = getStats();
  const levelProgress = Math.round((stats.xp % 1000) / 1000 * 100);

  // Background Cloud Sync Trigger
  useEffect(() => {
    saveSession(session);
    
    // Trigger Convex Sync in background
    if (session.progress.calibrationComplete) {
        setIsSyncing(true);
        syncWithCloud(session).finally(() => setIsSyncing(false));
    }

    const newAchievements = checkAchievements();
    if (newAchievements && newAchievements.length > 0) {
      setToast({ ...newAchievements[0], isGeneric: false });
      SFX.playSuccess();
      setTimeout(() => setToast(null), 5000);
    }
  }, [session]);

  useEffect(() => {
    const handleNotification = (e: any) => {
        setToast({ ...e.detail, isGeneric: true });
        SFX.playBlip();
        setTimeout(() => setToast(null), 3500);
    };
    window.addEventListener('rav_ui_notify', handleNotification);

    const pulseTimer = setInterval(() => {
        if (session.progress.calibrationComplete && currentView !== AppView.QUIZ && currentView !== AppView.ADMIN) {
            if (Math.random() > 0.95) {
                const pulses = [
                    "ACOUSTIC_SHADOWING detected in sector 5. Maintain focus.",
                    "NYQUIST_LIMIT exceeded. Increase PRF or adjust baseline immediately.",
                    "PIEZOELECTRIC resonance at critical levels. Prepare for calibration.",
                    "THERMAL_INDEX climbing. Monitor ALARA protocols in bone sectors.",
                    "STIFFNESS_MAP indicates high Young's Modulus. Possible diagnostic target."
                ];
                setActiveIntelPulse(pulses[Math.floor(Math.random() * pulses.length)]);
                addSystemLog("INTEL_PULSE_TX_COMPLETE", "WARNING");
            }
        }
    }, 60000);

    return () => {
        window.removeEventListener('rav_ui_notify', handleNotification);
        clearInterval(pulseTimer);
    };
  }, [session.progress.calibrationComplete, currentView]);

  const handleCalibrationComplete = (profile: any) => {
    const updatedSession = {
      ...session,
      profile,
      progress: { 
        ...session.progress, 
        calibrationComplete: true, 
        lastView: AppView.HOME,
        activeTopic: null
      }
    };
    setSession(updatedSession);
    saveSession(updatedSession);
    setCurrentView(AppView.HOME);
    setActiveTopic(null);
    SFX.playSuccess();
    window.dispatchEvent(new Event('storage'));
  };

  const navigateTo = (view: AppView, topic?: Topic) => {
    SFX.playBlip(activeTopic ? 880 : 440, 'sine', 0.05);
    const nextTopic = topic || ((view === AppView.TOPIC || view === AppView.QUIZ) ? activeTopic : null);
    
    if (view !== currentView || (topic && topic !== activeTopic)) {
      setTransition({ 
        active: true, 
        title: topic ? topic.split(' ')[0] : view, 
        subtitle: topic ? 'Sector_Synchronization' : 'System_Mapping_Active' 
      });
    }

    setActiveTopic(nextTopic);
    setCurrentView(view);
    
    setSession(prev => ({
        ...prev,
        progress: {
            ...prev.progress,
            lastView: view,
            activeTopic: nextTopic
        }
    }));
    
    window.scrollTo(0, 0);
  };

  const renderView = () => {
    if (!session.progress.calibrationComplete && currentView !== AppView.CALIBRATION) {
       return <Calibration onComplete={handleCalibrationComplete} />;
    }

    switch (currentView) {
      case AppView.CALIBRATION: return <Calibration onComplete={handleCalibrationComplete} />;
      case AppView.HOME: return <Home onNavigate={navigateTo} onOpenLexicon={() => setActiveLexiconTerm('')} />;
      case AppView.BRIDGE: return <Bridge profile={session.profile} />;
      case AppView.BLUEPRINT: return <Blueprint profile={session.profile} />;
      case AppView.PROTOCOL: return <Protocol onNavigate={navigateTo} />;
      case AppView.CURRICULUM: return <Curriculum onNavigate={navigateTo} />;
      case AppView.MISSIONS: return <FieldMissions onNavigate={navigateTo} />;
      case AppView.VAULT: return <TacticalVault onNavigate={navigateTo} />;
      case AppView.INTEL: return <IntelBureau onNavigate={navigateTo} />;
      case AppView.TOPIC: return activeTopic ? (<TopicContent topic={activeTopic} onNavigate={navigateTo} onOpenLexicon={(term) => setActiveLexiconTerm(term)} />) : <Home onNavigate={navigateTo} onOpenLexicon={() => setActiveLexiconTerm('')} />;
      case AppView.QUIZ: return activeTopic ? (<QuizPage topic={activeTopic} onNavigate={navigateTo} />) : <Home onNavigate={navigateTo} onOpenLexicon={() => setActiveLexiconTerm('')} />;
      case AppView.PROFILE: return <ProfilePage onNavigate={navigateTo} onTriggerIntro={() => {}} />;
      case AppView.EVOLUTION: return <SimExplorer />;
      case AppView.ADMIN: return <AdminDashboard onNavigate={navigateTo} />;
      default: return <Home onNavigate={navigateTo} onOpenLexicon={() => setActiveLexiconTerm('')} />;
    }
  };

  return (
    <div className="fixed inset-0 w-full flex flex-col bg-transparent font-sans text-slate-200 overflow-hidden">
      
      {transition.active && (
        <TransitionOverlay 
          title={transition.title} 
          subtitle={transition.subtitle} 
          onComplete={() => setTransition(prev => ({ ...prev, active: false }))} 
        />
      )}

      {activeIntelPulse && (
          <IntelPulse message={activeIntelPulse} onClose={() => setActiveIntelPulse(null)} />
      )}

      {isHubOpen && (
        <SystemsHub 
          onNavigate={navigateTo} 
          onClose={() => setIsHubOpen(false)} 
        />
      )}

      <header className="fixed top-0 left-0 w-full z-[110] pt-safe bg-space-1000/40 backdrop-blur-3xl border-b border-white/5">
        <div className="mx-auto px-4 md:px-12 h-14 md:h-20 flex items-center justify-between max-w-[2200px]">
          <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer" onClick={() => navigateTo(AppView.HOME)}>
             <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${isSyncing ? 'bg-amber-500 shadow-[0_0_15px_#f59e0b] animate-ping' : 'bg-emerald-500 shadow-[0_0_15px_#10b981]'} transition-colors`}></div>
             <div className="flex flex-col">
                <span className="text-[7px] sm:text-[10px] font-black uppercase text-gold-500/50 tracking-[0.2em] font-mono leading-none">{isSyncing ? 'CLOUD_SYNCING...' : 'SYSTEM_ACTIVE'}</span>
                <span className="text-xs sm:text-base font-display text-white font-black uppercase tracking-tighter leading-none mt-0.5 sm:mt-1">RAV_OS_v1.2</span>
             </div>
          </div>
          
          <div className="hidden xl:flex items-center gap-6 px-10 py-2 bg-white/5 rounded-full border border-white/10 mx-10 relative overflow-hidden group">
             <span className="hud-label text-slate-500">OPERATIONAL_EXP:</span>
             <div className="w-48 h-2 bg-black/40 rounded-full border border-white/10 overflow-hidden relative shadow-inner">
                <div className="h-full transition-all duration-1000 bg-emerald-500" style={{ width: `${levelProgress}%` }}></div>
             </div>
             <span className="hud-label text-white font-black text-xs">{stats.xp.toLocaleString()} XP</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
             <button 
               onClick={() => { SFX.playBlip(1200); setIsHubOpen(true); }}
               className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gold-500/10 border border-gold-500/40 flex items-center justify-center text-gold-500 hover:bg-gold-500 hover:text-black transition-all group shadow-xl"
             >
                <i className="fas fa-th text-[10px] sm:text-xs md:text-base group-hover:rotate-90 duration-500"></i>
             </button>
             <button 
               onClick={() => { SFX.playBlip(); setIsSearchOpen(true); }}
               className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-gold-500 transition-colors"
             >
                <i className="fas fa-search text-[10px] sm:text-xs md:text-base"></i>
             </button>
             <div className="hidden sm:flex items-center gap-4 md:gap-8 border-l border-white/10 pl-4 md:pl-8">
                <div className="flex flex-col items-end">
                   <span className="hud-label text-slate-500 text-[6px] md:text-[8px]">LEVEL_{stats.level}</span>
                   <span className="hud-label text-gold-500 text-[6px] md:text-[8px]">NODE: {currentView}</span>
                </div>
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 z-10 overflow-y-auto pt-14 md:pt-20 pb-32 no-scrollbar">
        {renderView()}
      </main>

      {session.progress.calibrationComplete && (
        <Navigation 
          currentView={currentView} 
          currentTopic={activeTopic}
          onNavigate={navigateTo} 
          onOpenLexicon={() => setActiveLexiconTerm('')}
          onOpenHub={() => setIsHubOpen(true)}
        />
      )}

      {toast && (
        <div className={`fixed top-16 right-4 sm:top-24 sm:right-6 z-[200] animate-slide-up flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl border-2 ${toast.isGeneric ? 'bg-indigo-950 border-indigo-500/50' : 'bg-emerald-600 border-white/20'}`}>
           <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-white text-sm sm:text-xl ${toast.isGeneric ? 'bg-indigo-500/20' : 'bg-black/20'}`}>
              <i className={`fas ${toast.icon}`}></i>
           </div>
           <div>
              <p className="text-[6px] sm:text-[8px] font-black uppercase text-white/60 font-mono leading-none mb-1">{toast.isGeneric ? 'System Message' : 'Achievement Unlocked'}</p>
              <h4 className="text-white font-black uppercase italic tracking-tight text-[10px] sm:text-base leading-none">{toast.title}</h4>
           </div>
        </div>
      )}

      {isSearchOpen && (
        <OmniSearch 
          onClose={() => setIsSearchOpen(false)} 
          onNavigate={(view, topic, subId) => {
            setIsSearchOpen(false);
            navigateTo(view, topic);
          }}
          onOpenTerm={(term) => {
            setIsSearchOpen(false);
            setActiveLexiconTerm(term);
          }}
        />
      )}

      {activeLexiconTerm !== null && (
        <VisualLexicon 
          initialTerm={activeLexiconTerm} 
          onClose={() => setActiveLexiconTerm(null)} 
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
    return (
        <ConvexProvider client={convex}>
            <MainApp />
        </ConvexProvider>
    );
};

export default App;
