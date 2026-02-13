
import React, { useState, useRef, useEffect } from 'react';
import { Topic, ChatMessage, TacticalScript } from '../types';
import { chatWithTutor, getMnemonics } from '../services/geminiService';
import { getChatHistory, saveChatHistory, vaultScript } from '../services/storageService';
import ReactMarkdown from 'react-markdown';
import { HarveyBot } from './HarveyBot';

interface GeminiTutorProps {
  topic: Topic;
  initialMessage?: string;
}

const SUGGESTED_PROBES = [
  "DECODE_ACOUSTICS",
  "SECTOR_DEFENSE",
  "VULNERABILITY_SCAN",
  "POWERUP_MNEMONIC"
];

export const GeminiTutor: React.FC<GeminiTutorProps> = ({ topic, initialMessage }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = getChatHistory(topic);
    return saved || [
      { role: 'model', text: `Tactical Link Established. I am Harvey. Sector **${topic}** is currently under heavy invasion. How shall we counter the impedance?` }
    ];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    const saved = getChatHistory(topic);
    if (saved) {
      setMessages(saved);
    } else {
      setMessages([{ role: 'model', text: `Sector link stable for ${topic}. Standing by for tactical query.` }]);
    }
  }, [topic]);

  useEffect(() => {
    if (initialMessage) {
      handleSend(initialMessage);
    }
  }, [initialMessage]);

  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(topic, messages);
    }
  }, [messages, topic]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;
    
    const userMsg: ChatMessage = { role: 'user', text: textToSend };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!messageText) setInput('');
    setLoading(true);

    const historyForApi = updatedMessages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const responseText = await chatWithTutor(topic, textToSend, historyForApi);
    
    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setLoading(false);
  };

  const handleMnemonicRequest = async () => {
     if (loading) return;
     setLoading(true);
     const mnemonicText = await getMnemonics(topic);
     setMessages(prev => [...prev, { role: 'model', text: mnemonicText }]);
     
     // SCRIPT VAULTING: Automatically save the mnemonic to the User's permanent progress
     const mnemonicScript: TacticalScript = {
        id: `mnemonic_${Date.now()}`,
        title: `${topic} Combat Mnemonic`,
        content: mnemonicText,
        date: new Date().toISOString(),
        topic: topic,
        type: 'INSIGHT'
     };
     vaultScript(mnemonicScript);
     
     setLoading(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-space-1000/90 relative">
      <div className="absolute top-0 left-0 w-full h-[1px] sm:h-[2px] bg-gradient-to-r from-transparent via-gold-500/50 to-transparent z-20 shadow-[0_0_20px_gold]"></div>
      
      <div className="bg-space-1000/95 border-b border-white/10 px-4 py-4 sm:px-12 sm:py-6 flex justify-between items-center backdrop-blur-3xl z-10 shadow-2xl">
        <div className="flex items-center gap-3 sm:gap-8 min-w-0">
            <HarveyBot size="sm" isTalking={loading} statusText="UPLINK" className="scale-75 sm:scale-100 -mt-4" />
            <div className="flex flex-col min-w-0 -mt-2">
                <h3 className="font-display font-black text-xs sm:text-3xl text-white tracking-widest sm:tracking-[0.4em] uppercase leading-none italic gold-text-gradient truncate">
                    VECTRON_<span className="text-white">CORE</span>
                </h3>
                <span className="text-[7px] sm:text-[13px] text-slate-600 font-black uppercase tracking-[0.2em] sm:tracking-[0.5em] font-mono mt-1 sm:mt-2.5 block italic leading-none truncate">{topic.split(' ')[0]}</span>
            </div>
        </div>
        <button 
          onClick={handleMnemonicRequest} 
          className="text-[7px] sm:text-[13px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-2xl transition-all duration-500 uppercase font-black tracking-widest flex items-center gap-2 sm:gap-4 active:scale-95 group font-mono italic flex-shrink-0" 
          disabled={loading}
        >
          <i className="fas fa-bolt text-[8px] sm:text-2xl group-hover:scale-125 transition-transform duration-500"></i> <span className="hidden sm:inline">POWERUP</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 sm:p-20 space-y-8 sm:space-y-16 no-scrollbar scroll-smooth relative">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
            <div className={`flex items-center gap-2 sm:gap-4 mb-2 opacity-40 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <span className="text-[7px] sm:text-[12px] font-black uppercase tracking-[0.3em] sm:tracking-[0.6em] font-mono italic">{msg.role === 'user' ? 'TX' : 'RX'}</span>
                <div className="w-4 sm:w-8 h-[1px] bg-white/30"></div>
            </div>
            
            <div className={`max-w-[95%] sm:max-w-[85%] rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-12 shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative transition-all duration-700 group border ${
              msg.role === 'user' 
                ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-100 rounded-tr-none' 
                : 'bg-space-950/60 border-white/10 text-slate-200 rounded-tl-none backdrop-blur-3xl'
            }`}>
              {msg.role === 'model' && (
                <div className="absolute top-0 left-0 w-1 sm:w-2 h-full bg-emerald-500/30 rounded-full"></div>
              )}
              
              <div className="prose prose-invert prose-xs sm:prose-2xl max-w-none">
                {/* Fixed: Wrapped ReactMarkdown in a div since className is not directly supported on the component in some type definitions */}
                <div className="leading-relaxed font-light italic text-[11px] sm:text-5xl tracking-tight text-slate-300 drop-shadow-2xl break-words">
                  <ReactMarkdown>
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex flex-col items-start animate-fade-in">
             <div className="flex items-center gap-2 sm:gap-4 mb-2 opacity-40">
                <span className="text-[7px] sm:text-[12px] font-black uppercase tracking-widest font-mono italic">SYNCING</span>
             </div>
             <div className="bg-white/[0.03] p-4 sm:p-10 rounded-xl sm:rounded-[2.5rem] border border-dashed border-white/10 flex items-center gap-3 sm:gap-8 shadow-2xl backdrop-blur-xl">
                <div className="flex space-x-1.5 sm:space-x-3">
                    <div className="w-1.5 sm:w-3 h-1.5 sm:h-3 bg-emerald-500/70 rounded-full animate-bounce shadow-[0_0_10px_#10b981]"></div>
                    <div className="w-1.5 sm:w-3 h-1.5 sm:h-3 bg-emerald-500/70 rounded-full animate-bounce [animation-delay:0.2s] shadow-[0_0_10px_#10b981]"></div>
                    <div className="w-1.5 sm:w-3 h-1.5 sm:h-3 bg-emerald-500/70 rounded-full animate-bounce [animation-delay:0.4s] shadow-[0_0_10px_#10b981]"></div>
                </div>
                <span className="text-[8px] sm:text-2xl font-mono text-slate-600 uppercase tracking-widest animate-pulse">Processing...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 sm:p-16 bg-space-1000/95 backdrop-blur-3xl border-t border-white/15 shadow-2xl z-50">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 sm:pb-12">
            {SUGGESTED_PROBES.map((probe, i) => (
                <button 
                    key={i}
                    onClick={() => handleSend(probe)}
                    className="flex-shrink-0 px-4 py-2 sm:px-8 sm:py-4 rounded-lg sm:rounded-2xl bg-white/[0.04] border border-white/15 text-slate-500 text-[7px] sm:text-[15px] font-black uppercase tracking-widest hover:border-emerald-500/50 hover:text-emerald-400 transition-all duration-500 active:scale-95 font-mono italic"
                >
                    {probe}
                </button>
            ))}
        </div>

        <div className="relative group">
            <input
                type="text"
                className="relative w-full bg-black/80 border-2 border-white/15 rounded-xl sm:rounded-[3rem] pl-4 sm:pl-10 pr-14 sm:pr-32 py-4 sm:py-12 text-[11px] sm:text-4xl text-white placeholder-slate-900 outline-none focus:border-emerald-500/50 transition-all duration-700 italic font-light tracking-tight"
                placeholder="Transmit query..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={loading}
            />
            <div className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2">
                <button 
                    onClick={() => handleSend()}
                    disabled={loading || !input.trim()}
                    className="w-10 h-10 sm:w-28 sm:h-28 bg-emerald-600 text-black rounded-lg sm:rounded-[2.2rem] flex items-center justify-center hover:scale-105 disabled:opacity-10 transition-all duration-500 shadow-xl active:scale-90 ring-4 sm:ring-8 ring-black/50"
                >
                    <i className={`fas ${loading ? 'fa-circle-notch fa-spin' : 'fa-arrow-up'} text-xs sm:text-6xl`}></i>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
