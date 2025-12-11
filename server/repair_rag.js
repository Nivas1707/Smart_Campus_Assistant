const mongoose = require('mongoose');
const Document = require('./models/Document');
const Folder = require('./models/Folder');
const { generateSummary } = require('./utils/aiService');
const { initializeVectorStore } = require('./utils/ragService');
require('dotenv').config();

const REPAIR_REPORT = {
    totalDocs: 0,
    summariesRegenerated: 0,
    summariesFailed: 0,
    embeddingsRebuilt: false,
    errors: []
};

const repair = async () => {
    console.log("=== STARTING RAG REPAIR & REGENERATION ===");

    // 1. Connect DB
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("[DB] Connected Successfully");
    } catch (err) {
        console.error("[DB] Connection Failed:", err);
        return;
    }

    // 2. Fetch All Documents
    const docs = await Document.find({});
    REPAIR_REPORT.totalDocs = docs.length;
    console.log(`[DB] Found ${docs.length} documents.`);

    // 3. Regenerate Summaries & Repair Metadata
    for (const doc of docs) {
        console.log(`Processing: ${doc.originalName} (${doc._id})...`);

        // Metadata Repair
        if (!doc.uploadDate) {
            doc.uploadDate = new Date();
            console.log("-> Repaired missing uploadDate");
        }

        // Summary Regeneration
        try {
            console.log("-> Regenerating Summary...");
            const newSummary = await generateSummary(doc.content);
            if (newSummary && newSummary.length > 50) {
                doc.summary = newSummary;
                REPAIR_REPORT.summariesRegenerated++;
                console.log("-> Summary Updated (HF)");
            } else {
                throw new Error("Generated summary too short");
            }
        } catch (err) {
            console.error(`-> Summary Failed: ${err.message}`);
            REPAIR_REPORT.summariesFailed++;
            REPAIR_REPORT.errors.push(`${doc.originalName}: Summary Failed - ${err.message}`);
            // Keep old summary or set error state? User said "Regenerate", so maybe keep old if fails to avoid data loss?
            // But if it was "Failed", we keep trying.
        }

        await doc.save();
    }

    // 4. Rebuild Vector Store (Validate Embeddings)
    console.log("=== REBUILDING VECTOR INDEX (Validation) ===");
    try {
        // This validates that HF Embeddings are working and we can index all docs
        await initializeVectorStore();
        REPAIR_REPORT.embeddingsRebuilt = true;
        console.log("[RAG] Vector Store Rebuild Successful (In-Memory Validation)");
    } catch (err) {
        console.error("[RAG] Rebuild Failed:", err);
        REPAIR_REPORT.embeddingsRebuilt = false;
        REPAIR_REPORT.errors.push(`RAG Rebuild Failed: ${err.message}`);
    }

    // 5. Final Report
    console.log("\n=== FINAL REPAIR REPORT ===");
    console.log(`Total Documents: ${REPAIR_REPORT.totalDocs}`);
    console.log(`Summaries Regenerated: ${REPAIR_REPORT.summariesRegenerated}`);
    console.log(`Summaries Failed: ${REPAIR_REPORT.summariesFailed}`);
    console.log(`Embeddings Validated: ${REPAIR_REPORT.embeddingsRebuilt ? 'YES' : 'NO'}`);
    if (REPAIR_REPORT.errors.length > 0) {
        console.log("\nErrors:");
        REPAIR_REPORT.errors.forEach(e => console.log(`- ${e}`));
    }
    console.log("\n[ACTION REQUIRED] Please RESTART your server to load the new RAG Index into memory.");

    process.exit(0);
};

repair();
