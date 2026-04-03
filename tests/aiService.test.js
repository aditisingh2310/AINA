const { analyzeIncidentText } = require('../services/aiService');

jest.mock('node-fetch');

describe('AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns fallback analysis when no API key configured', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const result = await analyzeIncidentText('Test incident');

    expect(result.source).toBe('fallback');
    expect(result.category).toBeDefined();
    expect(result.severityScore).toBeGreaterThanOrEqual(1);
    expect(result.severityScore).toBeLessThanOrEqual(10);

    process.env.GEMINI_API_KEY = originalKey;
  });

  it('handles empty text input gracefully', async () => {
    const result = await analyzeIncidentText('');
    expect(result).toBeNull();
  });

  it('validates severity score is between 1-10', async () => {
    const result = await analyzeIncidentText('Test');
    expect(result.severityScore).toBeGreaterThanOrEqual(1);
    expect(result.severityScore).toBeLessThanOrEqual(10);
  });
});
