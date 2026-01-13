/**
 * Session Management using signed JWT tokens
 * Handles session creation, verification, and cookie management
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { SessionPayload } from './types';

const SESSION_COOKIE_NAME = 'sheetsane_session';
const SESSION_EXPIRY_MINUTES = 30;

/**
 * Get the secret key for signing tokens
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Create a new session token
 */
export async function createSession(payload: Omit<SessionPayload, 'createdAt' | 'expiresAt'>): Promise<string> {
  const now = Date.now();
  const expiresAt = now + SESSION_EXPIRY_MINUTES * 60 * 1000;

  const fullPayload: SessionPayload = {
    ...payload,
    createdAt: now,
    expiresAt,
  };

  const token = await new SignJWT(fullPayload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(Math.floor(expiresAt / 1000))
    .sign(getSecretKey());

  return token;
}

/**
 * Verify and decode a session token
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const sessionPayload = payload as unknown as SessionPayload;

    // Check if expired
    if (sessionPayload.expiresAt < Date.now()) {
      return null;
    }

    return sessionPayload;
  } catch {
    return null;
  }
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY_MINUTES * 60,
    path: '/',
  });
}

/**
 * Get session from cookie
 */
export async function getSessionFromCookie(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySession(token);
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Update session with payment confirmation
 */
export async function markSessionAsPaid(currentSession: SessionPayload): Promise<string> {
  const newToken = await createSession({
    fileId: currentSession.fileId,
    fileName: currentSession.fileName,
    paid: true,
    selectedKeyColumn: currentSession.selectedKeyColumn,
  });

  await setSessionCookie(newToken);
  return newToken;
}
