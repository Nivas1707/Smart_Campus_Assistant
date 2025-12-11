const mongoose = require('mongoose');
const Document = require('./models/Document');
require('dotenv').config();

const dbUri = process.env.MONGODB_URI;

mongoose.connect(dbUri)
    .then(async () => {
        console.log('Connected to DB');
        const docs = await Document.find({});
        console.log(`Found ${docs.length} documents.`);
        docs.forEach(doc => {
            console.log(`\nID: ${doc._id}`);
            console.log(`Name: ${doc.originalName}`);
            console.log(`Summary Start: "${doc.summary.substring(0, 100)}..."`);
        });
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
