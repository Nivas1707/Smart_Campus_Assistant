require('dotenv').config();
const { ChatGroq } = require("@langchain/groq");
const { StringOutputParser } = require("@langchain/core/output_parsers");

async function testGroq() {
    console.log("Testing Groq API...");
    const key = process.env.GROQ_API_KEY;
    console.log("Key present:", !!key);

    const model = new ChatGroq({
        apiKey: key,
        modelName: "llama3-70b-8192", // High quality model
        temperature: 0.7
    });

    try {
        const response = await model.invoke("Who is the president of France?");
        console.log("Groq Success:", response.content);
    } catch (error) {
        console.error("Groq Error:", error.message);
    }
}

testGroq();
