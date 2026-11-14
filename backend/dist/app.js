"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const env_1 = require("./config/env");
const swagger_1 = require("./docs/swagger");
// Middleware
const rateLimiter_1 = require("./middleware/rateLimiter");
const requestLogger_1 = require("./middleware/requestLogger");
const errorHandler_1 = require("./middleware/errorHandler");
// Modular Routes (Phase 03, 04 & 05)
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const verification_routes_1 = __importDefault(require("./modules/verification/verification.routes"));
const report_routes_1 = __importDefault(require("./modules/reports/report.routes"));
const integrations_routes_1 = __importDefault(require("./modules/integrations/integrations.routes"));
const ai_routes_1 = __importDefault(require("./modules/ai/ai.routes"));
const search_routes_1 = __importDefault(require("./modules/search/search.routes"));
const claim_routes_1 = __importDefault(require("./modules/claims/claim.routes"));
const freshness_routes_1 = __importDefault(require("./modules/freshness/freshness.routes"));
const freshnessWatch_routes_1 = __importDefault(require("./modules/verification/freshnessWatch.routes"));
const developer_routes_1 = __importDefault(require("./modules/developer/developer.routes"));
const scoring_routes_1 = __importDefault(require("./modules/scoring/scoring.routes"));
const notification_routes_1 = __importDefault(require("./modules/verification/notification.routes"));
// System & Compatibility Routes
const healthRoutes_1 = __importDefault(require("./routes/healthRoutes"));
const verifyRoutes_1 = __importDefault(require("./routes/verifyRoutes"));
const historyRoutes_1 = __importDefault(require("./routes/historyRoutes"));
exports.app = (0, express_1.default)();
// ── Security Middleware ───────────────────────────────────────────────────
exports.app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Allows Swagger UI assets
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
const allowedOrigins = (env_1.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());
exports.app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, health checks)
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            return callback(null, true);
        }
        // Allow Vercel preview deploys matching regex or fallback to allowed
        if (origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Api-Key'],
}));
// ── General Middleware ────────────────────────────────────────────────────
exports.app.use((0, compression_1.default)());
exports.app.use(express_1.default.json({ limit: '50kb' }));
exports.app.use(express_1.default.urlencoded({ extended: true, limit: '50kb' }));
if (env_1.env.NODE_ENV !== 'test') {
    exports.app.use(requestLogger_1.requestLogger);
}
// ── Global Rate Limiting ──────────────────────────────────────────────────
exports.app.use('/api/', rateLimiter_1.standardRateLimiter);
// ── OpenAPI / Swagger Documentation ───────────────────────────────────────
exports.app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerDocument));
// ── Phase 03, 04 & 05 Modular API Endpoints ──────────────────────────────
exports.app.use('/api/v1/health', healthRoutes_1.default);
exports.app.use('/api/v1/integrations', integrations_routes_1.default);
exports.app.use('/api/v1/auth', auth_routes_1.default);
exports.app.use('/api/v1/verification', verification_routes_1.default);
exports.app.use('/api/v1/ai', ai_routes_1.default);
exports.app.use('/api/v1/search', search_routes_1.default);
exports.app.use('/api/v1/claims', claim_routes_1.default);
exports.app.use('/api/v1/freshness', freshness_routes_1.default);
exports.app.use('/api/v1/watches', freshnessWatch_routes_1.default);
exports.app.use('/api/v1/notifications', notification_routes_1.default);
exports.app.use('/api/v1/developer', developer_routes_1.default);
exports.app.use('/api/v1/scoring', scoring_routes_1.default);
// ── Backward Compatibility Endpoints (Phase 02 Frontend Support) ─────────
exports.app.use('/api/v1/verify', verifyRoutes_1.default);
exports.app.use('/api/v1/reports', report_routes_1.default);
exports.app.use('/api/v1/history', historyRoutes_1.default);
// ── 404 & Global Error Handling ──────────────────────────────────────────
exports.app.use(errorHandler_1.notFound);
exports.app.use(errorHandler_1.errorHandler);
exports.default = exports.app;
//# sourceMappingURL=app.js.map