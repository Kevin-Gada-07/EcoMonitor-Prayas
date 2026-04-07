// ==========================================
// 1. FIREBASE IMPORTS & INITIALIZATION
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC6-QogO1uu5la2MciRmbfpzgjzXCcZH30",
  authDomain: "aimg-550c6.firebaseapp.com",
  databaseURL: "https://aimg-550c6-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aimg-550c6",
  storageBucket: "aimg-550c6.firebasestorage.app",
  messagingSenderId: "246733966703",
  appId: "1:246733966703:web:52738e09a154245708ac9a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// GLOBAL AUTH TRACKER
let currentUser = null;
let telemetryListener = null;

// Grab the new Sign Out button from HTML
const signOutBtn = document.getElementById('navbar-sign-out');

// Listen for login state changes in the background
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log("User is logged in:", user.email);
        
        // SHOW the new Sign Out button
        if (signOutBtn) signOutBtn.style.display = 'block';

        // START LISTENING TO SECURE HARDWARE DATA
        const userTelemetryRef = ref(db, 'users/' + user.uid + '/telemetry');
        
        telemetryListener = onValue(userTelemetryRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                console.log("Live Hardware Data Received:", data);
            }
        }, (error) => {
            console.error("Firebase read failed. The server blocked access:", error);
        });

    } else {
        // USER IS LOGGED OUT
        currentUser = null;
        console.log("User is logged out.");
        
        // HIDE the Sign Out button
        if (signOutBtn) signOutBtn.style.display = 'none';
        
        if (telemetryListener) telemetryListener(); 
    }
});

// Handle the Sign Out Button Click
if (signOutBtn) {
    signOutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth).then(() => {
            window.location.reload(); // Refresh the page to clear the dashboard
        });
    });
}

// ==========================================
// 2. UI NAVIGATION LOGIC (With The Bouncer)
// ==========================================
const homePage = document.getElementById('home-page');
const dashboard = document.getElementById('dashboard');
const hardwarePage = document.getElementById('hardware');
const economicsPage = document.getElementById('economics');
const milestonesPage = document.getElementById('milestones');
const logsPage = document.getElementById('logs');
const teamPage = document.getElementById('team');

const homeBtn = document.querySelector(".home-button");
const launchBtn = document.querySelector('.launch-system-button');
const viewDashboardBtn = document.querySelector('.cta-btn'); 
const hardwareBtn = document.querySelector('.hardware-button');
const economicsBtn = document.querySelector('.economics-button');
const milestonesBtn = document.querySelector('.milestones-button');
const logsBtn = document.querySelector('.logs-button');
const teamBtn = document.querySelector('.team-button');
const systemRoiBtn = document.querySelector('.view-impact-btn');

function hideAllPages() {
    homePage.classList.add('hidden'); homePage.classList.remove('visible');
    dashboard.classList.add('hidden'); dashboard.classList.remove('visible');
    hardwarePage.classList.add('hidden'); hardwarePage.classList.remove('visible');
    economicsPage.classList.add('hidden'); economicsPage.classList.remove('visible');
    milestonesPage.classList.add('hidden'); milestonesPage.classList.remove('visible');
    logsPage.classList.add('hidden'); logsPage.classList.remove('visible');
    teamPage.classList.add('hidden'); teamPage.classList.remove('visible');
}

// --- PUBLIC PAGES ---
function openHomePage(event) { event.preventDefault(); hideAllPages(); homePage.classList.remove('hidden'); homePage.classList.add('visible'); }
function openHardwarePage(event) { event.preventDefault(); hideAllPages(); hardwarePage.classList.remove('hidden'); hardwarePage.classList.add('visible'); }
function openTeamPage(event) { event.preventDefault(); hideAllPages(); teamPage.classList.remove('hidden'); teamPage.classList.add('visible'); }

// --- PRIVATE PAGES ---
function showDashboard() { hideAllPages(); dashboard.classList.remove('hidden'); dashboard.classList.add('visible'); }
function showEconomics() { hideAllPages(); economicsPage.classList.remove('hidden'); economicsPage.classList.add('visible'); }
function showMilestones() { hideAllPages(); milestonesPage.classList.remove('hidden'); milestonesPage.classList.add('visible'); }
function showLogs() { hideAllPages(); logsPage.classList.remove('hidden'); logsPage.classList.add('visible'); }

// --- THE BOUNCER LOGIC ---
function requireAuth(event, targetPageFunction) {
    event.preventDefault();
    if (currentUser) {
        targetPageFunction(); // Let them in!
    } else {
        window.location.href = "login.html"; // Kick to login
    }
}

// --- ATTACH EVENT LISTENERS ---
// Public Buttons
homeBtn.addEventListener('click', openHomePage);
hardwareBtn.addEventListener('click', openHardwarePage);
teamBtn.addEventListener('click', openTeamPage);

// Protected Buttons (Properly hooked up to the Bouncer)
launchBtn.addEventListener('click', (e) => requireAuth(e, showDashboard));
viewDashboardBtn.addEventListener('click', (e) => requireAuth(e, showDashboard)); // <--- This fixes the click doing nothing!
economicsBtn.addEventListener('click', (e) => requireAuth(e, showEconomics));
systemRoiBtn.addEventListener('click', (e) => requireAuth(e, showEconomics));
milestonesBtn.addEventListener('click', (e) => requireAuth(e, showMilestones));
logsBtn.addEventListener('click', (e) => requireAuth(e, showLogs));
systemRoiBtn.addEventListener('click', (e) => requireAuth(e, showEconomics));
milestonesBtn.addEventListener('click', (e) => requireAuth(e, showMilestones));
logsBtn.addEventListener('click', (e) => requireAuth(e, showLogs));
// ==========================================
// MOBILE HAMBURGER MENU LOGIC
// ==========================================
const hamburger = document.querySelector('.hamburger-menu');
const navContainer = document.querySelector('.nav-links-container');
const navLinksList = document.querySelectorAll('.nav-links');

// 1. Toggle Menu when Hamburger is clicked
hamburger?.addEventListener('click', () => {
    navContainer.classList.toggle('active');
    
    // Animate the icon from Hamburger to X
    const icon = hamburger.querySelector('i');
    if (navContainer.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
    } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    }
});

// 2. Auto-close the menu when a link is clicked
navLinksList.forEach(link => {
    link.addEventListener('click', () => {
        navContainer.classList.remove('active');
        
        // Reset the icon back to Hamburger
        const icon = hamburger.querySelector('i');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    });
});

// ==========================================
// 3. CHART INITIALIZATION
// ==========================================

// CHART 1: VOLTAGE (Emptied out to prepare for Live Firebase Data)
const voltageChartCtx = document.getElementById('voltageChart').getContext('2d');
const voltageLineChart = new Chart(voltageChartCtx, {
    type: 'line',
    data: {
        labels: [], // Started empty
        datasets: [{
            label: 'Solar(V)',
            data: [], // Started empty
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
        },
        {
            label: 'Wind(V)',
            data: [], // Started empty (Ready for when you add Wind to Firebase later)
            borderColor: '#84CC16',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'bottom' } },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.1)', type: 'dashed' },
                border: { dash: [5, 5] }
            },
            x: { grid: { display: false } }
        }
    }
});

// CHART 2: CURRENT (Left static for now, unchanged)
const currentChartCtx = document.getElementById('currentChart').getContext('2d');
const currentLineChart = new Chart(currentChartCtx, {
    type: 'line',
    data: {
        labels: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'],
        datasets: [{
            label: 'Solar(A)',
            data: [2.5, 6.5, 25.3, 80.9, 245.4, 455.2, 198.5, 69.2, 2.9, 0.3],
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointRadius: 2.5,
            pointBorderWidth: 1.5,
        },
        {
            label: 'Wind(A)',
            data: [0.2, 85.6, 275.3, 580.9, 385.4, 255.2, 98.5, 9.2, 0.9, 0.01],
            borderColor: '#84CC16',
            backgroundColor: 'rgba(132, 204, 22, 0.1)',
            borderWidth: 3,
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointRadius: 2.5,
            pointBorderWidth: 1.5,
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'bottom' } },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.1)', lineWidth: 1 },
                border: { dash: [5, 5] }
            },
            x: { grid: { display: false } }
        }
    }
});
/// ==========================================
// 5. LIVE WEATHER & FORECAST PREDICTION API
// ==========================================

// ==========================================
// 5. LIVE WEATHER & FORECAST PREDICTION API
// ==========================================

// THE HACKATHON SWITCH: 
// Change this to "LIVE", "SUNNY", or "STORMY" before your presentation!
const DEMO_MODE = "LIVE"; 

async function fetchWeatherAndPredict() {
    // We put Mumbai back as the default location
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=36.4500&longitude=-116.8667&current=temperature_2m,is_day,cloud_cover,wind_speed_10m,weather_code&hourly=temperature_2m,is_day,cloud_cover,wind_speed_10m,weather_code&forecast_hours=12&timezone=auto';

    try {
        // Added 'no-cache' so the browser never uses old, saved weather
        const response = await fetch(url, { cache: "no-store" });
        const data = await response.json();
        
        const weatherCards = document.querySelectorAll('.weather-card');
        const currentCard = weatherCards[0];
        const forecastCard = weatherCards[1];

        /* --- DEMO MODE OVERRIDE LOGIC --- */
        let current = data.current;
        let hourly = data.hourly;

        if (DEMO_MODE === "SUNNY") {
            // Forces perfect daytime solar conditions
            current = { temperature_2m: 34, is_day: 1, cloud_cover: 5, wind_speed_10m: 8, weather_code: 0 };
        } else if (DEMO_MODE === "STORMY") {
            // Forces heavy clouds, rain, and high wind
            current = { temperature_2m: 22, is_day: 1, cloud_cover: 95, wind_speed_10m: 35, weather_code: 65 };
        }

        /* =====================================================
           PART 1: CURRENT WEATHER (Card 1)
           ===================================================== */
        currentCard.querySelector('.temp').innerHTML = `${Math.round(current.temperature_2m)}&deg;C`;

        let currText = "Clear & Sunny";
        let currIcon = "fas fa-sun";
        let currIconColor = "#FACC15"; 

        if (current.is_day === 0) { currText = "Clear Night"; currIcon = "fas fa-moon"; currIconColor = "#9CA3AF"; }
        if (current.cloud_cover > 40) { currText = "Mostly Cloudy"; currIcon = "fas fa-cloud"; currIconColor = "#9CA3AF"; }
        if (current.weather_code >= 50 && current.weather_code <= 69) { currText = "Rain Showers"; currIcon = "fas fa-cloud-rain"; currIconColor = "#3B82F6"; }

        currentCard.querySelector('.weather-conditions-text').innerText = currText;
        const currentIconEl = currentCard.querySelector('.weather-conditions-container > i');
        currentIconEl.className = currIcon;
        currentIconEl.style.color = currIconColor;

        // Current Physics Math
        let currSolarPot = (current.is_day === 1) ? (100 - current.cloud_cover) : 0;
        let currWindPot = Math.min((current.wind_speed_10m / 25) * 100, 100); 
        
        if (currSolarPot === 0 && currWindPot === 0) currWindPot = 100; // Baseline fallback
        
        let currTotal = currSolarPot + currWindPot;
        let currSolarPct = Math.round((currSolarPot / currTotal) * 100);
        let currWindPct = 100 - currSolarPct;

        // Update Current Grid
        currentCard.querySelector('.solar-generation').innerText = `${currSolarPct}%`;
        currentCard.querySelector('.wind-generation').innerText = `${currWindPct}%`;
        currentCard.querySelector('.generation-distribution-grid').style.gridTemplateColumns = `${currSolarPct}fr ${currWindPct}fr`;


        /* =====================================================
           PART 2: 12-HOUR FORECAST (Card 2)
           ===================================================== */
        // (Forecast always uses the LIVE API data to show it actually works)
        let totalTemp = 0, totalSolarPot = 0, totalWindPot = 0;
        let willRain = false;
        let daylightHours = 0;

        for (let i = 0; i < 12; i++) {
            totalTemp += hourly.temperature_2m[i];
            if (hourly.is_day[i] === 1) daylightHours++;
            if (hourly.weather_code[i] >= 50 && hourly.weather_code[i] <= 69) willRain = true;

            totalSolarPot += (hourly.is_day[i] === 1) ? (100 - hourly.cloud_cover[i]) : 0;
            totalWindPot += Math.min((hourly.wind_speed_10m[i] / 25) * 100, 100);
        }

        const avgTemp = Math.round(totalTemp / 12);
        forecastCard.querySelector('.temp').innerHTML = `${avgTemp}&deg;C`;

        let foreText = "Clear Skies Ahead";
        let foreIcon = "fas fa-sun";
        let foreIconColor = "#FACC15";

        if (daylightHours < 4) { foreText = "Clear Night Ahead"; foreIcon = "fas fa-moon"; foreIconColor = "#9CA3AF"; }
        if (totalSolarPot / 12 < 30 && daylightHours >= 4) { foreText = "Incoming Cloud Cover"; foreIcon = "fas fa-cloud"; foreIconColor = "#9CA3AF"; }
        if (totalWindPot / 12 > 60) { foreText = "High Winds Expected"; foreIcon = "fas fa-wind"; foreIconColor = "#9CA3AF"; }
        if (willRain) { foreText = "Rain Expected Soon"; foreIcon = "fas fa-cloud-rain"; foreIconColor = "#3B82F6"; }

        forecastCard.querySelector('.weather-conditions-text').innerText = foreText;
        const forecastIconEl = forecastCard.querySelector('.weather-conditions-container > i');
        forecastIconEl.className = `${foreIcon} forecast`; 
        forecastIconEl.style.color = foreIconColor;

        if (totalSolarPot === 0 && totalWindPot === 0) totalWindPot = 100;
        let foreTotal = totalSolarPot + totalWindPot;
        let foreSolarPct = Math.round((totalSolarPot / foreTotal) * 100);
        let foreWindPct = 100 - foreSolarPct;

        forecastCard.querySelector('.solar-generation').innerText = `${foreSolarPct}%`;
        forecastCard.querySelector('.wind-generation').innerText = `${foreWindPct}%`;
        forecastCard.querySelector('.grid2').style.gridTemplateColumns = `${foreSolarPct}fr ${foreWindPct}fr`;

    } catch (error) {
        console.error("Failed to fetch live weather data.", error);
    }
}

fetchWeatherAndPredict();
setInterval(fetchWeatherAndPredict, 900000);

// ==========================================
// 6. MULTI-LANGUAGE VOICE ASSISTANT
// ==========================================

// Dummy Data (Eventually, you can link these to your Firebase data variables!)
let voiceSolarVoltage = 15.2; 
let voiceWindVoltage = 12.8;
let voiceTotalVoltage = (voiceSolarVoltage + voiceWindVoltage).toFixed(1);
let voicePowerSolar = 150; 
let voicePowerWind = 95; 
let voiceTotalPower = voicePowerSolar + voicePowerWind;
let voiceMoneySaved = 113; 

const langConfig = {
    'en-US': {
        keywords: {
            solarV: ['solar voltage', 'solar output'],
            windV: ['wind voltage', 'turbine voltage', 'wind turbine'],
            totalV: ['total voltage', 'full voltage'],
            solarP: ['solar power'],
            windP: ['wind power'],
            totalP: ['total power', 'both power', 'combined power'],
            money: ['money', 'saved', 'rupees']
        },
        responses: {
            solarV: `Solar voltage is ${voiceSolarVoltage} Volts.`,
            windV: `Wind turbine voltage is ${voiceWindVoltage} Volts.`,
            totalV: `Combined system voltage is ${voiceTotalVoltage} Volts.`,
            solarP: `Solar power generated is ${voicePowerSolar} Watts.`,
            windP: `Wind power generated is ${voicePowerWind} Watts.`,
            totalP: `Total power from both sources is ${voiceTotalPower} Watts.`,
            money: `You have saved ${voiceMoneySaved} Rupees.`,
            error: "I didn't catch that. Please ask about solar, wind, or total power."
        }
    },
    'hi-IN': {
        keywords: {
            solarV: ['सोलर वोल्टेज', 'सोलर आउटपुट', 'solar voltage'],
            windV: ['विंड वोल्टेज', 'टरबाइन वोल्टेज', 'विंड टरबाइन', 'wind voltage'],
            totalV: ['कुल वोल्टेज', 'टोटल वोल्टेज', 'total voltage'],
            solarP: ['सोलर पावर', 'सौर ऊर्जा', 'solar power'],
            windP: ['विंड पावर', 'पवन ऊर्जा', 'wind power'],
            totalP: ['कुल पावर', 'दोनों पावर', 'total power'],
            money: ['पैसा', 'बचत', 'रुपये', 'rupees', 'saved']
        },
        responses: {
            solarV: `सोलर वोल्टेज ${voiceSolarVoltage} वोल्ट है।`,
            windV: `विंड टरबाइन वोल्टेज ${voiceWindVoltage} वोल्ट है।`,
            totalV: `कुल सिस्टम वोल्टेज ${voiceTotalVoltage} वोल्ट है।`,
            solarP: `सोलर पावर ${voicePowerSolar} वाट है।`,
            windP: `विंड पावर ${voicePowerWind} वाट है।`,
            totalP: `दोनों स्रोतों से कुल पावर ${voiceTotalPower} वाट है।`,
            money: `आपने ${voiceMoneySaved} रुपये बचाए हैं।`,
            error: "क्षमा करें, समझ नहीं आया। कृपया सोलर या विंड पावर के बारे में पूछें।"
        }
    },
    'mr-IN': {
        keywords: {
            solarV: ['सोलर व्होल्टेज', 'सौर व्होल्टेज', 'solar voltage'],
            windV: ['विंड व्होल्टेज', 'वारा टरबाइन', 'टरबाइन व्होल्टेज', 'wind voltage'],
            totalV: ['एकूण व्होल्टेज', 'टोटल व्होल्टेज', 'total voltage'],
            solarP: ['सोलर पावर', 'सौर ऊर्जा', 'solar power'],
            windP: ['विंड पावर', 'पवन ऊर्जा', 'wind power'],
            totalP: ['एकूण ऊर्जा', 'एकूण पावर', 'total power'],
            money: ['पैसे', 'बचत', 'रुपये', 'rupees', 'saved']
        },
        responses: {
            solarV: `सोलर व्होल्टेज ${voiceSolarVoltage} व्होल्ट आहे.`,
            windV: `विंड टरबाइन व्होल्टेज ${voiceWindVoltage} व्होल्ट आहे.`,
            totalV: `एकूण सिस्टम व्होल्टेज ${voiceTotalVoltage} व्होल्ट आहे.`,
            solarP: `सौर ऊर्जा ${voicePowerSolar} वॅट आहे.`,
            windP: `पवन ऊर्जा ${voicePowerWind} वॅट आहे.`,
            totalP: `दोन्ही स्रोतांची एकूण ऊर्जा ${voiceTotalPower} वॅट आहे.`,
            money: `तुम्ही ${voiceMoneySaved} रुपये वाचवले आहेत.`,
            error: "मला समजले नाही. कृपया सोलर किंवा पवन ऊर्जेबद्दल विचारा."
        }
    },
    'gu-IN': {
        keywords: {
            solarV: ['સોલર વોલ્ટેજ', 'સોલર આઉટપુટ', 'solar voltage'],
            windV: ['વિન્ડ વોલ્ટેજ', 'ટર્બાઇન વોલ્ટેજ', 'પવન ટર્બાઇન', 'wind voltage'],
            totalV: ['કુલ વોલ્ટેજ', 'total voltage'],
            solarP: ['સોલર પાવર', 'solar power'],
            windP: ['વિન્ડ પાવર', 'પવન પાવર', 'wind power'],
            totalP: ['કુલ પાવર', 'total power'],
            money: ['પૈસા', 'બચત', 'રૂપિયા', 'rupees', 'saved']
        },
        responses: {
            solarV: `સોલર વોલ્ટેજ ${voiceSolarVoltage} વોલ્ટ છે.`,
            windV: `વિન્ડ ટર્બાઇન વોલ્ટેજ ${voiceWindVoltage} વોલ્ટ છે.`,
            totalV: `કુલ સિસ્ટમ વોલ્ટેજ ${voiceTotalVoltage} વોલ્ટ છે.`,
            solarP: `સોલર પાવર ${voicePowerSolar} વોટ છે.`,
            windP: `પવન પાવર ${voicePowerWind} વોટ છે.`,
            totalP: `કુલ પાવર ${voiceTotalPower} વોટ છે.`,
            money: `તમે ${voiceMoneySaved} રૂપિયા બચાવ્યા છે.`,
            error: "મને સમજાયું નથી. કૃપા કરીને સોલર અથવા વિન્ડ પાવર વિશે પૂછો."
        }
    }
};

const startBtn = document.getElementById('startBtn');
const langSelect = document.getElementById('langSelect');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Force browser to load voice packs
window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };

if (!SpeechRecognition) {
    console.log("Speech API not supported in this browser.");
} else {
    const recognition = new SpeechRecognition();

    startBtn.addEventListener('click', async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            recognition.lang = langSelect.value;
            recognition.start();
        } catch (e) {
            alert("Microphone access denied.");
        }
    });

    recognition.onstart = () => {
        // This class toggles the CSS expansion and the red color!
        startBtn.classList.add('listening'); 
    };

    recognition.onend = () => {
        // This shrinks it back to a green circle
        startBtn.classList.remove('listening');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        const selectedLang = langSelect.value;
        const config = langConfig[selectedLang];
        
        console.log(`Heard: "${transcript}"`);
        let reply = config.responses.error;

        if (match(transcript, config.keywords.solarV)) reply = config.responses.solarV;
        else if (match(transcript, config.keywords.windV)) reply = config.responses.windV;
        else if (match(transcript, config.keywords.totalV)) reply = config.responses.totalV;
        else if (match(transcript, config.keywords.solarP)) reply = config.responses.solarP;
        else if (match(transcript, config.keywords.windP)) reply = config.responses.windP;
        else if (match(transcript, config.keywords.totalP)) reply = config.responses.totalP;
        else if (match(transcript, config.keywords.money)) reply = config.responses.money;

        speak(reply, selectedLang);
    };

    function match(input, keys) {
        return keys.some(k => input.includes(k));
    }

    // THE NATIVE OFFLINE TTS ENGINE
    function speak(text, langCode) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode;
        
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => voice.lang.includes(langCode));
        if (preferredVoice) utterance.voice = preferredVoice;
        
        window.speechSynthesis.speak(utterance);
    }
}