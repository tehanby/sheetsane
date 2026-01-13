/**
 * Payment Confirmations Storage
 * In-memory storage for Stripe payment confirmations
 * Maps Stripe session ID to fileId/fileName
 */

// Store payment confirmations (in production, use Redis or similar)
// Maps Stripe session ID to fileId
const paymentConfirmations = new Map<string, { fileId: string; fileName: string; confirmedAt: number }>();

// Cleanup old confirmations (keep for 1 hour)
const CONFIRMATION_EXPIRY = 60 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [sessionId, data] of paymentConfirmations.entries()) {
    if (now - data.confirmedAt > CONFIRMATION_EXPIRY) {
      paymentConfirmations.delete(sessionId);
    }
  }
}, 5 * 60 * 1000);

/**
 * Verify if a Stripe session was paid
 */
export function isSessionPaid(stripeSessionId: string): { fileId: string; fileName: string } | null {
  return paymentConfirmations.get(stripeSessionId) || null;
}

/**
 * Add a confirmed payment (called from webhook or verify endpoint)
 */
export function confirmPayment(stripeSessionId: string, fileId: string, fileName: string): void {
  paymentConfirmations.set(stripeSessionId, {
    fileId,
    fileName,
    confirmedAt: Date.now(),
  });
}
