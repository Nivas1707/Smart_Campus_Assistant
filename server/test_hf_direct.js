require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

async function test() {
    console.log("Testing Axios Direct...");
    const key = process.env.HUGGINGFACE_API_KEY;
    console.log("Key present:", !!key, key ? key.substring(0, 5) + '...' : 'NONE');

    try {
        console.log("Sending request to BAAI via Router (Auth Check)...");
        const response = await axios.post(
            'https://router.huggingface.co/models/BAAI/bge-base-en-v1.5',
            {
                inputs: "Hello world"
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
        console.log("Caught Error");
        const errorLog = {
            status: err.response ? err.response.status : 'No Response',
            statusText: err.response ? err.response.statusText : 'N/A',
            data: err.response ? err.response.data : err.message,
            headers: err.response ? err.response.headers : 'N/A'
        };
        fs.writeFileSync('debug_error.json', JSON.stringify(errorLog, null, 2));
        console.log("Status:", errorLog.status);
    }
}

test();
