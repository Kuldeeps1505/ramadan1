export const DEFAULT_PROFILE = {
  isOnboarded: false,
  name: '',
  city: '',
  latitude: 0,
  longitude: 0,
  calculationMethod: 'Muslim World League',
  asrMethod: 'Standard (Shafi, Maliki, Hanbali)',
  goalQuranMinutes: 30,
};

export const MOOD_PROMPTS = {
  Happy: "MashaAllah. How can you share this joy with someone else today to multiply the blessing?",
  Grateful: "Alhamdulillah. List three small things from today that were specific mercies from your Lord.",
  Anxious: "Remember: 'Verily, with hardship comes ease.' What is one thing you can hand over to Allah's control right now?",
  Tired: "Your sleep is worship if intended for strength. How can you make your rest spiritual tonight?",
  Spiritual: "In this moment of closeness, what is the one dua you want to whisper to the Most High?",
};

export const APP_GREETINGS = [
  "May Allah bless your day with light and barakah.",
  "May Allah keep you safe from all evil today.",
  "May your heart find deep rest in His remembrance.",
  "May Allah accept your smallest efforts today.",
  "May ease follow every hardship you face.",
  "May Allah guide your steps to what pleases Him.",
  "May you find tranquility in your worship."
];

export const BLESSINGS = [
  { text: "Allah does not burden a soul beyond that it can bear.", category: "general" },
  { text: "So verily, with the hardship, there is relief.", category: "general" },
  { text: "Call upon Me; I will respond to you.", category: "general" },
  { text: "And He is with you wherever you are.", category: "general" },
  { text: "Marriage is half of faith.", category: "Married" },
  { text: "Trust in Allah's timing for your companionship.", category: "Single" }
];

// Mock AI generated responses
export const AI_RECIPES = [
  {
    title: "Overnight Dates & Oats",
    description: "A slow-release energy sustainers. Blend oats, dates, almond milk, and a pinch of cinnamon.",
    tags: ["High Fiber", "Sunnah", "Suhoor"],
    prepTime: "5 min"
  },
  {
    title: "Grilled Chicken & Quinoa Bowl",
    description: "Packed with protein and complex carbs. Add cucumber, pomegranate seeds, and lemon dressing.",
    tags: ["High Protein", "Hydrating", "Iftar"],
    prepTime: "20 min"
  },
  {
    title: "Watermelon & Feta Salad",
    description: "The ultimate hydration booster. Fresh mint, cubed watermelon, and low-salt feta.",
    tags: ["Hydrating", "Light", "Iftar"],
    prepTime: "10 min"
  }
];

export const MOCK_QURAN_JUZ_1 = [
  {
    surah: "Al-Fatiha",
    number: 1,
    text: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
    translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
    tafsir: "The Basmalah is the key to the Quran and every noble action. It reminds us that everything begins with God's mercy."
  },
  {
    surah: "Al-Fatiha",
    number: 2,
    text: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ",
    translation: "[All] praise is [due] to Allah, Lord of the worlds.",
    tafsir: "Al-Hamd implies that all praise belongs to Allah alone, regardless of the situation. He is the Sustainer of all existence."
  },
  {
    surah: "Al-Fatiha",
    number: 3,
    text: "ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
    translation: "The Entirely Merciful, the Especially Merciful.",
    tafsir: "A repetition to emphasize that His Mercy prevails over His Wrath. Ar-Rahman is mercy for all, Ar-Rahim is special mercy for believers."
  },
  {
    surah: "Al-Fatiha",
    number: 4,
    text: "مَـٰلِكِ يَوْمِ ٱلدِّينِ",
    translation: "Sovereign of the Day of Recompense.",
    tafsir: "Reminds us of accountability. While He is Merciful, He is also the Judge. This creates a balance of hope and fear."
  },
  {
    surah: "Al-Fatiha",
    number: 5,
    text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
    translation: "It is You we worship and You we ask for help.",
    tafsir: "This is the core of Tawheed (monotheism). We declare our dependence solely on Him."
  },
  {
    surah: "Al-Fatiha",
    number: 6,
    text: "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ",
    translation: "Guide us to the straight path.",
    tafsir: "The most important prayer. Hidayah (guidance) is the greatest gift one can ask for."
  }
];