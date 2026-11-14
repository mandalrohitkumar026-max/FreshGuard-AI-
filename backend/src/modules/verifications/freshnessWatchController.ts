import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { freshnessWatchService } from './freshnessWatchService';
import { ApiError } from '../../utils/ApiError';

export class FreshnessWatchController {
  createWatch = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId, frequency } = req.body;
    if (!sessionId) {
      throw ApiError.badRequest('sessionId is required to establish a Freshness Watch');
    }

    const userId = req.userId || '000000000000000000000001';
    const watch = await freshnessWatchService.createWatch({
      sessionId,
      userId,
      frequency,
    });

    return ApiResponse.created(res, watch, 'Freshness watch activated with real scheduled monitoring');
  });

  listWatches = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    const watches = freshnessWatchService.listWatches(userId);
    return ApiResponse.ok(res, { total: watches.length, watches }, 'Monitored watches retrieved');
  });

  getWatch = asyncHandler(async (req: Request, res: Response) => {
    const watch = freshnessWatchService.getWatch(String(req.params.id));
    if (!watch) {
      throw ApiError.notFound('Monitored watch not found');
    }
    return ApiResponse.ok(res, watch, 'Watch details retrieved');
  });

  triggerCheck = asyncHandler(async (req: Request, res: Response) => {
    const result = await freshnessWatchService.executeRecheck(String(req.params.id));
    return ApiResponse.ok(
      res,
      result,
      result.alertGenerated
        ? 'Recheck executed: Factual drift detected and alert issued'
        : 'Recheck executed: All assertions remain fresh',
    );
  });

  cancelWatch = asyncHandler(async (req: Request, res: Response) => {
    const success = freshnessWatchService.cancelWatch(String(req.params.id), req.userId, req.userRole);
    if (!success) {
      throw ApiError.notFound('Watch not found');
    }
    return ApiResponse.ok(res, { message: 'Watch successfully paused' }, 'Watch cancelled');
  });

  toggleWatch = asyncHandler(async (req: Request, res: Response) => {
    const watch = freshnessWatchService.getWatch(String(req.params.id));
    if (!watch) {
      throw ApiError.notFound('Watch not found');
    }
    if (watch.active) {
      freshnessWatchService.pauseWatch(String(req.params.id), req.userId, req.userRole);
    } else {
      freshnessWatchService.resumeWatch(String(req.params.id), req.userId, req.userRole);
    }
    const updated = freshnessWatchService.getWatch(String(req.params.id));
    return ApiResponse.ok(res, updated, `Watch successfully ${updated?.active ? 'resumed' : 'paused'}`);
  });

  getAlerts = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    const alerts = freshnessWatchService.getAllAlerts(userId);
    return ApiResponse.ok(res, { total: alerts.length, alerts }, 'Freshness drift alerts retrieved');
  });
}

export const freshnessWatchController = new FreshnessWatchController();
