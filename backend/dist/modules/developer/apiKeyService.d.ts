export interface DeveloperApiKey {
    id: string;
    name: string;
    keyPrefix: string;
    keyHash: string;
    userId: string;
    rateLimitPerMinute: number;
    lastUsedAt?: string;
    createdAt: string;
    revoked: boolean;
}
export declare class ApiKeyService {
    private keys;
    private rawKeyStore;
    constructor();
    private hashKey;
    private seedDefaultKey;
    generateKey(userId: string, name: string): {
        key: DeveloperApiKey;
        rawKey: string;
    };
    validateKey(rawKey: string): DeveloperApiKey | null;
    listKeys(userId: string): Array<Omit<DeveloperApiKey, 'keyHash'>>;
    revokeKey(id: string, userId: string): boolean;
}
export declare const apiKeyService: ApiKeyService;
//# sourceMappingURL=apiKeyService.d.ts.map