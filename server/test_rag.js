const mongoose = require('mongoose');
const { initializeVectorStore, askGroq } = require('./utils/ragService');
require('dotenv').config();

const runTest = async () => {
    try {
        // Connect DB
        const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-campus';
        await mongoose.connect(dbUri);
        console.log("DB Connected.");

        // Init Store
        await initializeVectorStore();

        // Ask Question
        const question = "What are the key topics in the uploaded documents?";
        console.log(`asking: "${question}"`);

        const answer = await askGroq(question);
        console.log("\n--- ANSWER ---\n");
        console.log(answer);
        console.log("\n--------------\n");

        await mongoose.disconnect();
    } catch (error) {
        console.error("Test Failed:", error);
    }
};

runTest();
