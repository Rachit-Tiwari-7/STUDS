import { WorkspaceData, DifficultyType } from './types';
import { validateAndSanitizeWorkspace } from './groq';

/**
 * STRICTLY 100% FREE VISION OCR MODELS ONLY
 * All models have prompt price = $0.00 on OpenRouter
 */
export const OPENROUTER_VISION_MODELS = [
  {
    id: 'google/gemma-4-31b-it:free',
    name: 'Google Gemma 4 31B Vision (100% Free)',
    recommended: true,
    badge: '🏆 Primary Free',
    desc: 'Google multimodal model with advanced visual document reasoning.',
  },
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    name: 'Google Gemma 4 26B Vision (100% Free)',
    recommended: false,
    badge: '⚡ Fallback 1',
    desc: 'Fast, lightweight free multimodal model.',
  },
  {
    id: 'openrouter/free',
    name: 'OpenRouter Free Models Router (100% Free)',
    recommended: false,
    badge: '🔄 Fallback 2',
    desc: 'Automatically routes to available free multimodal endpoints.',
  },
  {
    id: 'dots-studio/dots-3-note-preview:free',
    name: 'Dots3-Note Preview (100% Free Note OCR)',
    recommended: false,
    badge: '📝 Fallback 3',
    desc: 'Trained specifically for document and note preview transcription.',
  },
  {
    id: 'nex-agi/nex-n2.5-pro:free',
    name: 'Nex-N2.5-Pro Vision (100% Free)',
    recommended: false,
    badge: '🆓 Free Tier',
    desc: 'High-parameter free vision model for dense layouts.',
  },
];

export const OPENROUTER_TEXT_MODELS = [
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    name: 'NVIDIA Nemotron 3 Ultra (100% Free)',
    recommended: true,
  },
  {
    id: 'openrouter/free',
    name: 'OpenRouter Free Text Router (100% Free)',
    recommended: false,
  },
  {
    id: 'liquid/lfm-2.5-2.6b:free',
    name: 'LiquidAI LFM 2.5 (100% Free)',
    recommended: false,
  },
];

export const DEFAULT_OPENROUTER_KEY =
  (typeof process !== 'undefined' && process.env.OPENROUTER_API_KEY) ||
  '';

export const DEFAULT_OPENROUTER_VISION_MODEL = 'google/gemma-4-31b-it:free';
export const DEFAULT_OPENROUTER_TEXT_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';

/**
 * Core call to OpenRouter Vision with a single model
 */
async function callVisionModel(
  apiKey: string,
  imageDataUrl: string,
  model: string
): Promise<string> {
  const prompt = `You are an expert academic OCR and handwriting transcription specialist. 
Your task is to transcribe everything written in these student lecture notes into clean, well-structured, formatted Markdown.

Rules:
1. Decipher messy handwriting, cursive, scratches, and student shorthand carefully using context.
2. Fix obvious spelling errors while preserving the author's technical terms, formulas, and exact meanings.
3. Transcribe mathematical and scientific formulas into standard LaTeX (e.g. $E = mc^2$ or $$ ... $$).
4. Organize the text with clean Markdown headers (# ## ###), bullet points (- or *), and bold key terms.
5. If there are diagrams, charts, or sketches, describe them in brackets like: [Diagram: Process flow of A -> B -> C].
6. Output ONLY the transcribed notes text in Markdown. Do not include conversational filler.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
        'X-Title': 'STUDS — Student Workspace',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 3000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      let message = `HTTP ${response.status}`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) message = errJson.error.message;
      } catch {
        // use status
      }
      throw new Error(message);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content || !content.trim()) {
      throw new Error('Empty response from model');
    }

    return content.trim();
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (typeof err === 'object' && err !== null && 'name' in err && err.name === 'AbortError') {
      throw new Error('Request timed out after 25s');
    }
    throw err;
  }
}

/**
 * Transcribes handwritten lecture notes, sketches, and whiteboard photos using strictly 100% FREE
 * multimodal vision models on OpenRouter, with an automatic 3-tier fallback cascade:
 * Tier 1: Primary chosen free vision model (default: google/gemma-4-31b-it:free)
 * Tier 2: Fallback 1 free vision model (google/gemma-4-26b-a4b-it:free)
 * Tier 3: Fallback 2 free vision model (openrouter/free)
 * Tier 4: Fallback 3 free vision model (dots-studio/dots-3-note-preview:free)
 *
 * @param {string} apiKey - OpenRouter API authentication token.
 * @param {string} imageDataUrl - Base64 data URL representation of the note image.
 * @param {string} [primaryModel] - Primary model identifier (defaults to DEFAULT_OPENROUTER_VISION_MODEL).
 * @param {(status: string) => void} [onStatusUpdate] - Optional callback emitting human-readable cascade progress.
 * @returns {Promise<{ text: string; usedModel: string }>} Clean transcribed Markdown and model telemetry.
 * @throws {Error} If all tiers in the cascade fail or time out.
 * @complexity Time: O(1) network bound with 25s per-tier abort controller. Space: O(K) image buffer size.
 */
export async function transcribeHandwrittenImage(
  apiKey: string,
  imageDataUrl: string,
  primaryModel = DEFAULT_OPENROUTER_VISION_MODEL,
  onStatusUpdate?: (status: string) => void
): Promise<{ text: string; usedModel: string }> {
  // Ordered list of 100% free models to try in sequence - O(N) deduplicated using Set
  const freeCascade = Array.from(
    new Set([
      primaryModel,
      'google/gemma-4-31b-it:free',
      'google/gemma-4-26b-a4b-it:free',
      'openrouter/free',
      'dots-studio/dots-3-note-preview:free',
      'nex-agi/nex-n2.5-pro:free',
    ])
  );

  const errors: string[] = [];

  for (let i = 0; i < freeCascade.length; i++) {
    const currentModel = freeCascade[i];
    const shortName = currentModel.split('/')[1] || currentModel;
    const tierLabel = i === 0 ? 'Primary' : `Fallback ${i}`;

    const statusMsg = `Attempting ${tierLabel} Free Model [${i + 1}/${freeCascade.length}]: ${shortName}...`;
    if (onStatusUpdate) onStatusUpdate(statusMsg);

    try {
      const result = await callVisionModel(apiKey, imageDataUrl, currentModel);
      return { text: result, usedModel: currentModel };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const errMsg = `${shortName} error: ${msg}`;
      console.warn(`[OCR Free Cascade] ${errMsg}`);
      errors.push(errMsg);

      // If there are more fallback models in the chain, announce fallback
      if (i < freeCascade.length - 1) {
        const nextModel = freeCascade[i + 1].split('/')[1] || freeCascade[i + 1];
        if (onStatusUpdate) {
          onStatusUpdate(`⚠️ ${shortName} busy/queued. Switching to Fallback ${i + 1}: ${nextModel}...`);
        }
      }
    }
  }

  throw new Error(
    `All ${freeCascade.length} free OCR models in the fallback chain were unavailable:\n${errors.join('\n')}`
  );
}

/**
 * Generate full 25-feature study workspace using 100% Free OpenRouter model
 */
export async function generateWorkspaceWithOpenRouter(
  apiKey: string,
  lectureText: string,
  difficulty: DifficultyType,
  model = DEFAULT_OPENROUTER_TEXT_MODEL
): Promise<WorkspaceData> {
  const schemaDescription = `{
  "topic": "string (Main subject title)",
  "wordCount": number,
  "estReadTimeMin": number,
  "takeaways": ["string", "string", "string"],
  "schedule": [
    { "day": "Day 1: Foundation & Core Terminology", "task": "string", "done": false },
    { "day": "Day 2: Deep Dive & Mechanism Analysis", "task": "string", "done": false },
    { "day": "Day 3: Practice Testing & Active Recall", "task": "string", "done": false }
  ],
  "glossary": [
    { "term": "string", "def": "string" }
  ],
  "mnemonics": [
    { "word": "string", "meaning": "string" }
  ],
  "mindmap": {
    "title": "string",
    "children": [
      {
        "title": "string",
        "children": [
          { "title": "string" }
        ]
      }
    ]
  },
  "notes": {
    "eli5": [
      {
        "title": "string",
        "complexity": "easy",
        "bullets": ["string with <span class=\\"spoiler-term\\">keyword</span> tags"]
      }
    ],
    "professor": [
      {
        "title": "string",
        "complexity": "hard",
        "bullets": ["string with <span class=\\"spoiler-term\\">keyword</span> tags"]
      }
    ],
    "cram": [
      {
        "title": "string",
        "complexity": "medium",
        "bullets": ["string with <span class=\\"spoiler-term\\">keyword</span> tags"]
      }
    ],
    "tldr": [
      {
        "title": "string",
        "complexity": "easy",
        "bullets": ["string with <span class=\\"spoiler-term\\">keyword</span> tags"]
      }
    ]
  },
  "cloze": {
    "sentence": "string with one or two words replaced by [_____]",
    "answers": ["exact missing word"]
  },
  "quiz": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "answer": 0,
      "explanation": "string"
    }
  ],
  "flashcards": [
    {
      "front": "string",
      "back": "string",
      "category": "string"
    }
  ]
}`;

  const prompt = `You are STUDS AI, an elite academic study engine.
Analyze the following lecture notes and generate a complete, rigorous study workspace in strict JSON format.
Difficulty Level: ${difficulty.toUpperCase()}.

Schema requirement:
${schemaDescription}

Rules:
1. Always output ONLY valid JSON matching the schema, with no surrounding Markdown backticks or commentary.
2. In the notes section, enclose 1 to 2 critical recall terms per bullet in: <span class="spoiler-term">TERM_HERE</span>
3. Provide exactly 5 multiple choice questions with 4 distinct options and clear explanations.
4. Provide at least 4 flippable flashcards.
5. Provide 4 to 8 glossary terms and at least 2 clever mnemonics.
6. Provide exactly 3 high-yield takeaways.

Lecture Content:
${lectureText.slice(0, 12000)}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      'X-Title': 'STUDS',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are STUDS AI. You output ONLY strictly valid JSON adhering to the specified schema.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    let message = `OpenRouter Free Model Error (${response.status})`;
    try {
      const errJson = JSON.parse(errText);
      if (errJson.error?.message) message = errJson.error.message;
    } catch {
      // fallback
    }
    throw new Error(message);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content || '{}';
  const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanJson);

  return validateAndSanitizeWorkspace(parsed, lectureText);
}
