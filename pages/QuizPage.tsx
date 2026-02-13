
import React, { useEffect, useState, useRef } from 'react';
import { AppView, QuizQuestion, Topic, ActiveQuiz, SPIDomain } from '../types';
import { generateQuizQuestions, chatWithTutor } from '../services/geminiService';
import { addExamResult, getActiveQuiz, saveActiveQuiz, updateBountyProgress } from '../services/storageService';
import { VisualExplainer } from '../components/VisualExplainer';
import { DopamineOverlay } from '../components/DopamineOverlay';
import { SFX } from '../services/audioService';
import ReactMarkdown from 'react-markdown';

interface QuizPageProps {
  topic: Topic;
  onNavigate: (view: AppView, topic?: Topic) => void;
}

type QuizPhase = 'LOADING' | 'ACTIVE' | 'REVIEW';

export const QuizPage: React.FC<QuizPageProps> = ({ topic, onNavigate }) => {
  const isFullMock = topic === Topic.FULL_MOCK;
  const [phase, setPhase] = useState<QuizPhase>('LOADING');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [flaggedQuestions, setFlaggedQuestions] = useState<boolean[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(7200);
  const [showNavigator, setShowNavigator] = useState(false);
  const [harveyReport, setHarveyReport] = useState<string>('');
  const [reportLoading, setReportLoading] = useState(false);
  const [inspectingIdx, setInspectingIdx] = useState<number | null>(null);
  const [hapticType, setHapticType] = useState<'success' | 'glitch' | null>(null);
  const [correctStreak, setCorrectStreak] = useState(0);
  
  const timerRef = useRef<any>(null);
  const lastSavedTimeRef = useRef<number>(0);

  useEffect(() => {
    const saved = getActiveQuiz();
    if (saved && (saved.topic as any) === topic) {
      setQuestions(saved.questions);
      setUserAnswers(saved.userAnswers);
      setFlaggedQuestions(saved.flaggedQuestions || new Array(saved.questions.length).fill(false));
      setCurrentQIndex(saved.currentIndex);
      if (saved.timeLeft !== undefined) setTimeLeft(saved.timeLeft);
      setPhase('ACTIVE');
    } else {
      fetchQuiz();
    }
  }, [topic]);

  useEffect(() => {
    if (phase === 'ACTIVE' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          const nextTime = Math.max(0, t - 1);
          if (Date.now() - lastSavedTimeRef.current > 10000) {
             updateSavedState(userAnswers, flaggedQuestions, currentQIndex, nextTime);
             lastSavedTimeRef.current = Date.now();
          }
          if (nextTime === 0) finishExam();
          return nextTime;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase, userAnswers, flaggedQuestions, currentQIndex]);

  const fetchQuiz = async () => {
    const count = isFullMock ? 110 : 30;
    const data = await generateQuizQuestions(topic, count);
    if (!data.length) { onNavigate(AppView.HOME); return; }
    setQuestions(data);
    setUserAnswers(new Array(data.length).fill(-1));
    setFlaggedQuestions(new Array(data.length).fill(false));
    const initialTime = isFullMock ? 7200 : 1800;
    setTimeLeft(initialTime);
    setPhase('ACTIVE');
    
    const initialQuizState: ActiveQuiz = { 
      topic, 
      questions: data, 
      userAnswers: new Array(data.length).fill(-1), 
      flaggedQuestions: new Array(data.length).fill(false), 
      currentIndex: 0, 
      startTime: Date.now(), 
      isFullMock: isFullMock,
      timeLeft: initialTime
    };
    saveActiveQuiz(initialQuizState);
    lastSavedTimeRef.current = Date.now();
  };

  const handleOptionSelect = (idx: number) => {
    const isFirstTime = userAnswers[currentQIndex] === -1;
    const nextAnswers = [...userAnswers];
    nextAnswers[currentQIndex] = idx;
    setUserAnswers(nextAnswers);
    updateSavedState(nextAnswers, flaggedQuestions, currentQIndex, timeLeft);

    if (isFirstTime) {
      const isCorrect = idx === questions[currentQIndex].correctAnswerIndex;
      setHapticType(isCorrect ? 'success' : 'glitch');
      setCorrectStreak(prev => isCorrect ? prev + 1 : 0);
      if (isCorrect) SFX.playBlip(1200); else SFX.playError();
      setTimeout(() => setHapticType(null), 1500);
    }
  };

  const handleToggleFlag = () => {
    const nextFlags = [...flaggedQuestions];
    nextFlags[currentQIndex] = !nextFlags[currentQIndex];
    setFlaggedQuestions(nextFlags);
    updateSavedState(userAnswers, nextFlags, currentQIndex, timeLeft);
    SFX.playBlip(600);
  };

  const updateSavedState = (answers: number[], flags: boolean[], index: number, time: number) => {
    saveActiveQuiz({ 
      topic, 
      questions, 
      userAnswers: answers, 
      flaggedQuestions: flags, 
      currentIndex: index, 
      startTime: Date.now(), 
      isFullMock: isFullMock,
      timeLeft: time
    });
  };

  const navigateTo = (idx: number) => {
    setCurrentQIndex(idx);
    updateSavedState(userAnswers, flaggedQuestions, idx, timeLeft);
    SFX.playBlip(idx > currentQIndex ? 880 : 440);
  };

  const generateHarveyReport = async (score: number, total: number, weakestDomain: string) => {
    setReportLoading(true);
    const pct = Math.round((score/total)*100);
    const report = await chatWithTutor(topic, `I scored ${score}/${total} (${pct}%). My weakest clinical sector was "${weakestDomain}". Provide a high-energy diagnosis of my clinical performance and focus specifically on improving that sector as Vectron.`);
    setHarveyReport(report);
    setReportLoading(false);
  };

  const finishExam = () => {
    SFX.playSweep();
    const score = userAnswers.reduce((acc, ans, idx) => ans === questions[idx].correctAnswerIndex ? acc + 1 : acc, 0);
    const pct = Math.round((score/questions.length)*100);

    // Calculate Domain Scores
    const domains: Record<string, { correct: number, total: number }> = {};
    questions.forEach((q, i) => {
      const d = q.domain || 'Uncategorized';
      if (!domains[d]) domains[d] = { correct: 0, total: 0 };
      domains[d].total++;
      if (userAnswers[i] === q.correctAnswerIndex) domains[d].correct++;
    });

    let weakest = 'N/A';
    let minPct = 101;
    Object.entries(domains).forEach(([name, stat]) => {
      const p = (stat.correct / stat.total) * 100;
      if (p < minPct) { minPct = p; weakest = name; }
    });
    
    updateBountyProgress('QUIZ');
    if (pct >= 90) updateBountyProgress('PERFECT_SCORE');

    addExamResult({ 
      id: Date.now().toString(), 
      date: new Date().toISOString(), 
      topic, 
      score, 
      totalQuestions: questions.length,
      domainScores: domains 
    });
    
    saveActiveQuiz(null);
    setPhase('REVIEW');
    generateHarveyReport(score, questions.length, weakest);
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (phase === 'LOADING') {
    return (
      <div className="fixed inset-0 z-[200] bg-space-1000 flex flex-col items-center justify-center p-6 text-center font-mono">
        <div className="relative w-20 h-20 md:w-48 md:h-48 lg:w-64 lg:h-64 rounded-full border-2 border-gold-500/20 flex items-center justify-center mb-8 shadow-2xl">
            <i className={`fas ${isFullMock ? 'fa-skull' : 'fa-satellite'} ${isFullMock ? 'text-red-500 animate-pulse' : 'text-gold-500'} text-2xl md:text-6xl lg:text-[8rem] animate-float`}></i>
            <div className={`absolute inset-0 border-t-2 ${isFullMock ? 'border-red-500' : 'border-gold-500'} rounded-full animate-spin`}></div>
        </div>
        <div className="space-y-3">
          <h2 className="text-white uppercase font-black tracking-widest text-[10px] md:text-2xl lg:text-4xl italic gold-text-gradient">Linking_Cortex</h2>
          <p className="text-slate-700 text-[7px] md:text-xs lg:text-sm uppercase tracking-widest">{isFullMock ? 'ELITE_COMBAT_SIMULATION_V110' : 'Protocol: ARDMS_SPI_v12'}</p>
        </div>
      </div>
    );
  }

  if (phase === 'REVIEW') {
    const score = userAnswers.reduce((acc, ans, idx) => ans === questions[idx].correctAnswerIndex ? acc + 1 : acc, 0);
    const pct = Math.round((score / questions.length) * 100);
    const isPassing = pct >= 70;

    // Aggregate Domain Telemetry
    const domains: Record<string, { correct: number, total: number }> = {};
    questions.forEach((q, i) => {
      const d = q.domain || 'General';
      if (!domains[d]) domains[d] = { correct: 0, total: 0 };
      domains[d].total++;
      if (userAnswers[i] === q.correctAnswerIndex) domains[d].correct++;
    });
    
    return (
      <div className="h-full overflow-y-auto p-4 md:p-12 lg:p-20 xl:p-24 pb-48 no-scrollbar font-mono animate-fade-in">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-16">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12">
            {/* Main Score & Harvey Intel */}
            <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="glass-panel p-10 rounded-[3rem] text-center relative overflow-hidden flex flex-col items-center justify-center bg-black/60 shadow-xl border-white/5">
                   <div className={`absolute inset-0 opacity-10 bg-gradient-to-b ${isPassing ? 'from-emerald-600' : 'from-red-900'} to-transparent`}></div>
                   <div className="relative z-10 space-y-4">
                     <div className={`w-32 h-32 md:w-56 md:h-56 mx-auto rounded-full border-2 md:border-[12px] ${isPassing ? 'border-emerald-500' : 'border-red-600'} flex flex-col items-center justify-center bg-black/80 shadow-[0_0_50px_rgba(0,0,0,0.5)]`}>
                       <span className={`text-3xl md:text-7xl font-display font-black leading-none ${isPassing ? 'text-emerald-400' : 'text-red-500'}`}>{pct}%</span>
                       <span className="text-[8px] md:text-sm text-white/40 uppercase tracking-widest mt-1">{score}/{questions.length}</span>
                     </div>
                     <h4 className="text-white font-black uppercase text-xs md:text-xl italic">Result_Sync</h4>
                   </div>
                </div>

                <div className="glass-panel p-8 rounded-[2.5rem] relative overflow-hidden bg-black/40 border-white/5 flex-1 min-h-[300px]">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center text-gold-500 border border-gold-500/30">
                            <i className="fas fa-microchip"></i>
                        </div>
                        <h3 className="text-white font-display font-black text-sm md:text-2xl uppercase italic gold-text-gradient">VECTRON_DEBRIEF</h3>
                    </div>
                    {reportLoading ? (
                        <div className="space-y-3"><div className="h-2 bg-white/5 rounded-full w-full animate-pulse"></div><div className="h-2 bg-white/5 rounded-full w-4/5 animate-pulse"></div></div>
                    ) : (
                        <div className="text-slate-300 italic font-light leading-relaxed text-[10px] md:text-lg font-display pr-2 border-l-2 border-gold-500/20 pl-4 h-[300px] overflow-y-auto no-scrollbar">
                           <ReactMarkdown>{harveyReport}</ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>

            {/* Sector Readiness Dashboard */}
            <div className="lg:col-span-8 glass-panel p-8 md:p-14 rounded-[4rem] bg-black/80 border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><i className="fas fa-radar text-[15rem]"></i></div>
                <div className="flex justify-between items-center mb-12">
                   <div className="space-y-1">
                      <span className="hud-label text-gold-500">DIAGNOSTIC_TELEMETRY</span>
                      <h3 className="text-xl md:text-5xl font-display font-black text-white italic uppercase tracking-tighter">Sector_Readiness</h3>
                   </div>
                   <div className="px-4 py-1 rounded-full bg-white/5 border border-white/10 text-[8px] md:text-xs text-slate-500 font-mono italic">SYNC_v2.1_ACTIVE</div>
                </div>

                <div className="space-y-10">
                   {Object.entries(domains).map(([name, stat], i) => {
                      const domainPct = Math.round((stat.correct / stat.total) * 100);
                      const isWeak = domainPct < 70;
                      return (
                        <div key={i} className="space-y-3 group">
                           <div className="flex justify-between items-end">
                              <div className="flex items-center gap-4">
                                 <div className={`w-8 h-8 md:w-12 md:h-12 rounded-lg flex items-center justify-center border transition-all ${isWeak ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'}`}>
                                    <i className={`fas ${isWeak ? 'fa-triangle-exclamation animate-pulse' : 'fa-check-circle'}`}></i>
                                 </div>
                                 <span className="text-[10px] md:text-2xl font-black text-white uppercase italic tracking-tight">{name}</span>
                              </div>
                              <span className={`text-xs md:text-3xl font-display font-black ${isWeak ? 'text-red-500' : 'text-emerald-400'}`}>{domainPct}%</span>
                           </div>
                           <div className="h-2 md:h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                              <div 
                                className={`h-full transition-all duration-[1.5s] delay-${i*100} ${isWeak ? 'bg-gradient-to-r from-red-900 to-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-gradient-to-r from-emerald-900 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'}`}
                                style={{ width: `${domainPct}%` }}
                              ></div>
                           </div>
                           <div className="flex justify-between items-center opacity-30 group-hover:opacity-60 transition-opacity">
                              <span className="text-[6px] md:text-[9px] text-slate-500 font-mono">NODES_SCANNED: {stat.total}</span>
                              <span className="text-[6px] md:text-[9px] text-slate-500 font-mono">{isWeak ? 'RE-SYNC_REQUIRED' : 'LOGIC_STABLE'}</span>
                           </div>
                        </div>
                      );
                   })}
                </div>

                <div className="mt-16 pt-10 border-t border-white/5 flex flex-col md:flex-row gap-4">
                   <button onClick={() => onNavigate(AppView.HOME)} className="flex-1 py-5 md:py-8 bg-gold-500 text-black font-black uppercase text-xs md:text-xl rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all italic">RETURN_TO_BASE</button>
                   <button onClick={() => window.location.reload()} className="flex-1 py-5 md:py-8 bg-white/5 border border-white/10 text-slate-400 font-black uppercase text-xs md:text-xl rounded-2xl hover:text-white hover:bg-white/10 transition-all italic">RE-RUN_PROBE</button>
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQIndex];

  return (
    <div className={`h-full flex flex-col ${isFullMock ? 'bg-red-950/20' : 'bg-space-1000'} relative overflow-hidden font-mono transition-colors duration-1000`}>
      {hapticType === 'glitch' && <div className="absolute inset-0 z-[100] pointer-events-none bg-red-600/5 animate-pulse border-2 border-red-600/20"></div>}
      
      <div className={`flex-shrink-0 ${isFullMock ? 'bg-black/95 border-red-500/30' : 'bg-black/95 border-white/10'} border-b px-4 py-2 md:px-10 lg:px-14 md:py-8 lg:py-12 flex items-center justify-between z-40 transition-colors`}>
        <div className="flex items-center gap-3">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isFullMock ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-gold-500'}`}></div>
            <span className={`text-xs md:text-2xl lg:text-3xl xl:text-4xl font-bold tracking-widest ${isFullMock ? 'text-red-500' : 'text-white'}`}>{currentQIndex + 1}/{questions.length}</span>
            <div className="hidden md:flex ml-6 flex-col">
               <span className="text-[6px] md:text-[8px] text-slate-500 uppercase tracking-widest">DOMAIN_LOCK</span>
               <span className="text-[8px] md:text-xs text-gold-500 font-black uppercase italic">{currentQuestion?.domain}</span>
            </div>
        </div>
        <div className="flex items-center gap-3 md:gap-8 lg:gap-14">
            <button 
              onClick={handleToggleFlag}
              className={`px-3 py-1 md:px-6 md:py-3 rounded-lg border transition-all flex items-center gap-2 ${flaggedQuestions[currentQIndex] ? 'bg-gold-500/20 border-gold-500 text-gold-500' : 'bg-white/5 border-white/10 text-slate-700'}`}
            >
              <i className="fas fa-flag text-[10px] md:text-2xl"></i>
              <span className="hidden md:inline text-xl font-black uppercase italic">Flag</span>
            </button>
            <span className={`text-[10px] md:text-3xl lg:text-4xl xl:text-5xl px-3 py-1 md:px-6 md:py-3 lg:px-8 lg:py-4 rounded-md border border-white/5 font-bold transition-colors ${timeLeft < 300 || isFullMock ? 'text-red-500 animate-pulse' : 'text-gold-500'}`}>{formatTime(timeLeft)}</span>
            <button onClick={() => setShowNavigator(true)} className="w-8 h-8 md:w-16 lg:w-20 xl:w-28 md:h-16 lg:h-20 xl:h-28 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 active:scale-90">
                <i className="fas fa-list-check text-xs md:text-3xl lg:text-4xl xl:text-5xl"></i>
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 md:p-12 lg:p-16 xl:p-24 pb-64 no-scrollbar relative">
        <div className="max-w-6xl mx-auto space-y-8 md:space-y-20 lg:space-y-32 xl:space-y-40 animate-fade-in" key={currentQIndex}>
            
            <div className="space-y-4">
                <h3 className={`text-xl sm:text-2xl md:text-4xl lg:text-6xl xl:text-[7rem] font-display font-black text-white italic tracking-tighter leading-tight ${isFullMock ? 'text-red-500' : 'gold-text-gradient'}`}>
                    {currentQuestion.question}
                </h3>
            </div>

            <div className="grid grid-cols-1 gap-3 md:gap-8 lg:gap-10 xl:gap-14">
                {currentQuestion.options.map((opt, idx) => (
                    <button 
                        key={idx}
                        onClick={() => handleOptionSelect(idx)}
                        className={`p-3 md:p-8 lg:p-10 xl:p-14 rounded-xl md:rounded-[2rem] lg:rounded-[3rem] xl:rounded-[4rem] border transition-all text-left flex items-start gap-3 md:gap-8 lg:gap-12 xl:gap-16 active:scale-95
                            ${userAnswers[currentQIndex] === idx ? (isFullMock ? 'bg-red-500/10 border-red-500' : 'bg-gold-500/10 border-gold-500') : 'bg-white/[0.02] border-white/5 text-slate-700'}`}
                    >
                        <span className={`w-7 h-7 md:w-16 lg:w-20 xl:w-24 md:h-16 lg:h-20 xl:h-24 rounded-md md:rounded-[1.5rem] lg:rounded-[2rem] xl:rounded-[2.5rem] flex-shrink-0 border flex items-center justify-center font-black text-[10px] md:text-3xl lg:text-4xl xl:text-5xl
                            ${userAnswers[currentQIndex] === idx ? (isFullMock ? 'bg-red-500 text-black' : 'bg-gold-500 text-black') : 'bg-space-1000 border-white/10 text-slate-800'}`}>
                            {String.fromCharCode(65 + idx)}
                        </span>
                        <span className={`text-xs md:text-2xl lg:text-3xl xl:text-5xl leading-tight pt-1 md:pt-4 lg:pt-6 xl:pt-8 italic font-light ${userAnswers[currentQIndex] === idx ? 'text-white' : 'text-slate-500'}`}>{opt}</span>
                    </button>
                ))}
            </div>
            
            <div className="flex items-center justify-between pt-8 md:pt-24 lg:pt-32 xl:pt-48 border-t border-white/5 gap-4">
                <button disabled={currentQIndex === 0} onClick={() => navigateTo(currentQIndex - 1)} className="px-4 py-2 md:px-10 lg:px-16 xl:px-20 md:py-6 lg:py-8 xl:py-10 text-[10px] md:text-xl lg:text-2xl font-black uppercase text-slate-800 disabled:opacity-0 transition-all">PREV</button>
                {currentQIndex === questions.length - 1 ? (
                    <button onClick={finishExam} className="flex-1 px-4 py-3 md:py-8 lg:py-12 xl:py-16 bg-red-600 text-white font-black rounded-lg md:rounded-[3rem] lg:rounded-[4rem] xl:rounded-[5rem] text-[10px] md:text-2xl lg:text-3xl xl:text-4xl uppercase tracking-widest active:scale-95 italic">FINALIZE_SUBMISSION</button>
                ) : (
                    <button onClick={() => navigateTo(currentQIndex + 1)} className={`flex-1 px-4 py-3 md:py-8 lg:py-12 xl:py-16 ${isFullMock ? 'bg-red-500 text-black' : 'bg-gold-500 text-black'} font-black rounded-lg md:rounded-[3rem] lg:rounded-[4rem] xl:rounded-[5rem] text-[10px] md:text-2xl lg:text-3xl xl:text-4xl uppercase tracking-widest active:scale-95 italic`}>NEXT_NODE</button>
                )}
            </div>
        </div>
      </div>

      {showNavigator && (
        <div className="fixed inset-0 z-[150] bg-space-950/98 backdrop-blur-2xl flex flex-col p-4 md:p-12 lg:p-24 animate-fade-in">
            <div className={`flex items-center justify-between mb-6 md:mb-12 lg:mb-24 border-b pb-4 ${isFullMock ? 'border-red-500/30' : 'border-white/5'}`}>
                <h3 className={`font-black uppercase text-xs md:text-3xl lg:text-5xl xl:text-6xl tracking-widest italic ${isFullMock ? 'text-red-500' : 'text-white gold-text-gradient'}`}>Sector_Array</h3>
                <button onClick={() => setShowNavigator(false)} className="w-10 h-10 md:w-20 lg:w-24 xl:w-28 md:h-20 lg:h-24 xl:h-28 rounded-full bg-white/5 flex items-center justify-center active:scale-90"><i className="fas fa-times text-sm md:text-4xl lg:text-6xl xl:text-7xl text-slate-700"></i></button>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-wrap gap-2 md:gap-4 lg:gap-8 pb-32 no-scrollbar">
                {questions.map((_, i) => (
                    <button key={i} onClick={() => { navigateTo(i); setShowNavigator(false); }} className={`w-10 h-10 md:w-20 lg:w-24 xl:w-28 md:h-16 lg:h-20 xl:h-28 rounded-lg md:rounded-[1.5rem] lg:rounded-[2rem] xl:rounded-[3rem] flex items-center justify-center text-[10px] md:text-2xl lg:text-4xl xl:text-5xl font-black border transition-all active:scale-90 relative
                        ${currentQIndex === i ? (isFullMock ? 'bg-red-500 text-black' : 'bg-gold-500 text-black border-white') : userAnswers[i] !== -1 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-slate-800'}`}>
                        {i + 1}
                        {flaggedQuestions[i] && <i className="fas fa-flag absolute top-1 right-1 text-[6px] md:text-xs text-gold-500"></i>}
                    </button>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};
