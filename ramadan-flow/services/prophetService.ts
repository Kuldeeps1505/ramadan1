// Prophet History Service - Seerah Timeline
// Fetches from OpenIslam seerah-timeline via jsDelivr or falls back to embedded data

export interface SeerahEvent {
    id: number;
    year_hijri?: string;
    year_gregorian: string;
    title: string;
    description: string;
    category: 'early_life' | 'prophethood' | 'medina' | 'legacy';
    location?: string;
}

// CDN URL for seerah data
const SEERAH_CDN = 'https://cdn.jsdelivr.net/gh/OpenIslam/seerah-timeline@main/seerah.json';

const CACHE_KEY = 'seerah_timeline_data';

// Cache helper with 24 hour expiry
const getFromCache = <T>(key: string): T | null => {
    try {
        const item = localStorage.getItem(key);
        if (!item) return null;
        const { timestamp, data } = JSON.parse(item);
        if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(key);
            return null;
        }
        return data;
    } catch {
        return null;
    }
};

const setCache = (key: string, data: any) => {
    try {
        localStorage.setItem(key, JSON.stringify({
            timestamp: Date.now(),
            data
        }));
    } catch (e) {
        console.warn('Failed to cache seerah data', e);
    }
};

// Comprehensive Seerah timeline data
const SEERAH_DATA: SeerahEvent[] = [
    {
        id: 1,
        year_gregorian: '570 CE',
        title: 'Birth of Prophet Muhammad ﷺ',
        description: 'Prophet Muhammad ﷺ was born in Mecca in the Year of the Elephant. His father Abdullah had passed away before his birth. He was born into the noble Quraysh tribe, in the clan of Banu Hashim.',
        category: 'early_life',
        location: 'Mecca'
    },
    {
        id: 2,
        year_gregorian: '576 CE',
        title: 'Death of Aminah (Mother)',
        description: 'At the age of six, the Prophet ﷺ lost his mother Aminah bint Wahb during their return journey from Medina. He was then placed under the care of his grandfather Abdul Muttalib.',
        category: 'early_life',
        location: 'Al-Abwa'
    },
    {
        id: 3,
        year_gregorian: '578 CE',
        title: 'Death of Abdul Muttalib',
        description: 'The Prophet\'s grandfather Abdul Muttalib passed away when Muhammad ﷺ was eight years old. His uncle Abu Talib then became his guardian and protector.',
        category: 'early_life',
        location: 'Mecca'
    },
    {
        id: 4,
        year_gregorian: '595 CE',
        title: 'Marriage to Khadijah',
        description: 'At age 25, Prophet Muhammad ﷺ married Khadijah bint Khuwaylid, a successful merchant and widow who was 40 years old. She became his greatest supporter and the first person to accept Islam.',
        category: 'early_life',
        location: 'Mecca'
    },
    {
        id: 5,
        year_hijri: '13 BH',
        year_gregorian: '610 CE',
        title: 'First Revelation',
        description: 'Angel Jibreel (Gabriel) appeared to Prophet Muhammad ﷺ in the Cave of Hira and revealed the first verses of the Quran: "Read in the name of your Lord who created..." (Surah Al-Alaq). This marked the beginning of his prophethood.',
        category: 'prophethood',
        location: 'Cave of Hira, Mecca'
    },
    {
        id: 6,
        year_hijri: '10 BH',
        year_gregorian: '613 CE',
        title: 'Public Preaching Begins',
        description: 'After three years of secret preaching, Prophet Muhammad ﷺ was commanded to preach Islam publicly. He gathered his relatives at Mount Safa and called them to monotheism.',
        category: 'prophethood',
        location: 'Mecca'
    },
    {
        id: 7,
        year_hijri: '5 BH',
        year_gregorian: '615 CE',
        title: 'Migration to Abyssinia',
        description: 'Due to severe persecution, a group of Muslims migrated to Abyssinia (Ethiopia) where the Christian king Negus granted them protection. This was the first migration in Islam.',
        category: 'prophethood',
        location: 'Abyssinia (Ethiopia)'
    },
    {
        id: 8,
        year_hijri: '3 BH',
        year_gregorian: '619 CE',
        title: 'Year of Sorrow',
        description: 'The Prophet ﷺ lost both his beloved wife Khadijah and his uncle Abu Talib within a short period. This year marked one of the most difficult times in his life.',
        category: 'prophethood',
        location: 'Mecca'
    },
    {
        id: 9,
        year_hijri: '1 BH',
        year_gregorian: '621 CE',
        title: 'Isra and Mi\'raj',
        description: 'The miraculous night journey from Mecca to Jerusalem (Isra) and ascension through the heavens (Mi\'raj). During this journey, the five daily prayers were prescribed.',
        category: 'prophethood',
        location: 'Mecca to Jerusalem'
    },
    {
        id: 10,
        year_hijri: '1 AH',
        year_gregorian: '622 CE',
        title: 'The Hijrah to Medina',
        description: 'Prophet Muhammad ﷺ and the Muslims migrated from Mecca to Medina. This event marks the beginning of the Islamic calendar. The Prophet ﷺ established the first Muslim community and built Masjid Quba and Masjid al-Nabawi.',
        category: 'medina',
        location: 'Medina'
    },
    {
        id: 11,
        year_hijri: '2 AH',
        year_gregorian: '624 CE',
        title: 'Battle of Badr',
        description: 'The first major military victory for Muslims against the Quraysh of Mecca. Despite being outnumbered (313 vs 1000), the Muslims achieved a decisive victory with divine support.',
        category: 'medina',
        location: 'Badr'
    },
    {
        id: 12,
        year_hijri: '3 AH',
        year_gregorian: '625 CE',
        title: 'Battle of Uhud',
        description: 'The Quraysh sought revenge for Badr. The battle resulted in losses for Muslims, and the Prophet ﷺ himself was injured. It taught important lessons about following commands.',
        category: 'medina',
        location: 'Mount Uhud'
    },
    {
        id: 13,
        year_hijri: '5 AH',
        year_gregorian: '627 CE',
        title: 'Battle of the Trench (Khandaq)',
        description: 'A coalition of 10,000 fighters besieged Medina. Following Salman al-Farisi\'s advice, Muslims dug a trench around the city. The siege eventually failed.',
        category: 'medina',
        location: 'Medina'
    },
    {
        id: 14,
        year_hijri: '6 AH',
        year_gregorian: '628 CE',
        title: 'Treaty of Hudaybiyyah',
        description: 'A peace treaty signed between Muslims and Quraysh. Though it seemed unfavorable initially, it was described as a "clear victory" in the Quran and allowed Islam to spread peacefully.',
        category: 'medina',
        location: 'Hudaybiyyah'
    },
    {
        id: 15,
        year_hijri: '8 AH',
        year_gregorian: '630 CE',
        title: 'Conquest of Mecca',
        description: 'Prophet Muhammad ﷺ returned to Mecca with 10,000 Muslims. The city was conquered peacefully, idols in the Kaaba were destroyed, and general amnesty was granted to the people of Mecca.',
        category: 'medina',
        location: 'Mecca'
    },
    {
        id: 16,
        year_hijri: '10 AH',
        year_gregorian: '632 CE',
        title: 'The Farewell Pilgrimage',
        description: 'Prophet Muhammad ﷺ performed his only Hajj and delivered his famous Farewell Sermon at Mount Arafat, emphasizing equality, justice, and the completion of the religion of Islam.',
        category: 'legacy',
        location: 'Mecca & Arafat'
    },
    {
        id: 17,
        year_hijri: '11 AH',
        year_gregorian: '632 CE',
        title: 'Passing of Prophet Muhammad ﷺ',
        description: 'The Prophet ﷺ passed away in Medina at the age of 63. He was buried in the room of Aisha (RA), which is now part of Masjid al-Nabawi. His death marked the end of prophethood.',
        category: 'legacy',
        location: 'Medina'
    }
];

// Attempt to fetch from CDN, fallback to embedded data
export const fetchSeerahTimeline = async (): Promise<SeerahEvent[]> => {
    const cached = getFromCache<SeerahEvent[]>(CACHE_KEY);
    if (cached) return cached;

    try {
        const response = await fetch(SEERAH_CDN);
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                setCache(CACHE_KEY, data);
                return data;
            }
        }
    } catch (error) {
        console.log('Using embedded seerah data:', error);
    }

    // Fallback to embedded data
    setCache(CACHE_KEY, SEERAH_DATA);
    return SEERAH_DATA;
};

// Get events by category
export const getEventsByCategory = (events: SeerahEvent[], category: string): SeerahEvent[] => {
    return events.filter(e => e.category === category);
};

// Get categories
export const SEERAH_CATEGORIES = [
    { id: 'early_life', name: 'Early Life', icon: 'baby' },
    { id: 'prophethood', name: 'Prophethood', icon: 'book' },
    { id: 'medina', name: 'Medina Period', icon: 'building' },
    { id: 'legacy', name: 'Final Days', icon: 'star' }
];
