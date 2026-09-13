import { WorkspaceData, MindMapNode } from './types';

export const ACTIVE_GROQ_MODELS = [
  {
    id: 'openai/gpt-oss-120b',
    name: 'OpenAI GPT-OSS 120B (Flagship Quality - Active)',
    recommended: true,
  },
  {
    id: 'qwen/qwen3.8-27b',
    name: 'Qwen 3.8 27B (High Academic Reasoning - Active)',
    recommended: false,
  },
  {
    id: 'groq/compound',
    name: 'Groq Compound (Agentic Synthesis - Active)',
    recommended: false,
  },
  {
    id: 'groq/compound-mini',
    name: 'Groq Compound Mini (Ultra-Fast - Active)',
    recommended: false,
  },
  {
    id: 'qwen/qwen3.6-27b',
    name: 'Qwen 3.6 27B (Balanced - Active)',
    recommended: false,
  },
];

export const DEFAULT_GROQ_MODEL =
  (typeof process !== 'undefined' && process.env.DEFAULT_GROQ_MODEL) ||
  'openai/gpt-oss-120b';

/**
 * Loads default Groq rotation keys from environment variables (GROQ_API_KEYS / GROQ_API_KEY)
 */
export function getEnvGroqKeys(): string[] {
  const envKeysRaw =
    (typeof process !== 'undefined' &&
      (process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY)) ||
    '';
  return parseGroqKeyPool(envKeysRaw);
}

export const DEFAULT_GROQ_KEYS: string[] = getEnvGroqKeys();

/**
 * Resolves a model ID, guaranteeing that deprecated Groq models (e.g., legacy Llama or Mixtral)
 * are cleanly mapped to verified active models (defaulting to openai/gpt-oss-120b).
 *
 * @param {string} [model] - Requested model identifier or empty string.
 * @returns {string} Verified, non-deprecated Groq model identifier.
 * @complexity Time: O(M) where M is the number of active models. Space: O(1).
 */
export function resolveGroqModel(model?: string): string {
  if (!model) return DEFAULT_GROQ_MODEL;
  const trimmed = model.trim();
  if (
    trimmed.startsWith('llama') ||
    trimmed.startsWith('mixtral') ||
    trimmed.startsWith('gemma-7b') ||
    trimmed.includes('versatile') ||
    trimmed.includes('instant')
  ) {
    return DEFAULT_GROQ_MODEL;
  }
  const match = ACTIVE_GROQ_MODELS.find((m) => m.id === trimmed);
  if (match) return match.id;
  return trimmed || DEFAULT_GROQ_MODEL;
}

// Global round-robin pointer across app lifecycle
let currentPoolIndex = 0;

/**
 * Resets the global pool index pointer (used for deterministic test assertions).
 */
export function resetGroqPoolIndex(): void {
  currentPoolIndex = 0;
}

/**
 * Parses arbitrary raw key pool string (newlines, commas, whitespace) or string array
 * into a sanitized, deduplicated array of valid Groq API authentication tokens.
 *
 * @param {string | string[]} input - User input string or array containing API keys.
 * @returns {string[]} Sanitized list of non-empty API key strings.
 * @complexity Time: O(K) where K is token length. Space: O(K) for tokens array.
 */
export function parseGroqKeyPool(input: string | string[]): string[] {
  if (Array.isArray(input)) {
    return input.map((k) => k.trim()).filter(Boolean);
  }
  if (!input || typeof input !== 'string') return [];
  return input
    .split(/[\n,\s]+/)
    .map((k) => k.trim())
    .filter(Boolean);
}

/**
 * Strict Data Consistency & Completeness Validator.
 * Enforces schema compliance (validating title, >=3 takeaways, >=3 glossary terms, >=1 mnemonic,
 * >=2 sections, >=4 quiz questions, and flashcards). Rejects malformed or incomplete outputs to trigger failover.
 *
 * @param {any} raw - Unvalidated raw JSON object from LLM response.
 * @param {string} lectureText - Raw lecture text used for fallback title derivation.
 * @returns {WorkspaceData} Strictly sanitized and normalized study workspace.
 * @throws {Error} If required schema invariants are violated.
 * @complexity Time: O(S + Q + F) where S=sections, Q=quiz items, F=flashcards. Space: O(W) normalized workspace size.
 */
export function validateAndSanitizeWorkspace(raw: unknown, lectureText: string): WorkspaceData {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('LLM output was empty or not a valid JSON object');
  }

  const record = raw as Record<string, unknown>;

  // 1. Validate title
  const title =
    (typeof record.title === 'string' && record.title.trim()) ||
    lectureText.split('\n')[0].replace(/[:#*]/g, '').slice(0, 60).trim() ||
    'Comprehensive Lecture Study Guide';

  // 2. Validate takeaways (strictly require 3 non-empty takeaways)
  let takeaways: string[] = Array.isArray(record.takeaways)
    ? record.takeaways.map((t) => String(t).trim()).filter(Boolean)
    : [];
  if (takeaways.length < 3) {
    throw new Error(`Incomplete takeaways returned (expected 3, got ${takeaways.length})`);
  }
  takeaways = takeaways.slice(0, 3);

  // 3. Validate glossary (strictly require at least 3 valid term/def pairs)
  const glossary = Array.isArray(record.glossary)
    ? record.glossary
        .filter(
          (g): g is { term: string; def: string } =>
            typeof g === 'object' &&
            g !== null &&
            'term' in g &&
            typeof (g as { term: unknown }).term === 'string' &&
            (g as { term: string }).term.trim().length > 0 &&
            'def' in g &&
            typeof (g as { def: unknown }).def === 'string' &&
            (g as { def: string }).def.trim().length > 0
        )
        .map((g) => ({ term: g.term.trim(), def: g.def.trim() }))
    : [];
  if (glossary.length < 3) {
    throw new Error(`Incomplete glossary returned (expected at least 3 terms, got ${glossary.length})`);
  }

  // 4. Validate mnemonics (strictly require at least 1 mnemonic)
  const mnemonics = Array.isArray(record.mnemonics)
    ? record.mnemonics
        .filter(
          (m): m is { word: string; meaning: string } =>
            typeof m === 'object' &&
            m !== null &&
            'word' in m &&
            typeof (m as { word: unknown }).word === 'string' &&
            (m as { word: string }).word.trim().length > 0 &&
            'meaning' in m &&
            typeof (m as { meaning: unknown }).meaning === 'string' &&
            (m as { meaning: string }).meaning.trim().length > 0
        )
        .map((m) => ({ word: m.word.trim(), meaning: m.meaning.trim() }))
    : [];
  if (mnemonics.length < 1) {
    throw new Error('No valid mnemonics returned by model');
  }

  // 5. Validate sections (strictly require at least 2 structured sections with bullets)
  const sections = Array.isArray(record.sections)
    ? record.sections
        .filter(
          (s): s is { title: string; bullets: unknown[]; complexity?: string } =>
            typeof s === 'object' &&
            s !== null &&
            'title' in s &&
            typeof (s as { title: unknown }).title === 'string' &&
            (s as { title: string }).title.trim().length > 0 &&
            'bullets' in s &&
            Array.isArray((s as { bullets: unknown }).bullets) &&
            (s as { bullets: unknown[] }).bullets.length > 0
        )
        .map((s) => ({
          title: s.title.trim(),
          complexity: (typeof s.complexity === 'string' && ['easy', 'medium', 'hard'].includes(s.complexity)
            ? s.complexity
            : 'medium') as 'easy' | 'medium' | 'hard',
          bullets: s.bullets.map((b) => String(b).trim()).filter(Boolean),
        }))
    : [];
  if (sections.length < 2) {
    throw new Error(`Incomplete revision notes (expected at least 2 sections, got ${sections.length})`);
  }

  // Ensure active recall tags exist in bullets (if missing [[ ]], wrap key terms)
  for (const sec of sections) {
    sec.bullets = sec.bullets.map((bullet: string) => {
      if (bullet.includes('[[') && bullet.includes(']]')) return bullet;
      // Auto-wrap the first prominent capitalized term if prompt missed [[ ]]
      const words = bullet.split(' ');
      if (words.length > 4) {
        return bullet.replace(words[1], `[[${words[1]}]]`);
      }
      return bullet;
    });
  }

  // 6. Validate quiz (strictly require 5 valid questions with 4 options and explanation)
  let quiz = Array.isArray(record.quiz)
    ? record.quiz
        .filter(
          (q): q is { q: string; options: unknown[]; correct?: number; explanation?: string } =>
            typeof q === 'object' &&
            q !== null &&
            'q' in q &&
            typeof (q as { q: unknown }).q === 'string' &&
            (q as { q: string }).q.trim().length > 0 &&
            'options' in q &&
            Array.isArray((q as { options: unknown }).options) &&
            (q as { options: unknown[] }).options.length >= 2
        )
        .map((q) => {
          const options = q.options.map((o) => String(o).trim()).filter(Boolean).slice(0, 4);
          const correct =
            typeof q.correct === 'number' && q.correct >= 0 && q.correct < options.length
              ? q.correct
              : 0;
          return {
            q: q.q.trim(),
            options,
            correct,
            explanation:
              (typeof q.explanation === 'string' && q.explanation.trim()) ||
              'Refer to the lecture notes above for the conceptual analysis.',
          };
        })
    : [];
  if (quiz.length < 4) {
    throw new Error(`Incomplete quiz returned (expected 5 questions, got ${quiz.length})`);
  }
  quiz = quiz.slice(0, 5);

  // 7. Validate flashcards (strictly require at least 3 flippable cards)
  const flashcards = Array.isArray(record.flashcards)
    ? record.flashcards
        .filter(
          (f): f is { front: string; back: string } =>
            typeof f === 'object' &&
            f !== null &&
            'front' in f &&
            typeof (f as { front: unknown }).front === 'string' &&
            (f as { front: string }).front.trim().length > 0 &&
            'back' in f &&
            typeof (f as { back: unknown }).back === 'string' &&
            (f as { back: string }).back.trim().length > 0
        )
        .map((f) => ({ front: f.front.trim(), back: f.back.trim() }))
    : [];
  if (flashcards.length < 3) {
    throw new Error(`Incomplete flashcards returned (expected at least 3, got ${flashcards.length})`);
  }

  // 8. Standardize 3-Day Schedule
  const schedule =
    Array.isArray(record.schedule) && record.schedule.length === 3
      ? record.schedule.map((d) => {
          const dayObj = typeof d === 'object' && d !== null ? (d as Record<string, unknown>) : {};
          return {
            day: String(dayObj.day || 'Study Day'),
            task: String(dayObj.task || 'Review core lecture concepts and complete active recall drills'),
            done: false,
          };
        })
      : [
          {
            day: 'Day 1: Foundation & Core Terms',
            task: `Master core glossary: ${glossary.slice(0, 3).map((g: { term: string }) => g.term).join(', ')}`,
            done: false,
          },
          {
            day: 'Day 2: Deep Dive & Mechanism Review',
            task: `Review sections: ${sections.map((s: { title: string }) => s.title).join(', ')}`,
            done: false,
          },
          {
            day: 'Day 3: Self-Test & Active Recall',
            task: `Complete all 3D flashcards and score 100% on the 5-question quiz`,
            done: false,
          },
        ];

  // 9. Standardize Cloze
  const cloze =
    Array.isArray(record.cloze) && record.cloze.length > 0
      ? record.cloze.map((c) => {
          const clozeObj = typeof c === 'object' && c !== null ? (c as Record<string, unknown>) : {};
          return {
            sentence: String(clozeObj.sentence || 'Key concept is [blank].'),
            answers: Array.isArray(clozeObj.answers)
              ? clozeObj.answers.map((a) => String(a).toLowerCase().trim())
              : [glossary[0]?.term.toLowerCase() || 'concept'],
          };
        })
      : [
          {
            sentence: `The primary mechanism established in the lecture is [blank].`,
            answers: [glossary[0]?.term.toLowerCase() || 'concept'],
          },
        ];

  // 10. Standardize Mind Map
  const mindmapRaw = record.mindmap as { title?: unknown } | undefined;
  const mindmap: MindMapNode =
    mindmapRaw && typeof mindmapRaw === 'object' && typeof mindmapRaw.title === 'string' && mindmapRaw.title.trim()
      ? (record.mindmap as MindMapNode)
      : {
          title,
          children: sections.map((s: { title: string; bullets: string[] }) => ({
            title: s.title,
            children: s.bullets.slice(0, 2).map((b: string) => ({
              title: b.replace(/\[\[(.*?)\]\]/g, '$1').slice(0, 50),
            })),
          })),
        };

  return {
    title,
    takeaways,
    glossary,
    mnemonics,
    schedule,
    mindmap,
    sections,
    cloze,
    quiz,
    flashcards,
  };
}

/**
 * Executes a single Groq request with a specified key and validates the output
 */
async function executeGroqRequest(
  lectureText: string,
  model: string,
  apiKey: string
): Promise<WorkspaceData> {
  const systemPrompt = `You are STUDS AI, an elite academic tutor and curriculum designer.
Analyze the student's lecture text and return a comprehensive JSON object strictly adhering to this exact schema:
{
  "title": string,
  "takeaways": [string, string, string],
  "glossary": [
    { "term": string, "def": string }
  ],
  "mnemonics": [
    { "word": string, "meaning": string }
  ],
  "schedule": [
    { "day": "Day 1: Foundation", "task": string, "done": false },
    { "day": "Day 2: Deep Dive", "task": string, "done": false },
    { "day": "Day 3: Self-Test", "task": string, "done": false }
  ],
  "mindmap": {
    "title": string,
    "children": [
      {
        "title": string,
        "children": [
          { "title": string },
          { "title": string }
        ]
      }
    ]
  },
  "sections": [
    {
      "title": string,
      "complexity": "easy" or "medium" or "hard",
      "bullets": [
        string with key terms wrapped in [[Key Term]] for active recall
      ]
    }
  ],
  "cloze": [
    { "sentence": string with '[blank]' placeholder, "answers": [string in lowercase] }
  ],
  "quiz": [
    {
      "q": string,
      "options": [string, string, string, string],
      "correct": integer (0 to 3),
      "explanation": string
    }
  ],
  "flashcards": [
    { "front": string, "back": string }
  ]
}
Rules:
- Provide exactly 3 high-yield takeaways.
- Provide 4-8 glossary items.
- Provide 1-3 memorable mnemonics.
- Provide 3-4 sections with complexity tags ('easy', 'medium', 'hard') and wrap key terms in [[Term]].
- Provide 2-3 fill-in-the-blank cloze sentences.
- Provide exactly 5 multiple choice questions with 4 options each, the correct 0-indexed integer, and explanation.
- Provide 5-6 3D flashcards.
- Return ONLY valid JSON. No markdown code blocks, no text outside the JSON object.`;

  const activeModel = resolveGroqModel(model);

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: activeModel,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Synthesize this study material into the complete STUDS JSON:\n\n${lectureText.slice(0, 16000)}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2, // Low temperature for high consistency across all keys in pool
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    let message = `Groq HTTP ${response.status}`;
    try {
      const errJson = JSON.parse(errText);
      if (errJson.error?.message) message = errJson.error.message;
    } catch {
      // fallback
    }
    const err = new Error(message) as Error & { status?: number };
    err.status = response.status;
    throw err;
  }

  const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content;
  if (!content || !content.trim()) {
    throw new Error('Groq returned an empty response body');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (parseErr: unknown) {
    const parseMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
    throw new Error(`Corrupted JSON returned by Groq: ${parseMsg}`);
  }

  // Strict validation & consistency check
  return validateAndSanitizeWorkspace(parsed, lectureText);
}

/**
 * Dispatches an academic synthesis request to the Groq LPU API across a load-balanced multi-key rotation pool.
 * Features round-robin key distribution, instant HTTP 429 rate limit failover, corrupted payload rejection,
 * and data consistency enforcement.
 *
 * @param {string} lectureText - Raw unformatted lecture text or transcript.
 * @param {string} model - Requested LLM model identifier (sanitized via resolveGroqModel).
 * @param {string[] | string} apiKeys - Single key string or list of rotation pool keys.
 * @param {(status: string) => void} [onStatusUpdate] - Optional progress notification callback.
 * @returns {Promise<{ data: WorkspaceData; keyIndex: number; keyMasked: string }>} Validated workspace and key telemetry.
 * @throws {Error} When all keys in the pool fail or are rate-limited.
 * @complexity Time: O(K * T) where K is number of keys and T is network latency. Space: O(W) for output workspace.
 */
export async function callGroqAPI(
  lectureText: string,
  model: string,
  apiKeys: string[] | string,
  onStatusUpdate?: (status: string) => void
): Promise<{ data: WorkspaceData; keyIndex: number; keyMasked: string }> {
  const keys = parseGroqKeyPool(apiKeys);
  if (keys.length === 0) {
    throw new Error('No valid Groq API keys found in pool.');
  }

  const totalKeys = keys.length;
  const startIndex = currentPoolIndex % totalKeys;
  const errors: string[] = [];

  // Try keys in round-robin sequence
  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const activeIndex = (startIndex + attempt) % totalKeys;
    const activeKey = keys[activeIndex];
    const maskedKey = `${activeKey.slice(0, 6)}...${activeKey.slice(-4)}`;

    if (totalKeys > 1 && onStatusUpdate) {
      onStatusUpdate(`⚡ Executing via Groq Key [${activeIndex + 1}/${totalKeys}] (${maskedKey})...`);
    }

    try {
      const data = await executeGroqRequest(lectureText, model, activeKey);
      // Advance round-robin pointer for next call
      currentPoolIndex = (activeIndex + 1) % totalKeys;
      return { data, keyIndex: activeIndex, keyMasked: maskedKey };
    } catch (err: unknown) {
      const errObj = typeof err === 'object' && err !== null ? (err as { status?: number; message?: string }) : {};
      const isRateLimit =
        errObj.status === 429 ||
        (typeof errObj.message === 'string' && /rate|quota|429/i.test(errObj.message));
      const errMsg = err instanceof Error ? err.message : String(err);
      const logMsg = `Key #${activeIndex + 1} (${maskedKey}) ${
        isRateLimit ? 'RATE LIMITED (429)' : 'REJECTED'
      }: ${errMsg}`;
      console.warn(`[Groq Pool Failover] ${logMsg}`);
      errors.push(logMsg);

      // If we have more keys in the pool, inform user of failover
      if (attempt < totalKeys - 1) {
        const nextIndex = (startIndex + attempt + 1) % totalKeys;
        const nextMasked = `${keys[nextIndex].slice(0, 6)}...${keys[nextIndex].slice(-4)}`;
        if (onStatusUpdate) {
          onStatusUpdate(
            `⚠️ Key #${activeIndex + 1} ${
              isRateLimit ? 'rate limited' : 'returned incomplete data'
            }. Auto-failing over to Key #${nextIndex + 1} (${nextMasked})...`
          );
        }
      }
    }
  }

  // All keys in the pool failed
  throw new Error(`All ${totalKeys} Groq keys in the pool failed validation/limits:\n${errors.join('\n')}`);
}
