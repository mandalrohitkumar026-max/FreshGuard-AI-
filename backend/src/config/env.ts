import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // MongoDB
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Bifrost AI Gateway (Maxim AI)
  BIFROST_BASE_URL: z.string().url().default('http://localhost:8080/v1'),
  BIFROST_API_KEY: z.string().default(process.env.BIFROST_API_KEY || process.env.BIFROST_VIRTUAL_KEY || 'sk-bf-demo-key'),
  BIFROST_VIRTUAL_KEY: z.string().default(process.env.BIFROST_VIRTUAL_KEY || process.env.BIFROST_API_KEY || 'sk-bf-demo-key'),
  BIFROST_DEFAULT_MODEL: z.string().default(process.env.BIFROST_DEFAULT_MODEL || process.env.BIFROST_PRIMARY_MODEL || 'openai/gpt-4o'),
  BIFROST_PRIMARY_MODEL: z.string().default(process.env.BIFROST_PRIMARY_MODEL || process.env.BIFROST_DEFAULT_MODEL || 'openai/gpt-4o'),
  BIFROST_FALLBACK_MODEL: z.string().default('claude-3-5-sonnet-20241022'),
  BIFROST_TIMEOUT: z.coerce.number().default(15000),

  // Tavily
  TAVILY_API_KEY: z.string().min(1, 'TAVILY_API_KEY is required'),
  TAVILY_MAX_RESULTS: z.coerce.number().min(1).max(20).default(5),
  TAVILY_SEARCH_DEPTH: z.enum(['basic', 'advanced']).default('advanced'),
  TAVILY_DEFAULT_SEARCH_DEPTH: z.enum(['basic', 'advanced']).default('advanced'),
  TAVILY_TIMEOUT: z.coerce.number().default(15000),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_GENERAL: z.coerce.number().default(60),
  RATE_LIMIT_MAX_VERIFY: z.coerce.number().default(5),
  RATE_LIMIT_MAX_AUTH: z.coerce.number().default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  parsed.error.issues.forEach((issue) => {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
