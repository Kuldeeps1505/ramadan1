
const fetch = require('node-fetch'); // Assuming node-fetch is available or using built-in fetch in recent node

const API_BASE = 'http://api.alquran.cloud/v1';

async function testSurah(number, edition) {
    console.log(`Fetching Surah ${number} with edition ${edition}...`);
    try {
        const response = await fetch(`${API_BASE}/surah/${number}/editions/quran-simple,${edition}`);
        const data = await response.json();

        if (data.code === 200 && data.status === 'OK') {
            console.log(`SUCCESS: Surah ${number} fetched.`);
            // Check if we have translation
            const translation = data.data.find(d => d.type === 'translation' || d.identifier !== 'quran-simple');
            if (translation) {
                console.log(`Translation found: ${translation.identifier}`);
                console.log(`First verse: ${translation.ayahs[0].text}`);
            } else {
                console.error('ERROR: No translation data found');
            }
        } else {
            console.error(`FAILED: API returned code ${data.code}`);
        }
    } catch (error) {
        console.error('FAILED: Network or parsing error', error);
    }
}

// Test Surah 1 and 2 in Tamil
(async () => {
    await testSurah(1, 'ta.tamil');
    await testSurah(2, 'ta.tamil');
})();
