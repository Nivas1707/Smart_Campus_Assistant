const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const testDynamicRag = async () => {
    console.log("--- Starting Dynamic RAG Test ---");

    // 1. Create a dummy file with unique name
    const uniqueId = Date.now();
    const testFileName = `temp_test_doc_${uniqueId}.txt`;
    const testContent = `The secret code for the verification protocol is GAMMA-77-DELTA-${uniqueId}. This is a crucial piece of information for the test.`;
    const testFilePath = path.join(__dirname, testFileName);
    fs.writeFileSync(testFilePath, testContent);
    console.log(`Created temp test file: ${testFileName}`);

    try {
        // 2. Upload the file
        const formData = new FormData();
        formData.append('file', fs.createReadStream(testFilePath));

        console.log("Uploading file...");
        const uploadRes = await axios.post(`${BASE_URL}/upload`, formData, {
            headers: {
                ...formData.getHeaders()
            }
        });

        if (uploadRes.data.documents && uploadRes.data.documents.length > 0) {
            const doc = uploadRes.data.documents[0];
            console.log(`Upload successful. Doc ID: ${doc._id}`);

            // 3. Wait a moment for indexing (it's async but fast)
            console.log("Waiting 5 seconds for indexing...");
            await wait(5000);

            // 4. Ask a question
            console.log("Asking question about the file...");
            const askRes = await axios.post(`${BASE_URL}/ask`, {
                question: "What is the secret code for the verification protocol?",
                documentId: doc._id // Testing direct doc context first
            });

            console.log("Answer:", askRes.data.answer);

            if (askRes.data.answer.includes("GAMMA-77-DELTA")) {
                console.log("SUCCESS: RAG retrieved the secret code!");
                fs.writeFileSync('verification_result.txt', 'SUCCESS: RAG retrieved the secret code!');
            } else {
                console.error("FAILURE: RAG did not retrieve the code.");
                fs.writeFileSync('verification_result.txt', `FAILURE: RAG did not retrieve the code. Answer: ${askRes.data.answer}`);
            }

        } else {
            console.error("Upload failed or returned no documents.");
            const details = uploadRes.data ? JSON.stringify(uploadRes.data) : "No data";
            fs.writeFileSync('verification_result.txt', `FAILURE: Upload failed. Documents: ${details}`);
        }

    } catch (error) {
        console.error("Test Failed:", error.message);
        const details = error.response ? JSON.stringify(error.response.data) : error.message;
        fs.writeFileSync('verification_result.txt', `FAILURE: Test script error: ${details}`);
        if (error.response) {
            console.error("Response data:", error.response.data);
        }
    } finally {
        // Cleanup
        if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
    }
};

testDynamicRag();
