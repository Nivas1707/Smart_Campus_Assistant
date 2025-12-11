const { initializeVectorStore, addDocumentToStore, askHuggingFace } = require('./utils/ragService');
const Document = require('./models/Document');
const mongoose = require('mongoose');
require('dotenv').config();

const runTest = async () => {
    console.log("--- Starting Manual RAG Test ---");

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        // Mock Document
        const mockDoc = {
            _id: new mongoose.Types.ObjectId(),
            originalName: "test_manual.txt",
            content: "The manual test code is ALPHA-99-OMEGA. Remember this code.",
            folderId: null
        };

        console.log("Mock Doc ID:", mockDoc._id.toString());

        // 1. Add to Store
        console.log("Adding document...");
        await addDocumentToStore(mockDoc);

        // 2. Ask Question
        console.log("Asking question...");
        const answer = await askHuggingFace("What is the manual test code?", mockDoc._id.toString());

        console.log("Answer:", answer);

        if (answer.includes("ALPHA-99-OMEGA")) {
            console.log("SUCCESS: Manual RAG worked.");
        } else {
            console.log("FAILURE: Manual RAG failed. Answer: " + answer);
        }
    } catch (error) {
        console.error("Manual Test Error:", error);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        process.exit(0); // Ensure process exits
    }
};

runTest();
