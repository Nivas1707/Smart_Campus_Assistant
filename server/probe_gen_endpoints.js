const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.HUGGINGFACE_API_KEY;
const MODEL = "mistralai/Mistral-7B-Instruct-v0.3";

const urls = [
    `https://router.huggingface.co/models/${MODEL}`, // Standard inference
    `https://router.huggingface.co/${MODEL}`,       // Short inference
    `https://router.huggingface.co/v1/completions`, // OpenAI completion (generic)
    // TGI specific endpoints sometimes exposed
    `https://router.huggingface.co/generate`,
    `https://router.huggingface.co/models/${MODEL}/generate`
];

async function test() {
    console.log(`Testing Generation for ${MODEL}...`);

    for (const url of urls) {
        console.log(`\nURL: ${url}`);
        try {
            // Try standard inference payload
            let res = await axios.post(
                url,
                { inputs: "Hello" },
                { headers: { Authorization: `Bearer ${API_KEY}` } }
            );
            console.log(`SUCCESS (Inputs)! Status: ${res.status}`);
            console.log(res.data);
            return;
        } catch (err) {
            console.log(`Inputs Failed: ${err.message} (${err.response?.status})`);
        }

        try {
            // Try OpenAI completion payload
            let res = await axios.post(
                url,
                { model: MODEL, prompt: "Hello", max_tokens: 5 },
                { headers: { Authorization: `Bearer ${API_KEY}` } }
            );
            console.log(`SUCCESS (OpenAI)! Status: ${res.status}`);
            console.log(res.data);
            return;
        } catch (err) {
            console.log(`OpenAI Failed: ${err.message} (${err.response?.status})`);
        }
    }
}

test();
