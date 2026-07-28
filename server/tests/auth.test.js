const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');
const emailService = require('../src/services/email.service');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Mock email service
jest.mock('../src/services/email.service', () => ({
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn()
}));

describe('Authentication Flow', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123!'
  };
  
  let rawVerifyToken = '';

  beforeAll(async () => {
    // Clear db
    await prisma.verificationToken.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Signup & Duplicates', () => {
    it('should create a new user and send verification email', async () => {
      // Create confirmPassword to match password for signup validator
      const res = await request(app).post('/api/auth/signup').send({...testUser, confirmPassword: testUser.password});
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email);

      // Verify email was sent and grab the token
      expect(emailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      const callArgs = emailService.sendVerificationEmail.mock.calls[0][0];
      expect(callArgs.email).toBe(testUser.email);
      rawVerifyToken = callArgs.token; // Save for later tests

      // Check DB for hashed password and unverified status
      const dbUser = await prisma.user.findUnique({ where: { email: testUser.email } });
      expect(dbUser.isVerified).toBe(false);
      const isMatch = await bcrypt.compare(testUser.password, dbUser.password);
      expect(isMatch).toBe(true);
    });

    it('should prevent duplicate emails', async () => {
      const res = await request(app).post('/api/auth/signup').send({...testUser, confirmPassword: testUser.password});
      expect(res.status).toBe(409);
    });
  });

  describe('2. Login Before Verification', () => {
    it('should block login if email is not verified', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password
      });
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/verify your email/i);
    });
  });

  describe('3. Email Verification', () => {
    it('should fail with invalid token', async () => {
      const res = await request(app).post('/api/auth/verify-email').send({ token: 'invalid_token' });
      expect(res.status).toBe(400);
    });

    it('should verify email successfully with raw token', async () => {
      const res = await request(app).post('/api/auth/verify-email').send({ token: rawVerifyToken });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dbUser = await prisma.user.findUnique({ where: { email: testUser.email } });
      expect(dbUser.isVerified).toBe(true);
      expect(dbUser.emailVerifiedAt).not.toBeNull();
    });

    it('should prevent reusing the verification token', async () => {
      const res = await request(app).post('/api/auth/verify-email').send({ token: rawVerifyToken });
      expect(res.status).toBe(400);
    });
  });

  describe('4. Login After Verification & Session Refresh', () => {
    let refreshTokenCookie = '';
    
    it('should allow login after verification', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password
      });
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refreshCookie = cookies.find(c => c.startsWith('refreshToken='));
      expect(refreshCookie).toBeDefined();
      refreshTokenCookie = refreshCookie.split(';')[0]; // Save for refresh test
    });

    it('should fail with incorrect password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: 'WrongPassword1!'
      });
      expect(res.status).toBe(401);
    });

    it('should refresh access token using refresh cookie', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', refreshTokenCookie);
      
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });
  });

  describe('5. Protected Routes & User Isolation', () => {
    let tokenA = '';
    
    beforeAll(async () => {
      // Login to get token
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password
      });
      tokenA = res.body.data.accessToken;
    });

    it('should access protected route with token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(testUser.email);
    });

    it('should reject access without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('6. Logout', () => {
    it('should logout and invalidate session', async () => {
      // First login
      const loginRes = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password
      });
      const cookies = loginRes.headers['set-cookie'];
      const refreshCookie = cookies.find(c => c.startsWith('refreshToken='));

      // Logout
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', refreshCookie);
      expect(logoutRes.status).toBe(200);

      // Attempt refresh with old cookie
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', refreshCookie);
      expect(refreshRes.status).toBe(401);
    });
  });
});
