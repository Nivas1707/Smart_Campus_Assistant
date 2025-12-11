const fs = require('fs');
const pdf = require('pdf-parse');

const extractText = async (filePath, mimeType) => {
    console.log(`Extracting text from ${filePath} (${mimeType})`);
    try {
        if (mimeType === 'application/pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            console.log(`Extracted ${data.text.length} characters from PDF`);
            return data.text;
        } else if (mimeType === 'text/plain') {
            const text = fs.readFileSync(filePath, 'utf8');
            console.log(`Extracted ${text.length} characters from text file`);
            return text;
        } else {
            console.warn(`Unsupported mime type: ${mimeType}`);
            // Placeholder for other types (PPT, DOCX) - requires other libraries like office-text-extractor
            return ''; // Return empty for unsupported types for now
        }
    } catch (error) {
        console.error('Error extracting text:', error);
        throw error;
    }
};

module.exports = { extractText };
