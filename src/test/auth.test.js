const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

beforeEach(async () => {
  await User.deleteMany();
});

describe('Auth Endpoints', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'test@test.com', password: '123456', role: 'viewer' });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
  });

  it('should login', async () => {
    await request(app).post('/api/auth/register').send({ name: 'Test', email: 'test@test.com', password: '123456' });
    const res = await request(app).post('/api/auth/login').send({ email: 'test@test.com', password: '123456' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.token).toBeDefined();
  });
});