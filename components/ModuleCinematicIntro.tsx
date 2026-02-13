
import React, { useEffect, useState, useRef } from 'react';
import { TopicMetadata } from '../types';
import { generateSpeech, getHarveyModuleIntro } from '../services/geminiService';
import { HarveyBot } from './HarveyBot';

interface ModuleCinematicIntroProps {
  metadata: TopicMetadata;
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

export const ModuleCinematicIntro: React.FC<ModuleCinematicIntroProps> = ({ metadata, onComplete }) => {
  const [status, setStatus] = useState<'INITIALIZING' | 'DECODING' | 'SYNCHRONIZED'>('INITIALIZING');
  const [glitchText, setGlitchText] = useState<string>(metadata.id);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const droneOscRef = useRef<OscillatorNode | null>(null);
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    handleIntroSequence();
    
    // Title glitch effect
    const glitchInterval = setInterval(() => {
        if (Math.random() > 0.85) {
            const chars = "01XZ#%@";
            const pos = Math.floor(Math.random() * metadata.id.length);
            const newText = metadata.id.substring(0, pos) + chars[Math.floor(Math.random()*chars.length)] + metadata.id.substring(pos + 1);
            setGlitchText(newText);
            setTimeout(() => setGlitchText(metadata.id), 40);
        }
    }, 150);

    // Emergency Skip fallback if AI hangs
    const skipTimer = setTimeout(() => {
        if (status === 'INITIALIZING') {
            setShowSkip(true);
        }
    }, 3000);

    return () => {
        clearInterval(glitchInterval);
        clearTimeout(skipTimer);
        if (droneOscRef.current) try { droneOscRef.current.stop(); } catch(e) {}
        if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const handleIntroSequence = async () => {
    try {
        const script = await getHarveyModuleIntro(metadata.id, metadata.description);
        const base64Audio = await generateSpeech(script, 'Charon');
        
        if (base64Audio && !hasFinishedRef.current) {
          setStatus('DECODING');
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
          }
          const ctx = audioContextRef.current;
          const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
          
          // Background Atmospheric Drone
          const drone = ctx.createOscillator();
          const droneGain = ctx.createGain();
          drone.type = 'sawtooth';
          drone.frequency.value = 40; 
          droneGain.gain.setValueAtTime(0, ctx.currentTime);
          droneGain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 1);
          
          const droneFilter = ctx.createBiquadFilter();
          droneFilter.type = 'lowpass';
          droneFilter.frequency.value = 100;
          
          drone.connect(droneFilter);
          droneFilter.connect(droneGain);
          droneGain.connect(ctx.destination);
          drone.start();
          droneOscRef.current = drone;

          // Main Voice Chain
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;

          const analyser = ctx.createAnalyser();
          analyser.fftSize = 128;
          
          const bassBoost = ctx.createBiquadFilter();
          bassBoost.type = 'lowshelf';
          bassBoost.frequency.value = 250;
          bassBoost.gain.value = 10;

          source.connect(bassBoost);
          bassBoost.connect(analyser);
          analyser.connect(ctx.destination);

          source.start(ctx.currentTime + 0.5);
          setIsTalking(true);
          drawVisualizer(analyser);

          source.onended = () => {
            if (hasFinishedRef.current) return;
            setStatus('SYNCHRONIZED');
            setIsTalking(false);
            droneGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2);
            setTimeout(() => setShowPrompt(true), 500);
          };
        } else {
          // Fallback if audio gen fails
          handleManualOverride();
        }
    } catch (e) {
        handleManualOverride();
    }
  };

  const handleManualOverride = () => {
    hasFinishedRef.current = true;
    setStatus('SYNCHRONIZED');
    setShowPrompt(true);
    setShowSkip(false);
    setIsTalking(false);
  };

  const drawVisualizer = (analyser: AnalyserNode) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      if (hasFinishedRef.current && status === 'SYNCHRONIZED') return;
      requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 60;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < bufferLength; i++) {
        const angle = (i / bufferLength) * Math.PI * 2;
        const amplitude = (dataArray[i] / 255) * 40;
        const x = centerX + (radius + amplitude) * Math.cos(angle);
        const y = centerY + (radius + amplitude) * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.stroke();
    };
    render();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-6 text-center overflow-hidden font-mono">
      <div className="absolute inset-0 bg-space-950 opacity-90"></div>
      <div className="absolute inset-0 bg-scanline opacity-[0.05] animate-scanline pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-4xl space-y-12 flex flex-col items-center">
        
        <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
            <div className="absolute inset-0 border border-gold-500/10 rounded-full"></div>
            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(234,179,8,0.1)_360deg)] rounded-full animate-radar-sweep"></div>
            <canvas ref={canvasRef} width={240} height={240} className="absolute inset-0 w-full h-full scale-125 opacity-50" />
            <div className="relative z-20">
                <HarveyBot size="lg" isTalking={isTalking} statusText={status} />
            </div>
        </div>

        <div className="space-y-6 w-full">
            <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">NEURAL_SYNC_ACTIVE</p>
            <h2 className="text-3xl md:text-8xl font-display font-black uppercase text-white tracking-tighter italic gold-text-gradient truncate w-full px-4">
                {glitchText}
            </h2>
            <div className={`transition-all duration-1000 ${status !== 'INITIALIZING' ? 'opacity-100' : 'opacity-0'}`}>
                <p className="text-slate-400 text-xl md:text-3xl font-light italic leading-relaxed max-w-2xl mx-auto px-4 font-display">
                    {metadata.description}
                </p>
            </div>
        </div>

        <div className="flex flex-col items-center gap-6 min-h-[100px]">
            {showPrompt ? (
                <button 
                    onClick={onComplete}
                    className="group relative px-16 py-6 bg-gold-500 text-black font-black uppercase text-xl tracking-[0.2em] rounded-xl shadow-[0_20px_50px_rgba(234,179,8,0.3)] active:scale-95 italic transition-all animate-pulse"
                >
                    INITIALIZE_SECTOR
                </button>
            ) : showSkip ? (
                <button 
                    onClick={handleManualOverride}
                    className="px-12 py-4 bg-white/5 border border-white/10 text-slate-500 hover:text-gold-500 transition-all uppercase font-black text-sm tracking-widest italic rounded-lg"
                >
                    Manual_Link_Override
                </button>
            ) : (
                <div className="flex items-center gap-4 text-emerald-500 font-black uppercase text-xs tracking-widest animate-pulse">
                    <i className="fas fa-circle-notch fa-spin"></i>
                    Neural_Link_Pending
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
