
import React, { useState, useMemo, useEffect } from 'react';
import { GLOSSARY_TERMS, TOPICS } from '../constants';
import { AppView, Topic } from '../types';

interface OmniSearchProps {
  onClose: () => void;
  onNavigate: (view: AppView, topic?: Topic, subId?: string) => void;
  onOpenTerm: (term: string) => void;
}

export const OmniSearch: React.FC<OmniSearchProps> = ({ onClose, onNavigate, onOpenTerm }) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const termResults = Object.values(GLOSSARY_TERMS)
      .filter(t => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q))
      .map(t => ({ type: 'TERM' as const, title: t.term, subtitle: 'Glossary Term', id: t.term }));

    const lessonResults: any[] = [];
    Object.values(TOPICS).forEach(topic => {
      topic.subTopics.forEach(sub => {
        if (sub.title.toLowerCase().includes(q) || sub.description.toLowerCase().includes(q)) {
          lessonResults.push({ 
            type: 'LESSON' as const, 
            title: sub.title, 
            subtitle: `Module: ${topic.id}`, 
            id: sub.id, 
            topicId: topic.id 
          });
        }
      });
    });

    return [...termResults, ...lessonResults].slice(0, 8);
  }, [query]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-24 md:pt-40 px-4 animate-fade-in">
      <div className="absolute inset-0 bg-space-1000/80 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center gap-4">
          <i className="fas fa-search text-gold-500 text-xl"></i>
          <input 
            autoFocus
            type="text"
            placeholder="Search frequency, impedance, artifacts..."
            className="flex-1 bg-transparent border-none outline-none text-white text-xl placeholder-slate-600 font-display italic"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="text-[10px] font-mono text-slate-700 border border-white/10 px-2 py-1 rounded">ESC</span>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto no-scrollbar pb-4">
          {results.length > 0 ? (
            results.map((res, i) => (
              <button 
                key={i}
                onClick={() => res.type === 'TERM' ? onOpenTerm(res.id) : onNavigate(AppView.TOPIC, res.topicId as Topic, res.id)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-white/[0.03] transition-colors border-b border-white/[0.02]"
              >
                <div>
                  <h4 className="text-white font-black italic uppercase tracking-tight text-lg">{res.title}</h4>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">{res.subtitle}</p>
                </div>
                <i className={`fas ${res.type === 'TERM' ? 'fa-dna text-gold-500/40' : 'fa-graduation-cap text-indigo-500/40'} text-xl`}></i>
              </button>
            ))
          ) : query.trim() ? (
            <div className="p-12 text-center text-slate-600 font-mono italic">No matching coordinates found in registry.</div>
          ) : (
            <div className="p-12 text-center text-slate-700 font-mono italic text-[10px] uppercase tracking-widest">Type to query the tactical database...</div>
          )}
        </div>
      </div>
    </div>
  );
};
