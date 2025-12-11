require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Request Logger
app.use((req, res, next) => {
    console.log(`[DEBUG] ${req.method} ${req.originalUrl}`);
    next();
});

// Database Connection
// Database Connection
const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-campus';
console.log('Attempting to connect to DB:', dbUri.replace(/:\/\/.*@/, '://***@')); // Secure log

mongoose.connect(dbUri, { serverSelectionTimeoutMS: 5000 })
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => {
        console.error('MongoDB Connection Error Details:', err.message);
        console.error('Code:', err.code);
    });

// Routes
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.send('Smart Campus Assistant API is running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Initialize RAG Vector Store
    const { initializeVectorStore } = require('./utils/ragService');
    // Give DB a moment to connect
    setTimeout(() => {
        initializeVectorStore().then(() => console.log('RAG Knowledge Base Ready')).catch(err => console.error('RAG Init Failed:', err));
    }, 2000);
});
