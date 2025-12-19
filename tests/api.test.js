const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
let app;
let mongod;

jest.setTimeout(30000);

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  app = require('../app');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
});

describe('API routes basic flow', () => {
  let userA, userB, group;

  test('create users', async () => {
    const res1 = await request(app).post('/api/users').send({ name: 'Alice', email: 'a@example.com', password: 'pass' });
    expect(res1.status).toBe(201);
    userA = res1.body;

    const res2 = await request(app).post('/api/users').send({ name: 'Bob', email: 'b@example.com', password: 'pass' });
    expect(res2.status).toBe(201);
    userB = res2.body;
  });

  test('create group', async () => {
    const res = await request(app).post('/api/groups').send({ name: 'Trip', members: [userA._id, userB._id], createdBy: userA._id });
    expect(res.status).toBe(201);
    group = res.body;
  });

  test('add equal expense and update balances', async () => {
    const expenseRes = await request(app).post('/api/expenses').send({
      description: 'Dinner',
      amount: 100,
      group: group._id,
      paidBy: userA._id,
      splitType: 'equal',
      splits: [userA._id, userB._id]
    });
    expect(expenseRes.status).toBe(201);

    // Check balances for Bob owes Alice
    const balancesRes = await request(app).get(`/api/balances/user/${userB._id}/group/${group._id}`);
    expect(balancesRes.status).toBe(200);
    // Bob should owe ~50 to Alice
    const owes = balancesRes.body.owes;
    expect(Array.isArray(owes)).toBe(true);
    const found = owes.find(b => b.toUser && b.toUser._id === userA._id);
    expect(found).toBeTruthy();
  });

  test('simplify balances', async () => {
    const res = await request(app).post(`/api/balances/simplify/${group._id}`).send();
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
