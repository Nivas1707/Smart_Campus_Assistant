require('dotenv').config();
const axios = require('axios');

async function testRouterV1() {
    console.log("Testing Router V1 (OpenAI Compatible)...");
    const key = process.env.HUGGINGFACE_CHAT_KEY || process.env.HUGGINGFACE_API_KEY;
    console.log("Key:", key ? "Present" : "Missing");

    try {
        const response = await axios.post(
            'https://router.huggingface.co/v1/chat/completions',
            {
                model: "meta-llama/Llama-3.2-3B-Instruct",
                messages: [
                    { role: "user", content: "Who is the president of France?" }
                ],
                max_tokens: 50
            },
            {
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log("Success:", JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.log("V1 Error Status:", err.response ? err.response.status : err.message);
        console.log("V1 Error Data:", err.response ? err.response.data : "No Data");
    }
}

testRouterV1();
