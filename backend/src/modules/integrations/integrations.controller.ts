import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { integrationsService } from './integrations.service';

export class IntegrationsController {
  getStatus = asyncHandler(async (_req: Request, res: Response) => {
    const status = await integrationsService.getStatus();
    return ApiResponse.ok(res, status, 'Integration status retrieved');
  });
}

export const integrationsController = new IntegrationsController();
