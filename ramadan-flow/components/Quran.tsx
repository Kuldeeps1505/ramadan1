import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from './ui/Icon';
import { storage } from '../services/storage';
import { GoalConfig, QuranProgress as QuranProgressType } from '../types';
import { fetchSurahs, fetchSurahDetails, fetchJuzSurahs, Surah, SurahDetail, Verse, JuzSurah, QURAN_EDITIONS, JUZ_DATA } from '../services/quranService';
import { quranService, progressService } from '../services/progressService';
import { useAuth } from '../src/context/AuthContext';

export const Quran: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated } = useAuth();
  const [goal, setGoal] = useState<GoalConfig>(storage.getGoals());
  const [mode, setMode] = useState<'setup' | 'dashboard' | 'reader'>((goal.completionDays && goal.completionDays > 0) ? 'dashboard' : 'setup');
  const [customDays, setCustomDays] = useState('');

  // Dynamic Data State
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [activeSurahDetail, setActiveSurahDetail] = useState<SurahDetail | null>(null);
  const [activeSurahNumber, setActiveSurahNumber] = useState<number | null>(null);
  const [activeVerse, setActiveVerse] = useState<Verse | null>(null);
  const [language, setLanguage] = useState<'en' | 'ta' | 'hi'>('en');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'surah' | 'juz'>('surah');
  const [activeJuz, setActiveJuz] = useState<number | null>(null);
  const [activeJuzSurahs, setActiveJuzSurahs] = useState<JuzSurah[]>([]);

  // Progress tracking state
  const [bookmarkedSurahs, setBookmarkedSurahs] = useState<number[]>([]);
  const [surahProgress, setSurahProgress] = useState<QuranProgressType[]>([]);
  const [currentPosition, setCurrentPosition] = useState<{ juz: number; surah: number; ayah: number }>({ juz: 1, surah: 1, ayah: 1 });
  const [readStartTime, setReadStartTime] = useState<Date | null>(null);

  // Fetch all surahs on mount
  useEffect(() => {
    const loadSurahs = async () => {
      const data = await fetchSurahs();
      if (data) setSurahs(data);
    };
    loadSurahs();
  }, []);

  // Load user progress from backend
  useEffect(() => {
    if (isAuthenticated) {
      loadUserProgress();
    }
  }, [isAuthenticated]);

  const loadUserProgress = async () => {
    try {
      // Load bookmarks
      const bookmarks = await quranService.getBookmarks();
      setBookmarkedSurahs(bookmarks.map(b => b.surahNumber));

      // Load overall progress 
      const progress = await progressService.get();
      if (progress?.quranProgress) {
        setCurrentPosition({
          juz: progress.quranProgress.currentJuz,
          surah: progress.quranProgress.currentSurah,
          ayah: progress.quranProgress.currentAyah
        });
        // Update goal from backend
        setGoal(prev => ({ ...prev, currentJuz: progress.quranProgress.currentJuz }));
      }

      // Load surah progress
      const allProgress = await quranService.getProgress();
      setSurahProgress(allProgress);
    } catch (err) {
      console.error('Failed to load user progress:', err);
    }
  };

  // Track previous language and initial fetch state
  const prevLanguageRef = useRef(language);
  const isInitialFetchRef = useRef(false);

  // Fetch surah details when opening reader or changing language
  const openSurah = async (number: number) => {
    console.log('[openSurah] Opening surah:', number, 'with language:', language, 'edition:', QURAN_EDITIONS[language]);
    setLoading(true);
    setMode('reader');
    isInitialFetchRef.current = true;
    setActiveSurahNumber(number);
    setActiveSurahDetail(null);
    setReadStartTime(new Date()); // Start tracking reading time
    const details = await fetchSurahDetails(number, QURAN_EDITIONS[language]);
    console.log('[openSurah] Fetched details:', details?.verses?.[0]?.translation?.substring(0, 50));
    if (details) {
      setActiveSurahDetail(details);
    }
    setLoading(false);
  };

  // Log reading activity when leaving reader
  const closeReader = async () => {
    if (activeSurahDetail && readStartTime && isAuthenticated) {
      const duration = Math.round((new Date().getTime() - readStartTime.getTime()) / 60000); // minutes
      try {
        await quranService.logActivity({
          surahNumber: activeSurahDetail.number,
          surahName: activeSurahDetail.englishName,
          duration: duration > 0 ? duration : 1
        });
        // Update position in backend
        await progressService.updateQuranPosition({
          currentSurah: activeSurahDetail.number
        });
      } catch (err) {
        console.error('Failed to log activity:', err);
      }
    }
    setReadStartTime(null);
    setMode('dashboard');
  };

  // Fetch Surahs in a Juz when clicking a Juz card
  const openJuz = async (juzNumber: number) => {
    setLoading(true);
    setActiveJuz(juzNumber);
    const juzSurahs = await fetchJuzSurahs(juzNumber);
    setActiveJuzSurahs(juzSurahs);
    setLoading(false);
  };

  // Reload current surah when language changes
  useEffect(() => {
    console.log('[useEffect] Language effect triggered. mode:', mode, 'activeSurahNumber:', activeSurahNumber, 'prevLang:', prevLanguageRef.current, 'newLang:', language, 'isInitialFetch:', isInitialFetchRef.current);

    if (isInitialFetchRef.current) {
      console.log('[useEffect] Skipping - initial fetch already done');
      isInitialFetchRef.current = false;
      prevLanguageRef.current = language;
      return;
    }

    if (mode === 'reader' && activeSurahNumber && prevLanguageRef.current !== language) {
      console.log('[useEffect] Language CHANGED! Reloading surah with edition:', QURAN_EDITIONS[language]);
      const reloadWithLanguage = async () => {
        setLoading(true);
        const details = await fetchSurahDetails(activeSurahNumber, QURAN_EDITIONS[language]);
        console.log('[useEffect] Fetched new translation:', details?.verses?.[0]?.translation?.substring(0, 50));
        if (details) {
          setActiveSurahDetail(details);
        }
        setLoading(false);
      };
      reloadWithLanguage();
    }
    prevLanguageRef.current = language;
  }, [language, activeSurahNumber, mode]);

  const handleSetGoal = (days: number) => {
    if (days < 1) return;
    const newGoal = { ...goal, completionDays: days, currentJuz: 1, quranTarget: parseFloat((30 / days).toFixed(2)) };
    storage.saveGoals(newGoal);
    setGoal(newGoal);
    setMode('dashboard');
  };

  const handleAskHafiz = () => {
    if (!activeVerse || !activeSurahDetail) return;
    navigate('/discover', {
      state: {
        askHafizQuery: `I am reading Surah ${activeSurahDetail.englishName}, Ayah ${activeVerse.numberInSurah} ("${activeVerse.translation}"). Can you explain the deeper meaning of this?`
      }
    });
  };

  // Toggle bookmark
  const handleToggleBookmark = async (surahNumber: number, surahName: string) => {
    if (!isAuthenticated) return;
    try {
      await quranService.toggleBookmark(surahNumber, surahName);
      if (bookmarkedSurahs.includes(surahNumber)) {
        setBookmarkedSurahs(prev => prev.filter(n => n !== surahNumber));
      } else {
        setBookmarkedSurahs(prev => [...prev, surahNumber]);
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  // Toggle mark as read
  const handleMarkAsRead = async (surahNumber: number, surahName: string) => {
    if (!isAuthenticated) return;

    // Optimistic update
    setSurahProgress(prev => {
      const existing = prev.find(p => p.surahNumber === surahNumber);
      if (existing) {
        return prev.map(p => p.surahNumber === surahNumber ? { ...p, completedReads: (p.completedReads || 0) + 1 } : p);
      }
      return [...prev, {
        surahNumber,
        surahName,
        totalAyahs: 0,
        lastReadAyah: 0,
        completedReads: 1,
        memorized: false,
        bookmarked: false
      }];
    });

    try {
      await quranService.markAsRead(surahNumber, surahName);
      // Refresh progress to ensure sync
      const freshProgress = await quranService.getProgress();
      setSurahProgress(freshProgress);
    } catch (err) {
      console.error('Failed to mark as read:', err);
      // Revert on failure (could be improved)
      loadUserProgress();
    }
  };

  const filteredSurahs = surahs.filter(s =>
    s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.includes(searchQuery) ||
    s.number.toString().includes(searchQuery)
  );

  // Get last read surah for resume
  const getLastReadSurah = () => {
    if (currentPosition.surah > 1) {
      const surah = surahs.find(s => s.number === currentPosition.surah);
      return surah || surahs[0];
    }
    return surahs[0] || { number: 1, englishName: 'Al-Fatiha', englishNameTranslation: 'The Opening' };
  };

  // ----------------------------------------------------------------------
  // VIEW: SETUP
  // ----------------------------------------------------------------------
  if (mode === 'setup') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50 to-white opacity-80"></div>

        <div className="relative z-10 w-full max-w-sm sm:max-w-md md:max-w-lg text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-brand-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-xl shadow-brand-200">
            <Icons.BookOpen size={32} className="text-white sm:w-10 sm:h-10 md:w-12 md:h-12" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-2 sm:mb-3 text-slate-800">Quran Journey</h1>
          <p className="text-slate-500 text-sm sm:text-base mb-8 sm:mb-10">Build a habit that lasts. Set a realistic goal for this Ramadan.</p>

          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <button onClick={() => handleSetGoal(30)} className="w-full bg-white hover:bg-brand-50 border border-brand-100 p-4 sm:p-5 rounded-xl sm:rounded-2xl flex items-center justify-between group transition-all shadow-sm">
              <div className="text-left">
                <p className="font-bold text-base sm:text-lg text-slate-800">30 Days</p>
                <p className="text-[10px] sm:text-xs text-slate-500">1 Juz per day (Standard)</p>
              </div>
              <Icons.ChevronRight className="text-slate-400 group-hover:text-brand-600 w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button onClick={() => handleSetGoal(15)} className="w-full bg-white hover:bg-brand-50 border border-brand-100 p-4 sm:p-5 rounded-xl sm:rounded-2xl flex items-center justify-between group transition-all shadow-sm">
              <div className="text-left">
                <p className="font-bold text-base sm:text-lg text-slate-800">15 Days</p>
                <p className="text-[10px] sm:text-xs text-slate-500">2 Juz per day (Intensive)</p>
              </div>
              <Icons.ChevronRight className="text-slate-400 group-hover:text-brand-600 w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="relative mb-4 sm:mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-[10px] sm:text-xs uppercase">
              <span className="bg-slate-50 px-2 text-slate-400 font-bold tracking-widest">Or Set Custom</span>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <input
              type="number"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              placeholder="Days (e.g. 45)"
              className="flex-1 bg-white border border-slate-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-800 placeholder:text-slate-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-center font-bold shadow-sm"
            />
            <button
              onClick={() => customDays && handleSetGoal(parseInt(customDays))}
              disabled={!customDays}
              className="bg-brand-600 text-white px-4 sm:px-6 rounded-lg sm:rounded-xl text-sm sm:text-base font-bold hover:bg-brand-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              Set
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: DASHBOARD
  // ----------------------------------------------------------------------
  if (mode === 'dashboard') {
    const lastRead = getLastReadSurah();
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 sm:pb-28">
        <div className="bg-emerald-800 text-white p-4 sm:p-6 md:p-8 pt-8 sm:pt-10 md:pt-12 rounded-b-2xl sm:rounded-b-3xl shadow-lg relative">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold">My Quran</h1>
                <p className="text-emerald-200 text-xs sm:text-sm">Target: Finish in {goal.completionDays} days</p>
              </div>
              <button onClick={() => setMode('setup')} className="bg-white/10 p-1.5 sm:p-2 rounded-lg text-emerald-100 hover:bg-white/20">
                <Icons.Settings size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Progress Card */}
            <div className="bg-white text-slate-900 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl shadow-xl shadow-black/10 flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5 sm:mb-1">Current Progress</p>
                <p className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-emerald-700">Juz {currentPosition.juz}<span className="text-base sm:text-lg md:text-xl text-slate-400 font-sans font-normal"> / 30</span></p>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full border-4 border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm sm:text-base">
                {Math.round((currentPosition.juz / 30) * 100)}%
              </div>
            </div>

            {/* Quick Resume */}
            <button onClick={() => openSurah(lastRead.number)} className="w-full bg-white/10 border border-white/20 p-3 rounded-lg flex items-center justify-between hover:bg-white/20 transition-all text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Icons.Play size={14} /></div>
                <div className="text-left">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-70">Resume Reading</p>
                  <p className="text-sm font-serif">{lastRead.englishName} ({lastRead.englishNameTranslation})</p>
                </div>
              </div>
              <Icons.ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
          {/* Bookmarks Section */}
          {bookmarkedSurahs.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-base sm:text-lg mb-3 text-slate-800 flex items-center gap-2">
                <Icons.Bookmark size={18} className="text-emerald-600" />
                Bookmarked Surahs
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {bookmarkedSurahs.map(num => {
                  const surah = surahs.find(s => s.number === num);
                  if (!surah) return null;
                  return (
                    <button
                      key={num}
                      onClick={() => openSurah(num)}
                      className="flex-shrink-0 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-emerald-700 font-medium text-sm hover:bg-emerald-100"
                    >
                      {surah.englishName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="sticky top-0 z-10 bg-slate-50 pt-2 pb-4">
            <div className="relative">
              <Icons.Search className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search Surah (e.g. Yasin, 36)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 pl-10 pr-4 py-3 rounded-xl shadow-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* View Toggle */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setViewMode('surah')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'surah'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300'
                  }`}
              >
                Surah (114)
              </button>
              <button
                onClick={() => setViewMode('juz')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'juz'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300'
                  }`}
              >
                Juz (30)
              </button>
            </div>
          </div>

          {viewMode === 'surah' && (
            <h3 className="font-bold text-base sm:text-lg md:text-xl mb-3 sm:mb-4 text-slate-800">All Surahs</h3>
          )}
          {viewMode === 'juz' && (
            <h3 className="font-bold text-base sm:text-lg md:text-xl mb-3 sm:mb-4 text-slate-800">Browse by Juz</h3>
          )}

          {/* Surah View */}
          {viewMode === 'surah' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredSurahs.map((surah) => {
                const progress = surahProgress.find(p => p.surahNumber === surah.number);
                const isRead = (progress?.completedReads || 0) > 0;

                return (
                  <button
                    key={surah.number}
                    onClick={() => openSurah(surah.number)}
                    className="bg-white border border-slate-100 p-4 rounded-xl flex items-center justify-between hover:border-emerald-300 hover:shadow-md transition-all group relative overflow-hidden"
                  >
                    {isRead && (
                      <div className="absolute top-0 right-0 bg-emerald-100/80 backdrop-blur-sm text-emerald-700 text-[9px] uppercase font-bold px-2 py-0.5 rounded-bl-lg">
                        Read
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center font-bold text-emerald-600 rotate-45 group-hover:bg-emerald-50 transition-colors">
                        <span className="-rotate-45">{surah.number}</span>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 group-hover:text-emerald-700">{surah.englishName}</h4>
                          {bookmarkedSurahs.includes(surah.number) && (
                            <Icons.Bookmark size={14} className="text-emerald-500 fill-emerald-500" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{surah.englishNameTranslation} • {surah.numberOfAyahs} Ayahs</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-serif text-xl text-slate-800">{surah.name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{surah.revelationType}</p>
                    </div>
                  </button>
                );
              })}
              {filteredSurahs.length === 0 && (
                <div className="col-span-full text-center py-10 text-slate-400">
                  <p>No surahs found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}

          {/* Juz View */}
          {viewMode === 'juz' && !activeJuz && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {JUZ_DATA.map((juz) => {
                const startSurah = surahs.find(s => s.number === juz.startSurah);
                const endSurah = surahs.find(s => s.number === juz.endSurah);
                return (
                  <button
                    key={juz.number}
                    onClick={() => openJuz(juz.number)}
                    className="bg-white border border-slate-100 p-4 rounded-xl hover:border-emerald-300 hover:shadow-md transition-all group text-center"
                  >
                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center font-bold text-emerald-600 mx-auto mb-2 group-hover:bg-emerald-100 transition-colors">
                      {juz.number}
                    </div>
                    <p className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 truncate">{juz.name}</p>
                    <p className="text-[10px] text-slate-400 mt-1 truncate">
                      {startSurah?.englishName || `Surah ${juz.startSurah}`}
                      {juz.startSurah !== juz.endSurah && ` - ${endSurah?.englishName || `S.${juz.endSurah}`}`}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Juz Surah List (Drill-down) */}
          {viewMode === 'juz' && activeJuz && (
            <div>
              <button
                onClick={() => { setActiveJuz(null); setActiveJuzSurahs([]); }}
                className="flex items-center gap-2 text-emerald-600 font-bold mb-4 hover:text-emerald-700"
              >
                <Icons.ChevronLeft size={20} />
                Back to Juz List
              </button>

              <h4 className="font-bold text-lg mb-3 text-slate-800">
                Juz {activeJuz} - {JUZ_DATA.find(j => j.number === activeJuz)?.name || ''}
              </h4>

              {loading ? (
                <div className="text-center py-10 text-slate-400">
                  <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  Loading Surahs...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeJuzSurahs.map((surah) => (
                    <button
                      key={surah.number}
                      onClick={() => openSurah(surah.number)}
                      className="bg-white border border-slate-100 p-4 rounded-xl flex items-center justify-between hover:border-emerald-300 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center font-bold text-emerald-600 rotate-45 group-hover:bg-emerald-50 transition-colors">
                          <span className="-rotate-45">{surah.number}</span>
                        </div>
                        <div className="text-left">
                          <h4 className="font-bold text-slate-900 group-hover:text-emerald-700">{surah.englishName}</h4>
                          <p className="text-xs text-slate-500">{surah.englishNameTranslation} • {surah.numberOfAyahs} Ayahs</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-serif text-xl text-slate-800">{surah.name}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{surah.revelationType}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: READER
  // ----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#fffdf5] text-slate-900 flex flex-col">
      {/* Reader Header */}
      <div className="sticky top-0 z-20 bg-[#fffdf5]/95 backdrop-blur border-b border-stone-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <button onClick={closeReader} className="text-stone-500 p-2 hover:bg-stone-100 rounded-full">
          <Icons.ArrowRight className="rotate-180" />
        </button>

        {activeSurahDetail ? (
          <div className="text-center">
            <h2 className="font-serif font-bold text-lg text-stone-800">{activeSurahDetail.englishName}</h2>
            <p className="text-xs text-stone-500">{activeSurahDetail.englishNameTranslation} • {activeSurahDetail.numberOfAyahs} Ayahs</p>
          </div>
        ) : (
          <div className="h-10 w-32 bg-stone-200 animate-pulse rounded"></div>
        )}

        <div className="flex items-center gap-2">
          {/* Mark Read Button */}
          {activeSurahDetail && isAuthenticated && (
            <button
              onClick={() => handleMarkAsRead(activeSurahDetail.number, activeSurahDetail.englishName)}
              className={`p-2 rounded-full transition-colors ${surahProgress.find(p => p.surahNumber === activeSurahDetail.number && (p.completedReads || 0) > 0)
                ? 'bg-emerald-100 text-emerald-600'
                : 'text-stone-400 hover:bg-stone-100'
                }`}
              title="Mark as Read"
            >
              <Icons.CheckCircle size={18} className={
                surahProgress.find(p => p.surahNumber === activeSurahDetail?.number && (p.completedReads || 0) > 0)
                  ? 'fill-current'
                  : ''
              } />
            </button>
          )}

          {/* Bookmark Button */}
          {activeSurahDetail && isAuthenticated && (
            <button
              onClick={() => handleToggleBookmark(activeSurahDetail.number, activeSurahDetail.englishName)}
              className={`p-2 rounded-full transition-colors ${bookmarkedSurahs.includes(activeSurahDetail.number)
                ? 'bg-emerald-100 text-emerald-600'
                : 'text-stone-400 hover:bg-stone-100'
                }`}
            >
              <Icons.Bookmark size={18} className={bookmarkedSurahs.includes(activeSurahDetail?.number || 0) ? 'fill-current' : ''} />
            </button>
          )}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="bg-stone-100 border-none text-xs font-bold rounded-lg px-2 py-1.5 outline-none cursor-pointer"
          >
            <option value="en">ENG</option>
            <option value="ta">TAM</option>
            <option value="hi">HIN</option>
          </select>
        </div>
      </div>

      {/* Text Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-32">
        <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-stone-400 text-sm animate-pulse">Loading Surah...</p>
            </div>
          ) : activeSurahDetail ? (
            <>
              {/* Bismillah (except for Surah 1 & 9) */}
              {activeSurahDetail.number !== 1 && activeSurahDetail.number !== 9 && (
                <div className="text-center mb-8 opacity-60">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/27/Basmala.svg" className="h-10 sm:h-12 mx-auto" alt="Bismillah" />
                </div>
              )}

              {activeSurahDetail.verses.map((ayah) => (
                <div
                  key={ayah.number}
                  onClick={() => setActiveVerse(ayah)}
                  className={`relative p-4 sm:p-5 rounded-2xl transition-all cursor-pointer border border-transparent ${activeVerse?.number === ayah.number ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'hover:bg-stone-50 hover:border-stone-100'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-xs font-serif text-stone-500 font-bold">{ayah.numberInSurah}</span>
                    <button className="text-stone-300 hover:text-emerald-500"><Icons.Share2 size={16} /></button>
                  </div>

                  {/* Arabic Text */}
                  <p className="text-right font-serif text-2xl sm:text-3xl md:text-4xl leading-[2.2] text-stone-800 mb-6" dir="rtl">
                    {ayah.text}
                  </p>

                  {/* Translation */}
                  <p className={`text-sm sm:text-base leading-relaxed text-stone-600 ${language === 'ta' || language === 'hi' ? 'font-sans' : 'font-sans'}`}>
                    {ayah.translation}
                  </p>
                </div>
              ))}
            </>
          ) : null}
        </div>
      </div>

      {/* Bottom Sheet / Insight Panel */}
      {activeVerse && activeSurahDetail && (
        <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
          {/* Close Area */}
          <div className="absolute inset-0 top-[-100vh]" onClick={() => setActiveVerse(null)} />

          <div className="bg-white rounded-t-3xl shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.1)] border-t border-stone-100 p-5 sm:p-6 animate-slide-up pointer-events-auto max-h-[60vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-emerald-800 text-lg">Surah {activeSurahDetail.englishName}</h3>
                <p className="text-xs text-stone-500">Ayah {activeVerse.numberInSurah}</p>
              </div>
              <button onClick={() => setActiveVerse(null)} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200"><Icons.X size={16} /></button>
            </div>

            <div className="space-y-4">
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                <p className="text-stone-800 font-medium leading-relaxed italic">"{activeVerse.translation}"</p>
              </div>

              <button
                onClick={handleAskHafiz}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 hover:translate-y-[-2px] transition-all"
              >
                <Icons.Sparkles size={18} />
                Ask Hafiz about this Ayah
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};