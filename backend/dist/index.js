"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
async function bootstrap() {
    // 1. Start HTTP server first so endpoints are accessible
    const server = app_1.app.listen(env_1.env.PORT, () => {
        logger_1.logger.info(`🚀 FreshGuard AI API running on port ${env_1.env.PORT}`, {
            port: env_1.env.PORT,
            env: env_1.env.NODE_ENV,
            bifrostUrl: env_1.env.BIFROST_BASE_URL,
        });
        logger_1.logger.info(`📋 Health check: http://localhost:${env_1.env.PORT}/api/v1/health`);
    });
    // 2. Connect to MongoDB gracefully (non-fatal if local mongod is not yet started)
    try {
        await (0, db_1.connectDB)();
    }
    catch (err) {
        logger_1.logger.warn('⚠️ MongoDB connection could not be established immediately. Start MongoDB or configure MONGODB_URI in backend/.env', {
            error: err instanceof Error ? err.message : String(err),
        });
    }
    // 3. Graceful shutdown
    const shutdown = async (signal) => {
        logger_1.logger.info(`${signal} received — shutting down gracefully`);
        server.close(async () => {
            const { freshnessWatchService } = await Promise.resolve().then(() => __importStar(require('./modules/verification/freshnessWatchService')));
            freshnessWatchService.stopScheduler();
            const { disconnectDB } = await Promise.resolve().then(() => __importStar(require('./config/db')));
            await disconnectDB();
            process.exit(0);
        });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
        logger_1.logger.error('Unhandled Promise Rejection', { reason });
    });
    process.on('uncaughtException', (err) => {
        logger_1.logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
    });
}
bootstrap();
//# sourceMappingURL=index.js.map