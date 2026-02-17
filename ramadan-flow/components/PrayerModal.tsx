import React from 'react';
import { Icons } from './ui/Icon';

export interface PrayerInfo {
    name: string;
    arabicName: string;
    rakats: {
        fard: number;
        sunnah: number;
        sunnahBefore?: number;
        sunnahAfter?: number;
    };
    meaning: string;
    significance: string;
    specialNotes: string[];
    bestPractices: string[];
}

export const PRAYER_DETAILS: Record<string, PrayerInfo> = {
    Fajr: {
        name: 'Fajr',
        arabicName: 'الفجر',
        rakats: { fard: 2, sunnah: 2, sunnahBefore: 2 },
        meaning: 'Dawn Prayer',
        significance: 'The Fajr prayer marks the beginning of the day and is one of the most virtuous prayers. The Prophet ﷺ said: "Whoever prays Fajr is under the protection of Allah."',
        specialNotes: [
            'Praying Fajr in congregation earns reward of praying half the night',
            'The two rakats before Fajr are better than the world and all it contains',
            'Angels of night and day witness this prayer'
        ],
        bestPractices: [
            'Recite Surah Al-Kafirun and Al-Ikhlas in Sunnah',
            'Make dua after prayer as it is a blessed time',
            'Stay seated until sunrise for extra reward'
        ]
    },
    Dhuhr: {
        name: 'Dhuhr',
        arabicName: 'الظهر',
        rakats: { fard: 4, sunnah: 6, sunnahBefore: 4, sunnahAfter: 2 },
        meaning: 'Noon Prayer',
        significance: 'Dhuhr is prayed when the sun passes its zenith. It helps Muslims take a spiritual break in the middle of their daily activities.',
        specialNotes: [
            'Gates of heaven are opened at this time',
            'The Prophet ﷺ never missed the 4 Sunnah before Dhuhr',
            'On Friday, it is replaced by Jummah prayer'
        ],
        bestPractices: [
            'Pray 4 Sunnah before and 2 after Fard',
            'Take time for dhikr between prayers',
            'Best time to make dua before the Adhan'
        ]
    },
    Asr: {
        name: 'Asr',
        arabicName: 'العصر',
        rakats: { fard: 4, sunnah: 4, sunnahBefore: 4 },
        meaning: 'Afternoon Prayer',
        significance: 'Allah mentions Asr specifically in the Quran: "By the time (Asr), indeed mankind is in loss." Missing Asr is like losing one\'s family and wealth.',
        specialNotes: [
            'The Prophet ﷺ emphasized not missing this prayer',
            'Mentioned specifically in Surah Al-Asr',
            'Angels record all deeds at this time'
        ],
        bestPractices: [
            'Pray as early as possible after Adhan',
            'Do not delay until the sun turns yellow',
            'Reflect on the meaning of Surah Al-Asr'
        ]
    },
    Maghrib: {
        name: 'Maghrib',
        arabicName: 'المغرب',
        rakats: { fard: 3, sunnah: 2, sunnahAfter: 2 },
        meaning: 'Sunset Prayer',
        significance: 'Maghrib marks the end of the fast during Ramadan. The Prophet ﷺ said: "Hasten to break the fast and delay Suhoor."',
        specialNotes: [
            'Best time to break fast during Ramadan',
            'Duas are accepted at this blessed time',
            'Shaytan is weakest at sunset'
        ],
        bestPractices: [
            'Break fast with dates and water before praying',
            'Pray immediately as the time is short',
            'Make dua before and after breaking fast'
        ]
    },
    Isha: {
        name: 'Isha',
        arabicName: 'العشاء',
        rakats: { fard: 4, sunnah: 2, sunnahAfter: 2 },
        meaning: 'Night Prayer',
        significance: 'Isha prayer brings peace to the heart before sleep. During Ramadan, Tarawih prayers follow Isha, making it a special time.',
        specialNotes: [
            'Praying Isha in congregation = half the night in prayer',
            'Witr prayer is highly recommended after Isha',
            'Last third of night is blessed for Tahajjud'
        ],
        bestPractices: [
            'Pray Witr before sleeping',
            'Recite Ayatul Kursi before bed',
            'Make night prayers a habit in Ramadan'
        ]
    }
};

interface PrayerModalProps {
    prayer: { name: string; time: string } | null;
    onClose: () => void;
    isPrayed: boolean;
    onTogglePrayed: () => void;
}

export const PrayerModal: React.FC<PrayerModalProps> = ({ prayer, onClose, isPrayed, onTogglePrayed }) => {
    if (!prayer) return null;

    const details = PRAYER_DETAILS[prayer.name];
    if (!details) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full sm:max-w-lg mx-auto bg-white rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-hidden animate-slide-up shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-br from-brand-600 to-brand-700 p-6 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-brand-100 text-xs uppercase tracking-widest mb-1">Prayer Details</p>
                            <h2 className="text-3xl font-bold font-serif">{details.name}</h2>
                            <p className="text-2xl font-arabic text-brand-100 mt-1">{details.arabicName}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                        >
                            <Icons.X size={18} />
                        </button>
                    </div>

                    {/* Time & Status */}
                    <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                            <Icons.Clock size={14} />
                            <span className="font-bold">{prayer.time}</span>
                        </div>
                        <button
                            onClick={onTogglePrayed}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${isPrayed ? 'bg-white text-brand-700' : 'bg-white/20 hover:bg-white/30'}`}
                        >
                            {isPrayed ? <Icons.Check size={14} /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />}
                            <span className="text-sm font-medium">{isPrayed ? 'Prayed' : 'Mark as Prayed'}</span>
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto max-h-[55vh] p-6 space-y-6">
                    {/* Rakats Section */}
                    <div className="bg-brand-50 rounded-2xl p-4 border border-brand-100">
                        <h3 className="text-sm font-bold text-brand-700 uppercase tracking-wider mb-3">Rakats</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {details.rakats.sunnahBefore && (
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-brand-600">{details.rakats.sunnahBefore}</div>
                                    <p className="text-xs text-slate-500">Sunnah Before</p>
                                </div>
                            )}
                            <div className="text-center">
                                <div className="text-2xl font-bold text-brand-700">{details.rakats.fard}</div>
                                <p className="text-xs text-slate-500">Fard</p>
                            </div>
                            {details.rakats.sunnahAfter && (
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-brand-600">{details.rakats.sunnahAfter}</div>
                                    <p className="text-xs text-slate-500">Sunnah After</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-brand-200 text-center">
                            <span className="text-slate-500 text-sm">Total: </span>
                            <span className="text-brand-700 font-bold">{details.rakats.fard + details.rakats.sunnah} rakats</span>
                        </div>
                    </div>

                    {/* Significance */}
                    <div>
                        <h3 className="text-sm font-bold text-brand-600 uppercase tracking-wider mb-2">Why It's Special</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">{details.significance}</p>
                    </div>

                    {/* Special Notes */}
                    <div>
                        <h3 className="text-sm font-bold text-brand-600 uppercase tracking-wider mb-3">Special Notes</h3>
                        <div className="space-y-2">
                            {details.specialNotes.map((note, idx) => (
                                <div key={idx} className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <Icons.Sparkles size={16} className="text-brand-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-slate-600 text-sm">{note}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Best Practices */}
                    <div>
                        <h3 className="text-sm font-bold text-brand-600 uppercase tracking-wider mb-3">Best Practices</h3>
                        <div className="space-y-2">
                            {details.bestPractices.map((practice, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Icons.Check size={12} className="text-brand-600" />
                                    </div>
                                    <p className="text-slate-600 text-sm">{practice}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
