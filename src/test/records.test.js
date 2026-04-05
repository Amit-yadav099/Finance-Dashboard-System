const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');
const FinancialRecord = require('../../src/models/FinancialRecord');

let adminToken;
let analystToken;
let viewerToken;
let adminUser;
let analystUser;
let viewerUser;

beforeAll(async () => {
  // Use test database (override .env for tests)
  const testDB = 'mongodb://localhost:27017/finance_test';
  await mongoose.connect(testDB);
  await User.deleteMany();
  await FinancialRecord.deleteMany();

  // Create users with different roles
  adminUser = await User.create({
    name: 'Admin Test',
    email: 'admin@test.com',
    password: '123456',
    role: 'admin',
    isActive: true,
  });
  analystUser = await User.create({
    name: 'Analyst Test',
    email: 'analyst@test.com',
    password: '123456',
    role: 'analyst',
    isActive: true,
  });
  viewerUser = await User.create({
    name: 'Viewer Test',
    email: 'viewer@test.com',
    password: '123456',
    role: 'viewer',
    isActive: true,
  });

  // Get tokens (simulate login)
  const login = async (email) => {
    const res = await request(app).post('/api/auth/login').send({ email, password: '123456' });
    return res.body.token;
  };
  adminToken = await login('admin@test.com');
  analystToken = await login('analyst@test.com');
  viewerToken = await login('viewer@test.com');
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Financial Records API', () => {
  let recordId;

  describe('POST /api/records (create record)', () => {
    it('should allow admin to create a record', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 1000,
          type: 'income',
          category: 'Salary',
          date: '2026-04-01',
          description: 'Test salary',
        });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.amount).toBe(1000);
      recordId = res.body._id;
    });

    it('should allow analyst to create a record', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          amount: 200,
          type: 'expense',
          category: 'Food',
          description: 'Lunch',
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.type).toBe('expense');
    });

    it('should deny viewer from creating a record (403)', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          amount: 500,
          type: 'income',
          category: 'Bonus',
        });
      expect(res.statusCode).toBe(403);
    });

    it('should return 400 for invalid data (missing amount)', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'income',
          category: 'Test',
        });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/records (list records)', () => {
    it('should allow viewer to get records (own only)', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.records).toBeInstanceOf(Array);
    });

    it('should allow admin to get all records', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.records.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/records?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.records.length).toBeLessThanOrEqual(1);
      expect(res.body).toHaveProperty('totalPages');
    });

    it('should filter by type', async () => {
      const res = await request(app)
        .get('/api/records?type=income')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.records.every(r => r.type === 'income')).toBe(true);
    });

    it('should filter by date range', async () => {
      const res = await request(app)
        .get('/api/records?startDate=2026-03-01&endDate=2026-04-02')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
    });

    it('should search by description', async () => {
      const res = await request(app)
        .get('/api/records?search=salary')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.records.some(r => r.description?.includes('salary'))).toBe(true);
    });
  });

  describe('PUT /api/records/:id (update record)', () => {
    it('should allow admin to update any record', async () => {
      const res = await request(app)
        .put(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 1200, description: 'Updated salary' });
      expect(res.statusCode).toBe(200);
      expect(res.body.amount).toBe(1200);
    });

    it('should allow analyst to update record (assuming same user or all records)', async () => {
      // Create a record with analyst first
      const createRes = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ amount: 50, type: 'expense', category: 'Coffee' });
      const analystRecordId = createRes.body._id;

      const updateRes = await request(app)
        .put(`/api/records/${analystRecordId}`)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ amount: 60 });
      expect(updateRes.statusCode).toBe(200);
    });

    it('should return 404 for non-existent record', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/records/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 999 });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/records/:id (soft delete)', () => {
    it('should soft delete a record (admin)', async () => {
      const res = await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/soft deleted/);

      // Verify it's not in regular list
      const getRes = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${adminToken}`);
      const found = getRes.body.records.some(r => r._id === recordId);
      expect(found).toBe(false);
    });

    it('should deny viewer from deleting', async () => {
      const res = await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.statusCode).toBe(403);
    });
  });
});