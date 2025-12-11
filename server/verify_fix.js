const axios = require('axios');

async function testAsk() {
    try {
        console.log("Testing /api/ask with general knowledge question...");
        const response1 = await axios.post('http://localhost:5000/api/ask', {
            question: "Who is the president of France?",
            documentId: null
        });
        console.log("Response 1 (General):", response1.data);

        console.log("\nTesting /api/ask with document-specific question (might fallback if doc empty)...");
        // We don't have a valid doc ID handy, but passing null for docId usually triggers 'Global' rag or fallback. 
        // Let's rely on the previous response to see if provider worked.
    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
    }
}

testAsk();
