const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, serverTimestamp } = require("firebase/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyBUPmtsWmM5tvFBDiloryBGgWBX9vIeU4w",
    authDomain: "uptura-leads.firebaseapp.com",
    projectId: "uptura-leads",
    storageBucket: "uptura-leads.firebasestorage.app",
    messagingSenderId: "146306181969",
    appId: "1:146306181969:web:c91b776edc33f652c2c170",
    measurementId: "G-ELHWMEHZ9W"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const dummyLeads = [
    { name: "John Doe", email: "john@example.com", phone: "+123456789", company: "Doe Corp", message: "I need a high-performance website for my business.", utm_source: "google", utm_medium: "cpc", utm_campaign: "web_dev" },
    { name: "Jane Smith", email: "jane@smith.me", phone: "+987654321", company: "Smith Solutions", message: "Interested in improving our SEO rankings.", utm_source: "facebook", utm_medium: "social", utm_campaign: "seo_boost" },
    { name: "Michael Brown", email: "michael@brownai.com", phone: "+112233445", company: "Brown AI", message: "Looking for AI consultancy to automate our workflows.", utm_source: "linkedin", utm_medium: "referral", utm_campaign: "ai_automation" },
    { name: "Sarah Wilson", email: "sarah@wilson.design", phone: "+556677889", company: "Wilson Design", message: "Our current website needs a complete redesign.", utm_source: "instagram", utm_medium: "social", utm_campaign: "redesign" },
    { name: "Robert Taylor", email: "robert@taylor.tech", phone: "+998877665", company: "Taylor Tech", message: "Need a custom mobile app for our field agents.", utm_source: "google", utm_medium: "search", utm_campaign: "app_dev" }
];

async function seed() {
    console.log("Starting seeding process...");
    try {
        for (const lead of dummyLeads) {
            await addDoc(collection(db, "leads"), {
                ...lead,
                createdAt: serverTimestamp(),
                pageUrl: "local-seed-script",
                userAgent: "Node.js Seeder Script"
            });
            console.log(`Added lead: ${lead.name}`);
        }
        console.log("Success! 5 leads seeded.");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

seed();
