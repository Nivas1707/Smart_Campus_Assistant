const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const { ChatGroq } = require("@langchain/groq");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");

// Helper to get a working model
async function getWorkingModel() {
    try {
        const response = await axios.get(`${BASE_URL}/models?key=${API_KEY}`);
        const models = response.data.models;

        // Prefer flash, then pro, then any gemini
        const flash = models.find(m => m.name.includes('flash'));
        if (flash) return flash.name.replace('models/', '');

        const pro = models.find(m => m.name.includes('pro'));
        if (pro) return pro.name.replace('models/', '');

        return 'gemini-1.5-flash'; // Fallback default
    } catch (error) {
        console.error("Error fetching models:", error.message);
        return 'gemini-1.5-flash';
    }
}

// Helper for API Retry
async function callGeminiWithRetry(url, payload, retries = 10) {
    for (let i = 0; i < retries; i++) {
        try {
            return await axios.post(url, payload);
        } catch (error) {
            // Check for 429 or 503 (service unavailable)
            if (error.response && (error.response.status === 429 || error.response.status === 503)) {
                let waitTime = 2000 * Math.pow(2, i); // Default Exponential: 2s, 4s, 8s, 16s, 32s

                // Try to parse "retry in X s" from the error message
                // Message format example: "... Please retry in 31.491109946s."
                const msg = error.response.data?.error?.message;
                if (msg) {
                    const match = msg.match(/retry in\s+([\d.]+)\s*s/);
                    if (match && match[1]) {
                        waitTime = Math.ceil(parseFloat(match[1]) * 1000) + 1000;
                    }
                }

                // Optimization: If wait time is too long (>90s), abort to prevent "Stuck" UI
                if (waitTime > 90000) {
                    console.warn(`[Gemini] Aborting retry. Wait time ${waitTime}ms is too long.`);
                    throw new Error("RateLimitBusy");
                }

                console.warn(`[Gemini] Rate limit hit (Attempt ${i + 1}/${retries}). Retrying in ${Math.round(waitTime / 1000)}s...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                throw error;
            }
        }
    }
    throw new Error("Max retries exceeded");
}

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const MISTRAL_GENERATOR = "mistralai/Mistral-7B-Instruct-v0.3";
const FALLBACK_GENERATOR = "meta-llama/Meta-Llama-3-8B-Instruct";

const { GoogleGenerativeAI } = require("@google/generative-ai");

const generateSummary = async (text, instructions = "") => {
    const SUMMARY_KEY = process.env.HUGGINGFACE_SUMMARY_KEY;
    const SUMMARY_MODEL = "meta-llama/Meta-Llama-3-8B-Instruct";

    if (!SUMMARY_KEY) {
        throw new Error("HUGGINGFACE_SUMMARY_KEY is missing");
    }

    try {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Generation Timed Out")), 45000)
        );

        console.log(`[AI] Starting Summary Generation with ${SUMMARY_MODEL}`);
        const truncatedText = text.substring(0, 15000);

        const systemPrompt = `You are a helpful academic assistant. Summarize the following text efficiently.

Rules:
1. Use **Bold** for all headings.
2. Do NOT use raw asterisks like ****Heading****.
3. Keep the content under each heading very crisp and neat (max 1-2 lines).
4. Ensure all key points are covered but stay concise.
5. Use standard Markdown formatting.

Instructions: ${instructions || "Summarize the key points."}`;

        const generationPromise = axios.post(
            `https://router.huggingface.co/v1/chat/completions`,
            {
                model: SUMMARY_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Text to summarize:\n\n${truncatedText}` }
                ],
                max_tokens: 2000,
                temperature: 0.3
            },
            {
                headers: {
                    Authorization: `Bearer ${SUMMARY_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        ).then(res => {
            if (res.data?.choices?.[0]?.message?.content) {
                return res.data.choices[0].message.content.trim();
            }
            throw new Error("No content in response");
        });

        return await Promise.race([generationPromise, timeoutPromise]);

    } catch (error) {
        console.error("Hugging Face Summary Failed:", error.message, error.response?.data);
        throw new Error(`Summary Failed: ${error.response?.data?.error || error.message}`);
    }
};


const HUGGINGFACE_QUIZ_KEY = process.env.HUGGINGFACE_QUIZ_KEY;
const QUIZ_MODEL = "meta-llama/Meta-Llama-3-8B-Instruct";

const generateQuiz = async (text, count = 5, isTopic = false, excludeQuestions = []) => {
    if (!HUGGINGFACE_QUIZ_KEY) return [];

    console.log(`[AI] Starting Quiz Generation with ${QUIZ_MODEL}. Target: ${count}`);

    // Truncate text to standard context window (approx 4-5k tokens safe)
    const context = text.substring(0, 15000);

    let systemPrompt = `You are an expert exam setter. Create a multiple-choice quiz based on the provided text.
    
Rules:
1. Output MUST be a valid JSON array of objects.
2. Structure: [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "..."}]
3. "correctAnswer" must be the exact string text of the correct option (e.g. "Paris", not "A").
4. Ensure exactly 4 options per question.
5. Create exactly ${count} questions.
6. Do NOT include markdown formatting (like \`\`\`json). Just the raw JSON array.`;

    if (excludeQuestions.length > 0) {
        systemPrompt += `\n7. Do NOT repeat or paraphrase these questions:\n${excludeQuestions.map(q => `- ${q}`).join('\n')}`;
    }

    const userContent = isTopic
        ? `Create ${count} unique questions about the topic: "${text}"`
        : `Create ${count} unique questions based on this text:\n\n${context}`;

    try {
        const response = await axios.post(
            `https://router.huggingface.co/v1/chat/completions`,
            {
                model: QUIZ_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userContent }
                ],
                max_tokens: 3000,
                temperature: 0.5 // Higher temp for variety
            },
            {
                headers: {
                    Authorization: `Bearer ${HUGGINGFACE_QUIZ_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.data?.choices?.[0]?.message?.content) {
            let content = response.data.choices[0].message.content.trim();
            console.log("[AI] Raw Quiz Response (First 100):", content.substring(0, 100));

            // Clean markdown if present
            content = content.replace(/```json/g, '').replace(/```/g, '').trim();

            // Attempt parse
            try {
                const quiz = JSON.parse(content);
                if (Array.isArray(quiz)) {
                    // Validate structure
                    const valid = quiz.filter(q => q.question && Array.isArray(q.options) && q.options.length === 4 && q.correctAnswer);
                    console.log(`[AI] Parsed ${valid.length} valid questions.`);
                    return valid.slice(0, count);
                }
            } catch (e) {
                console.error("[AI] JSON Parse Error:", e.message);
                // Fallback: Try regex extraction if JSON breaks
                const matches = content.match(/\{[\s\S]*?\}/g);
                if (matches) {
                    const recovered = matches.map(m => {
                        try { return JSON.parse(m); } catch { return null; }
                    }).filter(q => q && q.question);
                    return recovered.slice(0, count);
                }
            }
        }
    } catch (error) {
        console.error("Quiz API Error:", error.response?.data || error.message);
    }

    return [];
};

const deprecatedAnswerQuestion = async (context, question) => {
    console.warn("Legacy answerQuestion called... but you shouldn't see this if routes are fixed.");
    return "DEPRECATED";
};

const generateTopicSummary = async (topic) => {
    try {
        if (!process.env.GROQ_API_KEY) {
            console.warn("GROQ_API_KEY missing, falling back to simulation.");
            return "Simulation: Topic Summary (No API Key)...";
        }

        const model = new ChatGroq({
            apiKey: process.env.GROQ_API_KEY,
            model: "llama-3.3-70b-versatile",
            temperature: 0.5
        });

        const prompt = ChatPromptTemplate.fromTemplate(`
You are an expert academic tutor. Provide a comprehensive summary and explanation of the topic: "{topic}".

Rules:
1. Base your explanation on standard academic curriculum (like NCERT/High School/College standards).
2. Structure the content with clear headings (e.g., Introduction, Key Concepts, Mechanisms/Details, Significance).
3. Use standard Markdown formatting.
4. Be concise but thorough.

Topic: {topic}
        `);

        const chain = prompt.pipe(model).pipe(new StringOutputParser());
        const response = await chain.invoke({ topic });
        return response;

    } catch (error) {
        console.error("Groq/LangChain Error (Topic Summary):", error.message);
        return "Failed to generate topic summary.";
    }
};

module.exports = { generateSummary, generateQuiz, deprecatedAnswerQuestion, generateTopicSummary };
