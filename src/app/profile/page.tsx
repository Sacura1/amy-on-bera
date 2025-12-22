'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Component that handles the redirect logic
function ProfileRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Preserve query parameters when redirecting
    const queryString = searchParams.toString();
    const redirectUrl = queryString ? `/app/profile?${queryString}` : '/app/profile';
    router.replace(redirectUrl);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="loading-spinner w-12 h-12 mx-auto mb-4" />
        <p className="text-gray-400">Redirecting...</p>
      </div>
    </div>
  );
}

// Redirect from /profile to /app/profile (fixes OAuth callback mismatch)
export default function ProfileRedirect() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 mx-auto mb-4" />
          <p className="text-gray-400">Redirecting...</p>
        </div>
      </div>
    }>
      <ProfileRedirectContent />
    </Suspense>
  );
}
