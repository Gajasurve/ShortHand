//Accuaret tithi Generator

const Astronomy = require("astronomy-engine");
const fs = require("fs");

/* ---------------- CONFIG ---------------- */
const START_DATE = "2025-12-01";
const END_DATE   = "2026-12-31";
const IST_OFFSET = 5.5 * 3600 * 1000;

const TITHI_NAMES = [
    "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
    "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
    "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima",
    "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
    "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
    "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Amavasya"
];

/* ---------------- HELPERS ---------------- */
function toIST(date) { return new Date(date.getTime() + IST_OFFSET); }

function istHHMM(dateUTC) {
    const ist = toIST(dateUTC);
    return String(ist.getUTCHours()).padStart(2, '0') + ":" + 
           String(ist.getUTCMinutes()).padStart(2, '0');
}

function getTithiIndex(date) {
    const time = Astronomy.MakeTime(date);
    const angle = Astronomy.MoonPhase(time);
    // Standard Tithi calculation: floor(angle / 12)
    return Math.floor(angle / 12) % 30;
}

/* ---------------- MAIN ---------------- */
function generate() {
    let out = {};
    let currentDayIST = new Date(START_DATE + "T00:00:00Z");
    const endDayIST = new Date(END_DATE + "T23:59:59Z");

    while (currentDayIST <= endDayIST) {
        const dayKey = currentDayIST.toISOString().split('T')[0];
        const dayStartUTC = new Date(currentDayIST.getTime() - IST_OFFSET);
        const dayEndUTC = new Date(dayStartUTC.getTime() + 86400000);

        let slots = [];

        // 1. Initial Tithi at 00:00 IST
        let currentIdx = getTithiIndex(dayStartUTC);
        slots.push({
            start: "00:00",
            name: TITHI_NAMES[currentIdx],
            type: currentIdx < 15 ? "Shukla" : "Krishna"
        });

        // 2. Find transitions within this 24-hour IST block
        let searchTime = dayStartUTC;
        while (searchTime < dayEndUTC) {
            let currentAngle = Astronomy.MoonPhase(Astronomy.MakeTime(searchTime));
            // Find the next multiple of 12 degrees
            let nextTargetAngle = (Math.floor(currentAngle / 12) + 1) * 12;
            
            // Search for when the moon phase reaches the next 12-degree boundary
            let transit = Astronomy.SearchMoonPhase(nextTargetAngle % 360, searchTime, 1);
            
            if (transit && transit.date < dayEndUTC) {
                // The transition found is for the NEXT tithi
                let nextIdx = (Math.floor(nextTargetAngle / 12)) % 30;
                
                slots.push({
                    start: istHHMM(transit.date),
                    name: TITHI_NAMES[nextIdx],
                    type: nextIdx < 15 ? "Shukla" : "Krishna"
                });
                // Move search forward slightly past the transition
                searchTime = new Date(transit.date.getTime() + 1000); 
            } else {
                break; 
            }
        }

        out[dayKey] = slots;
        currentDayIST.setDate(currentDayIST.getDate() + 1);
    }

    fs.writeFileSync("tithi.json", JSON.stringify(out, null, 2));
    console.log("✔ tithi.json generated with correct transitions.");
}

generate();
