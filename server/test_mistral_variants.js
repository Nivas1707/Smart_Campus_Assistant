const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.HUGGINGFACE_API_KEY;

const models = [
    "meta-llama/Meta-Llama-3-8B-Instruct",
    "microsoft/Phi-3-mini-4k-instruct"
];

async function test() {
    console.log("Testing Models on chat/completions...");

    for (const model of models) {
        console.log(`\nModel: ${model}`);
        try {
            const res = await axios.post(
                `https://router.huggingface.co/v1/chat/completions`,
                {
                    model: model,
                    messages: [{ role: "user", content: "Hello" }],
                    max_tokens: 10
                },
                {
                    headers: { Authorization: `Bearer ${API_KEY}` }
                }
            );
            console.log(`SUCCESS! Status: ${res.status}`);
            console.log("Output:", res.data.choices[0].message.content);
            return; // Exit on first success
        } catch (err) {
            console.log(`Failed: ${err.message}`);
            if (err.response?.data) {
                console.log(`Error Data:`, JSON.stringify(err.response.data));
            }
        }
    }
}

test();
