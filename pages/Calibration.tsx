
import React, { useState, useEffect } from 'react';
import { decryptIdentity } from '../services/geminiService';
import { calculateNumerology, NumerologyData } from '../services/numerology';
import { ClearanceTier, LearningStyle, StyleScores } from '../types';
import { getCalibrationForm, saveCalibrationForm, clearCalibrationForm, getSession, setOnboardingComplete } from '../services/storageService';
import { JarvisMascot } from '../components/JarvisMascot';

interface CalibrationProps {
  onComplete: (profile: any) => void;
}

const STYLE_QUIZ = [
  {
    question: "When tackling complex physics, you prefer:",
    options: [
      { text: "Interactive Visual Simulations", style: "Visual" as LearningStyle },
      { text: "Narrated Specialist Lectures", style: "Auditory" as LearningStyle },
      { text: "Deep Technical Dossiers/Reading", style: "Reading" as LearningStyle },
      { text: "Manipulating Lab Parameters Manually", style: "Kinesthetic" as LearningStyle }
    ]
  },
  {
    question: "How do you best remember ultrasound artifacts?",
    options: [
      { text: "Seeing actual clinical loop examples", style: "Visual" as LearningStyle },
      { text: "Listening to mnemonics spoken aloud", style: "Auditory" as LearningStyle },
      { text: "Writing down the physics principles", style: "Reading" as LearningStyle },
      { text: "Recreating the artifact in a simulator", style: "Kinesthetic" as LearningStyle }
    ]
  },
  {
    question: "In a high-pressure exam scenario, you rely on:",
    options: [
      { text: "Mental images of the beam anatomy", style: "Visual" as LearningStyle },
      { text: "Recalling key technical definitions", style: "Reading" as LearningStyle },
      { text: "JARVIS's tactical advice in your head", style: "Auditory" as LearningStyle },
      { text: "Your 'muscle memory' with machine knobs", style: "Kinesthetic" as LearningStyle }
    ]
  }
];

export const Calibration: React.FC<CalibrationProps> = ({ onComplete }) => {
  const [data, setData] = useState(getCalibrationForm());
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<'ID' | 'STYLE' | 'LOADING'>('ID');
  const [styleQuizIdx, setStyleQuizIdx] = useState(0);
  const [styleScores, setStyleScores] = useState<StyleScores>({ Visual: 0, Auditory: 0, Reading: 0, Kinesthetic: 0 });
  const [error, setError] = useState<string | null>(null);
  
  const [calibrationStep, setCalibrationStep] = useState(0);
  const steps = [
    "INITIALIZING J.A.R.V.I.S. INTERFACE...",
    "SCANNING COGNITIVE FREQUENCIES...",
    "ISOLATING LEARNING ARCHETYPES...",
    "SYNTHESIZING USER PROFILE...",
    "CALIBRATION COMPLETE."
  ];

  useEffect(() => {
    if (loading && calibrationStep < steps.length - 1) {
      const timer = setTimeout(() => setCalibrationStep(prev => prev + 1), 1000); 
      return () => clearTimeout(timer);
    }
  }, [loading, calibrationStep]);

  const handleStyleAnswer = (style: LearningStyle) => {
    const nextScores = { ...styleScores, [style]: styleScores[style] + 1 };
    setStyleScores(nextScores);
    
    if (styleQuizIdx < STYLE_QUIZ.length - 1) {
      setStyleQuizIdx(prev => prev + 1);
    } else {
      setPhase('LOADING');
      handleFinalizeCalibration(nextScores);
    }
  };

  const handleFinalizeCalibration = async (finalScores: StyleScores) => {
    setLoading(true);
    setError(null);
    
    try {
        const numData = calculateNumerology(data.name, data.dob);
        const profileResponse = await decryptIdentity(data.name, data.dob, data.time || '00:00', numData);
        
        // Logic to determine dominant style
        const dominantStyle = Object.keys(finalScores).reduce((a, b) => 
          (finalScores[a as keyof StyleScores] > finalScores[b as keyof StyleScores]) ? a : b
        ) as LearningStyle;
        
        if (profileResponse) {
            setTimeout(() => {
                setOnboardingComplete();
                onComplete({
                    ...profileResponse,
                    name: data.name.trim().split(' ')[0], 
                    fullName: data.name.trim(),
                    dob: data.dob,
                    birthTime: data.time || 'NOT_PROVIDED',
                    vibrationalSignature: `LP${numData.lifePath}-EX${numData.expression}-SU${numData.soulUrge}`,
                    numerology: numData,
                    learningStyle: dominantStyle,
                    styleScores: finalScores,
                    tier: ClearanceTier.ASSET,
                    results: [], 
                });
            }, 5000);
        } else {
            throw new Error("J.A.R.V.I.S. core uplink failed.");
        }
    } catch (e) {
        setLoading(false);
        setPhase('ID');
        setError("UPLINK FAILURE: Diagnostic core returned malformed data packet.");
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center p-4 md:p-6 font-mono relative overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl w-full glass-card p-6 md:p-16 rounded-[2.5rem] md:rounded-[4rem] border-cyan-500/20 text-center space-y-8 md:space-y-12 relative my-10">
        
        {phase === 'ID' && (
          <div className="space-y-10 animate-fade-in">
            <div className="space-y-4">
              <JarvisMascot size="md" statusText="GREETINGS_OPERATOR" />
              <h1 className="text-3xl md:text-6xl font-display font-black text-white uppercase italic gold-text-gradient mt-6">Identity Sync</h1>
              <p className="hud-label text-cyan-500">BIOMETRIC_INITIALIZATION</p>
            </div>

            <div className="space-y-6 text-left">
              <div className="space-y-2">
                <label className="text-[8px] md:text-xs font-black text-cyan-500/60 uppercase">Full Designation</label>
                <input 
                    type="text" 
                    placeholder="ENTER YOUR FULL NAME" 
                    className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none focus:border-cyan-500 transition-all shadow-inner"
                    value={data.name}
                    onChange={e => setData({...data, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[8px] md:text-xs font-black text-cyan-500/60 uppercase">Origin Date</label>
                    <input 
                        type="date" 
                        className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none focus:border-cyan-500"
                        value={data.dob}
                        onChange={e => setData({...data, dob: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[8px] md:text-xs font-black text-slate-500 uppercase">Sync Time (Opt)</label>
                    <input 
                        type="time" 
                        className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none focus:border-cyan-500"
                        value={data.time}
                        onChange={e => setData({...data, time: e.target.value})}
                    />
                </div>
              </div>
            </div>

            <button 
              onClick={() => setPhase('STYLE')}
              disabled={!data.name || !data.dob}
              className="w-full py-6 bg-cyan-600 text-black font-black uppercase text-sm md:text-base tracking-[0.4em] rounded-2xl shadow-3xl hover:bg-cyan-400 active:scale-95 transition-all italic border-b-4 border-cyan-900 disabled:opacity-30"
            >
              PROCEED_TO_CALIBRATION
            </button>
          </div>
        )}

        {phase === 'STYLE' && (
          <div className="space-y-10 animate-fade-in">
             <div className="space-y-4">
                <JarvisMascot size="sm" isTalking={true} statusText="CALIBRATING_COGNITION" />
                <h2 className="text-2xl md:text-5xl font-display font-black text-white italic uppercase mt-4">{STYLE_QUIZ[styleQuizIdx].question}</h2>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${((styleQuizIdx + 1) / STYLE_QUIZ.length) * 100}%` }}></div>
                </div>
             </div>
             
             <div className="grid grid-cols-1 gap-4">
                {STYLE_QUIZ[styleQuizIdx].options.map((opt, i) => (
                  <button 
                    key={i}
                    onClick={() => handleStyleAnswer(opt.style)}
                    className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-cyan-600 hover:text-black transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                       <span className="text-sm md:text-2xl font-black uppercase italic">{opt.text}</span>
                       <i className="fas fa-chevron-right opacity-0 group-hover:opacity-100 transition-all"></i>
                    </div>
                  </button>
                ))}
             </div>
          </div>
        )}

        {phase === 'LOADING' && (
          <div className="space-y-12 py-12 flex flex-col items-center">
            <JarvisMascot size="lg" isThinking={true} statusText="PROCESSING_CORE_SYNC" />
            <h2 className="text-xl md:text-3xl font-black text-cyan-400 italic uppercase tracking-widest animate-pulse max-w-sm">
                {steps[calibrationStep]}
            </h2>
          </div>
        )}

        {error && <p className="text-red-500 font-mono text-xs uppercase animate-pulse">{error}</p>}
      </div>
    </div>
  );
};
