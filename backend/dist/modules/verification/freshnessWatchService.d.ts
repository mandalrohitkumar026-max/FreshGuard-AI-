export type WatchFrequency = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
export interface WatchAlert {
    id: string;
    watchId: string;
    sessionId: string;
    type: 'STALENESS_DETECTED' | 'SCORE_CHANGED' | 'CONTRADICTION_APPEARED' | 'ROUTINE_CHECK';
    previousScore: number;
    newScore: number;
    message: string;
    timestamp: string;
    read: boolean;
}
export interface FreshnessWatch {
    id: string;
    sessionId: string;
    userId: string;
    title: string;
    answerText: string;
    topic?: string;
    frequency: WatchFrequency;
    intervalMs: number;
    active: boolean;
    baselineScore: number;
    currentScore: number;
    currentRiskLevel: string;
    lastCheckedAt: string;
    nextCheckAt: string;
    checkCount: number;
    alerts: WatchAlert[];
    createdAt: string;
    updatedAt: string;
}
export declare class FreshnessWatchService {
    private watches;
    private schedulerInterval;
    constructor();
    private getIntervalMs;
    /**
     * Starts real periodic scheduled processing.
     */
    startScheduler(): void;
    stopScheduler(): void;
    /**
     * Scans for active watches where nextCheckAt <= now and runs re-verification.
     */
    processDueWatches(): Promise<number>;
    /**
     * Registers a verification session for continuous freshness monitoring.
     */
    createWatch(data: {
        sessionId: string;
        userId: string;
        frequency?: WatchFrequency;
    }): Promise<FreshnessWatch>;
    /**
     * Executes a live re-verification check for a watch, compares evidence,
     * and dispatches alerts if changes occur.
     */
    executeRecheck(watchId: string): Promise<{
        watch: FreshnessWatch;
        alertGenerated: boolean;
    }>;
    listWatches(userId?: string): FreshnessWatch[];
    getWatch(id: string): FreshnessWatch | null;
    cancelWatch(id: string, requesterUserId?: string, userRole?: string): boolean;
    pauseWatch(id: string, requesterUserId?: string, userRole?: string): boolean;
    resumeWatch(id: string, requesterUserId?: string, userRole?: string): boolean;
    deleteWatch(id: string, requesterUserId?: string, userRole?: string): boolean;
    getAllAlerts(userId?: string): WatchAlert[];
    getSchedulerStatus(): {
        active: boolean;
        intervalMs: number;
        totalWatches: number;
        activeWatches: number;
    };
}
export declare const freshnessWatchService: FreshnessWatchService;
//# sourceMappingURL=freshnessWatchService.d.ts.map