const axios = require('axios');
require('dotenv').config();

const QUIZ_KEY = process.env.HUGGINGFACE_QUIZ_KEY;

const models = [
    "google/flan-t5-base",
    "google/flan-t5-large",
    "meta-llama/Meta-Llama-3-8B-Instruct"
];

async function testT5Quiz() {
    console.log(`Testing Models with Key: ${QUIZ_KEY ? QUIZ_KEY.substring(0, 8) + '...' : 'None'}`);

    for (const model of models) {
        console.log(`\nModel: ${model}`);

        const isChat = model.includes("Llama");

        try {
            if (isChat) {
                const res = await axios.post(
                    `https://router.huggingface.co/v1/chat/completions`,
                    {
                        model: model,
                        messages: [{ role: "user", content: "Hi" }],
                        max_tokens: 10
                    },
                    { headers: { Authorization: `Bearer ${QUIZ_KEY}` } }
                );
                console.log(`SUCCESS (Chat)! Status: ${res.status}`);
            } else {
                const res = await axios.post(
                    `https://router.huggingface.co/models/${model}`,
                    { inputs: "Hello" },
                    { headers: { Authorization: `Bearer ${QUIZ_KEY}` } }
                );
                console.log(`SUCCESS (Infer)! Status: ${res.status}`);
                console.log(res.data);
            }
        } catch (err) {
            console.log(`Failed: ${err.message} (${err.response?.status})`);
        }
    }
}

testT5Quiz();
