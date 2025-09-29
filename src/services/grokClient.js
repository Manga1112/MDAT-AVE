import fetch from 'node-fetch';
import { env } from '../config/env.js';
import logger from '../config/logger.js';

const DEFAULT_ENDPOINT = process.env.GROK_API_ENDPOINT || 'https://api.x.ai/v1/chat/completions';
const DEFAULT_MODEL = process.env.GROK_MODEL || 'grok-4-latest';

function clamp(n, min, max) {
  if (typeof n !== 'number' || Number.isNaN(n)) return null;
  return Math.max(min, Math.min(max, n));
}

function fallbackHeuristicScore(resumeText = '', jdText = '') {
  // Very rough keyword overlap heuristic as a last resort
  try {
    const words = (s) => String(s).toLowerCase().match(/[a-z0-9+#\.]{2,}/g) || [];
    const r = new Set(words(resumeText));
    const j = words(jdText);
    if (!j.length) return 0;
    let hits = 0;
    for (const w of j) if (r.has(w)) hits++;
    const ratio = hits / j.length; // 0..1
    return Math.round(ratio * 100);
  } catch {
    return null;
  }
}

async function postWithTimeout(url, options, timeoutMs = 20000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function screenResumeWithJD({ resumeText, jdText, weights = { projects: 0.4, skills: 0.3, experience: 0.3 }, endpoint = DEFAULT_ENDPOINT, model = DEFAULT_MODEL, timeoutMs = 20000, retries = 2 }) {
  if (!env.grokApiKey) throw new Error('GROK_API_KEY not set');
  if (!resumeText || !jdText) throw new Error('Missing resumeText or jdText');

  const prompt = `You are an expert technical recruiter. Evaluate the candidate against the JD. Weights: projects=${weights.projects}, skills=${weights.skills}, experience=${weights.experience}. Respond in STRICT JSON with these keys only: {"score": number(0-100), "highlights": string[], "gaps": string[], "rationale": string}. Do not include any other text.`;

  // Build request payloads depending on provider style
  const isXAI = /api\.x\.ai\//i.test(endpoint);
  const body = isXAI
    ? {
        model,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: `Job Description:\n${jdText}\n\nResume:\n${resumeText}` },
        ],
        stream: false,
        temperature: 0,
      }
    : {
        model,
        input: {
          system: prompt,
          resume: resumeText,
          job_description: jdText,
        },
      };

  let lastErr;
  const started = Date.now();
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await postWithTimeout(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.grokApiKey}` },
        body: JSON.stringify(body),
      }, timeoutMs);

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`Grok API error: ${resp.status} ${text}`);
      }

      const data = await resp.json();
      // Normalize & validate (supports x.ai chat completions and generic JSON endpoints)
      let parsed = data;
      if (isXAI) {
        const choice = data?.choices?.[0];
        const content = choice?.message?.content;
        if (typeof content === 'string') {
          try {
            // Extract JSON block if extra text wraps it
            const match = content.match(/\{[\s\S]*\}/);
            parsed = match ? JSON.parse(match[0]) : JSON.parse(content);
          } catch (e) {
            throw new Error('Failed to parse x.ai JSON content: ' + (e?.message || e));
          }
        }
      }

      const rawScore = parsed.score ?? parsed.result?.score ?? data.score ?? data.result?.score;
      const score = clamp(typeof rawScore === 'string' ? Number(rawScore.replace(/[^0-9.\-]/g, '')) : rawScore, 0, 100);
      const highlights = Array.isArray(parsed.highlights ?? parsed.result?.highlights ?? data.highlights ?? data.result?.highlights)
        ? (parsed.highlights ?? parsed.result?.highlights ?? data.highlights ?? data.result?.highlights)
        : [];
      const gaps = Array.isArray(parsed.gaps ?? parsed.result?.gaps ?? data.gaps ?? data.result?.gaps)
        ? (parsed.gaps ?? parsed.result?.gaps ?? data.gaps ?? data.result?.gaps)
        : [];
      const rationale = String(parsed.rationale ?? parsed.result?.rationale ?? data.rationale ?? data.result?.rationale ?? '');

      if (score === null) throw new Error('Missing/invalid score in Grok response');

      const durationMs = Date.now() - started;
      logger.info({ provider: isXAI ? 'x.ai' : 'grok', model, durationMs, score }, 'Grok screening succeeded');
      return { score, highlights, gaps, rationale, raw: data };
    } catch (e) {
      lastErr = e;
      // Backoff before retrying
      if (attempt < retries) {
        const wait = 500 * Math.pow(2, attempt);
        logger.warn({ attempt, wait, err: String(e?.message || e) }, 'Grok screening attempt failed, retrying');
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
    }
  }

  // Final fallback heuristic so UI gets a score, and we persist something useful
  const fb = fallbackHeuristicScore(resumeText, jdText);
  if (fb !== null) {
    const durationMs = Date.now() - started;
    logger.warn({ provider: 'fallback', durationMs, score: fb, err: String(lastErr?.message || lastErr) }, 'Grok screening fell back to heuristic scoring');
    return { score: fb, highlights: [], gaps: [], rationale: 'Heuristic score (fallback due to Grok error)', raw: { error: String(lastErr?.message || lastErr) } };
  }
  throw lastErr || new Error('Grok screening failed');
}
