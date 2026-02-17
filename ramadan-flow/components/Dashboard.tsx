import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, DailyLog } from '../types';
import {
  fetchPrayerTimes,
  fetchQiblaDirection,
  getNextPrayer,
  formatCountdown,
  ParsedPrayerTimes,
  HijriDate
} from '../services/prayerService';
import { Icons } from './ui/Icon';
import { PrayerModal } from './PrayerModal';
import { storage } from '../services/storage';
import { APP_GREETINGS } from '../constants';
import { tasbihService, progressService, dailyLogService } from '../services/progressService';
import { useAuth } from '../src/context/AuthContext';

interface DashboardProps {
  user: UserProfile;
}

// Time-based gradient backgrounds - Light theme
const getTimeGradient = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 7) return 'bg-gradient-to-br from-amber-50 via-orange-50 to-brand-50'; // Fajr
  if (hour >= 7 && hour < 12) return 'bg-gradient-to-br from-sky-50 via-blue-50 to-brand-50'; // Morning
  if (hour >= 12 && hour < 15) return 'bg-gradient-to-br from-sky-50 via-brand-50 to-white'; // Afternoon
  if (hour >= 15 && hour < 18) return 'bg-gradient-to-br from-amber-50 via-orange-50 to-brand-50'; // Asr
  if (hour >= 18 && hour < 20) return 'bg-gradient-to-br from-orange-50 via-rose-50 to-brand-50'; // Maghrib
  return 'bg-gradient-to-br from-slate-50 via-brand-50 to-white'; // Night
};

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [prayerTimes, setPrayerTimes] = useState<ParsedPrayerTimes | null>(null);
  const [hijriDate, setHijriDate] = useState<HijriDate | null>(null);
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; remainingMs: number } | null>(null);
  const [countdown, setCountdown] = useState({ hours: '00', minutes: '00', seconds: '00' });
  const [log, setLog] = useState<DailyLog>(storage.getDailyLog(new Date().toISOString().split('T')[0]));
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPrayer, setSelectedPrayer] = useState<{ name: string; time: string } | null>(null);

  // Progress stats from backend
  const [streak, setStreak] = useState(0);
  const [tasbihTotal, setTasbihTotal] = useState(0);
  const [todayStats, setTodayStats] = useState<{
    prayersCompleted: number;
    quranMinutes: number;
    hadithsRead: number;
  }>({ prayersCompleted: 0, quranMinutes: 0, hadithsRead: 0 });

  // Contextual Dua based on time
  const getContextDua = () => {
    const hour = new Date().getHours();
    if (hour < 5) return { title: "Suhoor Time", text: "Wa bisawmi ghadinn nawaiytu..." };
    if (hour < 10) return { title: "Morning Adhkar", text: "Alhamdulillahil-ladhi ahyana ba'da ma amatana..." };
    if (hour > 18 && hour < 20) return { title: "Breaking Fast", text: "Dhahaba al-zama' wa abtallat al-'uruq..." };
    return { title: "Remembrance", text: "SubhanAllah wa bihamdihi..." };
  };
  const contextDua = getContextDua();

  // Fetch prayer times on mount
  useEffect(() => {
    const loadPrayerData = async () => {
      if (!user.latitude || !user.longitude) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const data = await fetchPrayerTimes(user.latitude, user.longitude, user.calculationMethod);
      if (data) {
        setPrayerTimes(data.timings);
        setHijriDate(data.hijri);
      }

      const qibla = await fetchQiblaDirection(user.latitude, user.longitude);
      if (qibla !== null) {
        setQiblaDirection(qibla);
      }

      setLoading(false);
    };

    loadPrayerData();
    setGreeting(APP_GREETINGS[Math.floor(Math.random() * APP_GREETINGS.length)]);
  }, [user.latitude, user.longitude, user.calculationMethod]);

  // Load progress stats from backend
  useEffect(() => {
    if (isAuthenticated) {
      loadProgressStats();
    }
  }, [isAuthenticated]);

  const loadProgressStats = async () => {
    try {
      // Load dashboard stats
      const stats = await progressService.getDashboard();
      setStreak(stats.streaks?.currentPrayerStreak || 0);

      // Load today's log from backend
      const today = new Date().toISOString().split('T')[0];
      const todayLog = await dailyLogService.getByDate(today);
      if (todayLog) {
        // Merge backend data with local state
        setLog(prev => ({
          ...prev,
          ...todayLog,
          prayers: { ...prev.prayers, ...todayLog.prayers }
        }));
        const prayersCompleted = Object.values(todayLog.prayers || {}).filter(Boolean).length;
        setTodayStats({
          prayersCompleted,
          quranMinutes: todayLog.quranMinutes || 0,
          hadithsRead: 0
        });
        setTasbihTotal(todayLog.tasbihCount || 0);
      }
    } catch (err) {
      console.error('Failed to load progress stats:', err);
    }
  };

  // Update countdown timer every second
  useEffect(() => {
    if (!prayerTimes) return;

    const updateCountdown = () => {
      const next = getNextPrayer(prayerTimes);
      if (next) {
        setNextPrayer(next);
        setCountdown(formatCountdown(next.remainingMs));
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [prayerTimes]);

  const togglePrayer = async (name: string) => {
    const newPrayerState = !log.prayers[name];
    const updated = { ...log, prayers: { ...log.prayers, [name]: newPrayerState } };
    setLog(updated);
    storage.saveDailyLog(updated);

    // Sync to backend
    if (isAuthenticated) {
      try {
        const today = new Date().toISOString().split('T')[0];
        await dailyLogService.save({
          date: today,
          prayers: updated.prayers
        });
        // Update stats count
        const prayersCompleted = Object.values(updated.prayers).filter(Boolean).length;
        setTodayStats(prev => ({ ...prev, prayersCompleted }));
      } catch (err) {
        console.error('Failed to sync prayer to backend:', err);
      }
    }
  };

  const handleTasbeeh = async () => {
    const newCount = (log.tasbihCount || 0) + 1;
    const updated = { ...log, tasbihCount: newCount };
    setLog(updated);
    storage.saveDailyLog(updated);
    setTasbihTotal(newCount);

    // Sync to backend every 10 counts
    if (isAuthenticated && newCount % 10 === 0) {
      try {
        await tasbihService.addSession({
          type: 'SubhanAllah',
          count: 10
        });
      } catch (err) {
        console.error('Failed to sync tasbih:', err);
      }
    }
  };

  // Reset counter and sync to backend
  const handleResetTasbeeh = async () => {
    const currentCount = log.tasbihCount || 0;

    // Sync remaining count to backend before reset
    if (isAuthenticated && currentCount > 0) {
      try {
        const remainingCount = currentCount % 10;
        if (remainingCount > 0) {
          await tasbihService.addSession({
            type: 'SubhanAllah',
            count: remainingCount
          });
        }
      } catch (err) {
        console.error('Failed to sync final tasbih count:', err);
      }
    }

    const updated = { ...log, tasbihCount: 0 };
    setLog(updated);
    storage.saveDailyLog(updated);
    setTasbihTotal(0);
  };

  // Prayer list for timeline
  const prayerList = prayerTimes ? [
    { name: 'Fajr', time: prayerTimes.fajr },
    { name: 'Dhuhr', time: prayerTimes.dhuhr },
    { name: 'Asr', time: prayerTimes.asr },
    { name: 'Maghrib', time: prayerTimes.maghrib },
    { name: 'Isha', time: prayerTimes.isha },
  ] : [];

  return (
    <div className={`min-h-screen transition-colors duration-1000 ease-in-out ${getTimeGradient()} pb-24 sm:pb-28 text-slate-800 overflow-y-auto`}>
      {/* Header */}
      <div className="pt-6 sm:pt-8 md:pt-10 px-4 sm:px-6 md:px-8 lg:px-12 flex justify-between items-start">
        <div>
          <h2 className="text-xs sm:text-sm font-medium tracking-wider uppercase text-slate-500">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </h2>
          {hijriDate && (
            <p className="text-[10px] sm:text-xs text-brand-600 mt-0.5">{hijriDate.formatted} H</p>
          )}
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif mt-1 text-slate-900">Salam, {user.name}</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Streak Badge */}
          {streak > 0 && (
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 sm:gap-2 shadow-sm text-amber-700">
              🔥 {streak} day streak
            </div>
          )}
          {/* Qibla Direction */}
          {qiblaDirection !== null && (
            <div className="bg-white/80 backdrop-blur border border-brand-100 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1 sm:gap-2 shadow-sm" title={`Qibla: ${qiblaDirection.toFixed(1)}° from North`}>
              <Icons.Compass size={12} className="text-brand-600" />
              <span className="text-slate-600">{qiblaDirection.toFixed(0)}°</span>
            </div>
          )}
          <div className="bg-white/80 backdrop-blur border border-brand-100 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1 sm:gap-2 shadow-sm">
            <Icons.MapPin size={12} className="text-brand-600" /> <span className="text-slate-600">{user.city?.split(',')[0] || 'Location'}</span>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-white/80 backdrop-blur border border-brand-100 flex items-center justify-center hover:bg-brand-50 transition-colors shadow-sm"
          >
            <Icons.Settings size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* No Location State */}
      {!loading && !prayerTimes && (!user.latitude || !user.longitude) && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mb-4">
            <Icons.MapPin size={32} className="text-brand-600" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-slate-800">Location Required</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm">
            We need your location to show accurate prayer times. Please update your location in settings.
          </p>
          <button
            onClick={() => navigate('/settings')}
            className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-500 transition-colors shadow-lg shadow-brand-200"
          >
            Update Location
          </button>
        </div>
      )}

      {!loading && prayerTimes && (
        <>
          {/* Main Content Grid - Responsive Layout */}
          <div className="lg:grid lg:grid-cols-3 lg:gap-8 lg:px-8 xl:px-12 lg:mt-6 px-4">

            {/* LEFT COLUMN: Countdown & Tasbeeh */}
            <div className="flex flex-col gap-6 lg:col-span-1 mt-6 sm:mt-8 mb-6 lg:mb-0">

              {/* Main Countdown Arc */}
              <div className="flex flex-col items-center justify-center relative">
                <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full border-4 border-brand-200 flex flex-col items-center justify-center relative bg-white shadow-xl shadow-brand-100">
                  <div className="absolute inset-0 rounded-full border border-brand-100 animate-pulse-slow"></div>
                  <span className="text-xs sm:text-sm uppercase tracking-widest text-brand-600 mb-1 sm:mb-2">
                    {nextPrayer?.name || 'Next'} in
                  </span>
                  <div className="text-4xl sm:text-5xl md:text-6xl font-bold font-sans tabular-nums tracking-tight text-slate-800">
                    {countdown.hours}:{countdown.minutes}
                    <span className="text-lg sm:text-2xl text-slate-400 ml-1">{countdown.seconds}</span>
                  </div>
                </div>
              </div>

              {/* Today's Progress Summary */}
              {/* {isAuthenticated && (
                <div className="bg-white p-4 rounded-2xl border border-brand-100 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Today's Progress</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-brand-600">{todayStats.prayersCompleted}</p>
                      <p className="text-[10px] text-slate-400">Prayers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-600">{todayStats.quranMinutes}</p>
                      <p className="text-[10px] text-slate-400">Quran min</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-600">{todayStats.hadithsRead}</p>
                      <p className="text-[10px] text-slate-400">Hadiths</p>
                    </div>
                  </div>
                </div>
              )} */}

              {/* Compact Tasbeeh Widget */}
              <div className="relative">
                <button
                  onClick={handleTasbeeh}
                  className="w-full bg-white p-4 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all relative overflow-hidden border border-brand-100 shadow-sm hover:shadow-md"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
                      <Icons.Activity size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Tasbeeh Counter</p>
                      <p className="text-2xl font-bold tabular-nums text-slate-800">{tasbihTotal}</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors text-brand-600 relative z-10">
                    <Icons.Plus size={20} />
                  </div>
                </button>
                {/* Reset button */}
                {tasbihTotal > 0 && (
                  <button
                    onClick={handleResetTasbeeh}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-red-100 hover:text-red-500 transition-colors z-20"
                    title="Reset counter"
                  >
                    <Icons.X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Greeting, Dua, Timeline */}
            <div className="flex flex-col gap-6 lg:col-span-2">

              {/* Greeting */}
              <div className="hidden lg:block animate-fade-in">
                <p className="text-brand-700 font-serif italic text-xl lg:text-2xl leading-relaxed">"{greeting}"</p>
              </div>

              {/* Dua Card */}
              <div className="glass-panel p-5 sm:p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-20"><Icons.Sparkles size={40} className="sm:w-12 sm:h-12" /></div>
                <p className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-brand-900 mb-1 sm:mb-2 opacity-70">
                  Recommended for {nextPrayer?.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <h3 className="text-brand-950 font-serif text-lg sm:text-xl font-medium mb-1">{contextDua.title}</h3>
                <p className="text-brand-800 text-sm italic opacity-90">"{contextDua.text}"</p>
              </div>

              {/* Prayer Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Today's Prayers</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                  {prayerList.map((t, idx) => {
                    const isNext = nextPrayer?.name === t.name;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedPrayer(t)}
                        className={`bg-white p-3 sm:p-4 rounded-xl flex items-center justify-between transition-all duration-300 cursor-pointer hover:shadow-md border ${isNext ? 'border-brand-300 bg-brand-50 relative overflow-hidden shadow-sm' : 'border-slate-100 hover:border-brand-200'}`}
                      >
                        {isNext && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500"></div>}
                        <div className="flex items-center gap-3 sm:gap-4 ml-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePrayer(t.name);
                            }}
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${log.prayers[t.name] ? 'bg-brand-500 text-white' : 'bg-brand-50 hover:bg-brand-100 text-brand-400'}`}
                          >
                            {log.prayers[t.name] ? <Icons.Check size={18} /> : <span className="text-xs">{t.name[0]}</span>}
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className={`text-sm sm:text-base font-semibold ${isNext ? 'text-slate-800' : 'text-slate-700'}`}>{t.name}</p>
                              {isNext && <span className="text-[10px] bg-brand-500 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Next</span>}
                            </div>
                            <p className="text-xs text-slate-400">{t.time}</p>
                          </div>
                        </div>
                        <Icons.ChevronRight size={14} className="text-slate-300" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Prayer Details Modal */}
      <PrayerModal
        prayer={selectedPrayer}
        onClose={() => setSelectedPrayer(null)}
        isPrayed={selectedPrayer ? !!log.prayers[selectedPrayer.name] : false}
        onTogglePrayed={() => {
          if (selectedPrayer) {
            togglePrayer(selectedPrayer.name);
          }
        }}
      />
    </div>
  );
};