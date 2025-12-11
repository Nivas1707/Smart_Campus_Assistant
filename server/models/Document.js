const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    folderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null
    },
    originalName: {
        type: String,
        required: true
    },
    contentType: {
        type: String,
        required: true
    },
    content: {
        type: String, // Extracted text
        default: ''
    },
    summary: {
        type: String,
        default: ''
    },
    uploadDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Document', DocumentSchema);
