const express = require('express');

const app = express();
app.use(require('cors')());
app.use(express.json());

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/balances', require('./routes/balanceRoutes'));
// DB ping (uses native driver to test Atlas connectivity)
app.use('/api/db', require('./routes/dbRoutes'));

module.exports = app;
