// @ts-ignore
import request from 'supertest';
import { app } from '../../src/app';
import { conflictDetectionService } from '../../src/modules/verification/conflictDetectionService';
import { answerEvolutionService } from '../../src/modules/verification/answerEvolutionService';
import { freshnessWatchService } from '../../src/modules/verification/freshnessWatchService';
import { verificationService } from '../../src/modules/verification/verification.service';
import { VerifiedEvidenceItem } from '../../src/modules/verification/verification.types';

describe('Phase 11 — End-to-End Integration & Advanced Intelligence Suite', () => {
  // =========================================================================
  // 1. EVIDENCE CONFLICT TESTS (5 Scenarios)
  // =========================================================================
  describe('Advanced Feature 1: Evidence Conflict Detector', () => {
    test('Scenario 1: Two sources support the same claim -> No conflict reported', () => {
      const supporting: VerifiedEvidenceItem[] = [
        {
          url: 'https://nodejs.org/docs',
          domain: 'nodejs.org',
          title: 'Node.js LTS Releases',
          content: 'Node.js 22 is active LTS release.',
          authorityScore: 0.95,
          publishedDate: '2026-05-01T00:00:00Z',
        },
        {
          url: 'https://github.com/nodejs/node',
          domain: 'github.com',
          title: 'Node Repository',
          content: 'Node 22 is officially supported as LTS.',
          authorityScore: 0.90,
          publishedDate: '2026-05-10T00:00:00Z',
        },
      ];

      const result = conflictDetectionService.analyzeConflicts(
        'Node.js 22 is the LTS version.',
        supporting,
        [],
        'SUPPORTED',
      );

      expect(result.hasConflict).toBe(false);
      expect(result.conflictType).toBe('NONE');
      expect(result.sourceDisagreements.length).toBe(0);
    });

    test('Scenario 2: Two sources directly contradict a claim -> DIRECT_CONTRADICTION with High severity', () => {
      const supporting: VerifiedEvidenceItem[] = [
        {
          url: 'https://old-blog.example.com',
          domain: 'old-blog.example.com',
          title: 'React Releases',
          content: 'React 18 is the latest stable version of React.',
          authorityScore: 0.60,
          publishedDate: '2024-01-01T00:00:00Z',
        },
      ];
      const contradicting: VerifiedEvidenceItem[] = [
        {
          url: 'https://react.dev/blog',
          domain: 'react.dev',
          title: 'React 19 is Here',
          content: 'React 19 is now stable and supersedes React 18 completely.',
          authorityScore: 0.98,
          publishedDate: '2024-12-05T00:00:00Z',
          isContradicting: true,
        },
      ];

      const result = conflictDetectionService.analyzeConflicts(
        'React 18 is the latest stable version.',
        supporting,
        contradicting,
        'OUTDATED',
      );

      expect(result.hasConflict).toBe(true);
      expect(['DIRECT_CONTRADICTION', 'TEMPORAL_SUPERSEDENCE']).toContain(result.conflictType);
      expect(['CRITICAL', 'HIGH']).toContain(result.severity);
      expect(result.sourceDisagreements.length).toBeGreaterThan(0);
      expect(result.recommendedResolution).toBeDefined();
    });

    test('Scenario 3: Two sources report different numerical figures -> NUMERICAL_DISAGREEMENT', () => {
      const supporting: VerifiedEvidenceItem[] = [
        {
          url: 'https://finance-daily.example.com',
          domain: 'finance-daily.example.com',
          title: 'Forex Rates',
          content: 'The exchange rate USD to EUR stands at 0.92.',
          authorityScore: 0.75,
          publishedDate: '2026-11-01T00:00:00Z',
        },
      ];
      const contradicting: VerifiedEvidenceItem[] = [
        {
          url: 'https://reuters.com/forex',
          domain: 'reuters.com',
          title: 'Reuters Forex Daily',
          content: 'The official rate USD to EUR closed today at 0.88.',
          authorityScore: 0.95,
          publishedDate: '2026-11-01T00:00:00Z',
          isContradicting: true,
        },
      ];

      const result = conflictDetectionService.analyzeConflicts(
        'USD to EUR exchange rate is 0.92.',
        supporting,
        contradicting,
        'PARTIALLY_SUPPORTED',
      );

      expect(result.hasConflict).toBe(true);
      expect(result.conflictType).toBe('NUMERICAL_DISAGREEMENT');
      expect(result.severity).toBe('HIGH');
      expect(result.explanation).toContain('Numerical divergence');
    });

    test('Scenario 4: Sources refer to different time periods -> TEMPORAL_SUPERSEDENCE / TEMPORAL_DIFFERENCE', () => {
      const supporting: VerifiedEvidenceItem[] = [
        {
          url: 'https://news-archive.example.com',
          domain: 'news-archive.example.com',
          title: 'Twitter Leadership 2022',
          content: 'Parag Agrawal serves as the CEO of Twitter.',
          authorityScore: 0.80,
          publishedDate: '2022-04-01T00:00:00Z',
        },
      ];
      const contradicting: VerifiedEvidenceItem[] = [
        {
          url: 'https://techcrunch.com/2026/x-leadership',
          domain: 'techcrunch.com',
          title: 'X Executive Suite',
          content: 'Linda Yaccarino serves as Chief Executive Officer of X.',
          authorityScore: 0.90,
          publishedDate: '2026-06-01T00:00:00Z',
          isContradicting: true,
        },
      ];

      const result = conflictDetectionService.analyzeConflicts(
        'Parag Agrawal is the current CEO of Twitter.',
        supporting,
        contradicting,
        'OUTDATED',
      );

      expect(result.hasConflict).toBe(true);
      expect(['TEMPORAL_SUPERSEDENCE', 'TEMPORAL_DIFFERENCE']).toContain(result.conflictType);
      expect(result.explanation).toContain('Temporal');
    });

    test('Scenario 5: Evidence is insufficient -> INSUFFICIENT_EVIDENCE', () => {
      const result = conflictDetectionService.analyzeConflicts(
        'A clandestine startup XyloQ9 launched in Greenland in 2026.',
        [],
        [],
        'UNVERIFIED',
      );

      expect(result.hasConflict).toBe(false);
      expect(result.conflictType).toBe('INSUFFICIENT_EVIDENCE');
      expect(result.recommendedResolution).toContain('Broaden retrieval');
    });
  });

  // =========================================================================
  // 2. ANSWER EVOLUTION TESTS (6 Scenarios)
  // =========================================================================
  describe('Advanced Feature 2: Answer Evolution Tracker', () => {
    test('Scenario 1: Identical answer revision -> UNCHANGED classification', async () => {
      const v1Session = await verificationService.createSession({
        userId: 'tester-evo-1',
        originalAnswer: 'Python was created by Guido van Rossum.',
      });
      await verificationService.runVerification((v1Session._id || v1Session.id).toString());

      const v2Session = await verificationService.createSession({
        userId: 'tester-evo-1',
        originalAnswer: 'Python was created by Guido van Rossum.',
      });
      await verificationService.runVerification((v2Session._id || v2Session.id).toString());

      const evolution = await answerEvolutionService.compareVersions(
        (v1Session._id || v1Session.id).toString(),
        (v2Session._id || v2Session.id).toString(),
      );

      expect(evolution.scoreDelta).toBe(0);
      expect(evolution.unmodifiedClaims.length).toBeGreaterThan(0);
      expect(evolution.addedClaims.length).toBe(0);
      expect(evolution.removedClaims.length).toBe(0);
    });

    test('Scenario 2: Answer contains a new claim -> ADDED classification', async () => {
      const v1 = await verificationService.createSession({
        userId: 'tester-evo-2',
        originalAnswer: 'Node.js is an open-source JavaScript runtime.',
      });
      await verificationService.runVerification((v1._id || v1.id).toString());

      const v2 = await verificationService.createSession({
        userId: 'tester-evo-2',
        originalAnswer:
          'Node.js is an open-source JavaScript runtime. Node.js 22 was officially released with V8 12.4.',
      });
      await verificationService.runVerification((v2._id || v2.id).toString());

      const evolution = await answerEvolutionService.compareVersions(
        (v1._id || v1.id).toString(),
        (v2._id || v2.id).toString(),
      );

      expect(evolution.addedClaims.length).toBeGreaterThan(0);
      expect(evolution.addedClaims[0].claimText).toContain('Node.js');
    });

    test('Scenario 3: Answer removes an obsolete claim -> REMOVED classification', async () => {
      const v1 = await verificationService.createSession({
        userId: 'tester-evo-3',
        originalAnswer: 'TypeScript is typed JavaScript. React 16 is the newest version.',
      });
      await verificationService.runVerification((v1._id || v1.id).toString());

      const v2 = await verificationService.createSession({
        userId: 'tester-evo-3',
        originalAnswer: 'TypeScript is typed JavaScript.',
      });
      await verificationService.runVerification((v2._id || v2.id).toString());

      const evolution = await answerEvolutionService.compareVersions(
        (v1._id || v1.id).toString(),
        (v2._id || v2.id).toString(),
      );

      expect(evolution.removedClaims.length).toBeGreaterThan(0);
      expect(evolution.version).toBe(2);
    });

    test('Scenario 4: Answer modifies a claim wording -> MODIFIED classification', async () => {
      const v1 = await verificationService.createSession({
        userId: 'tester-evo-4',
        originalAnswer: 'React is an open source library maintained by Meta.',
      });
      await verificationService.runVerification((v1._id || v1.id).toString());

      const v2 = await verificationService.createSession({
        userId: 'tester-evo-4',
        originalAnswer: 'React is a popular UI library maintained by the Meta engineering team.',
      });
      await verificationService.runVerification((v2._id || v2.id).toString());

      const evolution = await answerEvolutionService.compareVersions(
        (v1._id || v1.id).toString(),
        (v2._id || v2.id).toString(),
      );

      expect(evolution.version).toBe(2);
      expect(evolution.timeline.length).toBe(2);
    });

    test('Scenario 5: Outdated claim fixed -> NEWLY_SUPPORTED / STALENESS_RESOLVED', async () => {
      const v1 = await verificationService.createSession({
        userId: 'tester-evo-5',
        originalAnswer: 'React 18 is the latest stable React version.',
      });
      await verificationService.runVerification((v1._id || v1.id).toString());

      const v2 = await verificationService.createSession({
        userId: 'tester-evo-5',
        originalAnswer: 'React 19 is the latest stable React version.',
      });
      await verificationService.runVerification((v2._id || v2.id).toString());

      const evolution = await answerEvolutionService.compareVersions(
        (v1._id || v1.id).toString(),
        (v2._id || v2.id).toString(),
      );

      expect(evolution.scoreDelta).toBeGreaterThan(0);
      expect(evolution.stalenessResolvedCount).toBeGreaterThanOrEqual(1);
    });

    test('Scenario 6: New revision introduces outdated claim -> NEWLY_OUTDATED', async () => {
      const v1 = await verificationService.createSession({
        userId: 'tester-evo-6',
        originalAnswer: 'JavaScript supports async and await keywords.',
      });
      await verificationService.runVerification((v1._id || v1.id).toString());

      const v2 = await verificationService.createSession({
        userId: 'tester-evo-6',
        originalAnswer: 'JavaScript supports async keywords. React 16 is current.',
      });
      await verificationService.runVerification((v2._id || v2.id).toString());

      const evolution = await answerEvolutionService.compareVersions(
        (v1._id || v1.id).toString(),
        (v2._id || v2.id).toString(),
      );

      expect(evolution.version).toBe(2);
      expect(evolution.timeline.length).toBe(2);
      expect(evolution.addedClaims.length + evolution.changedClaims.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // 3. FRESHNESS WATCH TESTS (8 Scenarios)
  // =========================================================================
  describe('Advanced Feature 3: Freshness Watch Scheduler', () => {
    let testWatchId: string;
    let testSessionId: string;

    beforeAll(async () => {
      const session = await verificationService.createSession({
        userId: 'tester-watch-user',
        originalAnswer: 'Python was released in 1991.',
      });
      testSessionId = (session._id || session.id).toString();
      await verificationService.runVerification(testSessionId);
    });

    test('Scenario 1: Creates a scheduled freshness watch', async () => {
      const watch = await freshnessWatchService.createWatch({
        sessionId: testSessionId,
        userId: 'tester-watch-user',
        frequency: 'DAILY',
      });

      expect(watch.id).toBeDefined();
      expect(watch.active).toBe(true);
      expect(watch.frequency).toBe('DAILY');
      expect(watch.checkCount).toBe(1);
      testWatchId = watch.id;
    });

    test('Scenario 2: Executes a scheduled re-verification check', async () => {
      const recheck = await freshnessWatchService.executeRecheck(testWatchId);

      expect(recheck.watch).toBeDefined();
      expect(recheck.watch.checkCount).toBeGreaterThanOrEqual(2);
      expect(recheck.watch.currentScore).toBeDefined();
    });

    test('Scenario 3: Detects meaningful change and issues drift alert', async () => {
      const staleSession = await verificationService.createSession({
        userId: 'tester-drift',
        originalAnswer: 'React 18 is the latest stable React version.',
      });
      const sid = (staleSession._id || staleSession.id).toString();
      await verificationService.runVerification(sid);

      const staleWatch = await freshnessWatchService.createWatch({
        sessionId: sid,
        userId: 'tester-drift',
        frequency: 'HOURLY',
      });

      // Force simulated drift
      staleWatch.baselineScore = 100;
      staleWatch.currentScore = 100;

      const recheck = await freshnessWatchService.executeRecheck(staleWatch.id);
      expect(recheck.alertGenerated).toBe(true);
      expect(recheck.watch.alerts.length).toBeGreaterThan(0);
      expect(recheck.watch.alerts[0].type).toBe('STALENESS_DETECTED');
    });

    test('Scenario 4: Updates monitoring history and lastChecked timestamp', async () => {
      const watch = freshnessWatchService.getWatch(testWatchId);
      expect(watch).toBeDefined();
      expect(new Date(watch!.lastCheckedAt).getTime()).toBeLessThanOrEqual(Date.now());
      expect(new Date(watch!.nextCheckAt).getTime()).toBeGreaterThan(Date.now());
    });

    test('Scenario 5: Pauses and resumes watch successfully', () => {
      const paused = freshnessWatchService.pauseWatch(testWatchId);
      expect(paused).toBe(true);
      let watch = freshnessWatchService.getWatch(testWatchId);
      expect(watch?.active).toBe(false);

      const resumed = freshnessWatchService.resumeWatch(testWatchId);
      expect(resumed).toBe(true);
      watch = freshnessWatchService.getWatch(testWatchId);
      expect(watch?.active).toBe(true);
    });

    test('Scenario 6: Cancels and removes watch permanently', () => {
      const cancelled = freshnessWatchService.cancelWatch(testWatchId);
      expect(cancelled).toBe(true);
      const watch = freshnessWatchService.getWatch(testWatchId);
      expect(watch?.active).toBe(false);
    });

    test('Scenario 7: Gracefully handles non-existent watch without crashing', async () => {
      await expect(
        freshnessWatchService.executeRecheck('non-existent-watch-id-12345'),
      ).rejects.toThrow();
    });

    test('Scenario 8: Alerts endpoint retrieves user notifications', async () => {
      const alerts = freshnessWatchService.getAllAlerts('tester-drift');
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // 4. COMPLETE END-TO-END PIPELINE & REST API INTEGRATION
  // =========================================================================
  describe('Full End-to-End Verification Pipeline & REST APIs', () => {
    let e2eSessionId: string;

    test('E2E Step 1: POST /api/v1/verification/run runs complete 10-stage pipeline', async () => {
      const res = await request(app)
        .post('/api/v1/verification/run')
        .send({
          originalAnswer: 'Node.js 22 is an Active LTS version. JavaScript was created in 1995.',
          topic: 'Web Engineering',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sessionId).toBeDefined();
      e2eSessionId = res.body.data.sessionId;

      expect(res.body.data.summary.totalClaims).toBe(2);
      expect(res.body.data.summary.overallFreshnessScore).toBeGreaterThanOrEqual(70);
      expect(res.body.data.summary.overallRiskLevel).toBeDefined();
    });

    test('E2E Step 2: GET /api/v1/verification/:id/results returns structured claims & 5 factors', async () => {
      const res = await request(app).get(`/api/v1/verification/${e2eSessionId}/results`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.claims.length).toBe(2);
      expect(res.body.data.claims[0].factors).toBeDefined();
      expect(res.body.data.claims[0].factors.temporalRelevance).toBeDefined();
      expect(res.body.data.claims[0].factors.evidenceRecency).toBeDefined();
      expect(res.body.data.claims[0].factors.evidenceQuality).toBeDefined();
    });

    test('E2E Step 3: GET /api/v1/verification/:id/conflicts returns evidence conflict analysis', async () => {
      const res = await request(app).get(`/api/v1/verification/${e2eSessionId}/conflicts`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.conflicts).toBeDefined();
    });

    test('E2E Step 4: GET /api/v1/verification/:id/audit-trail returns SHA-256 verified package', async () => {
      const res = await request(app).get(`/api/v1/verification/${e2eSessionId}/audit-trail`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fingerprint.algorithm).toBe('sha256');
      expect(res.body.data.fingerprint.hash.length).toBe(64);
    });

    test('E2E Step 5: POST /api/v1/verification/evolve submits a revised version and generates delta', async () => {
      const res = await request(app)
        .post('/api/v1/verification/evolve')
        .send({
          parentSessionId: e2eSessionId,
          revisedAnswer:
            'Node.js 22 is an Active LTS version. JavaScript was created by Brendan Eich in 1995.',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      const evo = res.body.data.evolution || res.body.data;
      expect(evo.version).toBe(2);
      expect(evo.timeline.length).toBe(2);
    });

    test('E2E Step 6: POST /api/v1/watches activates continuous freshness monitoring', async () => {
      const res = await request(app)
        .post('/api/v1/watches')
        .send({
          sessionId: e2eSessionId,
          frequency: 'DAILY',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.active).toBe(true);
    });

    test('E2E Step 7: GET /api/v1/watches lists all active watches', async () => {
      const res = await request(app).get('/api/v1/watches');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.watches)).toBe(true);
    });

    test('E2E Step 8: GET /api/v1/notifications lists system drift notifications', async () => {
      const res = await request(app).get('/api/v1/notifications');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications).toBeDefined();
    });
  });
});
