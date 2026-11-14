"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchController = exports.SearchController = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const search_service_1 = require("./search.service");
const tavily_client_1 = require("./tavily.client");
class SearchController {
    getTavilyHealth = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const health = await tavily_client_1.tavilyClient.checkHealth();
        return ApiResponse_1.ApiResponse.ok(res, health, 'Tavily Search API health retrieved');
    });
    searchQuery = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { query, searchDepth, topic, maxResults, includeAnswer } = req.body;
        const result = await tavily_client_1.tavilyClient.search({
            query,
            searchDepth,
            topic,
            maxResults,
            includeAnswer,
        });
        return ApiResponse_1.ApiResponse.ok(res, result, 'Search query executed successfully');
    });
    searchEvidence = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const claimText = req.body.claimText || req.body.claim;
        const { topicHint, searchDepth, maxResults, sessionId, claimId } = req.body;
        const result = await search_service_1.searchService.searchCurrentEvidence(claimText, {
            topicHint,
            searchDepth,
            maxResults,
            sessionId,
            claimId,
        });
        return ApiResponse_1.ApiResponse.ok(res, result, 'Live evidence retrieved and normalized successfully');
    });
    getSearchHistory = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const history = search_service_1.searchService.getSearchHistory();
        return ApiResponse_1.ApiResponse.ok(res, history, 'Search history retrieved');
    });
}
exports.SearchController = SearchController;
exports.searchController = new SearchController();
//# sourceMappingURL=search.controller.js.map