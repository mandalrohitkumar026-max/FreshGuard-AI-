"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerDocument = void 0;
exports.swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'FreshGuard AI API',
        version: '1.0.0',
        description: 'Production-grade AI Verification & Stale-Answer Detection SaaS Platform API',
        contact: {
            name: 'FreshGuard AI Engineering',
            email: 'support@freshguard.ai',
        },
    },
    servers: [
        {
            url: 'http://localhost:5000',
            description: 'Local Development Server',
        },
    ],
    components: {
        securitySchemes: {
            ApiKeyAuth: {
                type: 'apiKey',
                in: 'header',
                name: 'x-api-key',
                description: 'Developer API Key (e.g. fg_live_demo_hackathon2026)',
            },
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter your JWT access token to authenticate',
            },
        },
        schemas: {
            ApiResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Operation completed successfully' },
                    data: { type: 'object' },
                },
            },
            ApiError: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    error: {
                        type: 'object',
                        properties: {
                            code: { type: 'string', example: 'VALIDATION_ERROR' },
                            message: { type: 'string', example: 'Validation failed' },
                            details: { type: 'array', items: { type: 'object' } },
                        },
                    },
                },
            },
            RegisterRequest: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                    name: { type: 'string', example: 'John Doe' },
                    email: { type: 'string', format: 'email', example: 'john@example.com' },
                    password: { type: 'string', minLength: 8, example: 'SecurePassword123!' },
                },
            },
            LoginRequest: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email', example: 'john@example.com' },
                    password: { type: 'string', example: 'SecurePassword123!' },
                },
            },
            CreateVerificationRequest: {
                type: 'object',
                required: ['originalAnswer'],
                properties: {
                    originalAnswer: {
                        type: 'string',
                        description: 'The AI-generated answer text to verify',
                        example: 'React 19 was officially released in December 2024 featuring React Server Components.',
                    },
                    topic: { type: 'string', example: 'Web Development' },
                    sourceModel: { type: 'string', example: 'GPT-4o' },
                    stream: { type: 'boolean', example: false },
                },
            },
            VerificationSession: {
                type: 'object',
                properties: {
                    sessionId: { type: 'string', example: '67332f12a34bc9876543210a' },
                    status: { type: 'string', enum: ['PROCESSING', 'COMPLETE', 'FAILED', 'PARTIAL'] },
                    originalAnswer: { type: 'string' },
                    aggregateFreshnessScore: { type: 'number', example: 88.5 },
                    riskLevel: { type: 'string', enum: ['FRESH', 'STALE', 'OUTDATED', 'UNVERIFIABLE'] },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
        },
    },
    paths: {
        '/api/v1/health': {
            get: {
                summary: 'System health check',
                description: 'Returns the health status of core backend services and database connection.',
                responses: {
                    '200': {
                        description: 'Service is healthy',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'ok' },
                                        uptime: { type: 'number' },
                                        services: { type: 'object' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/api/v1/integrations/tavily/health': {
            get: {
                summary: 'Tavily Search API health & live connectivity status',
                description: 'Pings the Tavily Search API, checks authentication, and reports roundtrip latency.',
                responses: {
                    '200': {
                        description: 'Tavily health report',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
                    },
                },
            },
        },
        '/api/v1/search/query': {
            post: {
                summary: 'Direct live web search via Tavily Search API',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['query'],
                                properties: {
                                    query: { type: 'string', example: 'Latest stable React release' },
                                    searchDepth: { type: 'string', enum: ['basic', 'advanced'], default: 'advanced' },
                                    maxResults: { type: 'number', default: 5 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Search results' },
                },
            },
        },
        '/api/v1/search/evidence': {
            post: {
                summary: 'Extract, search, normalize, and rank evidence for a factual claim',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['claimText'],
                                properties: {
                                    claimText: { type: 'string', example: 'React 18 is the latest stable version' },
                                    topicHint: { type: 'string', example: 'Web Development' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Normalized, deduplicated, authority-ranked evidence' },
                },
            },
        },
        '/api/v1/search/history': {
            get: {
                summary: 'Get search history and cached queries',
                responses: {
                    '200': { description: 'Search query history' },
                },
            },
        },
        '/api/v1/integrations/bifrost/health': {
            get: {
                summary: 'Bifrost AI Gateway health & connectivity status',
                description: 'Pings the live Bifrost Gateway on port 8080, checks model catalog, and reports real latency.',
                responses: {
                    '200': {
                        description: 'Bifrost health report',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
                    },
                },
            },
        },
        '/api/v1/ai/extract-claims': {
            post: {
                summary: 'Extract factual claims via Bifrost AI Gateway',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['answerText'],
                                properties: {
                                    answerText: { type: 'string', example: 'React 19 was released in December 2024.' },
                                    topicHint: { type: 'string', example: 'Web' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Extracted factual claims' },
                },
            },
        },
        '/api/v1/ai/analyze-claims': {
            post: {
                summary: 'Analyze claim time sensitivity via Bifrost AI Gateway',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['claims'],
                                properties: {
                                    claims: { type: 'array', items: { type: 'string' } },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Temporal freshness classifications' },
                },
            },
        },
        '/api/v1/ai/analyze-evidence': {
            post: {
                summary: 'Compare claim against web evidence via Bifrost AI Gateway',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['claimText', 'evidence'],
                                properties: {
                                    claimText: { type: 'string' },
                                    evidence: { type: 'array', items: { type: 'object' } },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Verdict, confidence, and comparison explanation' },
                },
            },
        },
        '/api/v1/ai/generate-correction': {
            post: {
                summary: 'Generate factually corrected answer via Bifrost AI Gateway',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['originalAnswer', 'claims'],
                                properties: {
                                    originalAnswer: { type: 'string' },
                                    claims: { type: 'array', items: { type: 'object' } },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Corrected answer and explanation' },
                },
            },
        },
        '/api/v1/integrations/status': {
            get: {
                summary: 'Integrations status check',
                description: 'Returns connectivity status and latency for Bifrost AI Gateway, Tavily Search, and MongoDB.',
                responses: {
                    '200': {
                        description: 'Integration statuses retrieved',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ApiResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/api/v1/auth/register': {
            post: {
                summary: 'Register a new user',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/RegisterRequest' },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'User registered successfully',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
                    },
                    '409': { description: 'Email already registered' },
                },
            },
        },
        '/api/v1/auth/login': {
            post: {
                summary: 'Authenticate a user',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/LoginRequest' },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Authentication successful with JWT tokens',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
                    },
                    '401': { description: 'Invalid credentials' },
                },
            },
        },
        '/api/v1/auth/me': {
            get: {
                summary: 'Get current user profile',
                security: [{ BearerAuth: [] }],
                responses: {
                    '200': { description: 'Current authenticated user profile' },
                    '401': { description: 'Unauthorized' },
                },
            },
        },
        '/api/v1/verification': {
            post: {
                summary: 'Submit an answer for verification',
                description: 'Initiates factual claim extraction, live web search via Tavily, and freshness scoring via Bifrost.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateVerificationRequest' },
                        },
                    },
                },
                responses: {
                    '201': { description: 'Verification session created' },
                    '400': { description: 'Validation error' },
                },
            },
            get: {
                summary: 'List user verification history',
                description: 'Returns paginated verification sessions with filter options.',
                responses: {
                    '200': { description: 'List of verification sessions' },
                },
            },
        },
        '/api/v1/verification/run': {
            post: {
                summary: 'Directly execute end-to-end live verification pipeline (Phase 08)',
                description: 'Accepts an AI answer, extracts atomic claims, searches live evidence via Tavily, detects contradictions via Bifrost, and returns grounded corrections.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['originalAnswer'],
                                properties: {
                                    originalAnswer: { type: 'string', example: 'React 18 is the latest stable React version.' },
                                    topic: { type: 'string', example: 'Frontend Web Development' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': { description: 'Verification results including verified claims, contradiction analysis, and grounded correction' },
                },
            },
        },
        '/api/v1/verification/{id}/run': {
            post: {
                summary: 'Execute live verification pipeline on an existing session (Phase 08)',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    '200': { description: 'Full verification pipeline result with verified claims and corrections' },
                },
            },
        },
        '/api/v1/verification/{id}/results': {
            get: {
                summary: 'Retrieve live verification results and claim-by-claim analysis',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    '200': { description: 'Complete verified claims breakdown, statuses, and evidence' },
                },
            },
        },
        '/api/v1/verification/{id}/correction': {
            get: {
                summary: 'Retrieve grounded corrected answer with citations',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    '200': { description: 'Grounded corrected answer, change summary, and cited URLs' },
                },
            },
        },
        '/api/v1/verification/claims/{claimId}/evidence': {
            get: {
                summary: 'Retrieve evidence items and contradictions for a specific claim',
                parameters: [
                    { name: 'claimId', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    '200': { description: 'Supporting and contradicting evidence for the claim' },
                },
            },
        },
        '/api/v1/verification/{id}': {
            get: {
                summary: 'Get verification session details',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    '200': { description: 'Verification session object' },
                    '404': { description: 'Session not found' },
                },
            },
            delete: {
                summary: 'Delete verification session',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    '200': { description: 'Session deleted' },
                },
            },
        },
        '/api/v1/verification/{id}/claims': {
            get: {
                summary: 'Get all claims extracted for a verification session',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    '200': { description: 'Array of extracted claims with time-sensitivity and freshness' },
                },
            },
        },
        '/api/v1/verification/{id}/report': {
            get: {
                summary: 'Get complete verification report',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    '200': { description: 'Full verification report including corrected answers and sources' },
                },
            },
        },
        '/api/v1/claims/extract': {
            post: {
                summary: 'Decompose AI answer into discrete, categorized atomic claims via Bifrost Gateway',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['answer'],
                                properties: {
                                    answer: { type: 'string' },
                                    verificationId: { type: 'string' },
                                    topicHint: { type: 'string' },
                                    model: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Structured atomic claims with entities, dates, categories, and text offsets' },
                    '400': { description: 'Validation error: empty or invalid answer input' },
                },
            },
        },
        '/api/v1/claims/verification/{verificationId}': {
            get: {
                summary: 'Retrieve extracted atomic claims for a verification session',
                parameters: [
                    { name: 'verificationId', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    '200': { description: 'Array of extracted claims with entities, categories, and context' },
                },
            },
        },
        '/api/v1/freshness/analyze': {
            post: {
                summary: 'Analyze claims for time-sensitivity, volatility, and live verification requirement via Bifrost Gateway',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    verificationId: { type: 'string' },
                                    claims: { type: 'array', items: { type: 'object' } },
                                    answerText: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Temporal freshness analysis with priority, volatility, and recommended search strategy' },
                    '400': { description: 'Validation error: no claims or answerText provided' },
                },
            },
        },
        '/api/v1/freshness/{verificationId}': {
            get: {
                summary: 'Retrieve freshness and temporal detection results for a verification session',
                parameters: [
                    { name: 'verificationId', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    '200': { description: 'Temporal analysis breakdown for all session claims' },
                },
            },
        },
        '/api/v1/developer/verify': {
            post: {
                tags: ['Developer API'],
                summary: 'Submit AI answer for automated verification and factual staleness check',
                security: [{ ApiKeyAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['answerText'],
                                properties: {
                                    answerText: { type: 'string', example: 'React 19 was released in December 2024.' },
                                    topic: { type: 'string', example: 'Web Development' },
                                    strictness: { type: 'string', enum: ['strict', 'balanced', 'permissive'], default: 'balanced' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': { description: 'Verification results, aggregate freshness score, and claims' },
                    '401': { description: 'Unauthorized: Invalid or missing API key' },
                    '429': { description: 'Rate limit exceeded' },
                },
            },
        },
        '/api/v1/developer/keys': {
            post: {
                tags: ['Developer API'],
                summary: 'Generate a new developer API key',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string', example: 'Production Backend Service' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': { description: 'API Key generated' },
                },
            },
            get: {
                tags: ['Developer API'],
                summary: 'List active developer API keys',
                responses: {
                    '200': { description: 'Active developer API keys' },
                },
            },
        },
    },
};
//# sourceMappingURL=swagger.js.map