const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testGemini() {
    console.log("Testing Gemini API...");
    const key = process.env.GEMINI_API_KEY;
    console.log("Key present:", !!key);

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // or gemini-pro

    try {
        const result = await model.generateContent("Who is the president of France?");
        const response = await result.response;
        console.log("Gemini Success:", response.text());
    } catch (error) {
        console.error("Gemini Error:", error.message);
    }
}

testGemini();
