const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const Document = require('../models/Document');
const Folder = require('../models/Folder');
const Quiz = require('../models/Quiz');
const { extractText } = require('../utils/textExtractor');
const { generateSummary, generateQuiz, generateTopicSummary } = require('../utils/aiService');
const { askHuggingFace, addDocumentToStore } = require('../utils/ragService');

// Multer Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Upload Endpoint (Supports single or multiple)
router.post('/upload', upload.any(), async (req, res) => {
    console.log('Received upload request');
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const { folderId } = req.body;
        let targetFolderId = folderId;

        // Check file limit for target folder (if not root)
        // Check for max files limit for root upload/automatic grouping
        if (req.files.length > 10) {
            return res.status(400).json({
                error: `10 uploads per session is the limit`
            });
        }

        // If multiple files (2-10) and no folder specified, create a new folder automatically
        if (req.files.length >= 2 && !targetFolderId) {
            const timestamp = new Date().toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true
            });
            const newFolder = new Folder({ name: `Upload - ${timestamp}` });
            await newFolder.save();
            targetFolderId = newFolder._id;
            console.log(`Created automatic folder: ${newFolder.name} (${newFolder._id})`);
        }

        const skippedFiles = [];
        const processedDocs = [];

        for (const file of req.files) {
            // Check for duplicate
            // Explicitly use null if targetFolderId is undefined/null to check root, 
            // otherwise check specific folder.
            const existingDoc = await Document.findOne({
                folderId: targetFolderId || null,
                originalName: file.originalname
            });

            if (existingDoc) {
                skippedFiles.push(file.originalname);
                // Clean up the uploaded temp file
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                continue;
            }

            const text = await extractText(file.path, file.mimetype);

            const newDoc = new Document({
                filename: file.filename,
                originalName: file.originalname,
                contentType: file.mimetype,
                content: text,
                summary: "Generating summary...",
                folderId: targetFolderId || null
            });

            await newDoc.save();
            processedDocs.push(newDoc);

            // Background process for summary
            // Background process for summary (Delayed to prevent rate limit collision with Embeddings)
            setTimeout(() => {
                generateSummary(text).then(async (summary) => {
                    // Re-fetch doc to ensure we have latest version
                    const docToUpdate = await Document.findById(newDoc._id);
                    if (docToUpdate) {
                        docToUpdate.summary = summary;
                        await docToUpdate.save().catch(e => console.error(`Failed to save summary for ${file.originalname}:`, e.message));
                    }
                }).catch(err => {
                    console.error("Delayed Summary Failed:", err);
                    // If delayed fail, update status
                    Document.findByIdAndUpdate(newDoc._id, { summary: "Failed to generate summary." }).catch(e => console.error(e));
                });
            }, 5000); // 5 Second Delay

            // Add to Vector Store Dynamically
            addDocumentToStore(newDoc);
        }

        res.json({
            message: 'Upload processing complete',
            documents: processedDocs,
            skippedFiles: skippedFiles,
            folderId: targetFolderId
        });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Failed to process files', details: error.message });
    }
});

// Get Library (Folders + Docs)
router.get('/library', async (req, res) => {
    try {
        const folders = await Folder.find().sort({ createdAt: -1 });
        const documents = await Document.find().sort({ uploadDate: -1 }); // We will filter in frontend or group here

        // Attach docs to folders or keep flat? Let's return flat lists and let UI organize.
        // Actually, organizing here is cleaner for UI.

        const library = {
            folders: folders.map(f => ({
                ...f.toObject(),
                documents: documents.filter(d => d.folderId && d.folderId.toString() === f._id.toString())
            })),
            rootDocuments: documents.filter(d => !d.folderId)
        };

        res.json(library);
    } catch (error) {
        console.error("Library Fetch Error:", error);
        res.status(500).json({ error: 'Failed to fetch library' });
    }
});

// Create Folder
router.post('/folders', async (req, res) => {
    console.log("POST /folders request:", req.body);
    try {
        const { name } = req.body;
        if (!name) {
            console.error("POST /folders Missing name");
            return res.status(400).json({ error: 'Folder name required' });
        }
        const newFolder = new Folder({ name });
        await newFolder.save();
        console.log("Folder created:", newFolder._id, newFolder.name);
        res.json(newFolder);
    } catch (error) {
        console.error("POST /folders Error:", error);
        res.status(500).json({ error: 'Failed to create folder' });
    }
});

// Rename Folder
router.put('/folders/:id', async (req, res) => {
    try {
        const { name } = req.body;
        const folder = await Folder.findByIdAndUpdate(req.params.id, { name }, { new: true });
        res.json(folder);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update folder' });
    }
});

// Delete Folder
router.delete('/folders/:id', async (req, res) => {
    try {
        // Delete docs inside first
        // Note: Actual file deletion logic should be here too iterating over docs
        const docs = await Document.find({ folderId: req.params.id });
        for (const doc of docs) {
            const filePath = path.join(__dirname, '../uploads', doc.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            await Document.findByIdAndDelete(doc._id);
        }

        await Folder.findByIdAndDelete(req.params.id);
        res.json({ message: 'Folder deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete folder' });
    }
});

// Get Single Document
router.get('/documents/:id', async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Document not found' });
        res.json(doc);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch document' });
    }
});

// Delete Document
// Delete Document
router.delete('/documents/:id', async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Document not found' });

        // Delete file from filesystem
        const filePath = path.join(__dirname, '../uploads', doc.filename);
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (fsError) {
            console.error(`Failed to delete file ${filePath}:`, fsError);
            // Continue to delete from DB even if file delete fails
        }

        await Document.findByIdAndDelete(req.params.id);
        res.json({ message: 'Document deleted' });
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

// Ask Question
// [Legacy Ask Route Removed]

// Generate Quiz
router.post('/quiz', async (req, res) => {
    const { sourceId, sourceType } = req.body; // sourceType: 'Document' | 'Folder'
    try {
        let contentToProcess = "";
        let quizTopic = "";

        if (sourceType === 'Folder') {
            const folder = await Folder.findById(sourceId);
            if (!folder) return res.status(404).json({ error: 'Folder not found' });

            const docs = await Document.find({ folderId: sourceId });
            if (docs.length === 0) return res.status(400).json({ error: 'Folder is empty' });

            contentToProcess = docs.map(d => d.content).join("\n\n");
            quizTopic = `Quiz for Folder: ${folder.name}`;

        } else {
            // Default to Document
            // support legacy 'documentId' if sent, but prefer sourceId
            const docId = sourceId || req.body.documentId;
            const doc = await Document.findById(docId);
            if (!doc) return res.status(404).json({ error: 'Document not found' });

            contentToProcess = doc.content;
            quizTopic = `Quiz for ${doc.originalName}`;
        }

        const count = parseInt(req.body.count) || 5;
        console.log(`Generating quiz with count: ${count}`);
        const quizQuestions = await generateQuiz(contentToProcess, count);

        // Save quiz to DB
        const newQuiz = new Quiz({
            sourceId: sourceId || req.body.documentId, // temporary fallback
            sourceType: sourceType || 'Document',
            topic: quizTopic,
            questions: quizQuestions
        });

        await newQuiz.save();
        console.log(`Quiz saved for ${sourceType} ${sourceId}`);

        res.json(newQuiz);
    } catch (error) {
        console.error("Quiz Generation Error:", error);
        res.status(500).json({ error: 'Failed to generate quiz' });
    }
});

// Wikipedia Search
router.get('/wiki', async (req, res) => {
    const { query } = req.query;
    try {
        const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
        res.json({
            title: response.data.title,
            extract: response.data.extract,
            url: response.data.content_urls.desktop.page
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch from Wikipedia' });
    }
});
// Regenerate Summary
router.post('/summary/regenerate', async (req, res) => {
    console.log("Hit /summary/regenerate");
    const { documentId, previousSummary } = req.body;

    try {
        const doc = await Document.findById(documentId);
        if (!doc) {
            console.warn("Doc not found for regen:", documentId);
            return res.status(404).json({ error: 'Document not found' });
        }

        doc.summary = "Generating summary...";
        await doc.save();

        const instructions = `IMPORTANT: This is a REGENERATION request. The previous summary was:\n"${previousSummary}"\n\nDO NOT generate the same summary. Focus on different aspects or use a different structure/tone to provide a fresh perspective.`;

        generateSummary(doc.content, instructions).then(async (summary) => {
            console.log("Regeneration complete for:", documentId);
            doc.summary = summary;
            await doc.save();
        }).catch(err => console.error("Regen Background Error:", err));

        res.json({ message: 'Summary regeneration started' });
    } catch (error) {
        console.error("Regen API Error:", error);
        res.status(500).json({ error: 'Failed to regenerate summary' });
    }
});



// Rename Folder
router.put('/folders/:id', async (req, res) => {
    try {
        const { name } = req.body;
        const folder = await Folder.findByIdAndUpdate(req.params.id, { name }, { new: true });
        res.json(folder);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update folder' });
    }
});

// Delete Folder
router.delete('/folders/:id', async (req, res) => {
    try {
        // Delete docs inside first
        // Note: Actual file deletion logic should be here too iterating over docs
        const docs = await Document.find({ folderId: req.params.id });
        for (const doc of docs) {
            const filePath = path.join(__dirname, '../uploads', doc.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            await Document.findByIdAndDelete(doc._id);
        }

        await Folder.findByIdAndDelete(req.params.id);
        res.json({ message: 'Folder deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete folder' });
    }
});

// Get Single Document
router.get('/documents/:id', async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Document not found' });

        // Lazy Summary / Repair Logic
        // If summary is failed, missing, or stuck in "Generating..." for > 1 min
        const isStuck = doc.summary && doc.summary.startsWith("Generating summary") && (Date.now() - new Date(doc.updatedAt).getTime() > 60000);

        // Check for specific error messages or empty/null
        const isFailed = !doc.summary ||
            doc.summary === "Failed to generate summary." ||
            doc.summary === "Error generating summary." ||
            doc.summary.startsWith("Summary Failed:") ||
            doc.summary.includes("Simulation: Summary");

        if (isFailed || isStuck) {
            console.log(`[LazySummary] Triggering generation for ${doc._id} (Status: ${doc.summary})`);

            // Set temporary status
            doc.summary = "Generating summary... (Retrying)";
            await doc.save(); // Save immediately so UI sees it

            // Trigger background job
            generateSummary(doc.content).then(async (summary) => {
                console.log(`[LazySummary] Completed for ${doc._id}`);
                await Document.findByIdAndUpdate(doc._id, { summary: summary });
            }).catch(e => {
                console.error(`[LazySummary] Failed for ${doc._id}:`, e.message);
                Document.findByIdAndUpdate(doc._id, { summary: "Failed to generate summary." }).catch(err => console.error(err));
            });
        }

        res.json(doc);
    } catch (error) {
        console.error("Get Document Error:", error);
        res.status(500).json({ error: 'Failed to fetch document' });
    }
});

// Delete Document
// Delete Document
router.delete('/documents/:id', async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Document not found' });

        // Delete file from filesystem
        const filePath = path.join(__dirname, '../uploads', doc.filename);
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (fsError) {
            console.error(`Failed to delete file ${filePath}:`, fsError);
            // Continue to delete from DB even if file delete fails
        }

        await Document.findByIdAndDelete(req.params.id);
        res.json({ message: 'Document deleted' });
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

// Ask Question
// Ask Question
router.post('/ask', async (req, res) => {
    const { question, documentId } = req.body;
    try {
        console.log(`[Ask] Hit NEW HuggingFace Llama 2 Route. Question: "${question}" | DocId: ${documentId || 'Global'}`);

        // Unified HuggingFace Llama 2 (RAG)
        const answer = await askHuggingFace(question, documentId);
        res.json({ answer });

    } catch (error) {
        console.error("Ask API Error:", error);
        res.status(500).json({ error: 'Failed to get answer' });
    }
});

// Generate Quiz
router.post('/quiz', async (req, res) => {
    const { sourceId, sourceType, contentOverride, topicName, count } = req.body;
    try {
        let contentToProcess = "";
        let quizTopic = "";
        let isTopicMode = false;

        // 1. Determine Content Source
        if (contentOverride) {
            // Direct Content Override
            contentToProcess = contentOverride;
            quizTopic = topicName || "Custom Quiz";
            if (sourceType === 'NCERT' || sourceType === 'Topic') isTopicMode = true;

        } else if (sourceType === 'Folder') {
            const folder = await Folder.findById(sourceId);
            if (!folder) return res.status(404).json({ error: 'Folder not found' });

            const docs = await Document.find({ folderId: sourceId });
            if (docs.length === 0) return res.status(400).json({ error: 'Folder is empty' });

            contentToProcess = docs.map(d => d.content).join("\n\n");
            quizTopic = `Quiz for Folder: ${folder.name}`;

        } else if (sourceType === 'NCERT' && topicName) {
            // Fallback if no override but topic provided
            contentToProcess = topicName;
            quizTopic = `NCERT: ${topicName}`;
            isTopicMode = true;

        } else {
            // Default to Document
            const docId = sourceId || req.body.documentId;
            const doc = await Document.findById(docId);
            if (!doc) return res.status(404).json({ error: 'Document not found' });

            contentToProcess = doc.content;
            quizTopic = `Quiz for ${doc.originalName}`;
        }

        // 2. Validate Content
        if (!contentToProcess || contentToProcess.length < 50) {
            console.warn("Quiz Generation Aborted: Content too short.", contentToProcess ? contentToProcess.length : 0);
            return res.status(400).json({ error: 'Source content is too short to generate a quiz. Please check the file content.' });
        }

        // 3. Generate Quiz
        const qCount = parseInt(count) || 5;

        let excludeQuestions = req.body.excludeQuestions || [];

        // Auto-fetch previous questions if not explicitly provided (for "Regenerate" flow)
        if (excludeQuestions.length === 0) {
            const previousQuiz = await Quiz.findOne({ sourceId: sourceId || req.body.documentId }).sort({ createdAt: -1 });
            if (previousQuiz && previousQuiz.questions) {
                excludeQuestions = previousQuiz.questions.map(q => q.question);
                console.log(`[Quiz] Excluding ${excludeQuestions.length} questions from previous quiz.`);
            }
        }

        console.log(`Generating quiz [${isTopicMode ? 'TOPIC' : 'CONTEXT'}] for: ${quizTopic} (Length: ${contentToProcess.length})`);
        console.log(`[Quiz] Exclusion list size: ${excludeQuestions.length}`);

        // Pass isTopicMode and excludeQuestions to aiService
        const quizQuestions = await generateQuiz(contentToProcess, qCount, isTopicMode, excludeQuestions);

        if (!quizQuestions || quizQuestions.length === 0) {
            throw new Error("AI returned 0 questions.");
        }

        // 4. Save to DB
        const newQuiz = new Quiz({
            sourceId: sourceId || 'external',
            sourceType: sourceType || 'Custom',
            topic: quizTopic,
            questions: quizQuestions
        });

        await newQuiz.save();
        console.log(`Quiz saved for ${sourceType} ${sourceId || topicName}`);

        res.json(newQuiz);

    } catch (error) {
        console.error("Quiz Generation Error:", error);
        res.status(500).json({ error: req.body.contentOverride ? 'Failed to generate quiz from override.' : 'Failed to generate quiz. Content may be insufficient.' });
    }
});

// Wikipedia Search
router.get('/wiki', async (req, res) => {
    const { query } = req.query;
    try {
        const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
        res.json({
            title: response.data.title,
            extract: response.data.extract,
            url: response.data.content_urls.desktop.page
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch from Wikipedia' });
    }
});
// Regenerate Summary
router.post('/summary/regenerate', async (req, res) => {
    console.log("Hit /summary/regenerate");
    const { documentId, previousSummary } = req.body;

    try {
        const doc = await Document.findById(documentId);
        if (!doc) {
            console.warn("Doc not found for regen:", documentId);
            return res.status(404).json({ error: 'Document not found' });
        }

        doc.summary = "Generating summary...";
        await doc.save();

        const instructions = `IMPORTANT: This is a REGENERATION request. The previous summary was:\n"${previousSummary}"\n\nDO NOT generate the same summary. Focus on different aspects or use a different structure/tone to provide a fresh perspective.`;

        generateSummary(doc.content, instructions).then(async (summary) => {
            console.log("Regeneration complete for:", documentId);
            doc.summary = summary;
            await doc.save();
        }).catch(err => console.error("Regen Background Error:", err));

        res.json({ message: 'Summary regeneration started' });
    } catch (error) {
        console.error("Regen API Error:", error);
        res.status(500).json({ error: 'Failed to regenerate summary' });
    }
});

// Folder Combined Summary
router.post('/summary/folder', async (req, res) => {
    console.log("Hit /summary/folder");
    const { folderId } = req.body;
    try {
        const folder = await Folder.findById(folderId);
        if (!folder) return res.status(404).json({ error: 'Folder not found' });

        const docs = await Document.find({ folderId }).limit(5); // Double check limit
        if (docs.length === 0) return res.status(400).json({ error: 'Folder is empty' });

        console.log(`Combining ${docs.length} docs for folder ${folderId}`);
        const combinedContent = docs.map(d => `--- Document: ${d.originalName} ---\n${d.content}`).join("\n\n");

        // Generate the summary
        // Note: We want to wait for it this time so it appears immediately
        let summaryText = await generateSummary(combinedContent, "Synthesize these multiple documents into a single cohesive summary.");

        if (!summaryText || summaryText.length < 10) {
            summaryText = "AI Generation returned empty. Please regenerate.";
        }

        // Persist as a new Document
        // Create a transient document object for the UI
        // We do NOT save this to the DB.
        const transientDoc = {
            _id: `transient_${Date.now()}`, // Fake ID for UI handling
            filename: null, // No physical file
            originalName: `Summary: ${folder.name}`,
            contentType: 'text/markdown',
            content: combinedContent,
            summary: summaryText,
            folderId: folderId,
            uploadDate: new Date(),
            isTransient: true // Flag for UI if needed
        };

        console.log("Generated transient folder summary");
        res.json(transientDoc);

    } catch (error) {
        console.error("Folder Summary Error:", error);
        res.status(500).json({ error: 'Failed to generate folder summary' });
    }
});

// External Topic Summary (NCERT/Wiki)
router.post('/summary/external', async (req, res) => {
    const { topic, type } = req.body; // type: 'NCERT' | 'WIKI'
    console.log(`Hit /summary/external [${type}]: ${topic}`);

    try {
        let summaryText = "";
        let title = "";

        if (type === 'NCERT') {
            title = `NCERT Concept: ${topic}`;
            // Use Gemini to explain topic
            summaryText = await generateTopicSummary(topic);
        } else if (type === 'WIKI') {
            // Fetch from Wikipedia API with Authentication
            try {
                const wikiToken = process.env.WIKI_ACCESS_TOKEN;
                const wikiConfig = wikiToken ? {
                    headers: {
                        'Authorization': `Bearer ${wikiToken}`,
                        'User-Agent': 'SmartCampusAssistant/1.0 (deltaforge_project)'
                    }
                } : {};

                const wikiRes = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`, wikiConfig);

                if (wikiRes.data && wikiRes.data.extract) {
                    title = `Wiki: ${wikiRes.data.title}`;
                    summaryText = wikiRes.data.extract;
                } else {
                    throw new Error("No extract found");
                }
            } catch (wikiErr) {
                console.warn("Wikipedia fetch failed, falling back to AI:", wikiErr.message);
                title = `Wiki Insight (AI): ${topic}`;
                summaryText = await generateTopicSummary(topic + " (General Knowledge)");
            }
        }

        if (!summaryText || summaryText.length < 10) {
            summaryText = "Data unavailable. Please try another topic.";
        }

        const transientDoc = {
            _id: `external_${Date.now()}`,
            filename: null,
            originalName: title,
            contentType: 'text/markdown',
            content: `External Source Query: ${topic}\n\nFetched from: ${type}`,
            summary: summaryText,
            isTransient: true,
            sourceType: type
        };

        res.json(transientDoc);

    } catch (error) {
        console.error("External Summary Error:", error);
        res.status(500).json({ error: 'Failed to fetch external summary' });
    }
});

// Bulk Delete
router.post('/bulk-delete', async (req, res) => {
    const { folderIds = [], documentIds = [] } = req.body;
    try {
        console.log("Bulk Delete Request:", { folderIds, documentIds });

        // Delete Documents
        if (documentIds.length > 0) {
            const docsToDelete = await Document.find({ _id: { $in: documentIds } });
            for (const doc of docsToDelete) {
                if (doc.filename) {
                    const filePath = path.join(__dirname, '../uploads', doc.filename);
                    try {
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                            console.log(`Deleted file: ${doc.filename}`);
                        }
                    } catch (fsErr) {
                        console.error(`Failed to delete file ${doc.filename}:`, fsErr.message);
                        // Continue deleting DB record even if file delete fails
                    }
                }
            }
            await Document.deleteMany({ _id: { $in: documentIds } });
        }

        // Delete Folders (and their contents)
        if (folderIds.length > 0) {
            for (const fId of folderIds) {
                // Delete docs inside this folder first
                const docs = await Document.find({ folderId: fId });
                for (const doc of docs) {
                    if (doc.filename) {
                        const filePath = path.join(__dirname, '../uploads', doc.filename);
                        try {
                            if (fs.existsSync(filePath)) {
                                fs.unlinkSync(filePath);
                            }
                        } catch (fsErr) {
                            console.error(`Failed to delete file in folder ${doc.filename}:`, fsErr.message);
                        }
                    }
                }
                await Document.deleteMany({ folderId: fId });
            }
            await Folder.deleteMany({ _id: { $in: folderIds } });
        }

        res.json({ message: 'Bulk delete successful' });
    } catch (error) {
        console.error("Bulk Delete Error:", error);
        res.status(500).json({ error: 'Failed to perform bulk delete' });
    }
});

module.exports = router;
