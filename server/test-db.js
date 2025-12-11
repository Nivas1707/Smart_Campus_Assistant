require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
console.log('Testing connection to:', uri);

mongoose.connect(uri)
    .then(() => {
        console.log('Successfully connected to MongoDB!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection failed!');
        console.error(err.message); // Log just the message first
        console.error(err); // Then full object
        process.exit(1);
    });
