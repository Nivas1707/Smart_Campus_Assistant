const { generateSummary } = require('./utils/aiService');
const util = require('util');
const fs = require('fs');

async function testMistral() {
    console.log("Testing Mistral Text Generation...");

    // Simulate a short text
    const text = `
    Photosynthesis is the process used by plants, algae and certain bacteria to harness energy from sunlight and turn it into chemical energy. 
    There are two types of photosynthetic processes: oxygenic photosynthesis and anoxygenic photosynthesis. 
    The general equation for photosynthesis as first proposed by Cornelis van Niel is therefore: CO2 + 2H2A + light energy -> [CH2O] + 2A + H2O.
    `;

    try {
        const summary = await generateSummary(text);
        fs.writeFileSync('verification_output.txt', "--- Generated Summary ---\n" + summary);
    } catch (error) {
        let errorMsg = "Test Failed: " + error.message;
        if (error.response) {
            errorMsg += "\nResponse Data: " + util.inspect(error.response.data, { showHidden: false, depth: null, colors: false });
        }
        fs.writeFileSync('verification_output.txt', errorMsg);
    }
}

testMistral();
