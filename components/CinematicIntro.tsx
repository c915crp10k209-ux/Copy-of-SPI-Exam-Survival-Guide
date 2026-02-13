
import React, { useEffect, useState, useRef } from 'react';
import { generateSpeech } from '../services/geminiService';

interface CinematicIntroProps {
  onComplete: () => void;
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
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

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'boot' | 'invaders' | 'vectron' | 'ready'>('boot');
  const [progress, setProgress] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [invaders, setInvaders] = useState<{ x: number, y: number, icon: string }[]>([]);

  const INTRO_TEXT = "Greetings, Operator. You have entered the high-frequency combat zone. I am VECTRON. Physics artifacts are invading our clinical sector! We must blast through the impedance and achieve certification. Shields up! Let the sync begin!";

  useEffect(() => {
    if (stage === 'boot') {
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            setStage('invaders');
            return 100;
          }
          return prev + 5;
        });
      }, 40);
      return () => clearInterval(timer);
    }
  }, [stage]);

  useEffect(() => {
    if (stage === 'invaders') {
      const isMobile = window.innerWidth < 640;
      const icons = ['fa-wave-square', 'fa-ghost', 'fa-shield-virus', 'fa-tint'];
      const newInvaders = [];
      const cols = isMobile ? 4 : 6;
      const rows = 3;
      const spacingX = isMobile ? 45 : 60;
      const spacingY = isMobile ? 40 : 50;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          newInvaders.push({ 
            x: c * spacingX - (spacingX * cols / 2) + (spacingX / 2), 
            y: r * spacingY - 150, 
            icon: icons[(r + c) % icons.length] 
          });
        }
      }
      setInvaders(newInvaders);
      setTimeout(() => setStage('vectron'), 2500);
    }
    if (stage === 'vectron') {
      handleHarveyVoice();
      setTimeout(() => setStage('ready'), 8500);
    }
  }, [stage]);

  const handleHarveyVoice = async () => {
    const base64Audio = await generateSpeech(INTRO_TEXT, 'Charon');
    if (base64Audio) {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        }
        const ctx = audioContextRef.current;
        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;

        const bassBoost = ctx.createBiquadFilter();
        bassBoost.type = 'lowshelf';
        bassBoost.frequency.value = 250;
        bassBoost.gain.value = 12;

        source.connect(bassBoost);
        bassBoost.connect(ctx.destination);
        source.start(0);
      } catch (e) {
        console.error("Vectron audio failure", e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center overflow-hidden font-mono text-emerald-500 p-4">
      <div className="absolute inset-0 pointer-events-none z-50">
        <div className="absolute inset-0 bg-scanline opacity-[0.1] animate-scanline"></div>
      </div>

      <div className="relative z-10 w-full max-w-xl text-center flex flex-col items-center">
        
        {stage === 'boot' && (
          <div className="space-y-6 w-full max-w-xs md:max-w-md animate-pulse">
            <p className="text-xs md:text-xl uppercase tracking-widest text-emerald-400">VECTRON_OS_v12.4</p>
            <div className="space-y-1 text-[8px] md:text-[10px] text-emerald-700 text-left">
              <p>> CORE_SYNC... OK</p>
              <p>> SECTOR_SCAN... ACTIVE</p>
            </div>
            <div className="w-full h-2 md:h-4 bg-emerald-950 border border-emerald-500 rounded-sm overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        {stage === 'invaders' && (
          <div className="space-y-8 w-full">
            <h1 className="text-3xl md:text-7xl font-display font-black text-white italic tracking-tighter gold-text-gradient animate-bounce">
              SPI <span className="text-gold-500">INVADERS</span>
            </h1>
            <div className="relative h-40 flex items-center justify-center w-full">
              {invaders.map((inv, i) => (
                <div 
                  key={i} 
                  className="absolute transition-all duration-[3000ms] animate-float"
                  style={{ transform: `translate(${inv.x}px, ${inv.y}px)` }}
                >
                  <i className={`fas ${inv.icon} text-xl md:text-3xl text-emerald-400`}></i>
                </div>
              ))}
            </div>
            <p className="text-[8px] md:text-xs uppercase tracking-[0.3em] text-gold-500/50 animate-pulse">DEFEND_THE_CLINICAL_SECTOR</p>
          </div>
        )}

        {(stage === 'vectron' || stage === 'ready') && (
          <div className="animate-fade-in space-y-6 md:space-y-8 w-full flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 md:w-48 md:h-48 bg-emerald-950/20 border-2 md:border-4 border-emerald-500 flex items-center justify-center text-emerald-400 text-4xl md:text-8xl shadow-2xl relative overflow-hidden rounded-lg">
                <i className="fas fa-microchip animate-spin-slow"></i>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-gold-500 w-8 h-8 md:w-12 md:h-12 rounded-md flex items-center justify-center text-black shadow-lg animate-bounce">
                <i className="fas fa-bolt text-xs md:text-base"></i>
              </div>
            </div>

            <div className="space-y-3 w-full">
              <h2 className="text-emerald-400 font-display text-xl md:text-4xl font-black uppercase tracking-[0.2em] italic glow-text">VECTRON</h2>
              <div className="bg-emerald-900/5 border border-emerald-500/20 p-4 md:p-6 rounded-lg backdrop-blur-md">
                <p className="text-emerald-200 text-xs md:text-lg font-light leading-relaxed max-w-sm mx-auto italic">
                  "{INTRO_TEXT}"
                </p>
              </div>
            </div>

            {stage === 'ready' && (
              <button 
                onClick={onComplete}
                className="group mt-4 px-8 py-4 md:px-12 md:py-6 bg-gold-500 text-black font-black uppercase tracking-[0.3em] text-xs md:text-lg border-b-4 md:border-b-8 border-amber-900 active:border-b-0 active:translate-y-1 transition-all shadow-xl animate-pulse rounded-sm"
              >
                PRESS START
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
