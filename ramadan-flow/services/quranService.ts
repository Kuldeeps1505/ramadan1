export interface Surah {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
}

export interface Verse {
    number: number;
    text: string;
    translation: string;
    numberInSurah: number;
    juz: number;
    manzil: number;
    page: number;
    ruku: number;
    hizbQuarter: number;
    sajda: boolean;
}

export interface SurahDetail {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    numberOfAyahs: number;
    verses: Verse[];
}

const API_BASE = 'https://api.alquran.cloud/v1';

export const QURAN_EDITIONS = {
    en: 'en.sahih',
    ta: 'ta.tamil',
    hi: 'hi.hindi'
};

const CACHE_KEYS = {
    SURAHS: 'quran_all_surahs',
    SURAH_DETAIL: (num: number, edition: string) => `quran_surah_${num}_${edition}_v3`  // v3 to invalidate corrupt old cache
};

// Helper to manage local storage cache with expiry
const getFromCache = <T>(key: string): T | null => {
    try {
        const item = localStorage.getItem(key);
        if (!item) return null;

        const { timestamp, data } = JSON.parse(item);
        // Cache for 24 hours
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
        console.warn('Failed to cache data', e);
    }
};

export const fetchSurahs = async (): Promise<Surah[]> => {
    const cached = getFromCache<Surah[]>(CACHE_KEYS.SURAHS);
    if (cached) return cached;

    try {
        const response = await fetch(`${API_BASE}/surah`);
        const data = await response.json();
        if (data.code === 200 && data.status === 'OK') {
            setCache(CACHE_KEYS.SURAHS, data.data);
            return data.data;
        }
        return [];
    } catch (error) {
        console.error('Failed to fetch surahs:', error);
        return [];
    }
};

export const fetchSurahDetails = async (
    surahNumber: number,
    edition: string = 'en.sahih'
): Promise<SurahDetail | null> => {
    const cacheKey = CACHE_KEYS.SURAH_DETAIL(surahNumber, edition);
    const cached = getFromCache<SurahDetail>(cacheKey);
    if (cached) {
        console.log('[fetchSurahDetails] Returning cached data for', cacheKey);
        return cached;
    }

    try {
        // Fetch Arabic (quran-simple) and Translation together
        // Note: quran-simple provides plain Arabic text
        const url = `${API_BASE}/surah/${surahNumber}/editions/quran-simple,${edition}`;
        console.log('[fetchSurahDetails] Fetching from:', url);
        const response = await fetch(url);
        const data = await response.json();

        console.log('[fetchSurahDetails] API Response data length:', data.data?.length, 'editions:', data.data?.map((d: any) => d.edition?.identifier));

        if (data.code === 200 && data.status === 'OK' && Array.isArray(data.data) && data.data.length === 2) {
            // Find Arabic and Translation data by edition identifier (more reliable)
            const arabicData = data.data.find((d: any) => d.edition?.identifier === 'quran-simple') || data.data[0];
            const translationData = data.data.find((d: any) => d.edition?.identifier === edition) || data.data[1];

            console.log('[fetchSurahDetails] Arabic edition:', arabicData?.edition?.identifier, 'Translation edition:', translationData?.edition?.identifier);
            console.log('[fetchSurahDetails] First translation ayah:', translationData?.ayahs?.[0]?.text?.substring(0, 50));

            const verses: Verse[] = arabicData.ayahs.map((ayah: any, index: number) => ({
                number: ayah.number,
                text: ayah.text, // Arabic
                translation: translationData.ayahs[index]?.text || '', // Translation
                numberInSurah: ayah.numberInSurah,
                juz: ayah.juz,
                manzil: ayah.manzil,
                page: ayah.page,
                ruku: ayah.ruku,
                hizbQuarter: ayah.hizbQuarter,
                sajda: ayah.sajda
            }));

            const result: SurahDetail = {
                number: arabicData.number,
                name: arabicData.name,
                englishName: arabicData.englishName,
                englishNameTranslation: arabicData.englishNameTranslation,
                revelationType: arabicData.revelationType,
                numberOfAyahs: arabicData.numberOfAyahs,
                verses
            };

            setCache(cacheKey, result);
            return result;
        }
        return null;
    } catch (error) {
        console.error(`Failed to fetch surah ${surahNumber} edition ${edition}:`, error);
        return null;
    }
};

// Juz to Surah mapping (30 Juz)
export const JUZ_DATA = [
    { number: 1, name: "Alif Lam Meem", startSurah: 1, startAyah: 1, endSurah: 2, endAyah: 141 },
    { number: 2, name: "Sayaqool", startSurah: 2, startAyah: 142, endSurah: 2, endAyah: 252 },
    { number: 3, name: "Tilkal Rusulu", startSurah: 2, startAyah: 253, endSurah: 3, endAyah: 92 },
    { number: 4, name: "Lan Tanaloo", startSurah: 3, startAyah: 93, endSurah: 4, endAyah: 23 },
    { number: 5, name: "Wal Mohsanatu", startSurah: 4, startAyah: 24, endSurah: 4, endAyah: 147 },
    { number: 6, name: "La Yuhibbullah", startSurah: 4, startAyah: 148, endSurah: 5, endAyah: 81 },
    { number: 7, name: "Wa Iza Samiu", startSurah: 5, startAyah: 82, endSurah: 6, endAyah: 110 },
    { number: 8, name: "Wa Lau Annana", startSurah: 6, startAyah: 111, endSurah: 7, endAyah: 87 },
    { number: 9, name: "Qalal Malao", startSurah: 7, startAyah: 88, endSurah: 8, endAyah: 40 },
    { number: 10, name: "Wa A'lamu", startSurah: 8, startAyah: 41, endSurah: 9, endAyah: 92 },
    { number: 11, name: "Yatazeroon", startSurah: 9, startAyah: 93, endSurah: 11, endAyah: 5 },
    { number: 12, name: "Wa Mamin Dabbatin", startSurah: 11, startAyah: 6, endSurah: 12, endAyah: 52 },
    { number: 13, name: "Wa Ma Ubrioo", startSurah: 12, startAyah: 53, endSurah: 14, endAyah: 52 },
    { number: 14, name: "Rubama", startSurah: 15, startAyah: 1, endSurah: 16, endAyah: 128 },
    { number: 15, name: "Subhan Alladhi", startSurah: 17, startAyah: 1, endSurah: 18, endAyah: 74 },
    { number: 16, name: "Qala Alam", startSurah: 18, startAyah: 75, endSurah: 20, endAyah: 135 },
    { number: 17, name: "Iqtaraba", startSurah: 21, startAyah: 1, endSurah: 22, endAyah: 78 },
    { number: 18, name: "Qad Aflaha", startSurah: 23, startAyah: 1, endSurah: 25, endAyah: 20 },
    { number: 19, name: "Wa Qalal Ladhina", startSurah: 25, startAyah: 21, endSurah: 27, endAyah: 55 },
    { number: 20, name: "Amman Khalaqa", startSurah: 27, startAyah: 56, endSurah: 29, endAyah: 45 },
    { number: 21, name: "Utlu Ma Oohiya", startSurah: 29, startAyah: 46, endSurah: 33, endAyah: 30 },
    { number: 22, name: "Wa Man Yaqnut", startSurah: 33, startAyah: 31, endSurah: 36, endAyah: 27 },
    { number: 23, name: "Wa Mali", startSurah: 36, startAyah: 28, endSurah: 39, endAyah: 31 },
    { number: 24, name: "Faman Azlamu", startSurah: 39, startAyah: 32, endSurah: 41, endAyah: 46 },
    { number: 25, name: "Ilayhi Yuraddu", startSurah: 41, startAyah: 47, endSurah: 45, endAyah: 37 },
    { number: 26, name: "Ha Meem", startSurah: 46, startAyah: 1, endSurah: 51, endAyah: 30 },
    { number: 27, name: "Qala Fama Khatbukum", startSurah: 51, startAyah: 31, endSurah: 57, endAyah: 29 },
    { number: 28, name: "Qad Sami Allah", startSurah: 58, startAyah: 1, endSurah: 66, endAyah: 12 },
    { number: 29, name: "Tabarakalladhi", startSurah: 67, startAyah: 1, endSurah: 77, endAyah: 50 },
    { number: 30, name: "Amma", startSurah: 78, startAyah: 1, endSurah: 114, endAyah: 6 },
];

// Juz Surah info extracted from API
export interface JuzSurah {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
}

// Fetch Surahs contained in a Juz
export const fetchJuzSurahs = async (juzNumber: number): Promise<JuzSurah[]> => {
    const cacheKey = `quran_juz_${juzNumber}_surahs`;
    const cached = getFromCache<JuzSurah[]>(cacheKey);
    if (cached) return cached;

    try {
        const response = await fetch(`${API_BASE}/juz/${juzNumber}/quran-simple`);
        const data = await response.json();

        if (data.code === 200 && data.status === 'OK' && data.data?.ayahs) {
            // Extract unique Surahs from ayahs
            const surahMap = new Map<number, JuzSurah>();
            data.data.ayahs.forEach((ayah: any) => {
                if (ayah.surah && !surahMap.has(ayah.surah.number)) {
                    surahMap.set(ayah.surah.number, {
                        number: ayah.surah.number,
                        name: ayah.surah.name,
                        englishName: ayah.surah.englishName,
                        englishNameTranslation: ayah.surah.englishNameTranslation,
                        numberOfAyahs: ayah.surah.numberOfAyahs,
                        revelationType: ayah.surah.revelationType
                    });
                }
            });

            const surahs = Array.from(surahMap.values());
            setCache(cacheKey, surahs);
            return surahs;
        }
        return [];
    } catch (error) {
        console.error(`Failed to fetch juz ${juzNumber}:`, error);
        return [];
    }
};
