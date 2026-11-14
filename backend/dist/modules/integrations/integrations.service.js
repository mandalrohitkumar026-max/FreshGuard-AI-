"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.integrationsService = exports.IntegrationsService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const bifrostClient_1 = require("../../integrations/bifrostClient");
const tavilyService_1 = require("../../integrations/tavilyService");
const database_1 = require("../../config/database");
class IntegrationsService {
    async getStatus() {
        const [bifrost, tavily] = await Promise.allSettled([
            (0, bifrostClient_1.checkBifrostHealth)(),
            (0, tavilyService_1.checkTavilyHealth)(),
        ]);
        const bifrostResult = bifrost.status === 'fulfilled'
            ? {
                status: bifrost.value.ok ? 'connected' : 'fallback_mode',
                latencyMs: bifrost.value.latencyMs,
                model: bifrost.value.model,
                message: bifrost.value.ok ? 'Bifrost AI gateway operational' : 'Bifrost proxy offline, running in resilient deterministic mode',
            }
            : { status: 'error', message: bifrost.reason?.message };
        const tavilyResult = tavily.status === 'fulfilled'
            ? {
                status: tavily.value.ok ? 'connected' : 'fallback_mode',
                latencyMs: tavily.value.latencyMs,
                message: tavily.value.ok ? 'Tavily live search operational' : 'Live public web retrieval fallback operational',
            }
            : { status: 'error', message: tavily.reason?.message };
        const mongoStatus = (0, database_1.isMongoConnected)() ? 'connected' : 'in_memory_mode';
        return {
            status: 'operational',
            timestamp: new Date().toISOString(),
            uptime: Math.floor(process.uptime()),
            database: {
                status: mongoStatus,
                driver: 'mongoose',
                host: mongoose_1.default.connection.host || 'local-in-memory',
            },
            integrations: {
                bifrost: bifrostResult,
                tavily: tavilyResult,
            },
        };
    }
}
exports.IntegrationsService = IntegrationsService;
exports.integrationsService = new IntegrationsService();
//# sourceMappingURL=integrations.service.js.map