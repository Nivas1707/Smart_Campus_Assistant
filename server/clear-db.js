const mongoose = require('mongoose');
const Document = require('./models/Document');
require('dotenv').config();

const dbUri = process.env.MONGODB_URI;

mongoose.connect(dbUri)
    .then(async () => {
        console.log('Connected to DB');
        await Document.deleteMany({});
        console.log('All documents deleted.');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
