import React, { useState, useEffect } from 'react';
import { Icons } from './ui/Icon';
import { storage } from '../services/storage';
import { DailyLog } from '../types';

export const Tracker: React.FC = () => {
  // Current view date (default today)
  const [viewDateStr, setViewDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [log, setLog] = useState<DailyLog>(storage.getDailyLog(viewDateStr));
  const [stats, setStats] = useState({ completed: 0, skipped: 0 });

  // Load stats on mount
  useEffect(() => {
    calculateStats();
  }, []);

  // Reload log when date changes
  useEffect(() => {
    setLog(storage.getDailyLog(viewDateStr));
  }, [viewDateStr]);

  const calculateStats = () => {
    const allLogs = storage.getAllLogs();
    let completed = 0;
    let skipped = 0;

    Object.values(allLogs).forEach((l: DailyLog) => {
      if (l.fasting?.status === 'completed') completed++;
      if (l.fasting?.status === 'skipped' || l.fasting?.status === 'broken') skipped++;
    });
    setStats({ completed, skipped });
  };

  const handleStatusChange = (status: 'completed' | 'skipped' | 'broken') => {
    const updatedFasting = {
      date: viewDateStr,
      status: status,
      difficulty: log.fasting?.difficulty || 3,
      notes: log.fasting?.notes || ''
    };

    const updatedLog = { ...log, fasting: updatedFasting };
    setLog(updatedLog);
    storage.saveDailyLog(updatedLog);
    calculateStats(); // Refresh stats
  };

  const handleDifficultyChange = (val: number) => {
    if (!log.fasting) return; // Can't set difficulty if no status set, but we can auto-init
    const updatedLog = {
      ...log,
      fasting: { ...log.fasting!, difficulty: val as any }
    };
    setLog(updatedLog);
    storage.saveDailyLog(updatedLog);
  };

  // Generate a mock 30-day grid relative to "Ramadan"
  // For production, we would map specific calendar dates. 
  // Here we use the last 30 days window or simple 1-30 for demo.
  const getDayStatus = (offset: number) => {
    // Generate date string for (Today - offset)
    const d = new Date();
    d.setDate(d.getDate() - (29 - offset)); // Show last 30 days ending today? Or a fixed month?
    // Let's do a simple visualization: Today is index 29 (last one).
    // Actually, users prefer a calendar view. Let's do a simple 30 day grid starting from "Start of usage" or just map current logs.

    // Simplified: Just show status if the log exists for that day index relative to today
    // Better: Render the current month's days.
    return null;
  };

  // Let's just render the logs we HAVE in the grid, mapped to an arbitrary 30 day view for visual density
  const allLogs = storage.getAllLogs();
  const sortedDates = Object.keys(allLogs).sort();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 sm:pb-28">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-700 text-white p-4 sm:p-6 pt-8 sm:pt-10 rounded-b-2xl sm:rounded-b-3xl shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold mb-1">Fasting Tracker</h1>
          <p className="text-brand-100 text-xs sm:text-sm mb-4">Your journey through Ramadan</p>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: `${Math.round((Object.values(allLogs).filter(l => l.fasting?.status === 'completed').length / 30) * 100)}%` }}
              />
            </div>
            <span className="text-sm font-bold">{Object.values(allLogs).filter(l => l.fasting?.status === 'completed').length}/30</span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
        {/* Progress Grid */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
          <h3 className="font-bold text-sm sm:text-base md:text-lg text-slate-800 mb-3 sm:mb-4 flex items-center gap-2">
            <Icons.Calendar size={16} className="text-emerald-500 sm:w-5 sm:h-5" /> History
          </h3>
          <div className="grid grid-cols-6 sm:grid-cols-7 md:grid-cols-10 gap-1.5 sm:gap-2">
            {Array.from({ length: 30 }, (_, i) => { // Render 30 days for the grid
              const d = new Date();
              d.setDate(d.getDate() - (29 - i)); // Calculate date for each grid cell
              const dStr = d.toISOString().split('T')[0];
              const dayLog = allLogs[dStr];
              const status = dayLog?.fasting?.status;

              let bgClass = 'bg-slate-100 text-slate-400'; // Default for empty/future
              if (status === 'completed') bgClass = 'bg-brand-500 text-white shadow-sm';
              else if (status === 'broken') bgClass = 'bg-red-500 text-white shadow-sm';
              else if (status === 'skipped') bgClass = 'bg-amber-400 text-white shadow-sm';

              const isToday = dStr === new Date().toISOString().split('T')[0];
              const isSelected = dStr === viewDateStr;

              return (
                <button
                  key={i}
                  onClick={() => setViewDateStr(dStr)}
                  className={`${bgClass} aspect-square rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all hover:scale-105 hover:shadow-md ${isSelected ? 'ring-2 ring-brand-700 ring-offset-1' : ''} ${isToday && !isSelected ? 'ring-1 ring-slate-900 ring-offset-1' : ''}`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3 sm:gap-4 mt-3 sm:mt-4 text-[9px] sm:text-[10px] md:text-xs text-slate-400 justify-center flex-wrap">
            <span className="flex items-center gap-1"><div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-brand-500"></div> Completed</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400"></div> Skipped</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500"></div> Broken</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-200"></div> Empty</span>
          </div>
        </div>

        {/* Daily Log Input */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-5 md:p-6 transition-all duration-300">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h3 className="font-bold text-sm sm:text-base md:text-lg text-slate-800">Log for {new Date(viewDateStr).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}</h3>
            {viewDateStr === new Date().toISOString().split('T')[0] && <span className="text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 sm:py-1 rounded">Today</span>}
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="p-3 sm:p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm font-medium text-slate-600">Fasting Status</span>
              <div className="flex gap-1.5 sm:gap-2">
                {['completed', 'broken', 'skipped'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status as 'completed' | 'broken' | 'skipped')}
                    className={`flex-1 p-2 sm:p-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all ${log.fasting?.status === status ? (status === 'completed' ? 'bg-brand-500 text-white' : status === 'broken' ? 'bg-red-500 text-white' : 'bg-amber-400 text-white') : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {log.fasting?.status === 'completed' && (
              <div className="animate-fade-in">
                <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Difficulty Level</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={log.fasting?.difficulty || 3}
                  onChange={(e) => handleDifficultyChange(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[9px] sm:text-[10px] md:text-xs text-slate-400 mt-1 sm:mt-2">
                  <span>Easy (1)</span>
                  <span>Hard (5)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};