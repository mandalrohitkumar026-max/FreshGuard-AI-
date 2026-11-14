import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { checkBifrostHealth } from '../integrations/bifrostClient';
import { checkTavilyHealth } from '../integrations/tavilyService';
import { freshnessWatchService } from '../modules/verification/freshnessWatchService';
import { asyncWrapper } from '../utils/asyncWrapper';

const router = Router();

router.get(
  '/',
  asyncWrapper(async (_req: Request, res: Response) => {
    const mongoConnected = mongoose.connection.readyState === 1;
    const scheduler = freshnessWatchService.getSchedulerStatus();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
      uptime: Math.floor(process.uptime()),
      services: {
        application: 'healthy',
        database: mongoConnected ? 'connected' : 'in-memory-fallback',
        backgroundWorker: scheduler.active ? 'active' : 'idle',
        activeWatches: scheduler.activeWatches,
      },
    });
  }),
);

router.get(
  '/ready',
  asyncWrapper(async (_req: Request, res: Response) => {
    const [bifrost, tavily] = await Promise.allSettled([
      checkBifrostHealth(),
      checkTavilyHealth(),
    ]);

    const mongoConnected = mongoose.connection.readyState === 1;
    const scheduler = freshnessWatchService.getSchedulerStatus();

    const bifrostOk = bifrost.status === 'fulfilled' && bifrost.value.ok;
    const tavilyOk = tavily.status === 'fulfilled' && tavily.value.ok;

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        application: { status: 'healthy' },
        database: { status: mongoConnected ? 'connected' : 'in-memory-fallback' },
        aiGateway: {
          status: bifrostOk ? 'connected' : 'resilient-fallback-active',
          latencyMs: bifrost.status === 'fulfilled' ? bifrost.value.latencyMs : null,
        },
        search: {
          status: tavilyOk ? 'connected' : 'public-web-fallback-active',
          latencyMs: tavily.status === 'fulfilled' ? tavily.value.latencyMs : null,
        },
        backgroundWorker: {
          status: scheduler.active ? 'active' : 'idle',
          activeWatches: scheduler.activeWatches,
        },
      },
    });
  }),
);

router.get(
  '/integrations',
  asyncWrapper(async (_req: Request, res: Response) => {
    const [bifrost, tavily] = await Promise.allSettled([
      checkBifrostHealth(),
      checkTavilyHealth(),
    ]);

    const bifrostResult =
      bifrost.status === 'fulfilled'
        ? { status: bifrost.value.ok ? 'ok' : 'unreachable', latencyMs: bifrost.value.latencyMs, model: bifrost.value.model }
        : { status: 'error', error: bifrost.reason?.message };

    const tavilyResult =
      tavily.status === 'fulfilled'
        ? { status: tavily.value.ok ? 'ok' : 'unreachable', latencyMs: tavily.value.latencyMs }
        : { status: 'error', error: tavily.reason?.message };

    const allOk = bifrostResult.status === 'ok' && tavilyResult.status === 'ok';

    res.status(allOk ? 200 : 503).json({
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      bifrost: bifrostResult,
      tavily: tavilyResult,
    });
  }),
);

export default router;
