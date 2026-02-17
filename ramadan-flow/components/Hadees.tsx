import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from './ui/Icon';
import { loadCollectionData, HADITH_COLLECTIONS } from '../services/hadithService';
import { hadithService } from '../services/progressService';
import { useAuth } from '../src/context/AuthContext';

export const Hadees: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [activeCollection, setActiveCollection] = useState<'bukhari' | 'muslim'>('bukhari');
    const [hadiths, setHadiths] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedHadith, setExpandedHadith] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const itemsPerPage = 20;

    // Track favorites and learned status
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [learnedHadiths, setLearnedHadiths] = useState<Set<string>>(new Set());

    // Load hadiths when collection changes
    useEffect(() => {
        loadHadiths();
        setPage(1);
        setExpandedHadith(null);
    }, [activeCollection]);

    // Load user's favorites
    useEffect(() => {
        if (isAuthenticated) {
            loadFavorites();
        }
    }, [isAuthenticated]);

    const loadFavorites = async () => {
        try {
            const favs = await hadithService.getFavorites();
            const favKeys = new Set(favs.map(f => `${f.hadithCollection}-${f.hadithNumber}`));
            setFavorites(favKeys);
            const learnedKeys = new Set(favs.filter(f => f.learned).map(f => `${f.hadithCollection}-${f.hadithNumber}`));
            setLearnedHadiths(learnedKeys);
        } catch (err) {
            console.error('Failed to load favorites:', err);
        }
    };

    const loadHadiths = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await loadCollectionData(activeCollection);
            setHadiths(data);

            if (data.length === 0) {
                setError('No hadiths found. Please try again later.');
            }
        } catch (err) {
            console.error('Failed to load hadiths:', err);
            setError('Failed to load hadiths. Please try again.');
        }
        setLoading(false);
    };

    // Log hadith as read when expanded
    const handleExpandHadith = async (displayNum: number, hadith: any) => {
        const isExpanding = expandedHadith !== displayNum;
        setExpandedHadith(isExpanding ? displayNum : null);

        if (isExpanding && isAuthenticated) {
            try {
                const hadithText = hadith.text || hadith.hadithEnglish || '';
                await hadithService.logActivity({
                    hadithCollection: activeCollection,
                    hadithNumber: hadith.hadithnumber || hadith.originalNumber || displayNum,
                    hadithText: hadithText.substring(0, 500)
                });
            } catch (err) {
                console.error('Failed to log hadith activity:', err);
            }
        }
    };

    // Toggle favorite
    const handleToggleFavorite = async (hadith: any, displayNum: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAuthenticated) return;

        const hadithNumber = hadith.hadithnumber || hadith.originalNumber || displayNum;
        const key = `${activeCollection}-${hadithNumber}`;
        const hadithText = hadith.text || hadith.hadithEnglish || '';

        try {
            await hadithService.toggleFavorite(activeCollection, hadithNumber, hadithText.substring(0, 500));
            if (favorites.has(key)) {
                setFavorites(prev => { const next = new Set(prev); next.delete(key); return next; });
            } else {
                setFavorites(prev => new Set(prev).add(key));
            }
        } catch (err) {
            console.error('Failed to toggle favorite:', err);
        }
    };

    // Toggle learned
    const handleToggleLearned = async (hadith: any, displayNum: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAuthenticated) return;

        const hadithNumber = hadith.hadithnumber || hadith.originalNumber || displayNum;
        const key = `${activeCollection}-${hadithNumber}`;

        try {
            await hadithService.toggleLearned(activeCollection, hadithNumber);
            if (learnedHadiths.has(key)) {
                setLearnedHadiths(prev => { const next = new Set(prev); next.delete(key); return next; });
            } else {
                setLearnedHadiths(prev => new Set(prev).add(key));
            }
        } catch (err) {
            console.error('Failed to toggle learned:', err);
        }
    };

    const shareHadith = async (hadith: any) => {
        const hadithText = hadith.text || hadith.hadithEnglish || '';
        const shareText = `${hadith.reference?.book ? `Book ${hadith.reference.book}, Hadith ${hadith.reference.hadith}` : `Hadith ${hadith.hadithnumber || hadith.displayNumber}`}\n\n"${hadithText}"\n\n- ${HADITH_COLLECTIONS.find(c => c.slug === activeCollection)?.name}`;

        if (navigator.share) {
            await navigator.share({ text: shareText });
        } else {
            await navigator.clipboard.writeText(shareText);
            alert('Hadith copied to clipboard!');
        }
    };

    // Filter hadiths based on search
    const filteredHadiths = hadiths.filter(h => {
        const hadithText = h.text || h.hadithEnglish || '';
        if (!hadithText || hadithText.trim().length < 10) return false;

        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            hadithText.toLowerCase().includes(query) ||
            String(h.hadithnumber || h.displayNumber).includes(query) ||
            h.reference?.book?.toString().includes(query)
        );
    });

    // Paginate
    const totalPages = Math.ceil(filteredHadiths.length / itemsPerPage);
    const paginatedHadiths = filteredHadiths.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 sm:pb-28">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-brand-600 to-brand-800 text-white pt-12 pb-6 px-4 sm:px-6 rounded-b-3xl">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="w-full h-full" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
                </div>
                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="flex justify-between items-start mb-4 sm:mb-6">
                        <div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold flex items-center gap-2">
                                <Icons.BookOpen size={24} className="text-brand-300" />
                                hadith
                            </h1>
                            <p className="text-brand-200 text-xs sm:text-sm">Sayings of Prophet Muhammad ﷺ</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold">{filteredHadiths.length}</p>
                            <p className="text-xs text-brand-200">Hadiths</p>
                        </div>
                    </div>

                    {/* Collection Tabs */}
                    <div className="flex gap-2 relative z-10">
                        {HADITH_COLLECTIONS.map((collection) => (
                            <button
                                key={collection.slug}
                                onClick={() => setActiveCollection(collection.slug as 'bukhari' | 'muslim')}
                                className={`flex-1 py-2.5 sm:py-3 rounded-xl text-sm font-bold transition-all ${activeCollection === collection.slug
                                    ? 'bg-white text-brand-700 shadow-lg'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                {collection.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
                {/* Search Bar */}
                <div className="sticky top-0 z-10 bg-slate-50 pb-4 pt-2">
                    <div className="relative">
                        <Icons.Search className="absolute left-3 top-3 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search hadiths by text or number..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                            className="w-full bg-white border border-slate-200 pl-10 pr-4 py-3 rounded-xl shadow-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                    {searchQuery && (
                        <p className="text-sm text-slate-500 mt-2">
                            Found {filteredHadiths.length} hadiths matching "{searchQuery}"
                        </p>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center justify-between">
                        <span>{error}</span>
                        <button onClick={loadHadiths} className="text-red-600 font-bold">Retry</button>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-400">Loading hadiths...</p>
                    </div>
                ) : (
                    <>
                        {/* Hadith List */}
                        <div className="space-y-3">
                            {paginatedHadiths.map((hadith, index) => {
                                const hadithText = hadith.text || hadith.hadithEnglish || '';
                                const displayNum = ((page - 1) * itemsPerPage) + index + 1;
                                const originalRef = hadith.hadithnumber || hadith.originalNumber;
                                const hadithNumber = hadith.hadithnumber || hadith.originalNumber || displayNum;
                                const key = `${activeCollection}-${hadithNumber}`;
                                const isFavorite = favorites.has(key);
                                const isLearned = learnedHadiths.has(key);

                                return (
                                    <div
                                        key={`hadith-${displayNum}`}
                                        className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${expandedHadith === displayNum ? 'ring-2 ring-brand-300' : 'border-slate-100'
                                            }`}
                                    >
                                        <div
                                            onClick={() => handleExpandHadith(displayNum, hadith)}
                                            className="p-4 cursor-pointer"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isLearned ? 'bg-emerald-100 text-emerald-600' : 'bg-brand-100 text-brand-600'}`}>
                                                        {isLearned ? <Icons.Check size={14} /> : displayNum}
                                                    </span>
                                                    <div>
                                                        <p className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                                                            {hadith.reference?.book ? `Book ${hadith.reference.book}` : HADITH_COLLECTIONS.find(c => c.slug === activeCollection)?.name}
                                                        </p>
                                                        {originalRef && (
                                                            <p className="text-xs text-slate-500">Ref #{originalRef}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isAuthenticated && (
                                                        <button
                                                            onClick={(e) => handleToggleFavorite(hadith, displayNum, e)}
                                                            className={`p-1 rounded transition-colors ${isFavorite ? 'text-red-500' : 'text-slate-300 hover:text-red-400'}`}
                                                        >
                                                            <Icons.Heart size={16} className={isFavorite ? 'fill-current' : ''} />
                                                        </button>
                                                    )}
                                                    <Icons.ChevronRight
                                                        size={16}
                                                        className={`text-slate-300 transition-transform ${expandedHadith === displayNum ? 'rotate-90' : ''
                                                            }`}
                                                    />
                                                </div>
                                            </div>

                                            {/* Preview Text (truncated) */}
                                            <p className={`text-slate-700 text-sm leading-relaxed ${expandedHadith === displayNum ? '' : 'line-clamp-2'
                                                }`}>
                                                {hadithText}
                                            </p>

                                            {/* Expanded Actions */}
                                            {expandedHadith === displayNum && (
                                                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); shareHadith(hadith); }}
                                                        className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200"
                                                    >
                                                        <Icons.Share2 size={14} />
                                                        Share
                                                    </button>
                                                    {isAuthenticated && (
                                                        <button
                                                            onClick={(e) => handleToggleLearned(hadith, displayNum, e)}
                                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isLearned ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                                        >
                                                            <Icons.Check size={14} />
                                                            {isLearned ? 'Learned' : 'Mark Learned'}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate('/discover', {
                                                                state: {
                                                                    askHafizQuery: `Explain this hadith: "${hadithText.substring(0, 150)}..."`
                                                                }
                                                            });
                                                        }}
                                                        className="flex items-center gap-2 px-3 py-2 bg-teal-50 text-teal-600 rounded-lg text-sm hover:bg-teal-100"
                                                    >
                                                        <Icons.Sparkles size={14} />
                                                        Explain
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Empty State */}
                        {!loading && paginatedHadiths.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
                                <Icons.BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                                <p>No hadiths found.</p>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50"
                                >
                                    <Icons.ChevronLeft size={20} />
                                </button>

                                <div className="flex items-center gap-1">
                                    {page > 2 && (
                                        <>
                                            <button onClick={() => setPage(1)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-sm">1</button>
                                            {page > 3 && <span className="text-slate-400">...</span>}
                                        </>
                                    )}

                                    {[page - 1, page, page + 1].filter(p => p >= 1 && p <= totalPages).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={`w-8 h-8 rounded-lg text-sm font-bold ${p === page
                                                ? 'bg-brand-600 text-white'
                                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}

                                    {page < totalPages - 1 && (
                                        <>
                                            {page < totalPages - 2 && <span className="text-slate-400">...</span>}
                                            <button onClick={() => setPage(totalPages)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-sm">{totalPages}</button>
                                        </>
                                    )}
                                </div>

                                <button
                                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                                    disabled={page === totalPages}
                                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50"
                                >
                                    <Icons.ChevronRight size={20} />
                                </button>
                            </div>
                        )}

                        {/* Page Info */}
                        {totalPages > 1 && (
                            <p className="text-center text-sm text-slate-400 mt-3">
                                Page {page} of {totalPages} • Showing {paginatedHadiths.length} of {filteredHadiths.length} hadiths
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
