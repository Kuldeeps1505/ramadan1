import React, { useState } from 'react';
import { Icons } from './ui/Icon';
import { MOOD_PROMPTS } from '../constants';
import { storage } from '../services/storage';

export const Reflect: React.FC = () => {
  const [log, setLog] = useState(storage.getDailyLog(new Date().toISOString().split('T')[0]));
  const [activeMood, setActiveMood] = useState<string | null>(log.mood || null);
  const [tasbih, setTasbih] = useState(log.tasbihCount || 0);

  const handleMoodSelect = (mood: any) => {
    setActiveMood(mood);
    const updated = { ...log, mood };
    setLog(updated);
    storage.saveDailyLog(updated);
  };

  const handleTasbih = () => {
    const newCount = tasbih + 1;
    setTasbih(newCount);
    // Debounced save ideally, but direct for now
    const updated = { ...log, tasbihCount: newCount };
    setLog(updated);
    storage.saveDailyLog(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      <div className="bg-indigo-900 text-white p-6 pt-8 rounded-b-3xl shadow-lg relative overflow-hidden">
        <Icons.Moon className="absolute -left-6 -top-6 text-white/5 w-40 h-40" />
        <h1 className="text-2xl font-serif font-bold relative z-10">Flow & Reflect</h1>
        <p className="opacity-80 relative z-10 text-sm mt-1">Connect with your Creator and yourself.</p>
      </div>

      <div className="p-6 space-y-8">
        
        {/* Digital Tasbih */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Digital Tasbih</span>
          <button 
            onClick={handleTasbih}
            className="w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-xl shadow-indigo-200 text-white flex flex-col items-center justify-center active:scale-95 transition-transform"
          >
            <span className="text-5xl font-sans font-bold">{tasbih}</span>
            <span className="text-xs opacity-80 mt-1">Tap</span>
          </button>
          <div className="flex gap-4 mt-6 w-full">
            <button onClick={() => { setTasbih(0); storage.saveDailyLog({...log, tasbihCount: 0}); }} className="flex-1 py-2 text-sm text-slate-400 hover:text-slate-600">Reset</button>
          </div>
        </div>

        {/* Mood Check-in */}
        <div>
           <h3 className="font-bold text-lg mb-4 text-slate-800">How is your heart today?</h3>
           <div className="flex justify-between gap-2 overflow-x-auto pb-2 no-scrollbar">
             {['Happy', 'Grateful', 'Anxious', 'Tired', 'Spiritual'].map((m) => (
               <button 
                 key={m}
                 onClick={() => handleMoodSelect(m)}
                 className={`flex-shrink-0 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${activeMood === m ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}
               >
                 {m}
               </button>
             ))}
           </div>
        </div>

        {/* AI Reflection Prompt */}
        {activeMood && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 animate-float">
            <div className="flex items-center gap-2 mb-3 text-indigo-700">
               <Icons.Sparkles size={18} />
               <span className="text-xs font-bold uppercase tracking-wider">Reflection for you</span>
            </div>
            <p className="text-lg font-serif text-indigo-900 leading-relaxed">
              "{MOOD_PROMPTS[activeMood as keyof typeof MOOD_PROMPTS]}"
            </p>
            <textarea 
              className="w-full mt-4 bg-white/50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-900 placeholder:text-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              rows={3}
              placeholder="Type your thoughts here..."
              value={log.journalEntry || ''}
              onChange={(e) => {
                 const u = {...log, journalEntry: e.target.value};
                 setLog(u);
                 storage.saveDailyLog(u);
              }}
            />
          </div>
        )}

      </div>
    </div>
  );
};