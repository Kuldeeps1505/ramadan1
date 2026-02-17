// AlAdhan API Service for Prayer Times, Hijri Calendar, and Qibla Direction
// API Documentation: https://aladhan.com/prayer-times-api

const ALADHAN_BASE_URL = 'https://api.aladhan.com/v1';

// Calculation method codes for AlAdhan API
export const CALCULATION_METHODS: Record<string, number> = {
  'Muslim World League': 3,
  'ISNA': 2,
  'Egyptian General Authority': 5,
  'Umm al-Qura': 4,
  'University of Islamic Sciences, Karachi': 1,
};

export interface PrayerTimesResponse {
  timings: {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
    Imsak: string;
    Midnight: string;
  };
  date: {
    readable: string;
    hijri: {
      date: string;
      day: string;
      month: {
        number: number;
        en: string;
        ar: string;
      };
      year: string;
      weekday: {
        en: string;
        ar: string;
      };
    };
    gregorian: {
      date: string;
      day: string;
      month: {
        number: number;
        en: string;
      };
      year: string;
      weekday: {
        en: string;
      };
    };
  };
}

export interface QiblaResponse {
  latitude: number;
  longitude: number;
  direction: number; // Degrees from North
}

export interface HijriDate {
  day: string;
  month: string;
  monthAr: string;
  year: string;
  weekday: string;
  formatted: string;
}

export interface ParsedPrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  imsak: string;
  midnight: string;
}

// Cache keys
const CACHE_KEY_PRAYERS = 'aladhan_prayer_times';
const CACHE_KEY_QIBLA = 'aladhan_qibla';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CachedData<T> {
  data: T;
  timestamp: number;
  date: string;
}

function getCachedData<T>(key: string, currentDate: string): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const parsed: CachedData<T> = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid (same date and within TTL)
    if (parsed.date === currentDate && now - parsed.timestamp < CACHE_TTL) {
      return parsed.data;
    }
  } catch (e) {
    console.error('Cache read error:', e);
  }
  return null;
}

function setCachedData<T>(key: string, data: T, currentDate: string): void {
  try {
    const cacheData: CachedData<T> = {
      data,
      timestamp: Date.now(),
      date: currentDate,
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (e) {
    console.error('Cache write error:', e);
  }
}

/**
 * Fetch prayer times for a specific location
 */
export async function fetchPrayerTimes(
  latitude: number,
  longitude: number,
  calculationMethod: string = 'Muslim World League'
): Promise<{ timings: ParsedPrayerTimes; hijri: HijriDate } | null> {
  const today = new Date();
  const dateStr = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
  const cacheKey = `${CACHE_KEY_PRAYERS}_${latitude}_${longitude}`;

  // Check cache first
  const cached = getCachedData<{ timings: ParsedPrayerTimes; hijri: HijriDate }>(cacheKey, dateStr);
  if (cached) {
    return cached;
  }

  try {
    const method = CALCULATION_METHODS[calculationMethod] || 3;
    const url = `${ALADHAN_BASE_URL}/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=${method}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch prayer times');

    const json = await response.json();
    const data: PrayerTimesResponse = json.data;

    const result = {
      timings: {
        fajr: data.timings.Fajr,
        sunrise: data.timings.Sunrise,
        dhuhr: data.timings.Dhuhr,
        asr: data.timings.Asr,
        maghrib: data.timings.Maghrib,
        isha: data.timings.Isha,
        imsak: data.timings.Imsak,
        midnight: data.timings.Midnight,
      },
      hijri: {
        day: data.date.hijri.day,
        month: data.date.hijri.month.en,
        monthAr: data.date.hijri.month.ar,
        year: data.date.hijri.year,
        weekday: data.date.hijri.weekday.en,
        formatted: `${data.date.hijri.day} ${data.date.hijri.month.en} ${data.date.hijri.year}`,
      },
    };

    // Cache the result
    setCachedData(cacheKey, result, dateStr);

    return result;
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    return null;
  }
}

/**
 * Fetch Qibla direction for a specific location
 */
export async function fetchQiblaDirection(
  latitude: number,
  longitude: number
): Promise<number | null> {
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `${CACHE_KEY_QIBLA}_${latitude}_${longitude}`;

  // Check cache first
  const cached = getCachedData<number>(cacheKey, today);
  if (cached !== null) {
    return cached;
  }

  try {
    const url = `${ALADHAN_BASE_URL}/qibla/${latitude}/${longitude}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch Qibla direction');

    const json = await response.json();
    const direction: number = json.data.direction;

    // Cache the result
    setCachedData(cacheKey, direction, today);

    return direction;
  } catch (error) {
    console.error('Error fetching Qibla direction:', error);
    return null;
  }
}

/**
 * Get the next prayer based on current time
 */
export function getNextPrayer(timings: ParsedPrayerTimes): { name: string; time: string; remainingMs: number } | null {
  const now = new Date();
  const prayers = [
    { name: 'Fajr', time: timings.fajr },
    { name: 'Sunrise', time: timings.sunrise },
    { name: 'Dhuhr', time: timings.dhuhr },
    { name: 'Asr', time: timings.asr },
    { name: 'Maghrib', time: timings.maghrib },
    { name: 'Isha', time: timings.isha },
  ];

  for (const prayer of prayers) {
    const [hours, minutes] = prayer.time.split(':').map(Number);
    const prayerDate = new Date(now);
    prayerDate.setHours(hours, minutes, 0, 0);

    if (prayerDate > now) {
      return {
        name: prayer.name,
        time: prayer.time,
        remainingMs: prayerDate.getTime() - now.getTime(),
      };
    }
  }

  // If all prayers passed, next is Fajr tomorrow
  const [hours, minutes] = timings.fajr.split(':').map(Number);
  const tomorrowFajr = new Date(now);
  tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
  tomorrowFajr.setHours(hours, minutes, 0, 0);

  return {
    name: 'Fajr',
    time: timings.fajr,
    remainingMs: tomorrowFajr.getTime() - now.getTime(),
  };
}

/**
 * Get current prayer (the one we're in the time window of)
 */
export function getCurrentPrayer(timings: ParsedPrayerTimes): string | null {
  const now = new Date();
  const prayers = [
    { name: 'Isha', time: timings.isha },
    { name: 'Maghrib', time: timings.maghrib },
    { name: 'Asr', time: timings.asr },
    { name: 'Dhuhr', time: timings.dhuhr },
    { name: 'Fajr', time: timings.fajr },
  ];

  for (const prayer of prayers) {
    const [hours, minutes] = prayer.time.split(':').map(Number);
    const prayerDate = new Date(now);
    prayerDate.setHours(hours, minutes, 0, 0);

    if (now >= prayerDate) {
      return prayer.name;
    }
  }

  return 'Isha'; // Late night before Fajr
}

/**
 * Format milliseconds to HH:MM:SS countdown
 */
export function formatCountdown(ms: number): { hours: string; minutes: string; seconds: string } {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
  };
}

/**
 * Check if currently fasting (between Fajr and Maghrib)
 */
export function isFastingTime(timings: ParsedPrayerTimes): boolean {
  const now = new Date();

  const [fajrH, fajrM] = timings.fajr.split(':').map(Number);
  const [maghribH, maghribM] = timings.maghrib.split(':').map(Number);

  const fajrTime = new Date(now);
  fajrTime.setHours(fajrH, fajrM, 0, 0);

  const maghribTime = new Date(now);
  maghribTime.setHours(maghribH, maghribM, 0, 0);

  return now >= fajrTime && now < maghribTime;
}