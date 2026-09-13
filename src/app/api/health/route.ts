import { NextResponse } from 'next/server';
import { HealthResponseBody } from '@/lib/types';

const startTime = Date.now();

/**
 * GET /api/health
 * @description Operational health check and diagnostic endpoint for automated evaluation pipelines.
 * @returns {NextResponse<HealthResponseBody>} System status and uptime telemetry.
 */
export async function GET(): Promise<NextResponse<HealthResponseBody>> {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  return NextResponse.json(
    {
      status: 'healthy',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      environment: process.env.NODE_ENV || 'production',
    },
    { status: 200 }
  );
}
