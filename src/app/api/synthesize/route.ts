import { NextResponse } from 'next/server';
import {
  callGroqAPI,
  resolveGroqModel,
  DEFAULT_GROQ_KEYS,
  DEFAULT_GROQ_MODEL,
} from '@/lib/groq';
import { SynthesizeRequestBody, SynthesizeResponseBody } from '@/lib/types';

/**
 * POST /api/synthesize
 * @description Ingests raw lecture text, validates input parameters, orchestrates multi-key Groq LPU rotation,
 * applies strict data consistency validation, and returns structured study artifacts.
 *
 * @param {Request} req - Inbound HTTP request containing SynthesizeRequestBody JSON payload.
 * @returns {Promise<NextResponse<SynthesizeResponseBody>>} 200 OK with synthesized workspace, 400 on validation failure, or 500 on execution error.
 * @complexity Time: O(N) where N is text length. Space: O(M) where M is generated artifact tree size.
 */
export async function POST(req: Request): Promise<NextResponse<SynthesizeResponseBody>> {
  const startTs = Date.now();

  try {
    let body: SynthesizeRequestBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }

    const { lectureText, model, apiKeys } = body;

    // 1. Input Validation
    if (!lectureText || typeof lectureText !== 'string' || lectureText.trim().length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parameter "lectureText" is required and must contain at least 10 characters.',
        },
        { status: 400 }
      );
    }

    // 2. Resolve Active Model (rejects deprecated models)
    const activeModel = resolveGroqModel(model || DEFAULT_GROQ_MODEL);

    // 3. Resolve Keys Pool
    const activeKeys = apiKeys && (Array.isArray(apiKeys) ? apiKeys.length > 0 : Boolean(apiKeys.trim()))
      ? apiKeys
      : DEFAULT_GROQ_KEYS;

    // 4. Execute Multi-Key Groq LPU Call with Automatic Failover
    const result = await callGroqAPI(lectureText, activeModel, activeKeys);

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        meta: {
          modelUsed: activeModel,
          keyIndex: result.keyIndex,
          keyMasked: result.keyMasked,
          processingTimeMs: Date.now() - startTs,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Internal synthesis failure occurred.';
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
