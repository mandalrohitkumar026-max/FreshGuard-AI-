import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { searchService } from './search.service';
import { tavilyClient } from './tavily.client';

export class SearchController {
  getTavilyHealth = asyncHandler(async (_req: Request, res: Response) => {
    const health = await tavilyClient.checkHealth();
    return ApiResponse.ok(res, health, 'Tavily Search API health retrieved');
  });

  searchQuery = asyncHandler(async (req: Request, res: Response) => {
    const { query, searchDepth, topic, maxResults, includeAnswer } = req.body;
    const result = await tavilyClient.search({
      query,
      searchDepth,
      topic,
      maxResults,
      includeAnswer,
    });
    return ApiResponse.ok(res, result, 'Search query executed successfully');
  });

  searchEvidence = asyncHandler(async (req: Request, res: Response) => {
    const claimText = req.body.claimText || req.body.claim;
    const { topicHint, searchDepth, maxResults, sessionId, claimId } = req.body;

    const result = await searchService.searchCurrentEvidence(claimText, {
      topicHint,
      searchDepth,
      maxResults,
      sessionId,
      claimId,
    });

    return ApiResponse.ok(res, result, 'Live evidence retrieved and normalized successfully');
  });

  getSearchHistory = asyncHandler(async (_req: Request, res: Response) => {
    const history = searchService.getSearchHistory();
    return ApiResponse.ok(res, history, 'Search history retrieved');
  });
}

export const searchController = new SearchController();
