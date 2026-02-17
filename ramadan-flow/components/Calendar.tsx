import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from './ui/Icon';
import { dailyLogService, calendarService } from '../services/progressService';
import { useAuth } from '../src/context/AuthContext';

interface CalendarDay {
    date: string;
    isCurrentMonth: boolean;
    isToday: boolean;
    data?: {
        prayersCompleted: number;
        quranMinutes: number;
        tasbihTotal: number;
        fastingStatus?: string;
    };
}

export const Calendar: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedDayData, setSelectedDayData] = useState<any>(null);

    // Generate calendar grid for current month
    const generateCalendarDays = (date: Date): CalendarDay[] => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startPadding = firstDay.getDay();
        const endPadding = 6 - lastDay.getDay();

        const days: CalendarDay[] = [];
        const today = new Date().toISOString().split('T')[0];

        // Previous month padding
        for (let i = startPadding - 1; i >= 0; i--) {
            const d = new Date(year, month, -i);
            days.push({
                date: d.toISOString().split('T')[0],
                isCurrentMonth: false,
                isToday: false
            });
        }

        // Current month days
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const d = new Date(year, month, i);
            const dateStr = d.toISOString().split('T')[0];
            days.push({
                date: dateStr,
                isCurrentMonth: true,
                isToday: dateStr === today
            });
        }

        // Next month padding
        for (let i = 1; i <= endPadding; i++) {
            const d = new Date(year, month + 1, i);
            days.push({
                date: d.toISOString().split('T')[0],
                isCurrentMonth: false,
                isToday: false
            });
        }

        return days;
    };

    // Load calendar data for the month
    useEffect(() => {
        const loadCalendarData = async () => {
            if (!isAuthenticated) {
                setLoading(false);
                return;
            }

            setLoading(true);
            const days = generateCalendarDays(currentMonth);

            try {
                const startDate = days[0].date;
                const endDate = days[days.length - 1].date;
                const rangeData = await calendarService.getRange(startDate, endDate);

                // Merge data with calendar days
                const daysWithData = days.map(day => ({
                    ...day,
                    data: rangeData[day.date] ? {
                        prayersCompleted: rangeData[day.date].prayersCompleted || 0,
                        quranMinutes: rangeData[day.date].quranMinutes || 0,
                        tasbihTotal: rangeData[day.date].tasbihTotal || 0,
                        fastingStatus: rangeData[day.date].fastingStatus
                    } : undefined
                }));

                setCalendarDays(daysWithData);
            } catch (err) {
                console.error('Failed to load calendar data:', err);
                setCalendarDays(days);
            }

            setLoading(false);
        };

        loadCalendarData();
    }, [currentMonth, isAuthenticated]);

    const goToPreviousMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const handleDateClick = async (day: CalendarDay) => {
        if (!day.isCurrentMonth) return;
        setSelectedDate(day.date);

        if (isAuthenticated) {
            try {
                const dayData = await dailyLogService.getByDate(day.date);
                setSelectedDayData(dayData);
            } catch (err) {
                console.error('Failed to load day data:', err);
            }
        }
    };

    const getCompletionLevel = (day: CalendarDay): number => {
        if (!day.data) return 0;
        const { prayersCompleted, quranMinutes, tasbihTotal } = day.data;
        let score = 0;
        if (prayersCompleted >= 5) score += 2;
        else if (prayersCompleted >= 3) score += 1;
        if (quranMinutes >= 15) score += 1;
        if (tasbihTotal >= 33) score += 1;
        return Math.min(score, 4);
    };

    const getCompletionColor = (level: number): string => {
        switch (level) {
            case 0: return 'bg-slate-100';
            case 1: return 'bg-brand-100';
            case 2: return 'bg-brand-200';
            case 3: return 'bg-brand-300';
            case 4: return 'bg-brand-500';
            default: return 'bg-slate-100';
        }
    };

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-brand-50 to-white pb-24 text-slate-800">
            {/* Header */}
            <div className="pt-6 px-4 sm:px-6 md:px-8">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate('/')}
                        className="w-10 h-10 rounded-full bg-white/80 backdrop-blur border border-brand-100 flex items-center justify-center hover:bg-brand-50 transition-colors"
                    >
                        <Icons.ChevronLeft size={20} className="text-slate-600" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-800">Calendar</h1>
                    <div className="w-10"></div>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4 bg-white rounded-xl p-4 shadow-sm border border-brand-100">
                    <button
                        onClick={goToPreviousMonth}
                        className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center hover:bg-brand-100 transition-colors"
                    >
                        <Icons.ChevronLeft size={16} className="text-brand-600" />
                    </button>
                    <h2 className="text-lg font-semibold text-slate-800">
                        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button
                        onClick={goToNextMonth}
                        className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center hover:bg-brand-100 transition-colors"
                    >
                        <Icons.ChevronRight size={16} className="text-brand-600" />
                    </button>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-2 mb-4 text-xs text-slate-500">
                    <span>Less</span>
                    <div className="w-3 h-3 rounded bg-slate-100"></div>
                    <div className="w-3 h-3 rounded bg-brand-100"></div>
                    <div className="w-3 h-3 rounded bg-brand-200"></div>
                    <div className="w-3 h-3 rounded bg-brand-300"></div>
                    <div className="w-3 h-3 rounded bg-brand-500"></div>
                    <span>More</span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {/* Week days header */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {weekDays.map(day => (
                                <div key={day} className="text-center text-xs font-medium text-slate-400 py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((day, idx) => {
                                const level = getCompletionLevel(day);
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleDateClick(day)}
                                        className={`
                      aspect-square rounded-lg flex flex-col items-center justify-center
                      ${day.isCurrentMonth ? 'text-slate-700' : 'text-slate-300'}
                      ${day.isToday ? 'ring-2 ring-brand-500' : ''}
                      ${selectedDate === day.date ? 'ring-2 ring-amber-500' : ''}
                      ${day.isCurrentMonth ? getCompletionColor(level) : 'bg-slate-50'}
                      transition-all hover:scale-105
                    `}
                                    >
                                        <span className={`text-sm ${day.isToday ? 'font-bold' : ''}`}>
                                            {new Date(day.date).getDate()}
                                        </span>
                                        {day.data && day.data.prayersCompleted > 0 && (
                                            <div className="flex gap-0.5 mt-0.5">
                                                {[...Array(Math.min(day.data.prayersCompleted, 5))].map((_, i) => (
                                                    <div key={i} className="w-1 h-1 rounded-full bg-brand-600"></div>
                                                ))}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Selected Day Details */}
                {selectedDate && selectedDayData && (
                    <div className="mt-6 bg-white rounded-2xl p-4 shadow-sm border border-brand-100">
                        <h3 className="font-semibold text-slate-800 mb-3">
                            {new Date(selectedDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </h3>

                        <div className="space-y-3">
                            {/* Prayers */}
                            <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                <span className="text-sm text-slate-600">Prayers</span>
                                <div className="flex gap-1">
                                    {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(prayer => (
                                        <div
                                            key={prayer}
                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${selectedDayData.prayers?.[prayer]
                                                    ? 'bg-brand-500 text-white'
                                                    : 'bg-slate-100 text-slate-400'
                                                }`}
                                            title={prayer}
                                        >
                                            {prayer[0]}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quran */}
                            <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                <span className="text-sm text-slate-600">Quran Reading</span>
                                <span className="text-sm font-medium text-brand-600">
                                    {selectedDayData.quranMinutes || 0} min
                                </span>
                            </div>

                            {/* Tasbih */}
                            <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                <span className="text-sm text-slate-600">Tasbih Count</span>
                                <span className="text-sm font-medium text-brand-600">
                                    {selectedDayData.tasbihCount || 0}
                                </span>
                            </div>

                            {/* Fasting */}
                            {selectedDayData.fastingStatus && (
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-sm text-slate-600">Fasting</span>
                                    <span className={`text-sm font-medium ${selectedDayData.fastingStatus === 'completed'
                                            ? 'text-emerald-600'
                                            : 'text-amber-600'
                                        }`}>
                                        {selectedDayData.fastingStatus}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!isAuthenticated && (
                    <div className="text-center py-12">
                        <Icons.Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500">Sign in to track your progress</p>
                    </div>
                )}
            </div>
        </div>
    );
};
