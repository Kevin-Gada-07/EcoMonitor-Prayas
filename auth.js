// ==========================================
// 1. FIREBASE IMPORTS & INITIALIZATION
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

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

// ==========================================
// 2. DOM ELEMENTS (Grabbing the UI)
// ==========================================
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authBtn = document.getElementById('auth-btn');
const formSubtitle = document.getElementById('form-subtitle');
const toggleModeBtn = document.getElementById('toggle-mode');
const toggleText = document.getElementById('toggle-text');

let isLoginMode = true; 

// ==========================================
// 3. UI TOGGLE: SWITCH BETWEEN LOGIN & SIGNUP
// ==========================================
toggleModeBtn.addEventListener('click', () => {
    isLoginMode = !isLoginMode; 

    if (isLoginMode) {
        authBtn.innerText = "Sign In";
        formSubtitle.innerText = "Sign in to view your system telemetry";
        toggleText.innerHTML = `Don't have an account? <span id="toggle-mode">Sign up here</span>`;
    } else {
        authBtn.innerText = "Create Account";
        formSubtitle.innerText = "Register your new EcoMonitor hardware";
        toggleText.innerHTML = `Already have an account? <span id="toggle-mode">Sign in here</span>`;
    }

    document.getElementById('toggle-mode').addEventListener('click', toggleModeBtn.click);
});

// ==========================================
// 4. THE SUBMIT EVENT: TALKING TO FIREBASE
// ==========================================
authForm.addEventListener('submit', (e) => {
    e.preventDefault(); 
    
    const email = emailInput.value;
    const password = passwordInput.value;

    const originalBtnText = authBtn.innerText;
    authBtn.innerText = "Authenticating...";
    authBtn.disabled = true;

    if (isLoginMode) {
        // --- LOGIN LOGIC ---
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                window.location.href = "index.html"; // Ensure this points back to your main file
            })
            .catch((error) => {
                alert("Login Failed: " + error.message);
                authBtn.innerText = originalBtnText;
                authBtn.disabled = false;
            });
    } else {
        // --- SIGN UP LOGIC (With Database Vault Creation) ---
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                
                // Build their database vault
               // Build their database vault
                set(ref(db, 'users/' + user.uid), {
                    profile: {
                        email: user.email,
                        role: "user",
                        createdAt: new Date().toISOString()
                    },
                    telemetry: {
                        solarVoltage: 0.0,
                        windVoltage: 0.0,
                        solarCurrent: 0.0,
                        windCurrent: 0.0,
                        totalPower: 0.0,
                        cloudCover: 0,        // NEW: Weather/Cloud cover percentage
                        gridMode: "Islanding" // NEW: "Islanding", "Exporting", etc.
                    }
                })
                .then(() => {
                    window.location.href = "index.html"; // Send to main file after setup
                })
                .catch((dbError) => {
                    console.error("Auth succeeded, but Database creation failed:", dbError);
                    alert("Account created, but failed to set up data vault.");
                });
            })
            .catch((error) => {
                alert("Registration Failed: " + error.message);
                authBtn.innerText = originalBtnText;
                authBtn.disabled = false;
            });
    }
});