import React, { useState, useEffect } from 'react';
import { UserProfile, DailyLog, GoalConfig, PrayerTime, MaritalStatus } from '../types';
import { BLESSINGS } from '../constants';
import { Icons } from './ui/Icon';
import { storage } from '../services/storage';
import { getPrayerTimes, getNextPrayer } from '../services/prayerService';

interface TimelineProps {
  user: UserProfile;
  date: string;
}

export const Timeline: React.FC<TimelineProps> = ({ user, date }) => {
  const [log, setLog] = useState<DailyLog>(storage.getDailyLog(date));
  const [goals] = useState<GoalConfig>(storage.getGoals());
  const [blessing, setBlessing] = useState<string | null>(null);
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);

  // Initialize Data
  useEffect(() => {
    const times = getPrayerTimes(new Date(), user);
    setPrayers(times);
    setNextPrayer(getNextPrayer(times));
  }, [user]);

  // Blessing Logic
  useEffect(() => {
    const tracker = storage.getBlessingTracker();
    if (tracker.lastDate !== date) {
      // Rotate blessing
      let pool = BLESSINGS.filter(b => b.category === 'general');
      if (user.maritalStatus === MaritalStatus.Yes) {
        pool = [...pool, ...BLESSINGS.filter(b => b.category === MaritalStatus.Yes)];
      } else if (user.maritalStatus === MaritalStatus.No) {
        pool = [...pool, ...BLESSINGS.filter(b => b.category === MaritalStatus.No)];
      }
      
      const nextIndex = (tracker.index + 1) % pool.length;
      storage.saveBlessingTracker(date, nextIndex);
      setBlessing(pool[nextIndex].text);
    } else {
      // Retrieve current blessing based on index (simplified: just picking random for MVP statelessness or persistent index)
      // Re-deriving for consistency
      let pool = BLESSINGS.filter(b => b.category === 'general');
       if (user.maritalStatus === MaritalStatus.Yes) {
        pool = [...pool, ...BLESSINGS.filter(b => b.category === MaritalStatus.Yes)];
      } else if (user.maritalStatus === MaritalStatus.No) {
        pool = [...pool, ...BLESSINGS.filter(b => b.category === MaritalStatus.No)];
      }
      setBlessing(pool[tracker.index % pool.length].text);
    }
  }, [date, user.maritalStatus]);

  const updateLog = (updates: Partial<DailyLog>) => {
    const newLog = { ...log, ...updates };
    setLog(newLog);
    storage.saveDailyLog(newLog);
  };

  const togglePrayer = (key: keyof typeof log.prayers) => {
    updateLog({ prayers: { ...log.prayers, [key]: !log.prayers[key] } });
  };

  return (
    <div className="pb-24 animate-fade-in">
      
      {/* Morning Blessing */}
      {blessing && (
        <div className="bg-gradient-to-br from-brand-600 to-emerald-800 text-white p-6 rounded-3xl mb-6 shadow-lg shadow-brand-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Icons.Sun size={120} />
          </div>
          <p className="text-brand-100 text-sm font-medium mb-2 uppercase tracking-wider">Morning Blessing</p>
          <h3 className="text-xl md:text-2xl font-serif leading-relaxed">
            "{blessing}"
          </h3>
          {user.name && <p className="mt-4 text-brand-200 text-sm">— For {user.name}</p>}
        </div>
      )}

      {/* Now / Next */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6 flex flex-col items-center text-center">
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">Up Next</p>
        <div className="text-4xl font-bold text-slate-800 mb-1">{nextPrayer?.time}</div>
        <div className="text-brand-600 font-medium text-lg mb-6">{nextPrayer?.name}</div>
        
        <div className="flex w-full justify-between border-t border-slate-50 pt-6">
          <div className="text-center flex-1 border-r border-slate-50">
            <span className="block text-slate-400 text-xs uppercase mb-1">Status</span>
            <span className="font-semibold text-slate-700">{log.fastingStatus === 'fasting' ? 'Fasting' : 'Not Fasting'}</span>
          </div>
          <div className="text-center flex-1">
             <span className="block text-slate-400 text-xs uppercase mb-1">Sunset</span>
             <span className="font-semibold text-slate-700">{prayers.find(p => p.name === 'Maghrib')?.time}</span>
          </div>
        </div>
      </div>

      {/* Trackers */}
      <div className="space-y-6">
        
        {/* Salah */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-slate-900 font-semibold mb-4 flex items-center gap-2">
            <Icons.Clock size={18} className="text-brand-500" /> Prayers
          </h3>
          <div className="flex justify-between items-center">
            {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => (
              <button 
                key={p}
                onClick={() => togglePrayer(p as any)}
                className={`flex flex-col items-center gap-2 group`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${log.prayers[p as keyof typeof log.prayers] ? 'bg-brand-500 text-white shadow-md shadow-brand-200' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                  <Icons.Check size={18} />
                </div>
                <span className="text-xs uppercase font-medium text-slate-500">{p.charAt(0)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quran */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
           <div className="flex justify-between items-start mb-4">
             <h3 className="text-slate-900 font-semibold flex items-center gap-2">
              <Icons.BookOpen size={18} className="text-brand-500" /> Quran
            </h3>
            <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded-md">
              Target: {goals.quranTarget} {goals.quranUnit}
            </span>
           </div>
           
           <div className="flex items-center gap-4">
              <button 
                onClick={() => updateLog({ quran: { ...log.quran, completed: !log.quran.completed }})}
                className={`flex-1 py-3 rounded-xl border-2 font-medium transition-colors ${log.quran.completed ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
              >
                {log.quran.completed ? 'Completed' : 'Mark Done'}
              </button>
           </div>
        </div>

        {/* Focus Mode (Last 10 Nights) */}
        {user.lastTenNightsMode && (
          <div className="bg-indigo-950 p-6 rounded-2xl shadow-lg text-white">
            <div className="flex items-center gap-2 mb-4">
              <Icons.Moon size={20} className="text-yellow-400" />
              <h3 className="font-semibold text-lg">Last 10 Nights</h3>
            </div>
            <p className="text-indigo-200 text-sm mb-4">Intensify your worship. Seek Laylatul Qadr.</p>
            <div className="grid grid-cols-2 gap-3">
               <button 
                  onClick={() => togglePrayer('taraweeh')}
                  className={`p-3 rounded-lg border border-indigo-700 flex items-center justify-center gap-2 ${log.prayers.taraweeh ? 'bg-indigo-600 text-white' : 'bg-transparent text-indigo-300'}`}
                >
                 <Icons.Check size={14} /> Taraweeh
               </button>
               <button 
                  onClick={() => togglePrayer('tahajjud')}
                  className={`p-3 rounded-lg border border-indigo-700 flex items-center justify-center gap-2 ${log.prayers.tahajjud ? 'bg-indigo-600 text-white' : 'bg-transparent text-indigo-300'}`}
                >
                 <Icons.Check size={14} /> Tahajjud
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};