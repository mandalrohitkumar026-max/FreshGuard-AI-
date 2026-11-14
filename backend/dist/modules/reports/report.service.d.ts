export declare class ReportService {
    getReport(reportOrSessionId: string, requesterUserId?: string, requesterUserRole?: string): Promise<any>;
    shareReport(reportId: string): Promise<{
        publicSlug: string;
        shareUrl: string;
    }>;
}
export declare const reportService: ReportService;
//# sourceMappingURL=report.service.d.ts.map