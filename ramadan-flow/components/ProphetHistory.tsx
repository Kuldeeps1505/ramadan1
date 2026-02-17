import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from './ui/Icon';
import { fetchSeerahTimeline, SeerahEvent, SEERAH_CATEGORIES } from '../services/prophetService';

export const ProphetHistory: React.FC = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState<SeerahEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [expandedEvent, setExpandedEvent] = useState<number | null>(null);

    useEffect(() => {
        loadTimeline();
    }, []);

    const loadTimeline = async () => {
        setLoading(true);
        const data = await fetchSeerahTimeline();
        setEvents(data);
        setLoading(false);
    };

    const filteredEvents = activeCategory
        ? events.filter(e => e.category === activeCategory)
        : events;

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'early_life': return 'bg-blue-500';
            case 'prophethood': return 'bg-purple-500';
            case 'medina': return 'bg-emerald-500';
            case 'legacy': return 'bg-amber-500';
            default: return 'bg-slate-500';
        }
    };

    const getCategoryBgColor = (category: string) => {
        switch (category) {
            case 'early_life': return 'bg-blue-50 border-blue-200 text-blue-700';
            case 'prophethood': return 'bg-purple-50 border-purple-200 text-purple-700';
            case 'medina': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
            case 'legacy': return 'bg-amber-50 border-amber-200 text-amber-700';
            default: return 'bg-slate-50 border-slate-200 text-slate-700';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 sm:pb-28">
            {/* Header */}
            <div className="bg-gradient-to-br from-brand-600 to-brand-800 text-white p-4 sm:p-6 md:p-8 pt-8 sm:pt-10 md:pt-12 rounded-b-2xl sm:rounded-b-3xl relative overflow-hidden">
                <Icons.Moon className="absolute -right-8 sm:-right-10 -top-8 sm:-top-10 text-white/5 w-36 h-36 sm:w-48 sm:h-48 md:w-60 md:h-60" />
                <div className="max-w-4xl mx-auto relative z-10">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold mb-1 sm:mb-2">The Prophet's Life</h1>
                    <p className="text-brand-100 text-xs sm:text-sm">A journey through time with Muhammad ﷺ</p>
                </div>
            </div>

            <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
                {/* Category Filter */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
                    <button
                        onClick={() => setActiveCategory(null)}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeCategory === null
                            ? 'bg-brand-600 text-white shadow-md'
                            : 'bg-white border border-brand-200 text-brand-700 hover:bg-brand-50'
                            }`}
                    >
                        All Events
                    </button>
                    {SEERAH_CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat.id
                                ? 'bg-brand-600 text-white shadow-md'
                                : 'bg-white border border-brand-200 text-brand-700 hover:bg-brand-50'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-400">Loading timeline...</p>
                    </div>
                ) : (
                    /* Timeline */
                    <div className="relative">
                        {/* Timeline Line */}
                        <div className="absolute left-[15px] sm:left-[19px] top-0 bottom-0 w-0.5 bg-brand-200"></div>

                        <div className="space-y-4">
                            {filteredEvents.map((event, index) => (
                                <div key={event.id} className="relative pl-12">
                                    {/* Timeline Dot */}
                                    <div className={`absolute left-0 top-5 w-9 h-9 rounded-full ${getCategoryColor(event.category)} flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
                                        {index + 1}
                                    </div>

                                    {/* Event Card */}
                                    <div
                                        onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                                        className={`bg-white rounded-xl border shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md ${expandedEvent === event.id ? 'ring-2 ring-indigo-300' : 'border-slate-100'
                                            }`}
                                    >
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 border ${getCategoryBgColor(event.category)}`}>
                                                        {SEERAH_CATEGORIES.find(c => c.id === event.category)?.name}
                                                    </span>
                                                    <h3 className="font-bold text-slate-800 text-sm sm:text-base">{event.title}</h3>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <p className="text-xs font-bold text-slate-600">{event.year_gregorian}</p>
                                                    {event.year_hijri && (
                                                        <p className="text-[10px] text-slate-400">{event.year_hijri}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {event.location && (
                                                <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                                                    <Icons.MapPin size={12} />
                                                    {event.location}
                                                </div>
                                            )}

                                            {/* Expanded Content */}
                                            <div className={`overflow-hidden transition-all duration-300 ${expandedEvent === event.id ? 'max-h-96 mt-3 pt-3 border-t border-slate-100' : 'max-h-0'
                                                }`}>
                                                <p className="text-slate-600 text-sm leading-relaxed">
                                                    {event.description}
                                                </p>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate('/discover', {
                                                            state: {
                                                                askHafizQuery: `Tell me more about "${event.title}" in the life of Prophet Muhammad ﷺ`
                                                            }
                                                        });
                                                    }}
                                                    className="mt-4 flex items-center gap-2 text-indigo-600 text-sm font-bold hover:text-indigo-700"
                                                >
                                                    <Icons.Sparkles size={16} />
                                                    Learn more about this event
                                                </button>
                                            </div>

                                            {/* Expand Indicator */}
                                            <div className="flex justify-center mt-2">
                                                <Icons.ChevronRight
                                                    size={16}
                                                    className={`text-slate-300 transition-transform ${expandedEvent === event.id ? 'rotate-90' : ''
                                                        }`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredEvents.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        <Icons.Calendar size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No events found for this category.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
