// @ts-ignore
import request from 'supertest';
import { app } from '../../src/app';
import { freshnessWatchService } from '../../src/modules/verification/freshnessWatchService';

describe('Developer API — Foundation Integration Tests', () => {
  const validKey = 'fg_live_demo_hackathon2026';

  afterAll(() => {
    freshnessWatchService.stopScheduler();
  });

  test('POST /api/v1/developer/verify rejects requests without API key with 401', async () => {
    const res = await request(app)
      .post('/api/v1/developer/verify')
      .send({ answerText: 'Node.js 22 is LTS.' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Authentication required');
  });

  test('POST /api/v1/developer/verify rejects invalid API key with 401', async () => {
    const res = await request(app)
      .post('/api/v1/developer/verify')
      .set('x-api-key', 'fg_live_invalid_key_12345')
      .send({ answerText: 'Node.js 22 is LTS.' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Invalid or revoked');
  });

  test('POST /api/v1/developer/verify rejects payload with answerText < 5 chars with 400', async () => {
    const res = await request(app)
      .post('/api/v1/developer/verify')
      .set('x-api-key', validKey)
      .send({ answerText: 'Hi' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_REQUEST_PAYLOAD');
  });

  test('POST /api/v1/developer/verify executes verification with valid key and payload', async () => {
    const res = await request(app)
      .post('/api/v1/developer/verify')
      .set('x-api-key', validKey)
      .send({
        answerText: 'JavaScript was created by Brendan Eich in 1995.',
        topic: 'Programming History',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sessionId).toBeDefined();
    expect(res.body.data.overallFreshnessScore).toBeDefined();
    expect(res.body.data.claims).toBeInstanceOf(Array);
  });

  test('POST /api/v1/developer/keys generates a new developer API key', async () => {
    const res = await request(app)
      .post('/api/v1/developer/keys')
      .send({ name: 'Integration Test Service Key' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.apiKey).toMatch(/^fg_live_[a-f0-9]{40}$/);
    expect(res.body.data.rateLimitPerMinute).toBe(60);
  });

  test('GET /api/v1/developer/keys lists active keys', async () => {
    const res = await request(app).get('/api/v1/developer/keys');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.keys).toBeInstanceOf(Array);
  });
});
