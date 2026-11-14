// @ts-ignore
import request from 'supertest';
import { app } from '../../src/app';

describe('Phase 03 — Backend Foundation & Architecture Integration Tests', () => {
  let authToken = '';
  let createdSessionId = '';
  const testUser = {
    name: 'Architect Tester',
    email: `tester_${Date.now()}@freshguard.ai`,
    password: 'SecureTestPassword123!',
  };

  describe('1. Health & Documentation Endpoints', () => {
    it('GET /api/v1/health should return ok with system status', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.services).toBeDefined();
    });

    it('GET /api/v1/integrations/status should return operational status', async () => {
      const res = await request(app).get('/api/v1/integrations/status');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.integrations).toBeDefined();
      expect(res.body.data.integrations.bifrost).toBeDefined();
      expect(res.body.data.integrations.tavily).toBeDefined();
    });

    it('GET /api/docs/ should serve Swagger UI HTML', async () => {
      const res = await request(app).get('/api/docs/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Swagger UI');
    });
  });

  describe('2. Authentication Module (Routes -> Controllers -> Services -> Repositories)', () => {
    it('POST /api/v1/auth/register should create a new user and return tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('POST /api/v1/auth/register should reject duplicate email with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('POST /api/v1/auth/register should reject invalid email with 400 Validation Error', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Invalid User',
          email: 'not-an-email',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/auth/login should authenticate with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      authToken = res.body.data.accessToken;
    });

    it('POST /api/v1/auth/login should reject invalid password with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/v1/auth/me should return user details when authenticated', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email.toLowerCase());
    });

    it('GET /api/v1/auth/me should reject request without token with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('POST /api/v1/auth/logout should invalidate the session', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('3. Verification Module (Session Management, Claims & Reports)', () => {
    it('POST /api/v1/verification should create a session with valid input', async () => {
      const res = await request(app)
        .post('/api/v1/verification')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          originalAnswer: 'Next.js 15 was officially released in October 2024 introducing Async Request APIs and React 19 support.',
          topic: 'Frontend Development',
          sourceModel: 'GPT-4o',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sessionId).toBeDefined();
      expect(res.body.data.status).toBe('PROCESSING');
      createdSessionId = res.body.data.sessionId;
    });

    it('POST /api/v1/verification should reject input shorter than 10 characters', async () => {
      const res = await request(app)
        .post('/api/v1/verification')
        .send({
          originalAnswer: 'Too short',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('GET /api/v1/verification/:id should retrieve session details', async () => {
      const res = await request(app)
        .get(`/api/v1/verification/${createdSessionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id || res.body.data.id).toBe(createdSessionId);
    });

    it('GET /api/v1/verification should retrieve paginated user history', async () => {
      const res = await request(app)
        .get('/api/v1/verification?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.sessions)).toBe(true);
      expect(res.body.data.page).toBe(1);
    });

    it('GET /api/v1/verification/:id/claims should return claims array', async () => {
      const res = await request(app)
        .get(`/api/v1/verification/${createdSessionId}/claims`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('DELETE /api/v1/verification/:id should delete the session', async () => {
      const res = await request(app)
        .delete(`/api/v1/verification/${createdSessionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('4. Frontend Compatibility & Resilience', () => {
    it('GET /api/v1/history should return history array for frontend compatibility', async () => {
      const res = await request(app).get('/api/v1/history');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /non-existent-route should return structured 404 error envelope', async () => {
      const res = await request(app).get('/non-existent-route');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
    });
  });
});
