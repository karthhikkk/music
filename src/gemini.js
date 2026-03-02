/**
 * Mood Analysis — Gemini API with automatic local fallback
 * 
 * Strategy:
 * 1. Try Gemini (multiple model fallbacks)
 * 2. If all Gemini models fail (rate limit, quota, network) → use local engine
 */
import { analyzeLocally } from './localMood.js';

const GEMINI_API_KEY = 'AIzaSyAV_YbUdsGNxp37-WjrcGL--myLjJSOYAw';

// Model fallback chain — newest first
const MODELS = [
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-pro'
];

function getModelUrl(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
}

const PROMPT_TEMPLATE = (moodDescription) => `You are a music expert and mood analyst. Analyze the following mood/situation and respond ONLY with valid JSON (no markdown, no code fences, no extra text).

Mood/situation: "${moodDescription}"

Respond with EXACTLY this JSON structure:
{
  "playlist_title": "A creative evocative playlist name (max 6 words)",
  "playlist_description": "One sentence describing why these songs fit this vibe",
  "vibe_label": "1-3 word vibe label e.g. Deep Focus or Post-Workout High",
  "energy": "low",
  "tempo": "slow",
  "mood_keywords": ["keyword1", "keyword2", "keyword3"],
  "genres": ["primary_genre", "secondary_genre"],
  "search_queries": [
    "real artist name 1",
    "real artist name 2",
    "real song title artist 3",
    "genre mood search 4",
    "artist name 5",
    "artist name 6",
    "artist name 7",
    "artist name 8"
  ],
  "color_palette": {
    "primary": "#1e3a5f",
    "secondary": "#2d6a9f",
    "accent": "#7eb8d4"
  }
}

Rules:
- search_queries = real artist names OR "song title artist" pairs
- energy must be one of: low, medium, high
- tempo must be one of: slow, medium, fast
- color_palette should emotionally match (rain→blues, energy→oranges/reds, romantic→pinks, zen→greens)`;

async function tryGemini(moodDescription) {
  const body = JSON.stringify({
    contents: [{ parts: [{ text: PROMPT_TEMPLATE(moodDescription) }] }],
    generationConfig: { temperature: 0.85, maxOutputTokens: 800 }
  });

  for (const model of MODELS) {
    try {
      console.log(`[Gemini] Trying model: ${model}`);
      const res = await fetch(getModelUrl(model), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });

      if (res.status === 429 || res.status === 503 || res.status === 404) {
        console.warn(`[Gemini] ${model} → ${res.status}, skipping`);
        continue;
      }
      if (!res.ok) {
        console.warn(`[Gemini] ${model} → ${res.status}`);
        continue;
      }

      const data = await res.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      text = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

      const parsed = (() => {
        try { return JSON.parse(text); } catch (_) {
          const m = text.match(/\{[\s\S]*\}/);
          return m ? JSON.parse(m[0]) : null;
        }
      })();

      if (parsed && parsed.playlist_title && Array.isArray(parsed.search_queries)) {
        console.log(`[Gemini] Success with ${model}`);
        return { ...parsed, _source: 'gemini' };
      }
    } catch (e) {
      console.warn(`[Gemini] ${model} threw:`, e.message);
    }
  }
  return null; // all models failed
}

/**
 * Main export — tries Gemini, falls back to local engine
 */
export async function analyzeMood(moodDescription, onStatusUpdate) {
  // Try Gemini first
  if (onStatusUpdate) onStatusUpdate('Reading your vibe with AI…');
  const geminiResult = await tryGemini(moodDescription);

  if (geminiResult) return geminiResult;

  // Fallback to local engine
  console.log('[Mood] Gemini unavailable — using local mood engine');
  if (onStatusUpdate) onStatusUpdate('Matching your vibe locally…');
  return analyzeLocally(moodDescription);
}
