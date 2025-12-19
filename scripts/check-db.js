#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/expenseapp';
console.log('Testing MongoDB connection to:', uri);

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connection successful ✅');
    return mongoose.connection.close();
  })
  .catch(err => {
    console.error('MongoDB connection failed ❌');
    console.error(err.message || err);
    process.exit(1);
  });
