const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const fs = require('fs');
const path = require('path');

async function run() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  const app = require('../app');

    const log = [];

    function print(title, obj) {
      console.log('\n== ' + title + ' ==');
      console.log(JSON.stringify(obj, null, 2));
      log.push({ title, data: obj });
    }

  const u1 = await request(app).post('/api/users').send({ name: 'Alice', email: 'alice@demo', password: 'pass' });
    print('User A', u1.body);
  const u2 = await request(app).post('/api/users').send({ name: 'Bob', email: 'bob@demo', password: 'pass' });
    print('User B', u2.body);

  console.log('\n== Demo: Creating group ==');
  const groupRes = await request(app).post('/api/groups').send({ name: 'Trip', members: [u1.body._id, u2.body._id], createdBy: u1.body._id });
    print('Group', groupRes.body);

  console.log('\n== Demo: Adding equal expense ==');
  const expenseRes = await request(app).post('/api/expenses').send({
    description: 'Dinner',
    amount: 120,
    group: groupRes.body._id,
    paidBy: u1.body._id,
    splitType: 'equal',
    splits: [u1.body._id, u2.body._id]
  });
    print('Expense', expenseRes.body);

  console.log('\n== Demo: Checking balances for Bob ==');
  const balances = await request(app).get(`/api/balances/user/${u2.body._id}/group/${groupRes.body._id}`);
    print('Balances (Bob)', balances.body);

  console.log('\n== Demo: Simplified transfers ==');
  const simplified = await request(app).post(`/api/balances/simplify/${groupRes.body._id}`).send();
    print('Simplified', simplified.body);

    // Save pretty log to file
    const outDir = path.join(__dirname);
    const outFile = path.join(outDir, 'demo-output.json');
    fs.writeFileSync(outFile, JSON.stringify(log, null, 2));
    console.log('\nSaved demo log to', outFile);

    // Build a simple Postman collection
    const collection = {
      info: {
        name: 'Expense App Demo',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: [
        { name: 'Create User A', request: { method: 'POST', header: [{ key: 'Content-Type', value: 'application/json' }], url: { raw: 'http://localhost:5001/api/users', host: ['http://localhost:5001'], path: ['api','users'] }, body: { mode: 'raw', raw: JSON.stringify({ name: 'Alice', email: 'alice@demo', password: 'pass' }, null, 2) } } },
        { name: 'Create User B', request: { method: 'POST', header: [{ key: 'Content-Type', value: 'application/json' }], url: { raw: 'http://localhost:5001/api/users', host: ['http://localhost:5001'], path: ['api','users'] }, body: { mode: 'raw', raw: JSON.stringify({ name: 'Bob', email: 'bob@demo', password: 'pass' }, null, 2) } } },
        { name: 'Create Group', request: { method: 'POST', header: [{ key: 'Content-Type', value: 'application/json' }], url: { raw: 'http://localhost:5001/api/groups', host: ['http://localhost:5001'], path: ['api','groups'] }, body: { mode: 'raw', raw: JSON.stringify({ name: 'Trip', members: [u1.body._id, u2.body._id], createdBy: u1.body._id }, null, 2) } } },
        { name: 'Add Expense', request: { method: 'POST', header: [{ key: 'Content-Type', value: 'application/json' }], url: { raw: 'http://localhost:5001/api/expenses', host: ['http://localhost:5001'], path: ['api','expenses'] }, body: { mode: 'raw', raw: JSON.stringify({ description: 'Dinner', amount: 120, group: groupRes.body._id, paidBy: u1.body._id, splitType: 'equal', splits: [u1.body._id, u2.body._id] }, null, 2) } } },
        { name: 'Get Balances (Bob)', request: { method: 'GET', url: { raw: `http://localhost:5001/api/balances/user/${u2.body._id}/group/${groupRes.body._id}`, host: ['http://localhost:5001'], path: ['api','balances','user', u2.body._id, 'group', groupRes.body._id] } } },
        { name: 'Simplify Balances', request: { method: 'POST', url: { raw: `http://localhost:5001/api/balances/simplify/${groupRes.body._id}`, host: ['http://localhost:5001'], path: ['api','balances','simplify', groupRes.body._id] } } }
      ]
    };

    const postmanFile = path.join(outDir, 'demo-postman.json');
    fs.writeFileSync(postmanFile, JSON.stringify(collection, null, 2));
    console.log('Saved Postman collection to', postmanFile);

  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
  console.log('\n== Demo finished ==');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
