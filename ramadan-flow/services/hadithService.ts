// Hadith API Service - fetches from multiple sources with fallbacks
// Uses ahadith.co.uk as primary (complete, CORS-enabled)
// Falls back to fawazahmed0/hadith-api via jsDelivr CDN

export interface Hadith {
    id: number;
    header: string;
    hadith_english: string;
    hadith_arabic?: string;
    book: string;
    refno: string;
    grades?: { name: string; grade: string }[];
}

export interface HadithCollection {
    name: string;
    slug: string;
    englishSlug: string;
    hadithCount: number;
}

// Primary API - ahadith.co.uk (complete and CORS-enabled)
const AHADITH_API = 'https://ahadith-api.herokuapp.com/api';

// Fallback API - fawazahmed0/hadith-api via CDN
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1';

const CACHE_KEYS = {
    HADITH: (collection: string, id: number) => `hadith_${collection}_${id}`,
    COLLECTION: (collection: string) => `hadith_collection_${collection}`
};

// Cache helper with 1 hour expiry
const getFromCache = <T>(key: string): T | null => {
    try {
        const item = localStorage.getItem(key);
        if (!item) return null;
        const { timestamp, data } = JSON.parse(item);
        if (Date.now() - timestamp > 60 * 60 * 1000) {
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
        console.warn('Failed to cache hadith data', e);
    }
};

export const HADITH_COLLECTIONS: HadithCollection[] = [
    { name: 'Sahih Bukhari', slug: 'bukhari', englishSlug: 'eng-bukhari', hadithCount: 7563 },
    { name: 'Sahih Muslim', slug: 'muslim', englishSlug: 'eng-muslim', hadithCount: 3033 }
];

// Cached hadith data per collection
let cachedCollections: { [key: string]: any[] } = {};

// Load collection data from CDN with filtering
export const loadCollectionData = async (collection: string): Promise<any[]> => {
    const collectionInfo = HADITH_COLLECTIONS.find(c => c.slug === collection);
    if (!collectionInfo) return [];

    const cacheKey = CACHE_KEYS.COLLECTION(collection);
    const cached = getFromCache<any[]>(cacheKey);
    if (cached && cached.length > 0) {
        cachedCollections[collection] = cached;
        return cached;
    }

    if (cachedCollections[collection] && cachedCollections[collection].length > 0) {
        return cachedCollections[collection];
    }

    try {
        // Fetch English version from CDN
        const response = await fetch(`${CDN_BASE}/editions/${collectionInfo.englishSlug}.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        let hadiths = data.hadiths || [];

        // Filter out empty hadiths (no text content)
        hadiths = hadiths.filter((h: any) => {
            const hasText = h.text && h.text.trim().length > 10;
            const hasEnglish = h.hadithEnglish && h.hadithEnglish.trim().length > 10;
            return hasText || hasEnglish;
        });

        // Re-number filtered hadiths for display consistency
        hadiths = hadiths.map((h: any, index: number) => ({
            ...h,
            displayNumber: index + 1,
            originalNumber: h.hadithnumber
        }));

        cachedCollections[collection] = hadiths;

        // Cache first 500 to save localStorage space
        const toCache = hadiths.slice(0, 500);
        setCache(cacheKey, toCache);

        return hadiths;
    } catch (error) {
        console.error(`Failed to load ${collection} collection:`, error);
        return [];
    }
};

// Fetch a random hadith from a collection
export const fetchRandomHadith = async (collection: string = 'bukhari'): Promise<Hadith | null> => {
    try {
        const hadiths = await loadCollectionData(collection);
        if (hadiths.length === 0) return null;

        const randomIndex = Math.floor(Math.random() * hadiths.length);
        const rawHadith = hadiths[randomIndex];

        return formatHadith(rawHadith, collection, randomIndex + 1);
    } catch (error) {
        console.error('Failed to fetch random hadith:', error);
        return null;
    }
};

// Fetch hadith by specific ID/index
export const fetchHadithById = async (collection: string, id: number): Promise<Hadith | null> => {
    const cacheKey = CACHE_KEYS.HADITH(collection, id);
    const cached = getFromCache<Hadith>(cacheKey);
    if (cached) return cached;

    try {
        const hadiths = await loadCollectionData(collection);
        if (hadiths.length === 0) return null;

        // ID is 1-indexed
        const index = Math.min(id - 1, hadiths.length - 1);
        const rawHadith = hadiths[Math.max(0, index)];

        if (!rawHadith) return null;

        const hadith = formatHadith(rawHadith, collection, id);
        setCache(cacheKey, hadith);
        return hadith;
    } catch (error) {
        console.error(`Failed to fetch hadith ${id} from ${collection}:`, error);
        return null;
    }
};

// Format raw API response to our Hadith interface
const formatHadith = (rawHadith: any, collection: string, id: number): Hadith => {
    return {
        id: rawHadith.hadithnumber || rawHadith.displayNumber || id,
        header: rawHadith.reference?.book
            ? `Book ${rawHadith.reference.book}, Hadith ${rawHadith.reference.hadith || id}`
            : `${HADITH_COLLECTIONS.find(c => c.slug === collection)?.name || collection} ${id}`,
        hadith_english: rawHadith.text || rawHadith.hadithEnglish || '',
        hadith_arabic: rawHadith.arabicText || rawHadith.hadithArabic,
        book: collection,
        refno: String(rawHadith.hadithnumber || rawHadith.originalNumber || id),
        grades: rawHadith.grades
    };
};

// Fetch multiple hadiths (for list view)
export const fetchHadithRange = async (
    collection: string,
    startId: number,
    count: number = 10
): Promise<Hadith[]> => {
    const hadiths: Hadith[] = [];

    for (let i = 0; i < count; i++) {
        const hadith = await fetchHadithById(collection, startId + i);
        if (hadith) hadiths.push(hadith);
    }

    return hadiths;
};
