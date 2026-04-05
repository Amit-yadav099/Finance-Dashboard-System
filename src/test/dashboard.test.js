const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');
const FinancialRecord = require('../../src/models/FinancialRecord');

let adminToken;
let viewerToken;
let testUserId;

beforeAll(async () => {
  const testDB = 'mongodb://localhost:27017/finance_test';
  await mongoose.connect(testDB);
  await User.deleteMany();
  await FinancialRecord.deleteMany();

  // Create test user
  const user = await User.create({
    name: 'Dashboard User',
    email: 'dashboard@test.com',
    password: '123456',
    role: 'viewer',
  });
  testUserId = user._id;

  // Create records for this user
  await FinancialRecord.create([
    { userId: testUserId, amount: 1000, type: 'income', category: 'Salary', date: new Date('2026-04-01') },
    { userId: testUserId, amount: 200, type: 'expense', category: 'Food', date: new Date('2026-04-02') },
    { userId: testUserId, amount: 300, type: 'expense', category: 'Shopping', date: new Date('2026-04-03') },
    { userId: testUserId, amount: 500, type: 'income', category: 'Freelance', date: new Date('2026-04-04') },
    { userId: testUserId, amount: 50, type: 'expense', category: 'Food', date: new Date('2026-03-28') }, // previous month
  ]);

  // Login to get token
  const loginRes = await request(app).post('/api/auth/login').send({
    email: 'dashboard@test.com',
    password: '123456',
  });
  viewerToken = loginRes.body.token;

  // Also create admin token for testing full access
  const admin = await User.create({
    name: 'Admin Dashboard',
    email: 'admindash@test.com',
    password: '123456',
    role: 'admin',
  });
  const adminLogin = await request(app).post('/api/auth/login').send({
    email: 'admindash@test.com',
    password: '123456',
  });
  adminToken = adminLogin.body.token;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Dashboard Summary API', () => {
  it('should return summary for authenticated user (viewer)', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('totalIncome');
    expect(res.body).toHaveProperty('totalExpenses');
    expect(res.body).toHaveProperty('netBalance');
    expect(res.body).toHaveProperty('categoryTotals');
    expect(res.body).toHaveProperty('recentActivity');
    expect(res.body).toHaveProperty('monthlyTrends');
  });

  it('should calculate correct totals for test user', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.body.totalIncome).toBe(1500); // 1000 + 500
    expect(res.body.totalExpenses).toBe(550); // 200 + 300 + 50
    expect(res.body.netBalance).toBe(950);
  });

  it('should respect date filters', async () => {
    const res = await request(app)
      .get('/api/dashboard?startDate=2026-04-01&endDate=2026-04-03')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.body.totalIncome).toBe(1000);
    expect(res.body.totalExpenses).toBe(500); // 200 + 300
  });

  it('should return category totals grouped correctly', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${viewerToken}`);
    const categories = res.body.categoryTotals;
    const foodCategory = categories.find(c => c._id.category === 'Food');
    expect(foodCategory).toBeDefined();
    expect(foodCategory.total).toBe(250); // 200 + 50
  });

  it('should include recent activity (max 5 records)', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.body.recentActivity.length).toBeLessThanOrEqual(5);
    expect(res.body.recentActivity[0]).toHaveProperty('date');
  });

  it('should allow admin to see summary for all users (if no userId filter)', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    // Admin sees all records, totals will be higher
    expect(res.body.totalIncome).toBeGreaterThanOrEqual(1500);
  });

  it('should deny unauthenticated requests', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.statusCode).toBe(401);
  });
});