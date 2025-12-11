const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.HUGGINGFACE_API_KEY;

const models = [
    "facebook/bart-large-cnn",
    "sshleifer/distilbart-cnn-12-6"
];

async function test() {
    console.log("Testing Summarization Models...");

    for (const model of models) {
        console.log(`\nModel: ${model}`);
        try {
            const res = await axios.post(
                `https://router.huggingface.co/models/${model}`,
                {
                    inputs: "The Apollo program was the third United States human spaceflight program carried out by the National Aeronautics and Space Administration (NASA), which accomplished landing the first humans on the Moon from 1969 to 1972.",
                    parameters: { min_length: 10, max_length: 50, do_sample: false }
                },
                {
                    headers: { Authorization: `Bearer ${API_KEY}` }
                }
            );
            console.log(`SUCCESS! Status: ${res.status}`);
            console.log("Output:", JSON.stringify(res.data));
            return;
        } catch (err) {
            console.log(`Failed: ${err.message}`);
            if (err.response?.data) {
                console.log(`Error Data:`, JSON.stringify(err.response.data));
            }
        }
    }
}

test();
