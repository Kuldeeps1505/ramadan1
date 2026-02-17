import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from './ui/Icon';
import { quranService, hadithService, tasbihService, dailyLogService } from '../services/progressService';
import { useAuth } from '../src/context/AuthContext';

interface ActivityItem {
    id: string;
    type: 'quran' | 'hadith' | 'tasbih' | 'prayer' | 'fasting';
    title: string;
    subtitle?: string;
    timestamp: Date;
    icon: keyof typeof Icons;
    color: string;
}

export const History: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'quran' | 'hadith' | 'tasbih' | 'prayer'>('all');

    useEffect(() => {
        if (isAuthenticated) {
            loadActivities();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const loadActivities = async () => {
        setLoading(true);
        const allActivities: ActivityItem[] = [];

        try {
            // Load Quran activities
            const quranActivities = await quranService.getAllActivities(20);
            quranActivities.forEach((activity: any) => {
                allActivities.push({
                    id: `quran-${activity._id}`,
                    type: 'quran',
                    title: `Read ${activity.surahName || 'Quran'}`,
                    subtitle: activity.duration ? `${activity.duration} minutes` : undefined,
                    timestamp: new Date(activity.createdAt || activity.date),
                    icon: 'BookOpen',
                    color: 'brand'
                });
            });

            // Load Hadith activities
            const hadithActivities = await hadithService.getAllActivities(20);
            hadithActivities.forEach((activity: any) => {
                allActivities.push({
                    id: `hadith-${activity._id}`,
                    type: 'hadith',
                    title: `Read Hadith from ${activity.hadithCollection}`,
                    subtitle: activity.learned ? 'Marked as learned' : undefined,
                    timestamp: new Date(activity.createdAt || activity.date),
                    icon: 'BookText',
                    color: 'amber'
                });
            });

            // Load Tasbih sessions
            const tasbihSessions = await tasbihService.getAllSessions(20);
            tasbihSessions.forEach((session: any) => {
                allActivities.push({
                    id: `tasbih-${session._id}`,
                    type: 'tasbih',
                    title: `Tasbih: ${session.type}`,
                    subtitle: `${session.count} counts`,
                    timestamp: new Date(session.createdAt || session.date),
                    icon: 'Activity',
                    color: 'emerald'
                });
            });

            // Load recent daily logs for prayer activities
            const logs = await dailyLogService.getAll();
            logs.slice(0, 10).forEach((log: any) => {
                const prayersList = Object.entries(log.prayers || {})
                    .filter(([_, prayed]) => prayed)
                    .map(([name]) => name);

                if (prayersList.length > 0) {
                    allActivities.push({
                        id: `prayer-${log._id}`,
                        type: 'prayer',
                        title: `Prayers completed`,
                        subtitle: prayersList.join(', '),
                        timestamp: new Date(log.date),
                        icon: 'Check',
                        color: 'sky'
                    });
                }
            });

            // Sort by timestamp (newest first)
            allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            setActivities(allActivities);
        } catch (err) {
            console.error('Failed to load activities:', err);
        }

        setLoading(false);
    };

    const filteredActivities = filter === 'all'
        ? activities
        : activities.filter(a => a.type === filter);

    const formatTimestamp = (date: Date): string => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (hours === 0) {
                const minutes = Math.floor(diff / (1000 * 60));
                return minutes <= 1 ? 'Just now' : `${minutes} min ago`;
            }
            return `${hours}h ago`;
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return `${days} days ago`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    const getColorClasses = (color: string) => {
        switch (color) {
            case 'brand': return 'bg-brand-100 text-brand-600';
            case 'amber': return 'bg-amber-100 text-amber-600';
            case 'emerald': return 'bg-emerald-100 text-emerald-600';
            case 'sky': return 'bg-sky-100 text-sky-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const IconComponent = (iconName: keyof typeof Icons) => {
        const Icon = Icons[iconName];
        return Icon ? <Icon size={16} /> : null;
    };

    const filterButtons = [
        { key: 'all', label: 'All' },
        { key: 'prayer', label: 'Prayer' },
        { key: 'quran', label: 'Quran' },
        { key: 'hadith', label: 'Hadith' },
        { key: 'tasbih', label: 'Tasbih' }
    ] as const;

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
                    <h1 className="text-xl font-bold text-slate-800">Activity History</h1>
                    <button
                        onClick={loadActivities}
                        className="w-10 h-10 rounded-full bg-white/80 backdrop-blur border border-brand-100 flex items-center justify-center hover:bg-brand-50 transition-colors"
                    >
                        <Icons.RefreshCw size={16} className="text-slate-600" />
                    </button>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4">
                    {filterButtons.map(btn => (
                        <button
                            key={btn.key}
                            onClick={() => setFilter(btn.key)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === btn.key
                                    ? 'bg-brand-500 text-white'
                                    : 'bg-white text-slate-600 border border-brand-100 hover:bg-brand-50'
                                }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : !isAuthenticated ? (
                    <div className="text-center py-12">
                        <Icons.History size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500">Sign in to view your activity history</p>
                    </div>
                ) : filteredActivities.length === 0 ? (
                    <div className="text-center py-12">
                        <Icons.History size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500">No activities yet</p>
                        <p className="text-sm text-slate-400 mt-1">Start reading Quran or complete prayers to see your history</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredActivities.map(activity => (
                            <div
                                key={activity.id}
                                className="bg-white rounded-xl p-4 shadow-sm border border-brand-100 flex items-start gap-3"
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getColorClasses(activity.color)}`}>
                                    {IconComponent(activity.icon)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-800 truncate">{activity.title}</p>
                                    {activity.subtitle && (
                                        <p className="text-sm text-slate-500 truncate">{activity.subtitle}</p>
                                    )}
                                </div>
                                <span className="text-xs text-slate-400 whitespace-nowrap">
                                    {formatTimestamp(activity.timestamp)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Stats summary */}
                {isAuthenticated && filteredActivities.length > 0 && (
                    <div className="mt-6 bg-white rounded-2xl p-4 shadow-sm border border-brand-100">
                        <h3 className="font-semibold text-slate-800 mb-3">Summary</h3>
                        <div className="grid grid-cols-4 gap-3">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-brand-600">
                                    {activities.filter(a => a.type === 'prayer').length}
                                </p>
                                <p className="text-[10px] text-slate-400">Prayer Days</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-amber-600">
                                    {activities.filter(a => a.type === 'quran').length}
                                </p>
                                <p className="text-[10px] text-slate-400">Quran Sessions</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-sky-600">
                                    {activities.filter(a => a.type === 'hadith').length}
                                </p>
                                <p className="text-[10px] text-slate-400">Hadiths Read</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-emerald-600">
                                    {activities.filter(a => a.type === 'tasbih').length}
                                </p>
                                <p className="text-[10px] text-slate-400">Tasbih Sessions</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
