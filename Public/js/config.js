// NOTE: Environment variables (.env) won't work directly in client-side JavaScript.
// If you are running this in a frontend application, you must manually replace the values with your actual keys.
// Do NOT expose sensitive keys in public repositories.

// Firebase Configuration
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};
// Realtime Database rules are included in the `Readme.md` file

// Gemini Configuration
const geminiConfiguration = {
    API_KEY: process.env.GEMINI_API_KEY,
    BASE_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=",
    TEST_KEY: process.env.GEMINI_TEST_KEY // This key is something I added myself for testing. 
                                         //  so the AI knows I'm a developer 
                                         // and follows the instructions.
                                         // It doesn't come with the Gemini config by default.
                                         // You can ignore it or set it to any value (e.g., 123 or "test"). 
                                         // You can see its usage in `editor.js` at line 331.

                                    
};


// Supabase Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Initialize Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Utility Functions
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// GitHub OAuth client ID
const githubClientId = process.env.GITHUB_CLIENT_ID;
