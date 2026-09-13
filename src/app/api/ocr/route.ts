import { NextResponse } from 'next/server';
import {
  transcribeHandwrittenImage,
  DEFAULT_OPENROUTER_KEY,
  DEFAULT_OPENROUTER_VISION_MODEL,
} from '@/lib/openrouter';
import { OCRRequestBody, OCRResponseBody } from '@/lib/types';

/**
 * POST /api/ocr
 * @description Transcribes handwritten lecture notes and whiteboard photos using 100% free multimodal vision models
 * with an automated 3-tier fallback cascade.
 *
 * @param {Request} req - Inbound HTTP request containing OCRRequestBody JSON payload.
 * @returns {Promise<NextResponse<OCRResponseBody>>} 200 OK with formatted Markdown transcription, 400 on invalid payload, or 500 on upstream error.
 * @complexity Time: O(1) network bound. Space: O(K) where K is image byte payload size.
 */
export async function POST(req: Request): Promise<NextResponse<OCRResponseBody>> {
  try {
    let body: OCRRequestBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }

    const { imageBase64, apiKey, primaryModel } = body;

    // 1. Input Validation
    if (!imageBase64 || typeof imageBase64 !== 'string' || imageBase64.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parameter "imageBase64" is required.',
        },
        { status: 400 }
      );
    }

    const resolvedKey = apiKey && apiKey.trim() ? apiKey.trim() : DEFAULT_OPENROUTER_KEY;
    const resolvedModel = primaryModel && primaryModel.trim() ? primaryModel.trim() : DEFAULT_OPENROUTER_VISION_MODEL;

    // 2. Execute 100% Free Multimodal Vision OCR Cascade
    const result = await transcribeHandwrittenImage(resolvedKey, imageBase64, resolvedModel);

    return NextResponse.json(
      {
        success: true,
        text: result.text,
        modelUsed: result.usedModel,
      },
      { status: 200 }
    );
  } catch (error: any) {
    const errorMsg = error?.message || 'Multimodal OCR transcription failure.';
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
