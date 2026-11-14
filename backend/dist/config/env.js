"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const envSchema = zod_1.z.object({
    // App
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(5000),
    FRONTEND_URL: zod_1.z.string().url().default('http://localhost:5173'),
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    // MongoDB
    MONGODB_URI: zod_1.z.string().min(1, 'MONGODB_URI is required'),
    // JWT
    JWT_SECRET: zod_1.z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
    JWT_EXPIRES_IN: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    // Bifrost AI Gateway (Maxim AI)
    BIFROST_BASE_URL: zod_1.z.string().url().default('http://localhost:8080/v1'),
    BIFROST_API_KEY: zod_1.z.string().default(process.env.BIFROST_API_KEY || process.env.BIFROST_VIRTUAL_KEY || 'sk-bf-demo-key'),
    BIFROST_VIRTUAL_KEY: zod_1.z.string().default(process.env.BIFROST_VIRTUAL_KEY || process.env.BIFROST_API_KEY || 'sk-bf-demo-key'),
    BIFROST_DEFAULT_MODEL: zod_1.z.string().default(process.env.BIFROST_DEFAULT_MODEL || process.env.BIFROST_PRIMARY_MODEL || 'openai/gpt-4o'),
    BIFROST_PRIMARY_MODEL: zod_1.z.string().default(process.env.BIFROST_PRIMARY_MODEL || process.env.BIFROST_DEFAULT_MODEL || 'openai/gpt-4o'),
    BIFROST_FALLBACK_MODEL: zod_1.z.string().default('claude-3-5-sonnet-20241022'),
    BIFROST_TIMEOUT: zod_1.z.coerce.number().default(15000),
    // Tavily
    TAVILY_API_KEY: zod_1.z.string().min(1, 'TAVILY_API_KEY is required'),
    TAVILY_MAX_RESULTS: zod_1.z.coerce.number().min(1).max(20).default(5),
    TAVILY_SEARCH_DEPTH: zod_1.z.enum(['basic', 'advanced']).default('advanced'),
    TAVILY_DEFAULT_SEARCH_DEPTH: zod_1.z.enum(['basic', 'advanced']).default('advanced'),
    TAVILY_TIMEOUT: zod_1.z.coerce.number().default(15000),
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().default(60000),
    RATE_LIMIT_MAX_GENERAL: zod_1.z.coerce.number().default(60),
    RATE_LIMIT_MAX_VERIFY: zod_1.z.coerce.number().default(5),
    RATE_LIMIT_MAX_AUTH: zod_1.z.coerce.number().default(10),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    parsed.error.issues.forEach((issue) => {
        console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
}
exports.env = parsed.data;
//# sourceMappingURL=env.js.map