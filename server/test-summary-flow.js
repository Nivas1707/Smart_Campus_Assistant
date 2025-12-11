const { generateSummary } = require('./utils/aiService');
const { extractText } = require('./utils/textExtractor');
const path = require('path');
const fs = require('fs');

// Create a dummy text file for testing
const testFilePath = path.join(__dirname, 'test-doc.txt');
fs.writeFileSync(testFilePath, 'Artificial Intelligence (AI) is intelligence demonstrated by machines, as opposed to the natural intelligence displayed by animals including humans. AI research has been defined as the field of study of intelligent agents, which refers to any system that perceives its environment and takes actions that maximize its chance of achieving its goals.');

async function testFlow() {
    try {
        console.log("1. Testing Text Extraction...");
        const text = await extractText(testFilePath, 'text/plain');
        console.log(`   Extracted text (${text.length} chars): "${text.substring(0, 50)}..."`);

        console.log("\n2. Testing Summary Generation...");
        const summary = await generateSummary(text);
        console.log(`   Generated Summary: "${summary}"`);

        if (summary.startsWith("Error") || summary.startsWith("Simulation")) {
            console.error("\n❌ Test Failed: Summary generation returned an error or simulation.");
        } else {
            console.log("\n✅ Test Passed: Summary generated successfully.");
        }

    } catch (error) {
        console.error("\n❌ Test Failed with error:", error);
    } finally {
        // Cleanup
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    }
}

testFlow();
