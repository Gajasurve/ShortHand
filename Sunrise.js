// Generate sunrise/sunset with seconds precision (LOCAL TIME)

// IMPORTANT: Run this on a machine set to IST timezone
// run as TZ=Asia/Kolkata node gen_sunrise.js

const SunCalc = require("suncalc");
const fs = require("fs");

const LAT = 17.3840;
const LON = 78.4564;

const START = new Date(2025, 11, 15); // Dec 15 2025 (LOCAL)
const END   = new Date(2026, 11, 31); // Dec 31 2026 (LOCAL)

let out = {};

for (let d = new Date(START); d <= END; d.setDate(d.getDate() + 1)) {
  const times = SunCalc.getTimes(d, LAT, LON);

  const sr =
    times.sunrise.getHours() * 3600 +
    times.sunrise.getMinutes() * 60 +
    times.sunrise.getSeconds();

  const ss =
    times.sunset.getHours() * 3600 +
    times.sunset.getMinutes() * 60 +
    times.sunset.getSeconds();

  const key =
    d.getFullYear() + "-" +
    ("0" + (d.getMonth() + 1)).slice(-2) + "-" +
    ("0" + d.getDate()).slice(-2);

  // SANITY CHECK
  if (!(sr >= 0 && ss > sr && ss < 86400)) {
    console.error("Invalid sunrise/sunset for", key, sr, ss);
    process.exit(1);
  }

  out[key] = { sr, ss };
}

fs.writeFileSync("sunrise.json", JSON.stringify(out, null, 2));
console.log("✅ sunrise.json generated correctly (local IST)");
