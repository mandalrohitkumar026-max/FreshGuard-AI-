// ─────────────────────────────────────────────────────────
// FreshGuard AI — Enterprise Frontend Type Definitions
// ─────────────────────────────────────────────────────────

export type RiskLevel =
  | 'LOW'
  | 'MODERATE'
  | 'HIGH'
  | 'CRITICAL'
  | 'FRESH'
  | 'STALE'
  | 'OUTDATED'
  | 'UNVERIFIABLE';

export type ClaimCategory =
  | 'SOFTWARE_RELEASE'
  | 'PERSONNEL_LEADERSHIP'
  | 'STATISTICS_DATA'
  | 'POLICY_LAW'
  | 'SCIENTIFIC_FACT'
  | 'CURRENT_EVENT'
  | 'GENERAL_KNOWLEDGE';

export type TimeSensitivity = 'STATIC' | 'SEMI_DYNAMIC' | 'HIGHLY_DYNAMIC';

export type Verdict =
  | 'CONFIRMS'
  | 'CONTRADICTS'
  | 'PARTIALLY_CONTRADICTS'
  | 'INSUFFICIENT';

export type AuthorityTier = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export type SessionStatus = 'PROCESSING' | 'COMPLETE' | 'FAILED' | 'PARTIAL';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'member' | 'admin';
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}

export interface Evidence {
  url: string;
  title: string;
  domain: string;
  authorityTier: AuthorityTier;
  authorityScore: number;
  tavilyScore: number;
  ageInDays: number | null;
  publishedDate: string | null;
  retrievedAt: string;
  snippet?: string;
  usedInAnalysis?: boolean;
  isContradicting?: boolean;
  content?: string;
}

export interface ScoringFactors {
  temporalRelevance: number;
  evidenceRecency: number;
  evidenceQuality: number;
  verificationOutcome: number;
  uncertainty: number;
}

export interface Claim {
  id: string;
  claimId?: string;
  order: number;
  claimText: string;
  category: ClaimCategory;
  timeSensitivity: TimeSensitivity;
  verdict: Verdict;
  confidence: number;
  freshnessScore: number;
  riskLevel?: RiskLevel;
  factors?: ScoringFactors;
  recommendedAction?: string;
  positiveContributions?: string[];
  negativeContributions?: string[];
  explanation: string;
  searchQuery?: string;
  evidence: Evidence[];
}

export interface VerificationReportSummary {
  aggregateFreshnessScore: number;
  riskLevel: RiskLevel;
  totalClaims: number;
  staleClaims: number;
  supportedClaims: number;
  freshClaims?: number;
  unverifiedClaims: number;
  processingTimeMs: number;
  modelUsed?: string;
}

export interface VerificationReport {
  id: string;
  sessionId: string;
  createdAt: string;
  summary: VerificationReportSummary;
  originalAnswer: string;
  suggestedAnswer?: string;
  correctedAnswer?: string;
  hasCorrectedAnswer: boolean;
  correctionExplanation?: string;
  claims: Claim[];
  topSources: Array<{
    url: string;
    title: string;
    domain: string;
    authorityTier: AuthorityTier;
  }>;
  isPublic: boolean;
  publicSlug?: string;
}

export interface VerificationSession {
  id: string;
  status: SessionStatus;
  riskLevel: RiskLevel;
  aggregateFreshnessScore: number;
  totalClaims: number;
  staleClaims: number;
  processingTimeMs: number;
  reportId?: string;
  title: string;
  topic?: string;
  sourceModel?: string;
  createdAt: string;
}

export interface DashboardStatistics {
  totalVerifications: number;
  claimsAnalyzed: number;
  outdatedClaims: number;
  supportedClaims: number;
  unverifiedClaims: number;
  averageFreshnessScore: number;
  activityOverTime: Array<{ date: string; count: number; avgScore: number }>;
  statusDistribution: Array<{ name: string; value: number; color: string }>;
  freshnessDistribution: Array<{ range: string; count: number }>;
  riskDistribution?: Record<string, number>;
}

export interface SSEEvent {
  stage: string;
  timestamp: string;
  sessionId?: string;
  reportId?: string;
  claimsCount?: number;
  claims?: Array<{ claimText: string; order: number }>;
  classifications?: Array<{ order: number; claimText: string; timeSensitivity: TimeSensitivity }>;
  claimOrder?: number;
  claimText?: string;
  verdict?: Verdict;
  confidence?: number;
  aggregateFreshnessScore?: number;
  riskLevel?: RiskLevel;
  processingTimeMs?: number;
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ── Backward Compatibility Aliases ────────────────────────
export type AuthData = {
  userId: string;
  name: string;
  email: string;
  plan: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};
export type Report = VerificationReport;
export type SessionListItem = VerificationSession;
export type AnalyticsData = DashboardStatistics;
export type ClaimDetail = Claim;
export type EvidenceItem = Evidence;

