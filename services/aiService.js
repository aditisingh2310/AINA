const INCIDENT_TYPES = ['verbal', 'physical', 'financial', 'threat'];
const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'];
const RISK_TAGS = [
  'harassment', 'assault', 'stalking', 'threat', 'abuse', 'danger', 'emergency',
  'workplace', 'public', 'domestic', 'sexual', 'verbal', 'physical', 'financial'
];

function parseGeminiJson(text) {
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

function mapSeverityScoreToLevel(score) {
  if (score <= 2) return 'low';
  if (score <= 5) return 'medium';
  if (score <= 8) return 'high';
  return 'critical';
}

async function analyzeIncidentText(text) {
  if (!text) {
    return null;
  }

  // Graceful fallback if API key is not configured.
  if (!process.env.GEMINI_API_KEY) {
    return {
      category: 'verbal',
      who: 'unknown',
      when: 'unknown',
      type: 'verbal',
      severityScore: 3,
      severityLevel: 'medium',
      riskTags: ['verbal'],
      source: 'fallback',
    };
  }

  const prompt = `You are a safety incident classifier.\nReturn strict JSON with keys: category, who, when, type, severityScore, riskTags.\nAllowed category/type values: verbal, physical, financial, threat.\nseverityScore must be integer 1-10.\nriskTags must be array of relevant tags from: harassment, assault, stalking, threat, abuse, danger, emergency, workplace, public, domestic, sexual, verbal, physical, financial.\nText: ${text}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const body = await response.json();
  const raw = body?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!raw) {
    throw new Error('Gemini returned empty response');
  }

  const parsed = parseGeminiJson(raw);

  return {
    category: INCIDENT_TYPES.includes(parsed.category) ? parsed.category : 'verbal',
    who: parsed.who || 'unknown',
    when: parsed.when || 'unknown',
    type: INCIDENT_TYPES.includes(parsed.type) ? parsed.type : 'verbal',
    severityScore: Math.max(1, Math.min(10, Number(parsed.severityScore) || 1)),
    severityLevel: mapSeverityScoreToLevel(Number(parsed.severityScore) || 1),
    riskTags: Array.isArray(parsed.riskTags) ? parsed.riskTags.filter(tag => RISK_TAGS.includes(tag)) : ['verbal'],
    source: 'gemini',
    raw: parsed,
  };
}

async function generateStructuredReport(incidentData) {
  if (!process.env.GEMINI_API_KEY) {
    return {
      summary: 'AI analysis not available - using fallback report',
      recommendations: ['Contact local authorities', 'Document the incident', 'Seek support if needed'],
      authoritySummary: 'Incident reported - please investigate',
      harassmentPatterns: [],
      source: 'fallback'
    };
  }

  const prompt = `Generate a structured safety incident report in JSON format with keys: summary, recommendations, authoritySummary, harassmentPatterns.
  summary: 2-3 sentence overview
  recommendations: array of 3-5 actionable safety steps
  authoritySummary: concise summary for law enforcement (max 100 words)
  harassmentPatterns: array of identified patterns or tactics used
  Incident data: ${JSON.stringify(incidentData)}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const body = await response.json();
  const raw = body?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!raw) {
    throw new Error('Gemini returned empty response');
  }

  const parsed = parseGeminiJson(raw);

  return {
    summary: parsed.summary || 'Incident analysis completed',
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : ['Contact authorities', 'Document incident'],
    authoritySummary: parsed.authoritySummary || 'Safety incident reported',
    harassmentPatterns: Array.isArray(parsed.harassmentPatterns) ? parsed.harassmentPatterns : [],
    source: 'gemini',
    raw: parsed,
  };
}

async function analyzeIncidentPatterns(incidents) {
  if (!process.env.GEMINI_API_KEY || !incidents?.length) {
    return {
      patterns: [],
      riskLevel: 'low',
      recommendations: ['Continue monitoring incidents'],
      source: 'fallback'
    };
  }

  const prompt = `Analyze incident patterns from this data: ${JSON.stringify(incidents)}.
  Return JSON with keys: patterns (array of pattern descriptions), riskLevel (low/medium/high/critical), recommendations (array of safety recommendations).`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const body = await response.json();
  const raw = body?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!raw) {
    throw new Error('Gemini returned empty response');
  }

  const parsed = parseGeminiJson(raw);

  return {
    patterns: Array.isArray(parsed.patterns) ? parsed.patterns : [],
    riskLevel: SEVERITY_LEVELS.includes(parsed.riskLevel) ? parsed.riskLevel : 'low',
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : ['Continue monitoring'],
    source: 'gemini',
    raw: parsed,
  };
}

module.exports = {
  analyzeIncidentText,
  generateStructuredReport,
  analyzeIncidentPatterns,
  SEVERITY_LEVELS,
  RISK_TAGS
};
