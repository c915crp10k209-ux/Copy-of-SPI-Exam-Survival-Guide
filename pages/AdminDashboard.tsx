
import React, { useState, useEffect } from 'react';
import { AppView, Topic, TopicMetadata, SubTopic } from '../types';
import { TOPICS } from '../constants';
import { saveContentOverride, getContentOverrides, getProfile } from '../services/storageService';

interface AdminDashboardProps {
    onNavigate: (view: AppView, topic?: Topic) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
    const [selectedTopicId, setSelectedTopicId] = useState<Topic>(Topic.MODULE_1);
    const [overrides, setOverrides] = useState<Record<string, Partial<TopicMetadata>>>(getContentOverrides());
    const [editData, setEditData] = useState<Partial<TopicMetadata>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        const base = TOPICS[selectedTopicId];
        const override = overrides[selectedTopicId as string] || {};
        setEditData({ ...base, ...override });
    }, [selectedTopicId, overrides]);

    const handleSave = async () => {
        setIsSaving(true);
        const success = await saveContentOverride(selectedTopicId, editData);
        if (success) {
            setSaveSuccess(true);
            setOverrides(getContentOverrides());
            setTimeout(() => setSaveSuccess(false), 3000);
        }
        setIsSaving(false);
    };

    const updateSubTopic = (idx: number, field: keyof SubTopic, value: string) => {
        const subs = [...(editData.subTopics || [])];
        subs[idx] = { ...subs[idx], [field]: value };
        setEditData(prev => ({ ...prev, subTopics: subs }));
    };

    return (
        <div className="h-full bg-black/90 p-4 md:p-20 overflow-y-auto no-scrollbar pb-64 relative">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-red-600/50 shadow-[0_0_20px_red] animate-pulse"></div>
            
            <div className="max-w-[1400px] mx-auto space-y-8 md:space-y-16">
                <header className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="w-12 h-12 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-red-600/10 border border-red-600/40 flex items-center justify-center text-red-500 shadow-2xl">
                            <i className="fas fa-shield-virus text-2xl md:text-4xl"></i>
                        </div>
                        <div>
                            <h1 className="text-xl md:text-7xl font-display font-black text-white italic uppercase tracking-tighter">Architect</h1>
                            <p className="text-red-500 font-mono text-[7px] md:text-sm uppercase tracking-widest mt-1">ADMIN_OVERRIDE_v9.1</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => onNavigate(AppView.HOME)}
                        className="w-full md:w-auto px-6 py-3 md:px-10 md:py-4 bg-white/5 border border-white/10 rounded-xl text-slate-500 font-mono text-[8px] md:text-xs uppercase tracking-widest"
                    >
                        Exit_Command
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
                    {/* Sector Selection (Horizontal on Mobile) */}
                    <div className="lg:col-span-4 space-y-4">
                        <h3 className="text-slate-700 font-black uppercase text-[8px] md:text-[10px] tracking-widest font-mono italic mb-4">TARGET_SECTORS</h3>
                        <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible no-scrollbar gap-2 md:gap-4 pb-2 lg:pb-0">
                            {Object.values(Topic).filter(t => t !== Topic.FULL_MOCK).map(topicId => (
                                <button 
                                    key={topicId}
                                    onClick={() => setSelectedTopicId(topicId as Topic)}
                                    className={`flex-shrink-0 w-40 lg:w-full p-4 md:p-6 rounded-xl md:rounded-2xl border transition-all text-left flex items-center gap-3 md:gap-4 group ${selectedTopicId === topicId ? 'bg-red-600/10 border-red-500 text-white shadow-xl' : 'bg-white/[0.02] border-white/5 text-slate-600'}`}
                                >
                                    <i className={`fas ${TOPICS[topicId as Topic].icon} text-xs md:text-base ${selectedTopicId === topicId ? 'text-red-500' : ''}`}></i>
                                    <span className="font-display font-black uppercase italic tracking-tight truncate text-[10px] md:text-base">{topicId}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Config Deck */}
                    <div className="lg:col-span-8 space-y-6 md:space-y-10">
                        <div className="glass-card p-6 md:p-10 rounded-3xl md:rounded-[3rem] border-red-600/20 bg-black/40 space-y-8 md:space-y-12">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4 md:pb-8">
                                <h4 className="text-white font-black uppercase tracking-widest text-xs md:text-xl italic font-display">Registry: <span className="text-red-500">{(selectedTopicId || '').split(' ')[0]}</span></h4>
                                {saveSuccess && <span className="text-emerald-500 font-mono text-[7px] md:text-[10px] animate-bounce">SYNC_OK</span>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                <div className="space-y-2">
                                    <label className="text-[8px] md:text-[10px] font-black text-slate-600 uppercase font-mono italic">Sector_Icon</label>
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 md:w-14 md:h-14 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center text-white text-xs md:text-base"><i className={`fas ${editData.icon}`}></i></div>
                                        <input 
                                            type="text" 
                                            value={editData.icon || ''} 
                                            onChange={e => setEditData({...editData, icon: e.target.value})}
                                            className="flex-1 bg-black/60 border border-white/10 rounded-lg px-4 py-2 text-white font-mono text-[10px] md:text-sm outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[8px] md:text-[10px] font-black text-slate-600 uppercase font-mono italic">Briefing (Description)</label>
                                    <textarea 
                                        value={editData.description || ''} 
                                        onChange={e => setEditData({...editData, description: e.target.value})}
                                        rows={3}
                                        className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-[10px] md:text-sm outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-6 md:space-y-8">
                                <h5 className="text-[8px] md:text-[10px] font-black text-red-500 uppercase tracking-widest font-mono italic">NODE_MAPPING</h5>
                                {editData.subTopics?.map((st, i) => (
                                    <div key={st.id} className="p-4 md:p-8 bg-white/[0.02] border border-white/5 rounded-2xl md:rounded-[2.5rem] space-y-4 md:space-y-6 relative overflow-hidden group">
                                        <div className="flex justify-between items-center">
                                            <span className="text-white font-black uppercase italic font-display tracking-tight text-sm md:text-xl">Node_{st.id}</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[7px] md:text-[8px] font-black text-slate-700 uppercase font-mono italic">Title</label>
                                                <input 
                                                    type="text" 
                                                    value={st.title} 
                                                    onChange={e => updateSubTopic(i, 'title', e.target.value)}
                                                    className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-white font-mono text-[9px] md:text-xs outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[7px] md:text-[8px] font-black text-slate-700 uppercase font-mono italic">Visual_Media</label>
                                                <select 
                                                    value={st.visualId}
                                                    onChange={e => updateSubTopic(i, 'visualId', e.target.value)}
                                                    className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-white font-mono text-[9px] md:text-xs outline-none"
                                                >
                                                    <option value="LongitudinalWaveVisual">Longitudinal Wave</option>
                                                    <option value="WaveParametersVisual">Wave Parameters</option>
                                                    <option value="TissueInteractionVisual">Tissue Interaction</option>
                                                    <option value="PulseParametersVisual">Pulse Parameters</option>
                                                    <option value="DopplerModesVisual">Doppler Modes</option>
                                                    <option value="TransducerAnatomyVisual">Transducer Core</option>
                                                    <option value="FlowPatternsVisual">Flow Patterns</option>
                                                    <option value="PropagationArtifactsVisual">Artifact Loops</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full py-6 md:py-8 bg-red-600 text-white font-black uppercase text-[10px] md:text-sm tracking-widest rounded-2xl md:rounded-3xl shadow-xl hover:bg-red-500 active:scale-95 transition-all italic font-mono flex items-center justify-center gap-3"
                            >
                                {isSaving ? (
                                    <><i className="fas fa-circle-notch fa-spin"></i> UPLOADING...</>
                                ) : (
                                    'COMMIT_TO_MATRIX'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="fixed bottom-0 left-0 w-full h-1 bg-red-600 opacity-20"></div>
        </div>
    );
};
