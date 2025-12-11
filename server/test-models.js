require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GEMINI_KEY);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Just to init
        // There isn't a direct listModels on the client instance in some versions, 
        // but let's try to just run a simple generation with a known safe model like 'gemini-pro'
        // or actually, the error message suggested "Call ListModels to see the list".
        // The Node SDK might not expose listModels directly on the main class easily without looking at docs.
        // Let's try to use the model that usually works: gemini-pro.

        console.log("Testing gemini-pro...");
        const modelPro = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await modelPro.generateContent("Hello");
        console.log("gemini-pro works:", await result.response.text());

        console.log("Testing gemini-1.5-flash...");
        const modelFlash = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const resultFlash = await modelFlash.generateContent("Hello");
        console.log("gemini-1.5-flash works:", await resultFlash.response.text());

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
