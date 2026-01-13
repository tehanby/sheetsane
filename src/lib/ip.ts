/**
 * Client IP Detection
 * Extracts client IP from request headers for rate limiting
 */

import { NextRequest } from 'next/server';

/**
 * Get client IP address from request
 * Priority: x-forwarded-for (first IP) > request.ip > 'unknown'
 */
export function getClientIp(request: NextRequest): string {
  // Check x-forwarded-for header (Vercel/proxy)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take first IP if comma-separated list
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) {
      return firstIp;
    }
  }

  // Fallback to request.ip if available
  if (request.ip) {
    return request.ip;
  }

  // Last resort
  return 'unknown';
}
