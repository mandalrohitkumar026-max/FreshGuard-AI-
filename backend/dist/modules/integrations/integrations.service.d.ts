export declare class IntegrationsService {
    getStatus(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
        database: {
            status: string;
            driver: string;
            host: string;
        };
        integrations: {
            bifrost: {
                status: string;
                latencyMs: number;
                model: string | undefined;
                message: string;
            } | {
                status: string;
                message: any;
                latencyMs?: undefined;
                model?: undefined;
            };
            tavily: {
                status: string;
                latencyMs: number;
                message: string;
            } | {
                status: string;
                message: any;
                latencyMs?: undefined;
            };
        };
    }>;
}
export declare const integrationsService: IntegrationsService;
//# sourceMappingURL=integrations.service.d.ts.map