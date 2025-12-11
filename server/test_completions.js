const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const API_KEY = process.env.HUGGINGFACE_API_KEY;

const models = [
    "mistralai/Mistral-7B-Instruct-v0.3",
    "mistralai/Mixtral-8x7B-Instruct-v0.1",
    "mistralai/Mistral-7B-Instruct-v0.2"
];

async function test() {
    let log = "Testing v1/completions...\n";

    for (const model of models) {
        log += `\nTesting Model: ${model}\n`;
        try {
            const res = await axios.post(
                `https://router.huggingface.co/v1/completions`,
                {
                    model: model,
                    prompt: "Hello, my name is",
                    max_tokens: 10
                },
                {
                    headers: { Authorization: `Bearer ${API_KEY}` }
                }
            );
            log += `SUCCESS! Status: ${res.status}\n`;
            log += `Output: ${JSON.stringify(res.data)}\n`;
        } catch (err) {
            log += `Failed: ${err.message}\n`;
            if (err.response?.data) {
                log += `Error Data: ${JSON.stringify(err.response.data)}\n`;
            }
        }
    }
    fs.writeFileSync('completions_test.txt', log);
}

test();
