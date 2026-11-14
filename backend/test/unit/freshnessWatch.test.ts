import { freshnessWatchService } from '../../src/modules/verification/freshnessWatchService';
import { verificationService } from '../../src/modules/verification/verification.service';

jest.mock('../../src/modules/verification/verification.service');

describe('Freshness Watch (Real Scheduled Processing)', () => {
  beforeAll(() => {
    freshnessWatchService.stopScheduler(); // stop real loop during test to control execution
  });

  afterAll(() => {
    freshnessWatchService.stopScheduler();
  });

  const mockSession = {
    id: 'session-watch-1',
    originalAnswer: 'Node.js 20 is the current LTS version.',
    context: { topic: 'Node.js LTS Releases' },
  };

  const mockInitialResults = {
    summary: {
      overallFreshnessScore: 100,
      overallRiskLevel: 'FRESH',
      outdated: 0,
      totalClaims: 1,
    },
    claims: [],
  };

  const mockDegradedResults = {
    summary: {
      overallFreshnessScore: 40,
      overallRiskLevel: 'OUTDATED',
      outdated: 1,
      totalClaims: 1,
    },
    claims: [],
  };

  test('successfully creates a monitored watch with next scheduled run', async () => {
    (verificationService.getSessionById as jest.Mock).mockResolvedValue(mockSession);
    (verificationService.getVerificationResults as jest.Mock).mockResolvedValue(mockInitialResults);

    const watch = await freshnessWatchService.createWatch({
      sessionId: 'session-watch-1',
      userId: 'user-123',
      frequency: 'DAILY',
    });

    expect(watch.id).toBeDefined();
    expect(watch.sessionId).toBe('session-watch-1');
    expect(watch.frequency).toBe('DAILY');
    expect(watch.active).toBe(true);
    expect(watch.baselineScore).toBe(100);
    expect(new Date(watch.nextCheckAt).getTime()).toBeGreaterThan(Date.now());
  });

  test('executes recheck and triggers alert when freshness score drops', async () => {
    (verificationService.getSessionById as jest.Mock).mockResolvedValue(mockSession);
    (verificationService.getVerificationResults as jest.Mock).mockResolvedValue(mockInitialResults);
    (verificationService.createSession as jest.Mock).mockResolvedValue({ id: 'recheck-session-1' });
    (verificationService.runVerification as jest.Mock).mockResolvedValue(mockDegradedResults);

    const watch = await freshnessWatchService.createWatch({
      sessionId: 'session-watch-1',
      userId: 'user-123',
      frequency: 'HOURLY',
    });

    const { watch: updatedWatch, alertGenerated } = await freshnessWatchService.executeRecheck(watch.id);

    expect(alertGenerated).toBe(true);
    expect(updatedWatch.currentScore).toBe(40);
    expect(updatedWatch.currentRiskLevel).toBe('OUTDATED');
    expect(updatedWatch.alerts).toHaveLength(1);
    expect(updatedWatch.alerts[0].type).toBe('STALENESS_DETECTED');
    expect(updatedWatch.alerts[0].previousScore).toBe(100);
    expect(updatedWatch.alerts[0].newScore).toBe(40);
  });

  test('cancels active watch', () => {
    const watches = freshnessWatchService.listWatches();
    const first = watches[0];
    const success = freshnessWatchService.cancelWatch(first.id);

    expect(success).toBe(true);
    const updated = freshnessWatchService.getWatch(first.id);
    expect(updated?.active).toBe(false);
  });
});
