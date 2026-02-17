import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Icons } from './ui/Icon';

interface JournalProps {
  date: string;
}

export const Journal: React.FC<JournalProps> = ({ date }) => {
  const [entry, setEntry] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const log = storage.getDailyLog(date);
    setEntry(log.journalEntry || '');
  }, [date]);

  const handleSave = () => {
    setIsSaving(true);
    const log = storage.getDailyLog(date);
    log.journalEntry = entry;
    storage.saveDailyLog(log);
    setTimeout(() => setIsSaving(false), 500);
  };

  return (
    <div className="pb-24 animate-fade-in h-full flex flex-col">
       <div className="flex items-center justify-between mb-6">
         <h1 className="text-2xl font-bold text-slate-900">Journal</h1>
         <div className="text-sm text-slate-500 flex items-center gap-1">
           <Icons.Shield size={14} /> Private
         </div>
       </div>

       <div className="bg-white flex-1 rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col relative">
         <textarea
           className="w-full h-full resize-none outline-none text-slate-700 leading-relaxed text-lg placeholder:text-slate-300"
           placeholder="Reflect on your day. What are you grateful for? What can you improve?"
           value={entry}
           onChange={(e) => setEntry(e.target.value)}
           onBlur={handleSave} // Auto-save on blur
         />
         <div className="absolute bottom-4 right-4 text-xs text-slate-400 transition-opacity duration-300">
           {isSaving ? 'Saving...' : 'Saved locally'}
         </div>
       </div>
    </div>
  );
};