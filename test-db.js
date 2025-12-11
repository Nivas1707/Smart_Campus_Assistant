require('dotenv').config({ path: './server/.env' });
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
        console.error(err);
        process.exit(1);
    });
