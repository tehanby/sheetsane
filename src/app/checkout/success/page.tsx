'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState<string | null>(null);

  const verifyPayment = useCallback(async () => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setError('Missing session ID');
      setStatus('error');
      return;
    }

    try {
      const response = await fetch('/api/verify-payment/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment verification failed');
      }

      if (data.paid) {
        setStatus('success');
        // Redirect to report after short delay
        setTimeout(() => {
          router.push('/report');
        }, 1500);
      } else {
        setError('Payment not completed');
        setStatus('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setStatus('error');
    }
  }, [searchParams, router]);

  useEffect(() => {
    verifyPayment();
  }, [verifyPayment]);

  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      {status === 'verifying' && (
        <div className="animate-fade-in">
          <div className="w-20 h-20 bg-surface-light rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="spinner !w-8 !h-8" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Confirming Payment...
          </h1>
          <p className="text-foreground/60">
            Please wait while we verify your payment
          </p>
        </div>
      )}

      {status === 'success' && (
        <div className="animate-fade-in">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Payment Successful!
          </h1>
          <p className="text-foreground/60 mb-6">
            Redirecting to your report...
          </p>
          <div className="inline-flex items-center gap-2 text-primary">
            <div className="spinner !w-4 !h-4 !border-2" />
            Loading report
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="animate-fade-in">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Verification Failed
          </h1>
          <p className="text-foreground/60 mb-6">
            {error || 'Unable to verify payment'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => verifyPayment()}
              className="btn-secondary"
            >
              Try Again
            </button>
            <a href="/" className="btn-primary inline-flex items-center justify-center">
              Start Over
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-surface-light rounded-full flex items-center justify-center mx-auto mb-6">
          <div className="spinner !w-8 !h-8" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
          Loading...
        </h1>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
