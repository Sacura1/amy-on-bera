'use client';

import { useEffect } from 'react';
import { initThirdwebSocialFetchGuard } from '@/lib/thirdwebSocialGuard';

export default function SocialFetchGuard() {
  useEffect(() => {
    initThirdwebSocialFetchGuard();
  }, []);

  return null;
}
