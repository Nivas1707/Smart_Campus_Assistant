const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const models = ["gemini-1.5-flash", "gemini-1.5-flash-001", "gemini-pro", "gemini-1.0-pro", "gemini-1.5-pro"];

async function test() {
    for (const model of models) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
        try {
            console.log(`Testing ${model}...`);
            const response = await axios.post(url, {
                contents: [{ parts: [{ text: "Hello" }] }]
            });
            console.log(`Success with ${model}:`, response.data.candidates[0].content.parts[0].text);
            return; // Found a working one
        } catch (error) {
            console.error(`Failed ${model}:`, error.response ? error.response.data.error.message : error.message);
        }
    }
}

test();
