"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.freshnessWatchController = exports.FreshnessWatchController = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const freshnessWatchService_1 = require("./freshnessWatchService");
const ApiError_1 = require("../../utils/ApiError");
class FreshnessWatchController {
    createWatch = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { sessionId, frequency } = req.body;
        if (!sessionId) {
            throw ApiError_1.ApiError.badRequest('sessionId is required to establish a Freshness Watch');
        }
        const userId = req.userId || '000000000000000000000001';
        const watch = await freshnessWatchService_1.freshnessWatchService.createWatch({
            sessionId,
            userId,
            frequency,
        });
        return ApiResponse_1.ApiResponse.created(res, watch, 'Freshness watch activated with real scheduled monitoring');
    });
    listWatches = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const userId = req.userId;
        const watches = freshnessWatchService_1.freshnessWatchService.listWatches(userId);
        return ApiResponse_1.ApiResponse.ok(res, { total: watches.length, watches }, 'Monitored watches retrieved');
    });
    getWatch = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const watch = freshnessWatchService_1.freshnessWatchService.getWatch(String(req.params.id));
        if (!watch) {
            throw ApiError_1.ApiError.notFound('Monitored watch not found');
        }
        return ApiResponse_1.ApiResponse.ok(res, watch, 'Watch details retrieved');
    });
    triggerCheck = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await freshnessWatchService_1.freshnessWatchService.executeRecheck(String(req.params.id));
        return ApiResponse_1.ApiResponse.ok(res, result, result.alertGenerated
            ? 'Recheck executed: Factual drift detected and alert issued'
            : 'Recheck executed: All assertions remain fresh');
    });
    cancelWatch = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const success = freshnessWatchService_1.freshnessWatchService.cancelWatch(String(req.params.id), req.userId, req.userRole);
        if (!success) {
            throw ApiError_1.ApiError.notFound('Watch not found');
        }
        return ApiResponse_1.ApiResponse.ok(res, { message: 'Watch successfully paused' }, 'Watch cancelled');
    });
    toggleWatch = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const watch = freshnessWatchService_1.freshnessWatchService.getWatch(String(req.params.id));
        if (!watch) {
            throw ApiError_1.ApiError.notFound('Watch not found');
        }
        if (watch.active) {
            freshnessWatchService_1.freshnessWatchService.pauseWatch(String(req.params.id), req.userId, req.userRole);
        }
        else {
            freshnessWatchService_1.freshnessWatchService.resumeWatch(String(req.params.id), req.userId, req.userRole);
        }
        const updated = freshnessWatchService_1.freshnessWatchService.getWatch(String(req.params.id));
        return ApiResponse_1.ApiResponse.ok(res, updated, `Watch successfully ${updated?.active ? 'resumed' : 'paused'}`);
    });
    getAlerts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const userId = req.userId;
        const alerts = freshnessWatchService_1.freshnessWatchService.getAllAlerts(userId);
        return ApiResponse_1.ApiResponse.ok(res, { total: alerts.length, alerts }, 'Freshness drift alerts retrieved');
    });
}
exports.FreshnessWatchController = FreshnessWatchController;
exports.freshnessWatchController = new FreshnessWatchController();
//# sourceMappingURL=freshnessWatchController.js.map