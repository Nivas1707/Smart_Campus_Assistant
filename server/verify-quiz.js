const { generateQuiz } = require('./utils/aiService');
const fs = require('fs');

async function verifyQuiz() {
    console.log("Verifying Quiz Generation...");

    // Detailed test content
    const text = `
    The solar system consists of the Sun and the objects that orbit it. 
    There are eight planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.
    Jupiter is the largest planet.
    Mercury is the closest to the Sun.
    Pluto is considered a dwarf planet.
    The asteroid belt lies between the orbits of Mars and Jupiter.
    `;

    try {
        // Request 3 questions
        const questions = await generateQuiz(text, 3);
        console.log("Questions Generated:", questions.length);
        console.log(JSON.stringify(questions, null, 2));

        if (questions.length > 0 && questions[0].options.length === 4) {
            fs.writeFileSync('quiz_verification.txt', "SUCCESS\n" + JSON.stringify(questions, null, 2));
        } else {
            fs.writeFileSync('quiz_verification.txt', "FAILED: Invalid Format or Zero Questions");
        }
    } catch (e) {
        console.error("Error:", e);
        fs.writeFileSync('quiz_verification.txt', "ERROR: " + e.message);
    }
}

verifyQuiz();
