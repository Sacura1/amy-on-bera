'use client';

const SOCIAL_PROFILE_PREFIX = 'https://social.thirdweb.com/v1/profiles/';

let guardInitialized = false;

export function initThirdwebSocialFetchGuard() {
  if (typeof window === 'undefined' || guardInitialized) return;
  guardInitialized = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input?.url;

    if (url && url.startsWith(SOCIAL_PROFILE_PREFIX)) {
      const cacheKey = `amy-social-profile:${url}`;
      if (typeof sessionStorage !== 'undefined') {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          return new Response(cached, {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 2200);
      try {
        const response = await originalFetch(input, { ...init, signal: controller.signal });
        if (response.ok && typeof sessionStorage !== 'undefined') {
          response.clone().text().then((body) => {
            sessionStorage.setItem(cacheKey, body);
          }).catch(() => {});
        }
        if (!response.ok && response.status >= 500) {
          return new Response('{}', {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return response;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return new Response('{}', {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        throw error;
      } finally {
        window.clearTimeout(timeout);
      }
    }

    return originalFetch(input, init);
  };
}
