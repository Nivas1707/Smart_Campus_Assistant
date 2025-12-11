const axios = require('axios');
const BASE_URL = 'http://localhost:5000/api';

const testNLP = async () => {
    console.log("--- Starting NLP Test ---");
    try {
        const question = "epidi iruka";
        console.log(`Asking question: "${question}"`);

        const res = await axios.post(`${BASE_URL}/ask`, {
            question: question,
            documentId: null // No context
        });

        console.log("Response:", res.data.answer);

        if (res.data.answer.toLowerCase().includes("find") || res.data.answer.toLowerCase().includes("cannot")) {
            console.log("FAILURE: Bot failed to understand Tanglish/General query.");
        } else {
            console.log("SUCCESS: Bot understood and replied.");
        }

    } catch (error) {
        console.error("NLP Test Error:", error.message);
        if (error.response) console.error(error.response.data);
    }
};

testNLP();
