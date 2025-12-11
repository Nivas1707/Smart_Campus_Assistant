const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
    sourceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'sourceType'
    },
    sourceType: {
        type: String,
        required: true,
        enum: ['Document', 'Folder']
    },
    topic: {
        type: String,
        required: true
    },
    questions: [{
        question: String,
        options: [String],
        correctAnswer: String // Index or value
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Quiz', QuizSchema);
