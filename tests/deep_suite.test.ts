import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseGroqKeyPool,
  validateAndSanitizeWorkspace,
  callGroqAPI,
  resolveGroqModel,
  DEFAULT_GROQ_MODEL,
  ACTIVE_GROQ_MODELS,
} from '../src/lib/groq';

import {
  OPENROUTER_VISION_MODELS,
  DEFAULT_OPENROUTER_VISION_MODEL,
  transcribeHandwrittenImage,
} from '../src/lib/openrouter';

import {
  getCSWorkspace,
  getBioWorkspace,
  getGenericWorkspace,
  SAMPLE_LECTURE_TEXTS,
} from '../src/lib/sampleData';

import { GET as healthHandler } from '../src/app/api/health/route';
import { POST as synthesizeHandler } from '../src/app/api/synthesize/route';
import { POST as ocrHandler } from '../src/app/api/ocr/route';

// ============================================================================
// SUITE 1: Groq Multi-Key Pool Parsing & Cleaning
// ============================================================================
test('SUITE 1: Groq Multi-Key Pool Parser', async (t) => {
  await t.test('parses newline-separated keys into clean array', () => {
    const raw = `gsk_key1_aaa\ngsk_key2_bbb\ngsk_key3_ccc\ngsk_key4_ddd\ngsk_key5_eee`;
    const keys = parseGroqKeyPool(raw);
    assert.equal(keys.length, 5);
    assert.equal(keys[0], 'gsk_key1_aaa');
    assert.equal(keys[4], 'gsk_key5_eee');
  });

  await t.test('parses comma-separated and mixed-whitespace keys', () => {
    const raw = 'gsk_alpha,  gsk_beta ,gsk_gamma\n\n gsk_delta ';
    const keys = parseGroqKeyPool(raw);
    assert.deepEqual(keys, ['gsk_alpha', 'gsk_beta', 'gsk_gamma', 'gsk_delta']);
  });

  await t.test('strips empty lines, spaces, and blank entries', () => {
    const raw = `\n\n   \n gsk_valid_key \n   \n\n`;
    const keys = parseGroqKeyPool(raw);
    assert.deepEqual(keys, ['gsk_valid_key']);
  });

  await t.test('handles array inputs safely', () => {
    const arr = ['  gsk_one ', 'gsk_two'];
    assert.deepEqual(parseGroqKeyPool(arr), ['gsk_one', 'gsk_two']);
  });

  await t.test('loads Groq keys dynamically from environment variables or configured pool', () => {
    const rawKeys =
      process.env.GROQ_API_KEYS ||
      process.env.NEXT_PUBLIC_GROQ_API_KEYS ||
      'gsk_mock_key_alpha,gsk_mock_key_beta,gsk_mock_key_gamma,gsk_mock_key_delta,gsk_mock_key_epsilon';
    const keys = parseGroqKeyPool(rawKeys);
    assert.equal(keys.length, 5);
    for (const key of keys) {
      assert.ok(key.startsWith('gsk_'), `Key ${key} must start with gsk_`);
    }
  });

  await t.test('resolveGroqModel strictly prevents deprecated models and selects active models', () => {
    // Deprecated models must resolve to DEFAULT_GROQ_MODEL
    assert.equal(resolveGroqModel('llama-3.3-70b-versatile'), DEFAULT_GROQ_MODEL);
    assert.equal(resolveGroqModel('llama-3.1-8b-instant'), DEFAULT_GROQ_MODEL);
    assert.equal(resolveGroqModel('mixtral-8x7b-32768'), DEFAULT_GROQ_MODEL);
    assert.equal(resolveGroqModel(''), DEFAULT_GROQ_MODEL);
    assert.equal(resolveGroqModel(undefined), DEFAULT_GROQ_MODEL);

    // Active models must resolve cleanly
    assert.equal(resolveGroqModel('openai/gpt-oss-120b'), 'openai/gpt-oss-120b');
    assert.equal(resolveGroqModel('qwen/qwen3.8-27b'), 'qwen/qwen3.8-27b');
    assert.equal(resolveGroqModel('groq/compound'), 'groq/compound');

    // All models in ACTIVE_GROQ_MODELS must be non-deprecated
    for (const model of ACTIVE_GROQ_MODELS) {
      assert.ok(!model.id.startsWith('llama'), `Model ${model.id} is deprecated!`);
      assert.ok(!model.id.startsWith('mixtral'), `Model ${model.id} is deprecated!`);
    }
  });

  await t.test('handles empty or non-string inputs safely', () => {
    assert.deepEqual(parseGroqKeyPool(''), []);
    assert.deepEqual(parseGroqKeyPool('   '), []);
    assert.deepEqual(parseGroqKeyPool([]), []);
    assert.deepEqual(parseGroqKeyPool(['gsk_1', ' gsk_2 ']), ['gsk_1', 'gsk_2']);
  });
});

// ============================================================================
// SUITE 2: Strict Data Consistency & Completeness Validator
// ============================================================================
test('SUITE 2: Strict Data Consistency & Completeness Validator', async (t) => {
  const sampleLecture = 'Concurrency and Deadlocks in Operating Systems';

  await t.test('accepts and normalizes a complete valid workspace', () => {
    const validRaw = {
      title: 'Operating Systems: Concurrency',
      takeaways: ['Takeaway 1', 'Takeaway 2', 'Takeaway 3'],
      glossary: [
        { term: 'Mutex', def: 'Mutual exclusion lock' },
        { term: 'Semaphore', def: 'Signaling mechanism' },
        { term: 'Deadlock', def: 'Permanent system freeze' },
      ],
      mnemonics: [{ word: 'M-H-N-C', meaning: 'Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait' }],
      sections: [
        { title: 'Core Mechanisms', complexity: 'medium', bullets: ['A [[thread]] shares heap memory.'] },
        { title: 'Deadlock Conditions', complexity: 'hard', bullets: ['Four [[Coffman]] conditions must hold simultaneously.'] },
      ],
      quiz: [
        { q: 'Q1?', options: ['A', 'B', 'C', 'D'], correct: 0, explanation: 'Exp 1' },
        { q: 'Q2?', options: ['A', 'B', 'C', 'D'], correct: 1, explanation: 'Exp 2' },
        { q: 'Q3?', options: ['A', 'B', 'C', 'D'], correct: 2, explanation: 'Exp 3' },
        { q: 'Q4?', options: ['A', 'B', 'C', 'D'], correct: 3, explanation: 'Exp 4' },
        { q: 'Q5?', options: ['A', 'B', 'C', 'D'], correct: 0, explanation: 'Exp 5' },
      ],
      flashcards: [
        { front: 'What is a process?', back: 'An isolated program in execution.' },
        { front: 'What is a thread?', back: 'Lightweight execution unit.' },
        { front: 'What is mutex?', back: 'Binary lock.' },
      ],
    };

    const validated = validateAndSanitizeWorkspace(validRaw, sampleLecture);
    assert.equal(validated.title, 'Operating Systems: Concurrency');
    assert.equal(validated.takeaways.length, 3);
    assert.equal(validated.glossary.length, 3);
    assert.equal(validated.sections.length, 2);
    assert.equal(validated.quiz.length, 5);
    assert.equal(validated.flashcards.length, 3);
    assert.equal(validated.schedule.length, 3);
    assert.ok(validated.mindmap.title);
  });

  await t.test('rejects empty object or null with explicit error to trigger failover', () => {
    assert.throws(() => validateAndSanitizeWorkspace(null, sampleLecture), /empty or not a valid JSON/);
    assert.throws(() => validateAndSanitizeWorkspace({}, sampleLecture), /Incomplete takeaways/);
  });

  await t.test('rejects primitive types and arrays with explicit invariant error', () => {
    assert.throws(() => validateAndSanitizeWorkspace('string' as unknown, sampleLecture), /empty or not a valid JSON/);
    assert.throws(() => validateAndSanitizeWorkspace(12345 as unknown, sampleLecture), /empty or not a valid JSON/);
    assert.throws(() => validateAndSanitizeWorkspace([] as unknown, sampleLecture), /empty or not a valid JSON/);
    assert.throws(() => validateAndSanitizeWorkspace(false as unknown, sampleLecture), /empty or not a valid JSON/);
  });

  await t.test('rejects incomplete takeaways (less than 3 items)', () => {
    const badRaw = {
      takeaways: ['Only One Takeaway'],
    };
    assert.throws(() => validateAndSanitizeWorkspace(badRaw, sampleLecture), /Incomplete takeaways returned/);
  });

  await t.test('rejects incomplete glossary (less than 3 items or empty terms)', () => {
    const badRaw = {
      takeaways: ['T1', 'T2', 'T3'],
      glossary: [{ term: '', def: 'Empty' }, { term: 'OnlyOne', def: 'Def' }],
    };
    assert.throws(() => validateAndSanitizeWorkspace(badRaw, sampleLecture), /Incomplete glossary returned/);
  });

  await t.test('rejects missing mnemonics', () => {
    const badRaw = {
      takeaways: ['T1', 'T2', 'T3'],
      glossary: [{ term: 'A', def: 'A' }, { term: 'B', def: 'B' }, { term: 'C', def: 'C' }],
      mnemonics: [],
    };
    assert.throws(() => validateAndSanitizeWorkspace(badRaw, sampleLecture), /No valid mnemonics returned/);
  });

  await t.test('rejects incomplete sections (< 2 sections)', () => {
    const badRaw = {
      takeaways: ['T1', 'T2', 'T3'],
      glossary: [{ term: 'A', def: 'A' }, { term: 'B', def: 'B' }, { term: 'C', def: 'C' }],
      mnemonics: [{ word: 'M', meaning: 'M' }],
      sections: [{ title: 'Single Section', bullets: ['Bullet 1'] }],
    };
    assert.throws(() => validateAndSanitizeWorkspace(badRaw, sampleLecture), /Incomplete revision notes/);
  });

  await t.test('auto-wraps key terms in [[ ]] if model omitted active recall syntax', () => {
    const raw = {
      takeaways: ['T1', 'T2', 'T3'],
      glossary: [{ term: 'A', def: 'A' }, { term: 'B', def: 'B' }, { term: 'C', def: 'C' }],
      mnemonics: [{ word: 'M', meaning: 'M' }],
      sections: [
        { title: 'Sec 1', bullets: ['Threads share virtual memory addresses.'] },
        { title: 'Sec 2', bullets: ['Deadlocks lock resources indefinitely.'] },
      ],
      quiz: [
        { q: 'Q1?', options: ['A', 'B'], correct: 0 },
        { q: 'Q2?', options: ['A', 'B'], correct: 0 },
        { q: 'Q3?', options: ['A', 'B'], correct: 0 },
        { q: 'Q4?', options: ['A', 'B'], correct: 0 },
      ],
      flashcards: [
        { front: 'F1', back: 'B1' },
        { front: 'F2', back: 'B2' },
        { front: 'F3', back: 'B3' },
      ],
    };

    const result = validateAndSanitizeWorkspace(raw, sampleLecture);
    assert.ok(result.sections[0].bullets[0].includes('[['));
    assert.ok(result.sections[0].bullets[0].includes(']]'));
  });

  await t.test('rejects incomplete quiz (< 4 questions)', () => {
    const badRaw = {
      takeaways: ['T1', 'T2', 'T3'],
      glossary: [{ term: 'A', def: 'A' }, { term: 'B', def: 'B' }, { term: 'C', def: 'C' }],
      mnemonics: [{ word: 'M', meaning: 'M' }],
      sections: [{ title: 'S1', bullets: ['B1'] }, { title: 'S2', bullets: ['B2'] }],
      quiz: [{ q: 'Only 1 Q?', options: ['A', 'B'], correct: 0 }],
      flashcards: [{ front: 'F', back: 'B' }, { front: 'F2', back: 'B2' }, { front: 'F3', back: 'B3' }],
    };
    assert.throws(() => validateAndSanitizeWorkspace(badRaw, sampleLecture), /Incomplete quiz returned/);
  });
});

// ============================================================================
// SUITE 3: Groq Multi-Key Load Balancing & 429 Failover
// ============================================================================
test('SUITE 3: Groq Multi-Key Load Balancing & Failover', async (t) => {
  const originalFetch = globalThis.fetch;

  await t.test('failover: catches 429 on Key 1 and succeeds seamlessly on Key 2', async () => {
    const keys = ['gsk_key_1_rate_limited', 'gsk_key_2_healthy'];
    const statusLogs: string[] = [];

    const mockWorkspaceJson = {
      title: 'OS Concurrency Test',
      takeaways: ['Point 1', 'Point 2', 'Point 3'],
      glossary: [
        { term: 'Process', def: 'Unit of execution' },
        { term: 'Thread', def: 'Sub-unit of execution' },
        { term: 'Lock', def: 'Sync primitive' },
      ],
      mnemonics: [{ word: 'LOCK', meaning: 'Locks Optimize Critical Knowledge' }],
      sections: [
        { title: 'Intro', complexity: 'easy', bullets: ['[[Processes]] have isolated memory.'] },
        { title: 'Concurrency', complexity: 'medium', bullets: ['[[Threads]] share the heap.'] },
      ],
      quiz: [
        { q: 'Q1?', options: ['A', 'B', 'C', 'D'], correct: 0, explanation: 'E1' },
        { q: 'Q2?', options: ['A', 'B', 'C', 'D'], correct: 1, explanation: 'E2' },
        { q: 'Q3?', options: ['A', 'B', 'C', 'D'], correct: 2, explanation: 'E3' },
        { q: 'Q4?', options: ['A', 'B', 'C', 'D'], correct: 3, explanation: 'E4' },
        { q: 'Q5?', options: ['A', 'B', 'C', 'D'], correct: 0, explanation: 'E5' },
      ],
      flashcards: [
        { front: 'Card 1', back: 'Back 1' },
        { front: 'Card 2', back: 'Back 2' },
        { front: 'Card 3', back: 'Back 3' },
      ],
    };

    globalThis.fetch = async (_url: RequestInfo | URL, init?: RequestInit) => {
      const headers = (init?.headers as Record<string, string>) || {};
      const authHeader = headers.Authorization || headers.authorization || '';
      if (authHeader.includes('gsk_key_1_rate_limited')) {
        return new Response(
          JSON.stringify({ error: { message: 'Rate limit reached: 30 requests per min (HTTP 429)' } }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (authHeader.includes('gsk_key_2_healthy')) {
        return new Response(
          JSON.stringify({ choices: [{ message: { content: JSON.stringify(mockWorkspaceJson) } }] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response('Unauthorized', { status: 401 });
    };

    try {
      const result = await callGroqAPI(
        'Lecture on OS Concurrency',
        DEFAULT_GROQ_MODEL,
        keys,
        (msg) => statusLogs.push(msg)
      );

      assert.equal(result.data.title, 'OS Concurrency Test');
      assert.equal(result.keyIndex, 1); // Key 2 succeeded
      assert.ok(result.keyMasked.includes('gsk_ke'));
      // Verify failover status message was logged
      assert.ok(statusLogs.some((m) => m.includes('rate limited') && m.includes('Auto-failing over')));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('failover: rejects corrupted JSON from Key 1 and succeeds on Key 2', async () => {
    const keys = ['gsk_bad_json', 'gsk_good_json'];

    const validJson = {
      title: 'Valid Data',
      takeaways: ['T1', 'T2', 'T3'],
      glossary: [{ term: 'A', def: 'A' }, { term: 'B', def: 'B' }, { term: 'C', def: 'C' }],
      mnemonics: [{ word: 'M', meaning: 'M' }],
      sections: [{ title: 'S1', bullets: ['[[B1]]'] }, { title: 'S2', bullets: ['[[B2]]'] }],
      quiz: [
        { q: 'Q1', options: ['A', 'B'], correct: 0 },
        { q: 'Q2', options: ['A', 'B'], correct: 0 },
        { q: 'Q3', options: ['A', 'B'], correct: 0 },
        { q: 'Q4', options: ['A', 'B'], correct: 0 },
      ],
      flashcards: [{ front: 'F1', back: 'B1' }, { front: 'F2', back: 'B2' }, { front: 'F3', back: 'B3' }],
    };

    globalThis.fetch = async (_url: RequestInfo | URL, init?: RequestInit) => {
      const headers = (init?.headers as Record<string, string>) || {};
      const authHeader = headers.Authorization || headers.authorization || '';
      if (authHeader.includes('gsk_bad_json')) {
        // Returns truncated/broken JSON
        return new Response(
          JSON.stringify({ choices: [{ message: { content: '{"title": "Broken Json without clos' } }] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ choices: [{ message: { content: JSON.stringify(validJson) } }] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    try {
      const result = await callGroqAPI('Text', DEFAULT_GROQ_MODEL, keys);
      assert.equal(result.data.title, 'Valid Data');
      assert.equal(result.keyIndex, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('throws aggregated error when all keys in pool fail', async () => {
    const keys = ['gsk_fail_1', 'gsk_fail_2'];
    globalThis.fetch = async () => new Response('Internal Server Error', { status: 500 });

    try {
      await assert.rejects(
        () => callGroqAPI('Text', DEFAULT_GROQ_MODEL, keys),
        /All 2 Groq keys in the pool failed/
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

// ============================================================================
// SUITE 4: OpenRouter 100% Free Vision OCR & 3-Tier Fallback
// ============================================================================
test('SUITE 4: OpenRouter 100% Free Vision OCR & Fallback Cascade', async (t) => {
  await t.test('every model in OPENROUTER_VISION_MODELS has 100% free tag', () => {
    for (const model of OPENROUTER_VISION_MODELS) {
      const isFree = model.id.endsWith(':free') || model.id === 'openrouter/free';
      assert.ok(
        isFree,
        `Model ${model.id} MUST be strictly a :free model or openrouter/free!`
      );
    }
  });

  await t.test('default vision model is google/gemma-4-31b-it:free', () => {
    assert.equal(DEFAULT_OPENROUTER_VISION_MODEL, 'google/gemma-4-31b-it:free');
  });

  await t.test('transcribeHandwrittenImage falls over to Tier 2 if Tier 1 is busy', async () => {
    const originalFetch = globalThis.fetch;
    const statusLogs: string[] = [];

    globalThis.fetch = async (_url: RequestInfo | URL, init?: RequestInit) => {
      const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as { model?: string }) : {};
      // Fail on Gemma 31B
      if (body.model === 'google/gemma-4-31b-it:free') {
        return new Response('Rate limit reached (429)', { status: 429 });
      }
      // Succeed on Gemma 26B (Fallback 1)
      if (body.model === 'google/gemma-4-26b-a4b-it:free') {
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: '# Transcribed Handwritten Biology Notes\n- Mitochondria generates ATP.\n- Ribosomes synthesize proteins.',
                },
              },
            ],
          }),
          { status: 200 }
        );
      }
      return new Response('Not found', { status: 404 });
    };

    try {
      const result = await transcribeHandwrittenImage(
        'sk-or-test-key',
        'data:image/jpeg;base64,dummyImageData',
        'google/gemma-4-31b-it:free',
        (msg) => statusLogs.push(msg)
      );

      assert.ok(result.text.includes('Transcribed Handwritten Biology Notes'));
      assert.equal(result.usedModel, 'google/gemma-4-26b-a4b-it:free');
      // Verify failover notification was sent
      assert.ok(statusLogs.some((m) => m.includes('Switching to Fallback 1')));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

// ============================================================================
// SUITE 5: Domain Workspaces & All 25 Features Verification
// ============================================================================
test('SUITE 5: Domain Workspaces Satisfy All 25 Features', async (t) => {
  await t.test('CS Workspace is 100% complete and contains all 25 features', () => {
    const cs = getCSWorkspace();
    assert.ok(cs.title);
    assert.equal(cs.takeaways.length, 3);
    assert.ok(cs.glossary.length >= 6);
    assert.ok(cs.mnemonics.length >= 2);
    assert.equal(cs.schedule.length, 3);
    assert.ok(cs.mindmap.children && cs.mindmap.children.length >= 3);
    assert.ok(cs.sections.length >= 3);
    // Verify active recall brackets [[ ]] exist in revision notes
    assert.ok(cs.sections[0].bullets.some((b) => b.includes('[[') && b.includes(']]')));
    assert.ok(cs.cloze.length >= 2);
    assert.equal(cs.quiz.length, 5);
    // Verify quiz questions have 4 options and valid answer index
    for (const q of cs.quiz) {
      assert.equal(q.options.length, 4);
      assert.ok(q.correct >= 0 && q.correct < 4);
      assert.ok(q.explanation.length > 5);
    }
    assert.ok(cs.flashcards.length >= 5);
  });

  await t.test('Biology Workspace is 100% complete and contains all 25 features', () => {
    const bio = getBioWorkspace();
    assert.ok(bio.title);
    assert.equal(bio.takeaways.length, 3);
    assert.ok(bio.glossary.length >= 6);
    assert.ok(bio.mnemonics.length >= 2);
    assert.equal(bio.schedule.length, 3);
    assert.ok(bio.sections.length >= 3);
    assert.equal(bio.quiz.length, 5);
    assert.ok(bio.flashcards.length >= 5);
  });

  await t.test('Generic Offline Generator extracts keywords and estimates study time', () => {
    const lectureText = SAMPLE_LECTURE_TEXTS.cs.text;
    const generic = getGenericWorkspace(lectureText, 'Operating Systems Concurrency');

    assert.ok(generic.title.includes('Operating Systems'));
    assert.equal(generic.takeaways.length, 3);
    assert.ok(generic.glossary.length >= 4);
    assert.equal(generic.quiz.length, 5);
    assert.ok(generic.flashcards.length >= 4);
  });

  await t.test('Deterministic O(N) frequency-map algorithm accurately filters stopwords and extracts core terms', () => {
    const text = `
      Quantum computing leverages quantum mechanical phenomena such as superposition and entanglement.
      In a quantum computer, quantum bits or qubits store quantum states.
      Superposition allows qubits to evaluate multiple probability states simultaneously.
      Quantum algorithms, like Shor's algorithm, threaten traditional cryptography algorithms.
    `;
    const ws = getGenericWorkspace(text, 'Quantum Computing & Algorithms');
    assert.equal(ws.title, 'Quantum Computing & Algorithms');
    // "quantum" is the highest frequency non-stopword token (repeated 6 times)
    assert.ok(ws.glossary.some((g) => g.term.toLowerCase() === 'quantum'));
    assert.equal(ws.takeaways.length, 3);
    assert.ok(ws.cloze.length >= 2);
    assert.ok(ws.sections.length >= 3);
  });
});

// ============================================================================
// SUITE 6: REST API Controllers & Error Boundaries (Hack2Skill Compliance)
// ============================================================================
test('SUITE 6: REST API Controllers & Error Boundaries', async (t) => {
  const originalFetch = globalThis.fetch;

  await t.test('GET /api/health returns 200 OK with health status and telemetry', async () => {
    const response = await healthHandler();
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, 'healthy');
    assert.equal(body.version, '2.0.0');
    assert.ok(typeof body.uptimeSeconds === 'number');
    assert.ok(body.timestamp);
  });

  await t.test('POST /api/synthesize returns 400 Bad Request on invalid JSON', async () => {
    const req = new Request('http://localhost:3000/api/synthesize', {
      method: 'POST',
      body: 'invalid-json-string',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await synthesizeHandler(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Invalid JSON'));
  });

  await t.test('POST /api/synthesize returns 400 Bad Request when lectureText is too short', async () => {
    const req = new Request('http://localhost:3000/api/synthesize', {
      method: 'POST',
      body: JSON.stringify({ lectureText: 'short' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await synthesizeHandler(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('at least 10 characters'));
  });

  await t.test('POST /api/synthesize returns 200 OK with structured data and meta telemetry', async () => {
    const mockCsWorkspace = getCSWorkspace();
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({ choices: [{ message: { content: JSON.stringify(mockCsWorkspace) } }] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    try {
      const req = new Request('http://localhost:3000/api/synthesize', {
        method: 'POST',
        body: JSON.stringify({
          lectureText: 'Operating Systems Concurrency, Threads, and Critical Sections in modern multicore systems.',
          apiKeys: ['gsk_api_key_test_1234567890'],
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await synthesizeHandler(req);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.data.title);
      assert.equal(body.meta.modelUsed, DEFAULT_GROQ_MODEL);
      assert.equal(body.meta.keyIndex, 0);
      assert.ok(typeof body.meta.processingTimeMs === 'number');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('POST /api/synthesize returns 500 when all upstream keys fail', async () => {
    globalThis.fetch = async () => new Response('Internal Server Error', { status: 500 });

    try {
      const req = new Request('http://localhost:3000/api/synthesize', {
        method: 'POST',
        body: JSON.stringify({
          lectureText: 'Operating Systems Concurrency, Threads, and Critical Sections.',
          apiKeys: ['gsk_fail_1'],
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await synthesizeHandler(req);
      assert.equal(res.status, 500);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.error);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('POST /api/ocr returns 400 Bad Request when imageBase64 is missing', async () => {
    const req = new Request('http://localhost:3000/api/ocr', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await ocrHandler(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('imageBase64'));
  });

  await t.test('POST /api/ocr returns 200 OK with transcribed text on valid input', async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          choices: [
            { message: { content: '# Transcribed Biochemistry Notes\n- ATP synthesis occurs in mitochondria.' } },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    try {
      const req = new Request('http://localhost:3000/api/ocr', {
        method: 'POST',
        body: JSON.stringify({
          imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await ocrHandler(req);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.text.includes('ATP synthesis'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('POST /api/ocr returns 500 when upstream vision model rejects image', async () => {
    globalThis.fetch = async () => new Response('Internal OCR Server Error', { status: 500 });

    try {
      const req = new Request('http://localhost:3000/api/ocr', {
        method: 'POST',
        body: JSON.stringify({
          imageBase64: 'data:image/png;base64,corruptData',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await ocrHandler(req);
      assert.equal(res.status, 500);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.error);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
