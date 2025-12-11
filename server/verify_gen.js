const { generateSummary } = require('./utils/aiService');
const mongoose = require('mongoose');
require('dotenv').config();

console.log("Checking Environment Variables...");
console.log("GROQ_API_KEY:", process.env.GROQ_API_KEY ? "Present" : "Missing");
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "Present" : "Missing");

async function testComp() {
    try {
        console.log("Testing generation...");
        const res = await generateSummary("This is a test content to check summary generation.");
        console.log("Success:", res);
    } catch (err) {
        console.error("Test Failed:", err.message);
    }
}

testComp();
