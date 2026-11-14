"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const bifrostClient_1 = require("../integrations/bifrostClient");
const tavilyService_1 = require("../integrations/tavilyService");
const freshnessWatchService_1 = require("../modules/verification/freshnessWatchService");
const asyncWrapper_1 = require("../utils/asyncWrapper");
const router = (0, express_1.Router)();
router.get('/', (0, asyncWrapper_1.asyncWrapper)(async (_req, res) => {
    const mongoConnected = mongoose_1.default.connection.readyState === 1;
    const scheduler = freshnessWatchService_1.freshnessWatchService.getSchedulerStatus();
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
}));
router.get('/ready', (0, asyncWrapper_1.asyncWrapper)(async (_req, res) => {
    const [bifrost, tavily] = await Promise.allSettled([
        (0, bifrostClient_1.checkBifrostHealth)(),
        (0, tavilyService_1.checkTavilyHealth)(),
    ]);
    const mongoConnected = mongoose_1.default.connection.readyState === 1;
    const scheduler = freshnessWatchService_1.freshnessWatchService.getSchedulerStatus();
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
}));
router.get('/integrations', (0, asyncWrapper_1.asyncWrapper)(async (_req, res) => {
    const [bifrost, tavily] = await Promise.allSettled([
        (0, bifrostClient_1.checkBifrostHealth)(),
        (0, tavilyService_1.checkTavilyHealth)(),
    ]);
    const bifrostResult = bifrost.status === 'fulfilled'
        ? { status: bifrost.value.ok ? 'ok' : 'unreachable', latencyMs: bifrost.value.latencyMs, model: bifrost.value.model }
        : { status: 'error', error: bifrost.reason?.message };
    const tavilyResult = tavily.status === 'fulfilled'
        ? { status: tavily.value.ok ? 'ok' : 'unreachable', latencyMs: tavily.value.latencyMs }
        : { status: 'error', error: tavily.reason?.message };
    const allOk = bifrostResult.status === 'ok' && tavilyResult.status === 'ok';
    res.status(allOk ? 200 : 503).json({
        status: allOk ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        bifrost: bifrostResult,
        tavily: tavilyResult,
    });
}));
exports.default = router;
//# sourceMappingURL=healthRoutes.js.map