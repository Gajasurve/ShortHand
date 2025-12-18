const fs = require('fs');
const swisseph = require('swisseph-v2');

const NAK = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

function getNakshatra(date) {
    // 1. Convert Date to Julian Day (Swiss Ephemeris uses Julian days)
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    
    const jd = swisseph.swe_julday(year, month, day, hour, swisseph.SE_GREG_CAL);

    // 2. Set Ayanamsa to Lahiri (Vedic standard)
    swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);

    // 3. Calculate Moon Position (using Sidereal flag)
    // flag = SEFLG_SWIEPH (use ephemeris) | SEFLG_SIDEREAL (use sidereal zodiac)
    const flag = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SIDEREAL;
    const moon = swisseph.swe_calc_ut(jd, swisseph.SE_MOON, flag);

    if (moon.error) {
        throw new Error(moon.error);
    }

    // 4. Calculate Nakshatra Index (0-26)
    // Longitude is in moon.longitude (0-360)
    const siderealLon = moon.longitude;
    const nakIdx = Math.floor(siderealLon / (360 / 27));

    return NAK[nakIdx];
}

async function main() {
    const START_DATE = new Date(Date.UTC(2025, 11, 15)); // Dec 15, 2025
    const END_DATE = new Date(Date.UTC(2026, 11, 31));   // Dec 31, 2026
    
    let result = {};
    let current = new Date(START_DATE);

    console.log(" Generating high-precision Nakshatras using Swiss Ephemeris...");

    while (current <= END_DATE) {
        const y = current.getUTCFullYear();
        const m = current.getUTCMonth() + 1;
        const d = current.getUTCDate();
        const dateKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        process.stdout.write(`Processing ${dateKey}...\r`);

        let daySlots = [];
        let lastNak = "";

        // Scan the 24-hour window (in IST)
        for (let min = 0; min < 1440; min++) {
            // Calculate UTC equivalent of the IST minute
            const utcTime = new Date(Date.UTC(y, m - 1, d, 0, min, 0) - (5.5 * 60 * 60 * 1000));
            const currentNak = getNakshatra(utcTime);

            if (currentNak !== lastNak) {
                daySlots.push({
                    start: `${String(Math.floor(min/60)).padStart(2, '0')}:${String(min%60).padStart(2, '0')}`,
                    name: currentNak
                });
                lastNak = currentNak;
            }
        }

        result[dateKey] = daySlots;
        current.setUTCDate(current.getUTCDate() + 1);
    }

    fs.writeFileSync("nakshatra.json", JSON.stringify(result, null, 2));
    console.log("\n\n✅ Done! File: nakshatra.json (Drik Panchang Accuracy)");
}
