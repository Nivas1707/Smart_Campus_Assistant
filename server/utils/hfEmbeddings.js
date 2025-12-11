const axios = require('axios');

class HFEmbeddings {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.model = config.model || "sentence-transformers/all-MiniLM-L6-v2";
        // Back to pipeline endpoint with CHAT KEY
        this.endpoint = `https://api-inference.huggingface.co/pipeline/feature-extraction/${this.model}`;
    }

    async embedDocuments(texts) {
        try {
            console.log(`[HFEmbeddings] Embedding ${texts.length} documents...`);
            const response = await axios.post(
                this.endpoint,
                { inputs: texts, options: { wait_for_model: true } },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        "Content-Type": "application/json",
                    },
                    timeout: 20000 // 20s timeout
                }
            );
            return response.data; // Expecting array of arrays
        } catch (error) {
            console.error("[HFEmbeddings] Embed Error:", error.message);
            if (error.response) console.error("Details:", error.response.data);
            throw error;
        }
    }

    async embedQuery(text) {
        try {
            console.log(`[HFEmbeddings] Embedding query...`);
            const response = await axios.post(
                this.endpoint,
                { inputs: [text], options: { wait_for_model: true } },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        "Content-Type": "application/json",
                    },
                    timeout: 10000
                }
            );
            // API returns array of arrays for list input.
            // For single input in list, we get [[...]]
            if (Array.isArray(response.data) && Array.isArray(response.data[0])) {
                return response.data[0];
            }
            return response.data;
        } catch (error) {
            console.error("[HFEmbeddings] Query Embed Error:", error.message);
            if (error.response) console.error("Details:", error.response.data);
            throw error;
        }
    }
}

module.exports = HFEmbeddings;
