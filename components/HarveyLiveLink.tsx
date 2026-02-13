
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { LIVE_MODEL } from '../services/geminiService';
import { Topic } from '../types';
import { HarveyBot } from './HarveyBot';

interface VectronLiveLinkProps {
  topic: Topic;
  onClose: () => void;
}

export const HarveyLiveLink: React.FC<VectronLiveLinkProps> = ({ topic, onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('OFFLINE');
  const [isVectronTalking, setIsVectronTalking] = useState(false);
  const [transcription, setTranscription] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  const cleanup = () => {
    if (sessionRef.current) sessionRef.current.close();
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    setIsActive(false);
    setStatus('DISCONNECTED');
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext) => {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    return buffer;
  };

  const createBlob = (data: Float32Array) => {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' };
  };

  const initSession = async () => {
    try {
      setStatus('INIT_CORE...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputAudioContext;

      const sessionPromise = ai.live.connect({
        model: LIVE_MODEL,
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setStatus('COMMS_STABLE_OPERATOR');
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              sessionPromise.then(session => session.sendRealtimeInput({ media: createBlob(inputData) }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              setIsVectronTalking(true);
              const audioBuffer = await decodeAudioData(decode(message.serverContent.modelTurn.parts[0].inlineData.data), outputAudioContext);
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContext.destination);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsVectronTalking(false);
              };
              sourcesRef.current.add(source);
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
            if (message.serverContent?.outputAudioTranscription) {
               setTranscription(prev => (prev + " " + message.serverContent?.outputAudioTranscription?.text).slice(-150));
            }
          },
          onerror: () => setStatus('CORE_ERROR'),
          onclose: () => cleanup()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: `You are Harvey, a deep-voiced, resonant AI Tactical Physics core. 
          You are VIBRANTLY EXCITED about sector: ${topic}. 
          Speak in high-energy bursts like an arcade announcer. Use arcade metaphors. 
          The student is an elite operator defending against physics errors!`,
          outputAudioTranscription: {}
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (e) {
      setStatus('LINK_DENIED');
    }
  };

  return (
    <div className="fixed inset-0 z-[400] bg-black/98 backdrop-blur-2xl flex flex-col items-center justify-center p-6 animate-fade-in font-mono">
      <div className="absolute inset-0 bg-scanline opacity-[0.1] animate-scanline pointer-events-none"></div>
      
      <div className="relative w-full max-w-4xl space-y-16 text-center">
        {/* Cinematic Neural Core - REFACTORED to HarveyBot */}
        <div className="relative mx-auto flex items-center justify-center">
          <div className={`absolute inset-0 border-2 border-emerald-500/5 rounded-full transition-all duration-1000 ${isActive ? 'animate-spin-slow' : ''}`}></div>
          
          <HarveyBot 
            size="xl" 
            isTalking={isVectronTalking} 
            statusText={status}
            className={`transition-all duration-700 ${isActive ? 'opacity-100 scale-110' : 'opacity-40 scale-90 grayscale'}`}
          />
        </div>

        <div className="glass-panel p-8 md:p-12 rounded-[2rem] border-gold-500/20 bg-black/80 min-h-[150px] flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold-500/50 to-transparent"></div>
            <p className="text-xl md:text-5xl font-display font-black italic text-gold-300 leading-tight tracking-tight uppercase">
               {isActive ? (transcription || "Awaiting transmission, Operator...") : "INITIALIZING HARVEY INTERFACE..."}
            </p>
        </div>

        <div className="flex gap-6 justify-center">
            {!isActive ? (
                <button 
                  onClick={initSession}
                  className="px-16 py-6 bg-gold-600 text-black font-black uppercase text-sm tracking-[0.6em] rounded-lg shadow-[0_20px_50px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95 transition-all italic"
                >
                  INITIALIZE_LINK
                </button>
            ) : (
                <button 
                  onClick={cleanup}
                  className="px-16 py-6 bg-red-600/20 text-red-500 border border-red-500/50 font-black uppercase text-sm tracking-[0.6em] rounded-lg hover:bg-red-600 hover:text-white transition-all italic"
                >
                  ABORT_LINK
                </button>
            )}
            <button 
                onClick={onClose}
                className="px-10 py-6 bg-white/5 text-slate-500 font-black uppercase text-sm tracking-[0.4em] rounded-lg border border-white/10 hover:text-white transition-all italic"
            >
              QUIT
            </button>
        </div>
      </div>
    </div>
  );
};
