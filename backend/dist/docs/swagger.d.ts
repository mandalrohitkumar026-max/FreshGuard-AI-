export declare const swaggerDocument: {
    openapi: string;
    info: {
        title: string;
        version: string;
        description: string;
        contact: {
            name: string;
            email: string;
        };
    };
    servers: {
        url: string;
        description: string;
    }[];
    components: {
        securitySchemes: {
            ApiKeyAuth: {
                type: string;
                in: string;
                name: string;
                description: string;
            };
            BearerAuth: {
                type: string;
                scheme: string;
                bearerFormat: string;
                description: string;
            };
        };
        schemas: {
            ApiResponse: {
                type: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    message: {
                        type: string;
                        example: string;
                    };
                    data: {
                        type: string;
                    };
                };
            };
            ApiError: {
                type: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    error: {
                        type: string;
                        properties: {
                            code: {
                                type: string;
                                example: string;
                            };
                            message: {
                                type: string;
                                example: string;
                            };
                            details: {
                                type: string;
                                items: {
                                    type: string;
                                };
                            };
                        };
                    };
                };
            };
            RegisterRequest: {
                type: string;
                required: string[];
                properties: {
                    name: {
                        type: string;
                        example: string;
                    };
                    email: {
                        type: string;
                        format: string;
                        example: string;
                    };
                    password: {
                        type: string;
                        minLength: number;
                        example: string;
                    };
                };
            };
            LoginRequest: {
                type: string;
                required: string[];
                properties: {
                    email: {
                        type: string;
                        format: string;
                        example: string;
                    };
                    password: {
                        type: string;
                        example: string;
                    };
                };
            };
            CreateVerificationRequest: {
                type: string;
                required: string[];
                properties: {
                    originalAnswer: {
                        type: string;
                        description: string;
                        example: string;
                    };
                    topic: {
                        type: string;
                        example: string;
                    };
                    sourceModel: {
                        type: string;
                        example: string;
                    };
                    stream: {
                        type: string;
                        example: boolean;
                    };
                };
            };
            VerificationSession: {
                type: string;
                properties: {
                    sessionId: {
                        type: string;
                        example: string;
                    };
                    status: {
                        type: string;
                        enum: string[];
                    };
                    originalAnswer: {
                        type: string;
                    };
                    aggregateFreshnessScore: {
                        type: string;
                        example: number;
                    };
                    riskLevel: {
                        type: string;
                        enum: string[];
                    };
                    createdAt: {
                        type: string;
                        format: string;
                    };
                };
            };
        };
    };
    paths: {
        '/api/v1/health': {
            get: {
                summary: string;
                description: string;
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        status: {
                                            type: string;
                                            example: string;
                                        };
                                        uptime: {
                                            type: string;
                                        };
                                        services: {
                                            type: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
        '/api/v1/integrations/tavily/health': {
            get: {
                summary: string;
                description: string;
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        '/api/v1/search/query': {
            post: {
                summary: string;
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    query: {
                                        type: string;
                                        example: string;
                                    };
                                    searchDepth: {
                                        type: string;
                                        enum: string[];
                                        default: string;
                                    };
                                    maxResults: {
                                        type: string;
                                        default: number;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/search/evidence': {
            post: {
                summary: string;
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    claimText: {
                                        type: string;
                                        example: string;
                                    };
                                    topicHint: {
                                        type: string;
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/search/history': {
            get: {
                summary: string;
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/integrations/bifrost/health': {
            get: {
                summary: string;
                description: string;
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        '/api/v1/ai/extract-claims': {
            post: {
                summary: string;
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    answerText: {
                                        type: string;
                                        example: string;
                                    };
                                    topicHint: {
                                        type: string;
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/ai/analyze-claims': {
            post: {
                summary: string;
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    claims: {
                                        type: string;
                                        items: {
                                            type: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/ai/analyze-evidence': {
            post: {
                summary: string;
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    claimText: {
                                        type: string;
                                    };
                                    evidence: {
                                        type: string;
                                        items: {
                                            type: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/ai/generate-correction': {
            post: {
                summary: string;
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    originalAnswer: {
                                        type: string;
                                    };
                                    claims: {
                                        type: string;
                                        items: {
                                            type: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/integrations/status': {
            get: {
                summary: string;
                description: string;
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        '/api/v1/auth/register': {
            post: {
                summary: string;
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    '201': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                    '409': {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/auth/login': {
            post: {
                summary: string;
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                    '401': {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/auth/me': {
            get: {
                summary: string;
                security: {
                    BearerAuth: never[];
                }[];
                responses: {
                    '200': {
                        description: string;
                    };
                    '401': {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/verification': {
            post: {
                summary: string;
                description: string;
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    '201': {
                        description: string;
                    };
                    '400': {
                        description: string;
                    };
                };
            };
            get: {
                summary: string;
                description: string;
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/verification/run': {
            post: {
                summary: string;
                description: string;
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    originalAnswer: {
                                        type: string;
                                        example: string;
                                    };
                                    topic: {
                                        type: string;
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    '201': {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/verification/{id}/run': {
            post: {
                summary: string;
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/verification/{id}/results': {
            get: {
                summary: string;
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/verification/{id}/correction': {
            get: {
                summary: string;
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/verification/claims/{claimId}/evidence': {
            get: {
                summary: string;
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/verification/{id}': {
            get: {
                summary: string;
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    '200': {
                        description: string;
                    };
                    '404': {
                        description: string;
                    };
                };
            };
            delete: {
                summary: string;
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/verification/{id}/claims': {
            get: {
                summary: string;
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/verification/{id}/report': {
            get: {
                summary: string;
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/claims/extract': {
            post: {
                summary: string;
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    answer: {
                                        type: string;
                                    };
                                    verificationId: {
                                        type: string;
                                    };
                                    topicHint: {
                                        type: string;
                                    };
                                    model: {
                                        type: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    '200': {
                        description: string;
                    };
                    '400': {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/claims/verification/{verificationId}': {
            get: {
                summary: string;
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/freshness/analyze': {
            post: {
                summary: string;
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                properties: {
                                    verificationId: {
                                        type: string;
                                    };
                                    claims: {
                                        type: string;
                                        items: {
                                            type: string;
                                        };
                                    };
                                    answerText: {
                                        type: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    '200': {
                        description: string;
                    };
                    '400': {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/freshness/{verificationId}': {
            get: {
                summary: string;
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/developer/verify': {
            post: {
                tags: string[];
                summary: string;
                security: {
                    ApiKeyAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    answerText: {
                                        type: string;
                                        example: string;
                                    };
                                    topic: {
                                        type: string;
                                        example: string;
                                    };
                                    strictness: {
                                        type: string;
                                        enum: string[];
                                        default: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    '201': {
                        description: string;
                    };
                    '401': {
                        description: string;
                    };
                    '429': {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/developer/keys': {
            post: {
                tags: string[];
                summary: string;
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                properties: {
                                    name: {
                                        type: string;
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    '201': {
                        description: string;
                    };
                };
            };
            get: {
                tags: string[];
                summary: string;
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
    };
};
//# sourceMappingURL=swagger.d.ts.map