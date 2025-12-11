const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ No GEMINI_API_KEY found in .env file.");
    process.exit(1);
}

console.log(`🔑 Testing API Key: ${API_KEY.substring(0, 5)}...${API_KEY.substring(API_KEY.length - 4)}`);

async function verifyKey() {
    try {
        // 1. Try to list models - this verifies the key and project status
        console.log("\n📡 Attempting to list available models...");
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);

        console.log("✅ API Key is VALID!");
        console.log("✅ Generative AI API is ENABLED.");

        const models = response.data.models;
        console.log(`\n📋 Found ${models.length} available models:`);

        const flashModel = models.find(m => m.name.includes('flash'));
        const proModel = models.find(m => m.name.includes('pro'));

        models.forEach(m => {
            console.log(`   - ${m.name} (${m.displayName})`);
        });

        if (flashModel) {
            console.log(`\n✨ Recommended model found: ${flashModel.name}`);
        } else if (proModel) {
            console.log(`\n✨ Recommended model found: ${proModel.name}`);
        } else {
            console.log("\n⚠️ No standard 'flash' or 'pro' models found. You might need to enable them in Google Cloud Console.");
        }

        // 2. Try a simple generation
        console.log("\n🧪 Testing text generation with the first available model...");
        const testModel = flashModel ? flashModel.name : models[0].name;
        const genUrl = `https://generativelanguage.googleapis.com/v1beta/${testModel}:generateContent?key=${API_KEY}`;

        const genResponse = await axios.post(genUrl, {
            contents: [{ parts: [{ text: "Say 'Hello, World!'" }] }]
        });

        console.log(`✅ Generation Successful! Response: "${genResponse.data.candidates[0].content.parts[0].text.trim()}"`);

    } catch (error) {
        console.error("\n❌ API Verification FAILED.");
        if (error.response) {
            console.error(`   Status: ${error.response.status} ${error.response.statusText}`);
            console.error("   Error Details:", JSON.stringify(error.response.data, null, 2));

            if (error.response.status === 400 && error.response.data.error.message.includes("API_KEY_INVALID")) {
                console.error("\n👉 ACTION: Your API Key is invalid. Please generate a new one at https://aistudio.google.com/app/apikey");
            } else if (error.response.status === 403) {
                console.error("\n👉 ACTION: The API Key is valid, but the API is not enabled. Enable 'Generative Language API' in Google Cloud Console.");
            }
        } else {
            console.error("   Error:", error.message);
        }
    }
}

verifyKey();
