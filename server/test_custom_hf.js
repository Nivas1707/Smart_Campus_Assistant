const HFEmbeddings = require('./utils/hfEmbeddings');
require('dotenv').config();

const test = async () => {
    try {
        console.log("Initializing Custom Embeddings...");
        const embeddings = new HFEmbeddings({
            apiKey: process.env.HUGGINGFACE_CHAT_KEY, // Switched to CHAT KEY
            model: "sentence-transformers/all-MiniLM-L6-v2",
        });

        console.log("Testing embedQuery...");
        const res = await embeddings.embedQuery("hello world");
        console.log("Embed result length:", res ? res.length : "null");

        console.log("Testing embedDocuments...");
        const resDocs = await embeddings.embedDocuments(["hello world", "foo bar"]);
        console.log("Embed docs count:", resDocs ? resDocs.length : "null");

    } catch (e) {
        console.error("Crash:", e);
    }
};

test();
