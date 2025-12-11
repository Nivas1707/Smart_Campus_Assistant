require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
    console.log("Testing Gemini API...");
    if (!process.env.GEMINI_API_KEY) {
        console.error("ERROR: GEMINI_API_KEY is missing in .env");
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Try gemini-pro (most standard)
        console.log("Attempting with model: gemini-pro");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Say 'Hello from Gemini Pro!'");
        console.log("Success! Response:", result.response.text());
    } catch (error) {
        console.error("Gemini API Failed (Message):", error.message);
        console.error("Gemini API Failed (Full):", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    }
}

testGemini();
