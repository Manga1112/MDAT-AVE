import fetch from 'node-fetch';
import { env } from '../config/env.js';

export async function screenResumeWithJD({ resumeText, jdText, weights = { projects: 0.4, skills: 0.3, experience: 0.3 } }) {
  if (!env.grokApiKey) throw new Error('GROK_API_KEY not set');

  // Example request structure; replace with actual Grok API endpoint if different
  const prompt = `You are an expert technical recruiter. Evaluate the candidate against the JD. Weights: projects=${weights.projects}, skills=${weights.skills}, experience=${weights.experience}. Provide JSON with keys: score(0-100), highlights[], gaps[], rationale.`;

  const body = {
    model: 'grok-llm-sk-or-v1',
    input: {
      system: prompt,
      resume: resumeText,
      job_description: jdText,
    },
  };

  const resp = await fetch('https://api.grok.com/v1/screen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.grokApiKey}` },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Grok API error: ${resp.status} ${text}`);
  }

  const data = await resp.json();
  // Normalize output expected
  return {
    score: data.score ?? data.result?.score ?? null,
    highlights: data.highlights ?? data.result?.highlights ?? [],
    gaps: data.gaps ?? data.result?.gaps ?? [],
    rationale: data.rationale ?? data.result?.rationale ?? '',
    raw: data,
  };
}
