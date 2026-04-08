// ==========================================
// 1. FIREBASE IMPORTS & INITIALIZATION
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

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

// GLOBAL TRACKERS
let currentUser = null;
let telemetryListener = null;

const signOutBtn = document.getElementById('navbar-sign-out');

// ==========================================
// 2. THE MASTER AUTH & TELEMETRY LISTENER
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log("User is logged in:", user.email);
        if (signOutBtn) signOutBtn.style.display = 'block';

        const userTelemetryRef = ref(db, 'users/' + user.uid + '/telemetry');
        
        telemetryListener = onValue(userTelemetryRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // --- 1. GRAB EXACT VARIABLES FROM NEW FIREBASE STRUCTURE ---
                const sVolt = data.solarVoltage || 0;
                const sCurr = data.solarCurrent || 0;
                const sPow  = data.solarPower || 0; 
                
                const wVolt = data.windVoltage || 0; 
                const wCurr = data.windCurrent || 0;
                const wPow  = data.windPower || 0;

                const totalCombinedPower = data.totalPower || (sPow + wPow);

                // --- 2. UPDATE SOLAR UI ---
                const solarVolt = document.getElementById('solar-voltage');
                const solarCurr = document.getElementById('solar-current');
                const solarPow  = document.getElementById('solar-power');
                
                if (solarVolt) solarVolt.innerText = sVolt.toFixed(2);
                if (solarCurr) solarCurr.innerText = sCurr.toFixed(2);
                if (solarPow)  solarPow.innerHTML = `${sPow.toFixed(2)} <span class="watt">mW</span>`;

                // --- 3. UPDATE WIND UI ---
                const windVolt = document.getElementById('wind-voltage');
                const windCurr = document.getElementById('wind-current');
                const windPow  = document.getElementById('wind-power');

                if (windVolt) windVolt.innerText = wVolt.toFixed(2);
                if (windCurr) windCurr.innerText = wCurr.toFixed(2);
                if (windPow)  windPow.innerHTML = `${wPow.toFixed(2)} <span class="watt">mW</span>`;

                // --- 4. UPDATE TOTAL POWER UI ---
                const totalPowEl = document.getElementById('total-power');
                if (totalPowEl) totalPowEl.innerText = totalCombinedPower.toFixed(1);

                // --- 5. LOAD SHEDDING LOGIC ---
                const updateLoadUI = (elementId, status) => {
                    const el = document.getElementById(elementId);
                    if (!el) return;
                    if (status === 1 || status === "ON") {
                        el.innerText = (elementId === 'load-hospital') ? "Priority On" : "Active";
                        el.className = "status-badge on";
                    } else {
                        el.innerText = "Shed";
                        el.className = "status-badge off";
                    }
                };
                updateLoadUI('load-hospital', data.Status_Hospital ?? 1); 
                updateLoadUI('load-streetlights', data.Status_Streetlights ?? 1);
                updateLoadUI('load-house', data.Status_House ?? 0);

                // --- 6. ECONOMICS & ROI ENGINE ---
                const RATE_PER_KWH = 8.00;
                const SYSTEM_COST = 3500.00;
                const CO2_PER_KWH = 0.85;

                let baseKWh = data.lifetime_kWh || 14.2;
                const live_kW = (parseFloat(totalCombinedPower) / 1000000); 
                const demoMultiplier = 1000; 
                const lifetimeKWh = baseKWh + (live_kW * demoMultiplier);

                const moneySaved = lifetimeKWh * RATE_PER_KWH;
                const carbonOffset = lifetimeKWh * CO2_PER_KWH;
                const roiPercentage = (moneySaved / SYSTEM_COST) * 100;

                const ecoKwhEl = document.getElementById('eco-total-kwh');
                const ecoMoneyEl = document.getElementById('eco-money-saved');
                const ecoCarbonEl = document.getElementById('eco-carbon');
                const ecoRoiPercentEl = document.getElementById('eco-roi-percent');
                const ecoRoiBarEl = document.getElementById('eco-roi-bar');
                const ecoRecoveredEl = document.getElementById('eco-recovered-text');

                if (ecoKwhEl) ecoKwhEl.innerHTML = `${lifetimeKWh.toFixed(2)} <span class="text-sm font-normal text-gray-400">kWh</span>`;
                if (ecoMoneyEl) ecoMoneyEl.innerText = `₹ ${moneySaved.toFixed(2)}`;
                if (ecoCarbonEl) ecoCarbonEl.innerHTML = `${carbonOffset.toFixed(1)} <span class="text-sm font-normal text-gray-300">kg CO2</span>`;
                if (ecoRoiPercentEl) ecoRoiPercentEl.innerText = `${roiPercentage.toFixed(1)}%`;
                if (ecoRecoveredEl) ecoRecoveredEl.innerText = `Recovered: ₹${moneySaved.toFixed(2)}`;
                if (ecoRoiBarEl) ecoRoiBarEl.style.width = `${Math.min(roiPercentage, 100)}%`; 

                // --- 7. ANIMATE 3D TURBINE ---
                if (window.turbineSpinSpeed !== undefined) {
                    window.turbineSpinSpeed = (wVolt > 0.5) ? 0.08 : 0.0;
                }

                // --- 8. GENERATE TIMESTAMP FOR GRAPHS ---
                const now = new Date();
                const timeLabel = now.getHours() + ':' + 
                                  now.getMinutes().toString().padStart(2, '0') + ':' + 
                                  now.getSeconds().toString().padStart(2, '0');

                // --- 9. LIVE VOLTAGE CHART UPDATE ---
                if (typeof voltageLineChart !== 'undefined') {
                    voltageLineChart.data.labels.push(timeLabel);
                    voltageLineChart.data.datasets[0].data.push(sVolt); 
                    voltageLineChart.data.datasets[1].data.push(wVolt); 

                    if (voltageLineChart.data.labels.length > 15) {
                        voltageLineChart.data.labels.shift();
                        voltageLineChart.data.datasets[0].data.shift();
                        voltageLineChart.data.datasets[1].data.shift();
                    }
                    voltageLineChart.update('none'); 
                }

                // --- 10. LIVE CURRENT CHART UPDATE ---
                if (typeof currentLineChart !== 'undefined') {
                    currentLineChart.data.labels.push(timeLabel);
                    currentLineChart.data.datasets[0].data.push(sCurr); 
                    currentLineChart.data.datasets[1].data.push(wCurr); 

                    if (currentLineChart.data.labels.length > 15) {
                        currentLineChart.data.labels.shift();
                        currentLineChart.data.datasets[0].data.shift();
                        currentLineChart.data.datasets[1].data.shift();
                    }
                    currentLineChart.update('none'); 
                }
            }
        }, (error) => {
            console.error("Firebase connection failed:", error);
        });

    } else {
        currentUser = null;
        if (signOutBtn) signOutBtn.style.display = 'none';
        if (telemetryListener) telemetryListener(); 
    }
});

if (signOutBtn) {
    signOutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth).then(() => window.location.reload());
    });
}

// ==========================================
// 3. UI NAVIGATION LOGIC (The Bouncer)
// ==========================================
const pages = {
    home: document.getElementById('home-page'),
    dashboard: document.getElementById('dashboard'),
    hardware: document.getElementById('hardware'),
    economics: document.getElementById('economics'),
    milestones: document.getElementById('milestones'),
    logs: document.getElementById('logs'),
    team: document.getElementById('team')
};

function showPage(pageKey) {
    Object.values(pages).forEach(page => {
        if (page) {
            page.classList.add('hidden');
            page.classList.remove('visible');
        }
    });
    if (pages[pageKey]) {
        pages[pageKey].classList.remove('hidden');
        pages[pageKey].classList.add('visible');
    }
}

function requireAuth(event, targetPageKey) {
    event.preventDefault();
    if (currentUser) showPage(targetPageKey);
    else window.location.href = "login.html";
}

// Attach Event Listeners safely
document.querySelector(".home-button")?.addEventListener('click', (e) => { e.preventDefault(); showPage('home'); });
document.querySelector('.hardware-button')?.addEventListener('click', (e) => { e.preventDefault(); showPage('hardware'); });
document.querySelector('.team-button')?.addEventListener('click', (e) => { e.preventDefault(); showPage('team'); });

document.querySelector('.launch-system-button')?.addEventListener('click', (e) => requireAuth(e, 'dashboard'));
document.querySelector('.cta-btn')?.addEventListener('click', (e) => requireAuth(e, 'dashboard'));
document.querySelector('.economics-button')?.addEventListener('click', (e) => requireAuth(e, 'economics'));
document.querySelector('.view-impact-btn')?.addEventListener('click', (e) => requireAuth(e, 'economics'));
document.querySelector('.milestones-button')?.addEventListener('click', (e) => requireAuth(e, 'milestones'));
document.querySelector('.logs-button')?.addEventListener('click', (e) => requireAuth(e, 'logs'));


// ==========================================
// 4. MOBILE HAMBURGER MENU LOGIC (Strict Fix)
// ==========================================
const hamburger = document.querySelector('.hamburger-menu');
const navContainer = document.querySelector('.nav-links-container');
const navLinksList = document.querySelectorAll('.nav-links');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        if (!navContainer) return;
        navContainer.classList.toggle('active');
        const icon = hamburger.querySelector('i');
        if (icon) {
            if (navContainer.classList.contains('active')) {
                icon.classList.remove('fa-bars'); icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times'); icon.classList.add('fa-bars');
            }
        }
    });
}

if (navLinksList) {
    navLinksList.forEach(link => {
        link.addEventListener('click', () => {
            navContainer?.classList.remove('active');
            const icon = hamburger?.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-times'); icon.classList.add('fa-bars');
            }
        });
    });
}

// ==========================================
// 5. CHART INITIALIZATION (Starts Empty for Live Data)
// ==========================================
const vCtx = document.getElementById('voltageChart')?.getContext('2d');
const voltageLineChart = vCtx ? new Chart(vCtx, {
    type: 'line',
    data: {
        labels: [], 
        datasets: [
            { label: 'Solar(V)', data: [], borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 3, fill: true, tension: 0.4, pointRadius: 3 },
            { label: 'Wind(V)', data: [], borderColor: '#84CC16', backgroundColor: 'rgba(132, 204, 22, 0.1)', borderWidth: 3, fill: true, tension: 0.4, pointRadius: 3 }
        ]
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } } }
}) : null;

const cCtx = document.getElementById('currentChart')?.getContext('2d');
const currentLineChart = cCtx ? new Chart(cCtx, {
    type: 'line',
    data: {
        labels: [], 
        datasets: [
            { label: 'Solar(mA)', data: [], borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 3, borderDash: [5, 5], fill: false, tension: 0.4, pointRadius: 2.5 },
            { label: 'Wind(mA)', data: [], borderColor: '#84CC16', backgroundColor: 'rgba(132, 204, 22, 0.1)', borderWidth: 3, borderDash: [5, 5], fill: false, tension: 0.4, pointRadius: 2.5 }
        ]
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } } }
}) : null;

// ==========================================
// 6. LIVE WEATHER & FORECAST API
// ==========================================
const DEMO_MODE = "LIVE"; 

async function fetchWeatherAndPredict() {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=19.0760&longitude=72.8777&current=temperature_2m,is_day,cloud_cover,wind_speed_10m,weather_code&hourly=temperature_2m,is_day,cloud_cover,wind_speed_10m,weather_code&forecast_hours=12&timezone=auto';

    try {
        const response = await fetch(url, { cache: "no-store" });
        const data = await response.json();
        
        const weatherCards = document.querySelectorAll('.weather-card');
        if(weatherCards.length < 2) return;
        const currentCard = weatherCards[0];
        const forecastCard = weatherCards[1];

        let current = data.current;
        let hourly = data.hourly;

        if (DEMO_MODE === "SUNNY") {
            current = { temperature_2m: 34, is_day: 1, cloud_cover: 5, wind_speed_10m: 8, weather_code: 0 };
        } else if (DEMO_MODE === "STORMY") {
            current = { temperature_2m: 22, is_day: 1, cloud_cover: 95, wind_speed_10m: 35, weather_code: 65 };
        }

        // Current Weather Update
        const tempEl = currentCard.querySelector('.temp');
        if(tempEl) tempEl.innerHTML = `${Math.round(current.temperature_2m)}&deg;C`;

        let currText = "Clear & Sunny", currIcon = "fas fa-sun", currIconColor = "#FACC15"; 
        if (current.is_day === 0) { currText = "Clear Night"; currIcon = "fas fa-moon"; currIconColor = "#9CA3AF"; }
        if (current.cloud_cover > 40) { currText = "Mostly Cloudy"; currIcon = "fas fa-cloud"; currIconColor = "#9CA3AF"; }
        if (current.weather_code >= 50 && current.weather_code <= 69) { currText = "Rain Showers"; currIcon = "fas fa-cloud-rain"; currIconColor = "#3B82F6"; }

        const textEl = currentCard.querySelector('.weather-conditions-text');
        if(textEl) textEl.innerText = currText;
        const iconEl = currentCard.querySelector('.weather-conditions-container > i');
        if(iconEl) { iconEl.className = currIcon; iconEl.style.color = currIconColor; }

        let currSolarPot = (current.is_day === 1) ? (100 - current.cloud_cover) : 0;
        let currWindPot = Math.min((current.wind_speed_10m / 25) * 100, 100); 
        if (currSolarPot === 0 && currWindPot === 0) currWindPot = 100; 
        
        let currTotal = currSolarPot + currWindPot;
        let currSolarPct = Math.round((currSolarPot / currTotal) * 100);
        let currWindPct = 100 - currSolarPct;

        const solGenEl = currentCard.querySelector('.solar-generation');
        if(solGenEl) solGenEl.innerText = `${currSolarPct}%`;
        const windGenEl = currentCard.querySelector('.wind-generation');
        if(windGenEl) windGenEl.innerText = `${currWindPct}%`;
        const gridEl = currentCard.querySelector('.generation-distribution-grid');
        if(gridEl) gridEl.style.gridTemplateColumns = `${currSolarPct}fr ${currWindPct}fr`;

        // Forecast Weather Update
        let totalTemp = 0, totalSolarPot = 0, totalWindPot = 0, willRain = false, daylightHours = 0;
        for (let i = 0; i < 12; i++) {
            totalTemp += hourly.temperature_2m[i];
            if (hourly.is_day[i] === 1) daylightHours++;
            if (hourly.weather_code[i] >= 50 && hourly.weather_code[i] <= 69) willRain = true;
            totalSolarPot += (hourly.is_day[i] === 1) ? (100 - hourly.cloud_cover[i]) : 0;
            totalWindPot += Math.min((hourly.wind_speed_10m[i] / 25) * 100, 100);
        }

        const avgTemp = Math.round(totalTemp / 12);
        const fTempEl = forecastCard.querySelector('.temp');
        if(fTempEl) fTempEl.innerHTML = `${avgTemp}&deg;C`;

        let foreText = "Clear Skies Ahead", foreIcon = "fas fa-sun", foreIconColor = "#FACC15";
        if (daylightHours < 4) { foreText = "Clear Night Ahead"; foreIcon = "fas fa-moon"; foreIconColor = "#9CA3AF"; }
        if (totalSolarPot / 12 < 30 && daylightHours >= 4) { foreText = "Incoming Cloud Cover"; foreIcon = "fas fa-cloud"; foreIconColor = "#9CA3AF"; }
        if (totalWindPot / 12 > 60) { foreText = "High Winds Expected"; foreIcon = "fas fa-wind"; foreIconColor = "#9CA3AF"; }
        if (willRain) { foreText = "Rain Expected Soon"; foreIcon = "fas fa-cloud-rain"; foreIconColor = "#3B82F6"; }

        const fTextEl = forecastCard.querySelector('.weather-conditions-text');
        if(fTextEl) fTextEl.innerText = foreText;
        const fIconEl = forecastCard.querySelector('.weather-conditions-container > i');
        if(fIconEl) { fIconEl.className = `${foreIcon} forecast`; fIconEl.style.color = foreIconColor; }

        if (totalSolarPot === 0 && totalWindPot === 0) totalWindPot = 100;
        let foreTotal = totalSolarPot + totalWindPot;
        let foreSolarPct = Math.round((totalSolarPot / foreTotal) * 100);
        let foreWindPct = 100 - foreSolarPct;

        const fSolGenEl = forecastCard.querySelector('.solar-generation');
        if(fSolGenEl) fSolGenEl.innerText = `${foreSolarPct}%`;
        const fWindGenEl = forecastCard.querySelector('.wind-generation');
        if(fWindGenEl) fWindGenEl.innerText = `${foreWindPct}%`;
        const fGridEl = forecastCard.querySelector('.grid2');
        if(fGridEl) fGridEl.style.gridTemplateColumns = `${foreSolarPct}fr ${foreWindPct}fr`;

    } catch (error) {
        console.error("Failed to fetch live weather data.", error);
    }
}
fetchWeatherAndPredict();
setInterval(fetchWeatherAndPredict, 900000);

// ==========================================
// 7. MULTI-LANGUAGE VOICE ASSISTANT
// ==========================================
const langConfig = {
    'en-US': {
        keywords: { totalP: ['total power', 'both power', 'combined power'] },
        responses: { totalP: `Checking system output now.`, error: "I didn't catch that." }
    },
    'hi-IN': {
        keywords: { totalP: ['कुल पावर', 'दोनों पावर', 'total power'] },
        responses: { totalP: `सिस्टम आउटपुट की जांच कर रहा हूं।`, error: "क्षमा करें, समझ नहीं आया।" }
    }
};

const startBtn = document.getElementById('startBtn');
const langSelect = document.getElementById('langSelect');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };

if (SpeechRecognition && startBtn) {
    const recognition = new SpeechRecognition();

    startBtn.addEventListener('click', async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            recognition.lang = langSelect.value;
            recognition.start();
        } catch (e) { alert("Microphone access denied."); }
    });

    recognition.onstart = () => startBtn.classList.add('listening');
    recognition.onend = () => startBtn.classList.remove('listening');

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        const selectedLang = langSelect.value;
        const config = langConfig[selectedLang];
        
        let reply = config.responses.error;
        if (config.keywords.totalP.some(k => transcript.includes(k))) reply = config.responses.totalP;
        
        speak(reply, selectedLang);
    };

    function speak(text, langCode) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode;
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.includes(langCode) || v.lang.includes(langCode.split('-')[0]));
        if (preferredVoice) utterance.voice = preferredVoice;
        window.speechSynthesis.speak(utterance);
    }
}

// ==========================================
// 8. EMBEDDED 3D MODELS
// ==========================================
function init3DModels() {
    const solarContainer = document.getElementById('solar-model');
    const windContainer = document.getElementById('wind-model');
    
    if (!solarContainer || !windContainer) return;

    const structureMaterial = new THREE.MeshPhongMaterial({ color: 0x333333, specular: 0xaaaaaa, shininess: 30 });
    const blackTurbineMaterial = new THREE.MeshPhongMaterial({ color: 0x050505, specular: 0xffffff, shininess: 100, side: THREE.DoubleSide });
    const pvMaterial = new THREE.MeshPhongMaterial({ color: 0x0a1530, specular: 0x4466ff, shininess: 80 });
    const lineMat = new THREE.MeshPhongMaterial({ color: 0xdddddd, specular: 0xffffff, shininess: 150 });

    // Solar Scene
    const solarScene = new THREE.Scene();
    const solarCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    solarCamera.position.set(5, 5, 8);
    solarCamera.lookAt(0, 1, 0);

    const solarRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); 
    solarRenderer.setSize(100, 100); 
    solarContainer.appendChild(solarRenderer.domElement);

    solarScene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const sKeyLight = new THREE.DirectionalLight(0xffffff, 1.5); sKeyLight.position.set(5, 10, 5); solarScene.add(sKeyLight);
    const sFillLight = new THREE.DirectionalLight(0x90b0d0, 0.8); sFillLight.position.set(-5, 0, 5); solarScene.add(sFillLight);
    const sRimLight = new THREE.PointLight(0xffffff, 2); sRimLight.position.set(0, 5, -5); solarScene.add(sRimLight);

    const solarGroup = new THREE.Group();
    solarGroup.position.set(0, -1, 0);
    solarScene.add(solarGroup);

    solarGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.15, 32), structureMaterial));
    const sSupport = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.3, 2, 16), structureMaterial);
    sSupport.position.y = 1; solarGroup.add(sSupport);

    const panelContainer = new THREE.Group();
    panelContainer.position.y = 2.1; panelContainer.rotation.x = -Math.PI / 4; 
    solarGroup.add(panelContainer);
    panelContainer.add(new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.7, 0.2), structureMaterial));
    
    const panel = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 0.1), pvMaterial);
    panel.position.z = 0.1; panelContainer.add(panel);

    for(let i = -1.5; i <= 1.5; i += 0.75) {
        const vLine = new THREE.Mesh(new THREE.BoxGeometry(0.02, 2.5, 0.02), lineMat);
        vLine.position.set(i, 0, 0.06); panel.add(vLine);
    }
    for(let i = -1; i <= 1; i += 0.5) {
        const hLine = new THREE.Mesh(new THREE.BoxGeometry(4, 0.02, 0.02), lineMat);
        hLine.position.set(0, i, 0.06); panel.add(hLine);
    }

    // Wind Scene
    const windScene = new THREE.Scene();
    const windCamera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    windCamera.position.set(0, 5, 12); windCamera.lookAt(0, 5, 0);

    const windRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    windRenderer.setSize(100, 100);
    windContainer.appendChild(windRenderer.domElement);

    windScene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const wKeyLight = new THREE.DirectionalLight(0xffffff, 1.5); wKeyLight.position.set(5, 10, 5); windScene.add(wKeyLight);
    const wFillLight = new THREE.DirectionalLight(0x90b0d0, 0.8); wFillLight.position.set(-5, 0, 5); windScene.add(wFillLight);
    const wRimLight = new THREE.PointLight(0xffffff, 2); wRimLight.position.set(0, 5, -5); windScene.add(wRimLight);

    const vawtGroup = new THREE.Group();
    vawtGroup.position.set(0, -1, 0); windScene.add(vawtGroup);

    vawtGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 0.2, 32), structureMaterial));
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.5, 8, 16), structureMaterial);
    post.position.y = 4; vawtGroup.add(post);

    const controlBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.6), structureMaterial);
    controlBox.position.set(0.5, 4, 0); vawtGroup.add(controlBox);

    const vawtRotor = new THREE.Group();
    vawtRotor.position.y = 8.5; vawtGroup.add(vawtRotor);

    for (let i = 0; i < 3; i++) {
        const scoop = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 4, 16, 1, true, 0, Math.PI), blackTurbineMaterial);
        scoop.position.x = 1.1; scoop.rotation.y = Math.PI / 2; 
        const pivot = new THREE.Group(); pivot.rotation.y = (i * (Math.PI * 2) / 3);
        pivot.add(scoop); vawtRotor.add(pivot);
    }

    window.turbineSpinSpeed = 0.05; 

    function animate3D() {
        requestAnimationFrame(animate3D);
        if (vawtRotor) vawtRotor.rotation.y += window.turbineSpinSpeed;
        if (solarGroup) {
            solarGroup.rotation.y = Math.sin(Date.now() * 0.001) * 0.15;
            solarGroup.rotation.z = Math.sin(Date.now() * 0.0005) * 0.05;
        }
        solarRenderer.render(solarScene, solarCamera);
        windRenderer.render(windScene, windCamera);
    }
    animate3D();
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(init3DModels, 150); 
});