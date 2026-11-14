import mongoose from 'mongoose';
import { SessionStatus } from '../types/verification.types';
/**
 * In-Memory Session & Report Store
 *
 * Provides high-availability storage fallback when MongoDB is disconnected.
 * Enables zero-downtime development, automated testing, and demonstration.
 */
declare class InMemoryStore {
    private sessions;
    private claims;
    private evidence;
    private reports;
    createSession(data: {
        userId: string | mongoose.Types.ObjectId;
        originalAnswer: string;
        context?: any;
        status?: SessionStatus;
    }): any;
    getSession(id: string): any | null;
    updateSession(id: string, updates: Partial<any>): any | null;
    listSessions(userId?: string): any[];
    saveClaim(sessionId: string, claimData: any): any;
    saveClaims(sessionId: string, claimsList: any[]): void;
    getClaims(sessionId: string): any[];
    updateClaim(sessionId: string, claimId: string, updates: any): void;
    saveEvidence(sessionId: string, evidenceItems: any[]): void;
    getEvidence(sessionId: string): any[];
    saveReport(reportData: any): any;
    getReport(idOrSlug: string): any | null;
    listReports(userId?: string): any[];
    getAnalytics(userId?: string): {
        totalVerifications: number;
        claimsAnalyzed: number;
        outdatedClaims: number;
        supportedClaims: number;
        unverifiedClaims: number;
        averageFreshnessScore: number;
        activityOverTime: {
            date: string;
            count: number;
            avgScore: number;
        }[];
        statusDistribution: {
            name: string;
            value: number;
            color: string;
        }[];
        freshnessDistribution: {
            range: string;
            count: number;
        }[];
        riskDistribution: {
            FRESH: number;
            STALE: number;
            OUTDATED: number;
            UNVERIFIABLE: number;
        };
        scoreOverTime: {
            date: string;
            score: any;
        }[];
    };
}
export declare const inMemoryStore: InMemoryStore;
export declare const isMongoConnected: () => boolean;
export {};
//# sourceMappingURL=sessionStore.d.ts.map