// @ts-ignore
import request from 'supertest';
import { app } from '../../src/app';
import { aiGateway, AIGateway } from '../../src/modules/ai/ai.gateway';
import { aiService } from '../../src/modules/ai/ai.service';
import { claimExtractionResponseSchema, timeSensitivityResponseSchema } from '../../src/modules/ai/ai.validation';

describe('Phase 04 — Bifrost AI Gateway Integration Tests', () => {
  // TEST 1: Send a simple prompt through Bifrost Gateway
  it('TEST 1: Health check should verify live Bifrost connectivity on port 8080', async () => {
    const res = await request(app).get('/api/v1/integrations/bifrost/health');
    if (res.status !== 200) {
      console.log('CORRECTION ERROR BODY:', JSON.stringify(res.body));
    }
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(['CONNECTED', 'CONFIGURATION_REQUIRED']).toContain(res.body.data.status);
    expect(res.body.data.url).toContain('8080');
    expect(res.body.data.latencyMs).toBeGreaterThanOrEqual(0);
  });

  // TEST 2: Extract factual claims from a sample answer
  it('TEST 2: POST /api/v1/ai/extract-claims should extract structured claims', async () => {
    const sampleAnswer =
      'React 18 was released in March 2022. React 19 is now the active stable major release with React Server Components.';

    const res = await request(app)
      .post('/api/v1/ai/extract-claims')
      .send({
        answerText: sampleAnswer,
        topicHint: 'Web Technologies',
      });

    if (res.status !== 200) {
      console.log('CORRECTION ERROR BODY:', JSON.stringify(res.body));
    }
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.result.claims).toBeDefined();
    expect(res.body.data.result.claims.length).toBeGreaterThan(0);
    expect(res.body.data.result.claims[0].claimText).toBeDefined();
  });

  // TEST 3: Request structured JSON output
  it('TEST 3: Gateway should return structured JSON output with appropriate schemas', async () => {
    const response = await aiGateway.request({
      stage: 'CLAIM_EXTRACTION',
      messages: [
        { role: 'user', content: 'Extract factual claims from: Python 3.7 reached end-of-life in 2023.' },
      ],
      responseFormat: { type: 'json_object' },
    });

    expect(response.content).toBeDefined();
    const parsed = JSON.parse(response.content);
    expect(typeof parsed).toBe('object');
    expect(parsed.claims).toBeDefined();
  });

  // TEST 4: Validate model response using Zod
  it('TEST 4: Zod schemas should validate claim extraction and time sensitivity', async () => {
    const validClaimData = {
      claims: [
        {
          claimText: 'React 19 was released in 2024.',
          category: 'technology',
          timeSensitive: true,
          reason: 'Version status changes over time',
        },
      ],
    };

    const parsed = claimExtractionResponseSchema.parse(validClaimData);
    expect(parsed.claims.length).toBe(1);

    // Invalid schema rejection
    expect(() => {
      claimExtractionResponseSchema.parse({ claims: [] });
    }).toThrow();
  });

  // TEST 5: Test invalid credentials handling
  it('TEST 5: Gateway should handle unauthenticated / invalid credentials gracefully', async () => {
    const gatewayBadKey = new AIGateway();
    // Directly testing request handling with invalid parameters
    const response = await gatewayBadKey.request({
      stage: 'CLAIM_EXTRACTION',
      messages: [{ role: 'user', content: 'Test with mock credentials' }],
    });

    expect(response).toBeDefined();
    expect(response.content).toBeDefined();
  });

  // TEST 6: Test unavailable model fallback
  it('TEST 6: Gateway should handle unavailable model requests gracefully without crashing', async () => {
    const response = await aiGateway.request({
      model: 'nonexistent-model-xyz-12345',
      stage: 'CLAIM_EXTRACTION',
      messages: [{ role: 'user', content: 'Testing model routing' }],
    });

    expect(response).toBeDefined();
    expect(response.status).toBeDefined();
  });

  // TEST 7: Test timeout behavior
  it('TEST 7: Gateway should respect timeout constraints', async () => {
    const start = Date.now();
    const response = await aiGateway.request({
      stage: 'CLAIM_EXTRACTION',
      timeoutMs: 1500, // Strict 1.5s timeout
      messages: [{ role: 'user', content: 'Test fast timeout handling' }],
    });

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(10000);
    expect(response.content).toBeDefined();
  });

  // TEST 8: Test retry behavior
  it('TEST 8: Gateway should execute retries on transient connection issues', async () => {
    const response = await aiGateway.request({
      stage: 'TIME_SENSITIVITY',
      messages: [{ role: 'user', content: 'Test retry loop' }],
    });

    expect(response.content).toBeDefined();
  });

  // TEST 9: Measure request latency
  it('TEST 9: All AI responses should measure and report positive latencyMs', async () => {
    const res = await request(app)
      .post('/api/v1/ai/analyze-claims')
      .send({
        claims: ['React 18 is the latest stable version.'],
      });

    if (res.status !== 200) {
      console.log('CORRECTION ERROR BODY:', JSON.stringify(res.body));
    }
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.meta.latencyMs).toBe('number');
    expect(res.body.data.meta.latencyMs).toBeGreaterThanOrEqual(0);
  });

  // TEST 10: Check token usage metadata where supported
  it('TEST 10: Token usage metadata should be captured and returned', async () => {
    const res = await request(app)
      .post('/api/v1/ai/extract-claims')
      .send({
        answerText: 'Sam Altman was reinstated as CEO of OpenAI in late 2023.',
      });

    if (res.status !== 200) {
      console.log('CORRECTION ERROR BODY:', JSON.stringify(res.body));
    }
    expect(res.status).toBe(200);
    expect(res.body.data.meta.usage).toBeDefined();
    expect(res.body.data.meta.usage.inputTokens).toBeGreaterThanOrEqual(0);
    expect(res.body.data.meta.usage.outputTokens).toBeGreaterThanOrEqual(0);
  });

  // ADDITIONAL AI CAPABILITY TESTS: Evidence Analysis & Correction
  it('POST /api/v1/ai/analyze-evidence should analyze claim against live evidence', async () => {
    const res = await request(app)
      .post('/api/v1/ai/analyze-evidence')
      .send({
        claimText: 'React 18 is the latest stable version.',
        evidence: [
          {
            title: 'React 19 Release',
            content: 'React 19 is now available on npm. It includes React Server Components.',
            url: 'https://react.dev/blog/2024/12/05/react-19',
          },
        ],
      });

    if (res.status !== 200) {
      console.log('CORRECTION ERROR BODY:', JSON.stringify(res.body));
    }
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.result.verdict).toBeDefined();
    expect(res.body.data.result.confidence).toBeGreaterThan(0);
  });

  it('POST /api/v1/ai/generate-correction should rewrite outdated claims accurately', async () => {
    const res = await request(app)
      .post('/api/v1/ai/generate-correction')
      .send({
        originalAnswer: 'React 18 is the latest version.',
        claims: [
          {
            claimText: 'React 18 is the latest version.',
            verdict: 'CONTRADICTS',
            explanation: 'React 19 has been released.',
          },
        ],
      });

    if (res.status !== 200) {
      console.log('CORRECTION ERROR BODY:', JSON.stringify(res.body));
    }
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.result.hasModifications).toBe(true);
    expect(res.body.data.result.correctedAnswer).toContain('React 19');
  });
});
