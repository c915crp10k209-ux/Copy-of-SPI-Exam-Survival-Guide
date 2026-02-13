
import { RAV_Session, AppView, IdentityProfile, Topic, LabState, ActiveQuiz, ExamResult, TopicMetadata, Achievement, IntelNote, TacticalScript, QuizQuestion, TacticalBounty, FleetMember, ClearanceTier, LogEntry, SPIDomain, LearningStyle, StyleScores, UserProgress } from "../types";
import { convex } from "./convexClient";

const SESSION_KEY = 'rav_os_session_v1';
const LAB_STATE_PREFIX = 'rav_lab_';
const CHAT_HISTORY_PREFIX = 'rav_chat_';
const AUDIO_CACHE_PREFIX = 'rav_audio_session_';
const DATA_CACHE_NAME = 'rav_data_cache_v1';
const CONTENT_OVERRIDES_KEY = 'rav_content_overrides';
const CALIBRATION_FORM_KEY = 'rav_calib_form';

const DEFAULT_PROGRESS: UserProgress = {
  lastView: AppView.CALIBRATION,
  calibrationComplete: false,
  onboardingSeen: false,
  topicProgress: {},
  achievements: [],
  moduleIntrosSeen: [],
  notes: [],
  vaultedScripts: [],
  syncStreak: 0,
  lastSyncDate: undefined,
  bounties: [],
  activeTopic: null,
  logs: [{ id: 'init', message: 'SYSTEM_ESTABLISHED', type: 'INFO', timestamp: Date.now() }],
  completedMissions: []
};

// --- Convex Persistence Bridge ---
/**
 * Synchronizes the current session state to the Convex Cloud.
 * This assumes a Convex mutation named "session:sync" exists on the backend.
 */
export const syncWithCloud = async (session: RAV_Session) => {
    try {
        // Debounced or direct call to Convex mutation
        // Since we are in a frontend client environment, we use the client directly.
        // We assume the schema has a 'syncSession' mutation
        await (convex as any).mutation("session:sync", {
            profile: session.profile,
            progress: session.progress,
            lastSync: Date.now()
        });
        console.log("CONVEX_SYNC_SUCCESS");
    } catch (e) {
        console.warn("CONVEX_SYNC_OFFLINE: Fallback to LocalStorage only.");
    }
};

/**
 * Attempts to pull the latest state from Convex.
 */
export const pullFromCloud = async (): Promise<RAV_Session | null> => {
    try {
        const cloudData = await (convex as any).query("session:getLatest");
        if (cloudData) {
            return {
                profile: cloudData.profile,
                progress: cloudData.progress
            };
        }
    } catch (e) {
        console.error("CONVEX_PULL_FAILURE", e);
    }
    return null;
};

export const getSession = (): RAV_Session => {
  const data = localStorage.getItem(SESSION_KEY);
  const session = data ? JSON.parse(data) : { profile: null, progress: { ...DEFAULT_PROGRESS } };
  if (!session.progress) session.progress = { ...DEFAULT_PROGRESS };
  return session;
};

export const saveSession = (session: RAV_Session) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  // In App.tsx, we have a useEffect that triggers syncWithCloud whenever the session state changes.
};

export const getProfile = (): IdentityProfile => {
  const session = getSession();
  const profile = session.profile || { 
    name: 'Operator', fullName: 'Operator', dob: '', birthTime: '', vibrationalSignature: '',
    numerology: { lifePath: 0, expression: 0, soulUrge: 0, isWealth: false },
    type: 'Unknown', strategy: 'Unknown', authority: 'Unknown', tier: ClearanceTier.ASSET,
    learningStyle: 'Visual' as LearningStyle,
    styleScores: { Visual: 0, Auditory: 0, Reading: 0, Kinesthetic: 0 } as StyleScores,
    progress: session.progress, results: [],
  };
  return profile;
};

export const saveProfile = (profile: IdentityProfile) => {
  const session = getSession();
  session.profile = profile;
  saveSession(session);
};

export const getTopicProgress = (topic: string): string | undefined => {
  const session = getSession();
  return session.progress.topicProgress?.[topic];
};

export const updateTopicSubState = (topic: string, subId: string) => {
  const session = getSession();
  if (!session.progress.topicProgress) session.progress.topicProgress = {};
  session.progress.topicProgress[topic] = subId;
  saveSession(session);
};

export const setOnboardingComplete = () => {
  const session = getSession();
  session.progress.onboardingSeen = true;
  saveSession(session);
};

export const markModuleIntroSeen = (t: string) => {
  const session = getSession();
  if (!session.progress.moduleIntrosSeen.includes(t)) {
    session.progress.moduleIntrosSeen.push(t);
    saveSession(session);
  }
};

export const hasSeenModuleIntro = (t: string) => getSession().progress.moduleIntrosSeen.includes(t);

export const getCalibrationForm = () => {
    const data = localStorage.getItem(CALIBRATION_FORM_KEY);
    return data ? JSON.parse(data) : { name: '', dob: '', time: '' };
};

export const saveCalibrationForm = (data: { name: string, dob: string, time: string }) => {
    localStorage.setItem(CALIBRATION_FORM_KEY, JSON.stringify(data));
};

export const clearCalibrationForm = () => localStorage.removeItem(CALIBRATION_FORM_KEY);

export const getSessionAudio = (key: string): string | null => {
    return sessionStorage.getItem(AUDIO_CACHE_PREFIX + key);
};

export const setSessionAudio = (key: string, base64: string) => {
    try {
        sessionStorage.setItem(AUDIO_CACHE_PREFIX + key, base64);
    } catch (e) {
        Object.keys(sessionStorage).filter(k => k.startsWith(AUDIO_CACHE_PREFIX)).forEach(k => sessionStorage.removeItem(k));
    }
};

export const getContentOverrides = () => {
  const data = localStorage.getItem(CONTENT_OVERRIDES_KEY);
  return data ? JSON.parse(data) : {};
};

export const saveContentOverride = async (t: string, o: any) => {
  const overrides = getContentOverrides();
  overrides[t] = o;
  localStorage.setItem(CONTENT_OVERRIDES_KEY, JSON.stringify(overrides));
  return true;
};

export const getLabState = (id: string) => {
  const data = localStorage.getItem(LAB_STATE_PREFIX + id);
  return data ? JSON.parse(data) : null;
};

export const saveLabState = (id: string, s: any) => {
  localStorage.setItem(LAB_STATE_PREFIX + id, JSON.stringify(s));
};

export const getCachedGenData = async (k: string) => {
  try {
    const cache = await caches.open(DATA_CACHE_NAME);
    const match = await cache.match(k);
    return match ? await match.text() : null;
  } catch(e) { return null; }
};

export const setCachedGenData = async (k: string, d: string) => {
  try {
    const cache = await caches.open(DATA_CACHE_NAME);
    await cache.put(k, new Response(d));
  } catch(e) {}
};

export const triggerNotification = (title: string, icon: string = 'fa-info-circle') => {
  window.dispatchEvent(new CustomEvent('rav_ui_notify', { detail: { title, icon } }));
};

export const addSystemLog = (message: string, type: LogEntry['type'] = 'INFO') => {
  const session = getSession();
  const log: LogEntry = { id: `log_${Date.now()}`, message: message.toUpperCase(), type, timestamp: Date.now() };
  session.progress.logs = [log, ...(session.progress.logs || [])].slice(0, 50);
  saveSession(session);
};

export const recordDailySpin = (xp: number) => {
  const session = getSession();
  if (session.profile) {
    if (!session.profile.results) session.profile.results = [];
    // XP placeholder
    saveSession(session);
  }
};

export const handleDailyCheckIn = () => {
  const session = getSession();
  const today = new Date().toDateString();
  if (session.progress.lastSyncDate !== today) {
    session.progress.syncStreak = (session.progress.lastSyncDate === new Date(Date.now() - 86400000).toDateString()) ? session.progress.syncStreak + 1 : 1;
    session.progress.lastSyncDate = today;
    saveSession(session);
  }
};

export const getDailyInsightCache = () => {
    const session = getSession();
    const now = Date.now();
    const lastTime = (session.progress as any).dailyInsightTimestamp || 0;
    if ((session.progress as any).dailyInsight && (now - lastTime < 24 * 60 * 60 * 1000)) return (session.progress as any).dailyInsight;
    return null;
};

export const saveDailyInsight = (insight: string) => {
    const session = getSession();
    (session.progress as any).dailyInsight = insight;
    (session.progress as any).dailyInsightTimestamp = Date.now();
    saveSession(session);
};

export const getChatHistory = (topic: string) => {
  const data = localStorage.getItem(CHAT_HISTORY_PREFIX + topic);
  return data ? JSON.parse(data) : null;
};

export const saveChatHistory = (topic: string, hist: any) => {
  localStorage.setItem(CHAT_HISTORY_PREFIX + topic, JSON.stringify(hist));
};

export const vaultScript = (script: TacticalScript) => {
    const session = getSession();
    if (!session.progress.vaultedScripts) session.progress.vaultedScripts = [];
    session.progress.vaultedScripts.push(script);
    saveSession(session);
    triggerNotification('SCRIPT_VAULTED', 'fa-scroll');
};

export const checkAchievements = (): Achievement[] => {
    return []; 
};

export const getStats = () => {
  const profile = getProfile();
  const results = profile.results || [];
  const totalXp = results.reduce((acc, r) => acc + (r.score * 10), 0);
  
  const matrix: Record<string, { correct: number, total: number }> = {
      [SPIDomain.SAFETY]: { correct: 0, total: 0 },
      [SPIDomain.PHYSICS]: { correct: 0, total: 0 },
      [SPIDomain.TRANSDUCERS]: { correct: 0, total: 0 },
      [SPIDomain.INSTRUMENTATION]: { correct: 0, total: 0 },
      [SPIDomain.DOPPLER]: { correct: 0, total: 0 }
  };

  results.forEach(res => {
      if (res.domainScores) {
          Object.entries(res.domainScores).forEach(([domain, stats]) => {
              if (matrix[domain]) {
                  matrix[domain].correct += stats.correct;
                  matrix[domain].total += stats.total;
              }
          });
      }
  });

  return { 
      xp: totalXp, 
      averageScore: results.length > 0 ? Math.round(results.reduce((acc, r) => acc + (r.score / r.totalQuestions * 100), 0) / results.length) : 0, 
      rank: totalXp > 5000 ? 'SPI_MASTER' : 'ASSET', 
      level: Math.floor(totalXp / 1000) + 1, 
      domainMatrix: matrix 
  };
};

export const getActiveQuiz = (): ActiveQuiz | null => {
  const data = localStorage.getItem('rav_active_quiz');
  return data ? JSON.parse(data) : null;
};

export const saveActiveQuiz = (quiz: ActiveQuiz | null) => {
  if (quiz) localStorage.setItem('rav_active_quiz', JSON.stringify(quiz));
  else localStorage.removeItem('rav_active_quiz');
};

export const addExamResult = (result: ExamResult) => {
  const session = getSession();
  if (session.profile) {
    if (!session.profile.results) session.profile.results = [];
    session.profile.results.push(result);
    saveSession(session);
  }
};

export const updateBountyProgress = (type: string) => {
};

export const claimBounty = (id: string) => {
    const session = getSession();
    const bounty = session.progress.bounties.find((b: any) => b.id === id);
    if (bounty) {
        bounty.isClaimed = true;
        saveSession(session);
        triggerNotification('BOUNTY_CLAIMED', 'fa-award');
    }
};

export const updateUserName = (name: string) => {
  const session = getSession();
  if (session.profile) {
    session.profile.name = name;
    saveSession(session);
  }
};

export const clearAllData = () => localStorage.clear();

export const updateNote = (id: string, updates: Partial<IntelNote>) => {
    const session = getSession();
    const idx = session.progress.notes.findIndex((n: any) => n.id === id);
    if (idx !== -1) {
        session.progress.notes[idx] = { ...session.progress.notes[idx], ...updates };
        saveSession(session);
    }
};

export const deleteNote = (id: string) => {
    const session = getSession();
    session.progress.notes = session.progress.notes.filter((n: any) => n.id !== id);
    saveSession(session);
};

export const deleteScript = (id: string) => {
    const session = getSession();
    session.progress.vaultedScripts = session.progress.vaultedScripts.filter((s: any) => s.id !== id);
    saveSession(session);
};

export const getWeaknessReportCache = () => (getSession().progress as any).lastWeaknessReport || null;

export const saveWeaknessReport = (report: string) => {
    const session = getSession();
    (session.progress as any).lastWeaknessReport = report;
    saveSession(session);
};

export const getFleetStandings = (): FleetMember[] => {
    const stats = getStats();
    const profile = getProfile();
    return [
        { name: 'Acoustic_Knight', xp: 12500, rank: 'SPI_MASTER' },
        { name: 'Wave_Pilot_08', xp: 9800, rank: 'SPI_MASTER' },
        { name: profile.name, xp: stats.xp, rank: stats.rank, isUser: true }
    ];
};
