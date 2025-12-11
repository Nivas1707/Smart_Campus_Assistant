const { HuggingFaceInferenceEmbeddings } = require("@langchain/community/embeddings/hf");
require('dotenv').config();

const test = async () => {
    try {
        console.log("Initializing Embeddings...");
        const embeddings = new HuggingFaceInferenceEmbeddings({
            apiKey: process.env.HUGGINGFACE_API_KEY,
            model: "sentence-transformers/all-MiniLM-L6-v2",
        });
        console.log("Initialized.");

        console.log("Testing embedQuery...");
        const res = await embeddings.embedQuery("hello world");
        console.log("Embed result length:", res.length);

    } catch (e) {
        console.error("Crash:", e);
    }
};

test();
