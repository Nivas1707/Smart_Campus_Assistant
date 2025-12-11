// ChatGroq removed
const { HuggingFaceInferenceEmbeddings } = require("@langchain/community/embeddings/hf");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { Document: LangChainDocument } = require("@langchain/core/documents");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { RunnableSequence } = require("@langchain/core/runnables");
const Document = require('../models/Document');
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const LOG_FILE = path.join(__dirname, '../rag_debug.log');

const logRag = (msg) => {
    // Async logging to prevents blocking the main thread
    console.log(msg);
    fs.appendFile(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`, (err) => {
        if (err) console.error("Log Error:", err);
    });
};

// --- Simple Vector Store Implementation ---
class SimpleVectorStore {
    constructor(embeddings) {
        this.embeddings = embeddings;
        this.vectors = []; // { content, metadata, embedding }
    }

    async addDocuments(documents) {
        const texts = documents.map(d => d.pageContent);
        // Batch embed
        const embeddings = await this.embeddings.embedDocuments(texts);

        for (let i = 0; i < documents.length; i++) {
            this.vectors.push({
                content: documents[i].pageContent,
                metadata: documents[i].metadata,
                embedding: embeddings[i]
            });
        }
    }

    async similaritySearch(query, k = 4) {
        const queryEmbedding = await this.embeddings.embedQuery(query);

        // Calculate Cosine Similarity
        const scoredDocs = this.vectors.map(vec => {
            const similarity = this.cosineSimilarity(queryEmbedding, vec.embedding);
            return { ...vec, score: similarity };
        });

        // Sort descending
        scoredDocs.sort((a, b) => b.score - a.score);

        // Return top k
        return scoredDocs.slice(0, k).map(d => new LangChainDocument({
            pageContent: d.content,
            metadata: d.metadata
        }));
    }

    asRetriever(k = 4, filter = {}) {
        return {
            invoke: async (query) => {
                let initialDocs = await this.similaritySearch(query, k * 3); // Fetch more for filtering
                if (filter && filter.sourceId) {
                    initialDocs = initialDocs.filter(d => d.metadata.sourceId === filter.sourceId);
                }
                return initialDocs.slice(0, k);
            }
        };
    }

    cosineSimilarity(a, b) {
        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            magnitudeA += a[i] * a[i];
            magnitudeB += b[i] * b[i];
        }
        return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
    }

    static async fromDocuments(docs, embeddings) {
        const store = new SimpleVectorStore(embeddings);
        await store.addDocuments(docs);
        return store;
    }

    async addOneDocument(doc) {
        await this.addDocuments([doc]);
    }
}
// ------------------------------------------

let vectorStore = null;

// Initialize Vector Store
const initializeVectorStore = async () => {
    console.log("[RAG] Initializing Knowledge Base...");
    try {
        const docs = await Document.find({});
        if (docs.length === 0) {
            console.log("[RAG] No documents to index.");
            return;
        }

        const validDocs = docs.filter(d => d.content && d.content.length > 50);
        console.log(`[RAG] Found ${validDocs.length} valid documents.`);

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const splitDocs = [];
        for (const doc of validDocs) {
            // Include filename in content for better context
            const chunks = await splitter.splitText(doc.content);
            for (const chunk of chunks) {
                splitDocs.push(new LangChainDocument({
                    pageContent: `Source: ${doc.originalName}\n${chunk}`,
                    metadata: { sourceId: doc._id.toString(), filename: doc.originalName }
                }));
            }
        }

        console.log(`[RAG] Created ${splitDocs.length} chunks. Embedding...`);

        // Use HuggingFace for Embeddings
        const embeddings = new HuggingFaceInferenceEmbeddings({
            apiKey: process.env.HUGGINGFACE_API_KEY
        });

        vectorStore = await SimpleVectorStore.fromDocuments(splitDocs, embeddings);
        console.log("[RAG] Knowledge Base Ready.");

    } catch (error) {
        console.error("[RAG] Initialization Error:", error);
    }
};

// Helper to batch array
const chunkArray = (array, size) => {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
};

// Add Single Document to Store (Dynamic Update)
const addDocumentToStore = async (doc) => {
    if (!vectorStore) {
        await initializeVectorStore();
    }
    if (!vectorStore) return;

    try {
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const chunks = await splitter.splitText(doc.content);
        const splitDocs = chunks.map(chunk => new LangChainDocument({
            pageContent: `Source: ${doc.originalName}\n${chunk}`,
            metadata: {
                sourceId: doc._id.toString(),
                filename: doc.originalName,
                folderId: doc.folderId ? doc.folderId.toString() : null
            }
        }));

        // BATCHING TO AVOID 429 ERRORS (Gemini Limit: ~15 RPM / Burst limits)
        const batches = chunkArray(splitDocs, 5); // Process 5 chunks at a time
        logRag(`[RAG] Split into ${batches.length} batches to respect rate limits.`);

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            await vectorStore.addDocuments(batch);
            logRag(`[RAG] Added batch ${i + 1}/${batches.length}`);

            // Wait 2 seconds between batches
            if (i < batches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        logRag(`[RAG] Added total ${splitDocs.length} chunks for ${doc.originalName}`);
    } catch (error) {
        logRag(`[RAG] Add Document Error: ${error.message}`);
    }
};

// Ask Gemini (Replaces HuggingFace for stability/NLP)
// Ask HuggingFace (Real Implementation)
const askHuggingFace = async (question, contextId = null) => {
    logRag(`[Ask] Question: "${question}" | ContextId: ${contextId} (Using Hugging Face)`);

    if (!vectorStore) {
        await initializeVectorStore();
    }

    let context = "";
    try {
        if (vectorStore) {
            // Context filtering logic...
            if (contextId && contextId !== 'all') {
                const allDocs = await vectorStore.similaritySearch(question, 12);
                const filteredDocs = allDocs.filter(d =>
                    d.metadata.sourceId === contextId ||
                    d.metadata.folderId === contextId
                );
                const finalDocs = filteredDocs.slice(0, 3);
                if (finalDocs.length > 0) {
                    context = finalDocs.map(d => d.pageContent).join("\n\n---\n\n");
                }
            } else {
                const relevantDocs = await vectorStore.similaritySearch(question, 3);
                if (relevantDocs.length > 0) {
                    context = relevantDocs.map(d => d.pageContent).join("\n\n---\n\n");
                }
            }
        }
    } catch (e) {
        logRag(`[RAG] Retrieval failed, proceeding with general knowledge: ${e.message}`);
    }

    const maxRetries = 3;
    const CHAT_MODEL = "meta-llama/Meta-Llama-3-8B-Instruct"; // Or similar chat model
    const CHAT_KEY = process.env.HUGGINGFACE_CHAT_KEY || process.env.HUGGINGFACE_API_KEY;

    if (!CHAT_KEY) {
        return "I cannot answer right now. Configuration Error: HUGGINGFACE_CHAT_KEY missing.";
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            logRag(`[Ask] Sending to HF (Attempt ${attempt}/${maxRetries})...`);

            const systemPrompt = `You are a smart and friendly AI assistant for students.
                                
User Context (Documents):
${context || "No relevant document context found."}

INSTRUCTIONS:
1. If the user asks a GENERAL question (e.g., "how are you?", "epidi iruka", "explain quantum physics"), answer it directly using your general knowledge. Do NOT say "I cannot find info".
2. If the user asks about specific uploaded content, use the "User Context" above.
3. Be flexible with languages. "Epidi iruka" means "How are you?" in Tamil/Tanglish. Reply naturally.`;

            const response = await require('axios').post(
                `https://router.huggingface.co/v1/chat/completions`,
                {
                    model: CHAT_MODEL,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: question }
                    ],
                    max_tokens: 500,
                    temperature: 0.7
                },
                {
                    headers: {
                        Authorization: `Bearer ${CHAT_KEY}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            if (response.data && response.data.choices && response.data.choices[0]) {
                return response.data.choices[0].message.content;
            }
            throw new Error("Invalid Response Format");

        } catch (err) {
            logRag(`[Ask] HF failed (Attempt ${attempt}): ${err.message}`);
            if (attempt === maxRetries) {
                return "I encountered an error connecting to the AI service. Please try again later.";
            }
            // Wait 2 seconds before retry
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
};

module.exports = { initializeVectorStore, askHuggingFace, addDocumentToStore };
