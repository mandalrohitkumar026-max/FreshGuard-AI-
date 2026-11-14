import { z } from 'zod';

export const searchQueryRequestSchema = z.object({
  body: z.object({
    query: z.string().min(2, 'Query must be at least 2 characters').max(300),
    searchDepth: z.enum(['basic', 'advanced']).default('advanced').optional(),
    topic: z.enum(['general', 'news', 'finance']).default('general').optional(),
    maxResults: z.coerce.number().min(1).max(20).default(5).optional(),
    includeAnswer: z.boolean().default(false).optional(),
  }),
});

export const claimEvidenceRequestSchema = z.object({
  body: z.object({
    claim: z.string().min(3, 'Claim must be at least 3 characters').max(1000).optional(),
    claimText: z.string().min(3, 'Claim must be at least 3 characters').max(1000).optional(),
    topicHint: z.string().max(100).optional(),
    searchDepth: z.enum(['basic', 'advanced']).default('advanced').optional(),
    maxResults: z.coerce.number().min(1).max(20).default(5).optional(),
    sessionId: z.string().optional(),
    claimId: z.string().optional(),
  }).refine((data) => data.claim || data.claimText, {
    message: 'Either "claim" or "claimText" is required',
    path: ['claimText'],
  }),
});

export const normalizedEvidenceSchema = z.object({
  sourceTitle: z.string().min(1),
  sourceUrl: z.string().url('Source URL must be a valid URL'),
  sourceDomain: z.string().min(1),
  content: z.string().min(1),
  publishedAt: z.string().nullable(),
  retrievedAt: z.string().min(1),
  relevanceScore: z.number().min(0).max(1),
  authorityScore: z.number().min(0).max(1),
  authorityTier: z.enum(['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN']),
  sourceType: z.enum([
    'official_documentation',
    'government',
    'academic',
    'company_official',
    'established_news',
    'community',
    'general',
  ]),
  usedInAnalysis: z.boolean(),
});
