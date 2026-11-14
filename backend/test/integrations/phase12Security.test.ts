// @ts-ignore
import request from 'supertest';
import { app } from '../../src/app';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';
import { inMemoryStore } from '../../src/services/sessionStore';
import { freshnessWatchService } from '../../src/modules/verification/freshnessWatchService';
import mongoose from 'mongoose';

describe('Phase 12 — Application Security & IDOR Protection Integration Suite', () => {
  const userAId = new mongoose.Types.ObjectId().toString();
  const userBId = new mongoose.Types.ObjectId().toString();

  const tokenUserA = jwt.sign(
    { userId: userAId, email: 'userA@freshguard.ai', role: 'user' },
    env.JWT_SECRET,
    { expiresIn: '1h' },
  );

  const tokenUserB = jwt.sign(
    { userId: userBId, email: 'userB@freshguard.ai', role: 'user' },
    env.JWT_SECRET,
    { expiresIn: '1h' },
  );

  let sessionUserAId: string;
  let reportUserAId: string;
  let watchUserAId: string;

  beforeAll(async () => {
    // Seed user A session in memory store
    const sessionA = inMemoryStore.createSession({
      userId: new mongoose.Types.ObjectId(userAId),
      originalAnswer: 'Private confidential AI verification answer for user A.',
      status: 'COMPLETE',
    });
    sessionUserAId = sessionA.id;

    // Seed user A report
    const reportA = inMemoryStore.saveReport({
      sessionId: sessionUserAId,
      userId: new mongoose.Types.ObjectId(userAId),
      originalAnswer: 'Private confidential AI verification answer for user A.',
      claims: [],
      overallFreshnessScore: 90,
      overallRiskLevel: 'LOW',
      freshnessInterpretation: 'VERY_FRESH',
      isPublic: false,
    });
    reportUserAId = reportA.id;

    // Seed user A watch
    const watchA = await freshnessWatchService.createWatch({
      sessionId: sessionUserAId,
      frequency: 'DAILY',
      userId: userAId,
    });
    watchUserAId = watchA.id;
  });

  describe('1. IDOR (Insecure Direct Object Reference) Prevention', () => {
    it('allows User A to access their own verification session', async () => {
      const res = await request(app)
        .get(`/api/v1/verification/${sessionUserAId}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('blocks User B from accessing User A verification session (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/v1/verification/${sessionUserAId}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message || res.body.message).toMatch(/permission/i);
    });

    it('allows User A to access their own private report', async () => {
      const res = await request(app)
        .get(`/api/v1/reports/${reportUserAId}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('blocks User B from accessing User A private report (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/v1/reports/${reportUserAId}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message || res.body.message).toMatch(/permission/i);
    });

    it('blocks User B from pausing/toggling User A freshness watch (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/v1/watches/${watchUserAId}/toggle`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('blocks User B from deleting User A freshness watch (403 Forbidden)', async () => {
      const res = await request(app)
        .delete(`/api/v1/watches/${watchUserAId}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Input Security & Payload Size Limiting', () => {
    it('rejects oversized JSON payloads exceeding 50kb limit (413 Payload Too Large)', async () => {
      const hugePayload = 'A'.repeat(60 * 1024); // 60KB string

      const res = await request(app)
        .post('/api/v1/verification')
        .set('Content-Type', 'application/json')
        .send(`{"answer": "${hugePayload}"}`);

      expect([413, 400]).toContain(res.status);
    });

    it('gracefully handles malformed JSON bodies (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/v1/verification')
        .set('Content-Type', 'application/json')
        .send('{"invalidJson: true');

      expect(res.status).toBe(400);
    });
  });

  describe('3. Rate Limiting & Security Headers', () => {
    it('exposes rate limiting and security headers on API responses', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty('ratelimit-limit');
      expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
    });
  });
});
