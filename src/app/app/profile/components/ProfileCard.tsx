'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { API_BASE_URL } from '@/lib/constants';

interface BadgeData {
  badge_id: string;
  badge_title: string;
  badge_image: string;
  is_active: boolean;
  current_tier_level: 0 | 1 | 2 | 3;
  current_tier_name: 'inactive' | 'bronze' | 'silver' | 'gold';
  current_multiplier: number;
}

interface EquippedBadge {
  slotNumber: number;
  badgeId: string;
}

interface ProfileData {
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  avatarData: string | null;
  avatarType: string;
  showX: boolean;
  showDiscord: boolean;
  showTelegram: boolean;
  showBalance: boolean;
  backgroundId: string | null;
}

export const CARD_BACKGROUNDS: { id: string; path: string; label: string }[] = [
  { id: 'bg_desktop_1', path: '/bg_desktop_1.jpg', label: 'Background 1' },
  { id: 'bg_desktop_2', path: '/bg_desktop_2.jpg', label: 'Background 2' },
  { id: 'bg_desktop_3', path: '/bg_desktop_3.jpg', label: 'Background 3' },
  { id: 'bg_desktop_4', path: '/bg_desktop_4.jpg', label: 'Background 4' },
  { id: 'bg_desktop_5', path: '/bg_desktop_5.jpg', label: 'Background 5' },
  { id: 'bg_desktop_6', path: '/bg_desktop_6.jpg', label: 'Background 6' },
];

interface SocialData {
  discordUsername: string | null;
  telegramUsername: string | null;
  email: string | null;
}

interface SocialConnections {
  xConnected?: boolean;
  discordConnected?: boolean;
  telegramConnected?: boolean;
  emailConnected?: boolean;
}

interface ProfileCardProps {
  wallet: string;
  xUsername: string;
  balance: number;
  tier: string;
  totalMultiplier: number;
  pointsPerHour: number;
  amyScore?: number;
  userReferralCode?: string;
  onEditProfile: () => void;
  onEditBadges: () => void;
  onConnectX: () => void;
  onConnectDiscord: () => void;
  onConnectTelegram: () => void;
  onConnectEmail: () => void;
  socialConnections: SocialConnections;
}

const BADGE_RING: Record<string, string> = {
  bronze: 'ring-2 ring-amber-600 shadow-[0_0_6px_rgba(217,119,6,0.5)]',
  silver: 'ring-2 ring-slate-300 shadow-[0_0_6px_rgba(203,213,225,0.5)]',
  gold:   'ring-2 ring-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.6)]',
};

// Avatar border — keyed by AMY holder tier (bronze/silver/gold/platinum/none)
const HOLDER_RING: Record<string, string> = {
  platinum: 'border-cyan-400',
  gold:     'border-yellow-400',
  silver:   'border-slate-400',
  bronze:   'border-orange-500',
  none:     'border-gray-600',
};

export default function ProfileCard({
  wallet,
  xUsername,
  balance,
  tier,
  totalMultiplier,
  pointsPerHour,
  amyScore = 0,
  userReferralCode,
  onEditProfile,
  onEditBadges,
  onConnectX,
  onConnectDiscord,
  onConnectTelegram,
  onConnectEmail,
  socialConnections
}: ProfileCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [equippedBadges, setEquippedBadges] = useState<EquippedBadge[]>([]);
  const [activeBadges, setActiveBadges] = useState<BadgeData[]>([]);
  const [socialData, setSocialData] = useState<SocialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cardBgId, setCardBgId] = useState<string>('bg_desktop_1');

  useEffect(() => {
    if (typeof window === 'undefined' || !wallet) return;
    const stored = localStorage.getItem(`amy-card-bg-${wallet.toLowerCase()}`);
    if (stored) setCardBgId(stored);
  }, [wallet]);

  const referralUrl = userReferralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://amybera.com'}/app/profile?ref=${userReferralCode}`
    : '';

  // Route external image URLs through the same-origin proxy so iOS Safari can
  // capture them. data: / blob: / relative paths pass through unchanged.
  const proxySrc = (src: string | null | undefined): string | undefined => {
    if (!src) return undefined;
    if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('/')) return src;
    return `/api/image-proxy?url=${encodeURIComponent(src)}`;
  };

  const toDataUrl = (url: string): Promise<string> =>
    fetch(url)
      .then(r => r.blob())
      .then(blob => new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(blob);
      }));

  // Converts an image URL to a data URL using an off-screen canvas.
  // Works for images that have CORS headers; returns null if tainted/failed.
  const imgToDataUrlViaCanvas = (src: string): Promise<string | null> =>
    new Promise(resolve => {
      const tmp = new Image();
      tmp.crossOrigin = 'anonymous';
      tmp.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = tmp.naturalWidth || tmp.width;
          c.height = tmp.naturalHeight || tmp.height;
          c.getContext('2d')!.drawImage(tmp, 0, 0);
          resolve(c.toDataURL('image/png'));
        } catch { resolve(null); }
      };
      tmp.onerror = () => resolve(null);
      tmp.src = src;
    });

  const handleDownload = async () => {
    if (!cardRef.current) return;
    const card = cardRef.current;

    // ── Force desktop layout regardless of device viewport ──────────────
    // CSS media queries fire on viewport width, not element width, so we must
    // manually show/hide the desktop vs mobile split elements before capture.
    const origCardWidth = card.style.width;
    const origCardMaxWidth = card.style.maxWidth;
    const origCardPadding = card.style.padding;
    card.style.width = '560px';
    card.style.maxWidth = '560px';
    card.style.padding = '1rem';

    const innerFlex = card.querySelector<HTMLElement>('[data-card-inner]');
    const origFlexDir = innerFlex?.style.flexDirection ?? '';
    const origFlexGap = innerFlex?.style.gap ?? '';
    if (innerFlex) {
      innerFlex.style.flexDirection = 'row';
      innerFlex.style.gap = '1rem';
    }

    const mobileEls = card.querySelectorAll<HTMLElement>('[data-mobile-only]');
    const desktopEls = card.querySelectorAll<HTMLElement>('[data-desktop-only]');
    const mobileOrigDisplay: string[] = [];
    const desktopOrigDisplay: string[] = [];
    mobileEls.forEach((el, i) => { mobileOrigDisplay[i] = el.style.display; el.style.display = 'none'; });
    desktopEls.forEach((el, i) => { desktopOrigDisplay[i] = el.style.display; el.style.display = 'flex'; });

    // Constrain stat columns so they can shrink inside the 560px layout.
    // flex-1 children without min-width:0 can't shrink below their text content
    // width, which makes the row overflow when AMY Balance is shown.
    const desktopStats = card.querySelector<HTMLElement>('[data-desktop-stats]');
    const statChildren: HTMLElement[] = [];
    const statChildOrigMinWidth: string[] = [];
    const statChildOrigOverflow: string[] = [];
    if (desktopStats) {
      Array.from(desktopStats.children).forEach((child, i) => {
        const el = child as HTMLElement;
        statChildren.push(el);
        statChildOrigMinWidth[i] = el.style.minWidth;
        statChildOrigOverflow[i] = el.style.overflow;
        el.style.minWidth = '0';
        el.style.overflow = 'hidden';
      });
    }

    // Two frames so the browser reflows at the forced desktop layout
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    // ── Background ───────────────────────────────────────────────────────
    const origBackground = card.style.background;
    const origBackgroundImage = card.style.backgroundImage;
    const origBackgroundSize = card.style.backgroundSize;
    const origBackgroundPosition = card.style.backgroundPosition;
    if (cardBg) {
      try {
        // cardBg.path is a local /public file — same-origin fetch always works.
        const bgDataUrl = await toDataUrl(cardBg.path);
        card.style.background = '';
        card.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.4)),url('${bgDataUrl}')`;
        card.style.backgroundSize = 'cover';
        card.style.backgroundRepeat = 'no-repeat';
        card.style.backgroundPosition = 'center';
      } catch { /* plain dark bg on failure */ }
    }

    // ── Hide capture-ignored elements ────────────────────────────────────
    const ignored = card.querySelectorAll<HTMLElement>('[data-ignore-capture="true"]');
    ignored.forEach(n => (n.style.display = 'none'));
    const preserved = card.querySelectorAll<HTMLElement>('[data-ignore-capture="preserve"]');
    preserved.forEach(n => (n.style.visibility = 'hidden'));

    const truncated = card.querySelectorAll<HTMLElement>('.truncate');
    const clamped = card.querySelectorAll<HTMLElement>('.line-clamp-2');
    truncated.forEach(n => { n.dataset.origOverflow = n.style.overflow; n.style.overflow = 'visible'; n.style.textOverflow = 'unset'; n.style.whiteSpace = 'normal'; });
    clamped.forEach(n => { n.dataset.origDisplay = n.style.display; n.style.display = 'block'; n.style.overflow = 'visible'; (n.style as CSSStyleDeclaration & { webkitLineClamp: string }).webkitLineClamp = 'unset'; });

    // ── Replace <canvas> elements with <img> snapshots ───────────────────
    // html-to-image can't reliably capture <canvas> on iOS Safari (QR code
    // renders as blank). Snapshot each canvas to a data URL and swap to <img>.
    type CanvasSwap = { canvas: HTMLCanvasElement; img: HTMLImageElement; parent: Node; next: Node | null };
    const canvasSwaps: CanvasSwap[] = [];
    for (const canvas of Array.from(card.querySelectorAll<HTMLCanvasElement>('canvas'))) {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        const img = document.createElement('img');
        img.src = dataUrl;
        img.style.display = 'block';
        img.style.width = canvas.style.width || `${canvas.offsetWidth}px`;
        img.style.height = canvas.style.height || `${canvas.offsetHeight}px`;
        const parent = canvas.parentNode!;
        const next = canvas.nextSibling;
        parent.replaceChild(img, canvas);
        canvasSwaps.push({ canvas, img, parent, next });
      } catch { /* tainted canvas — leave it */ }
    }

    // ── Convert all <img> elements to data: URLs before capture ─────────
    // Strategy: badge/avatar images are already loaded in the DOM via the
    // same-origin proxy with crossOrigin='anonymous', so we can draw them
    // directly from the existing element — zero extra network requests on iOS.
    // For any image that wasn't loaded through the proxy (e.g. newly added),
    // we fall back to fetching via proxy → canvas.
    const imgEls = Array.from(card.querySelectorAll<HTMLImageElement>('img'));
    const imgOrigSrcs = imgEls.map(img => img.src);
    for (const img of imgEls) {
      if (!img.src || img.src.startsWith('data:') || img.src.startsWith('blob:')) continue;
      // Fast path: draw the already-rendered element (works because crossOrigin
      // was set when these images were first loaded via proxySrc in JSX).
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth || img.offsetWidth || 64;
        c.height = img.naturalHeight || img.offsetHeight || 64;
        c.getContext('2d')!.drawImage(img, 0, 0);
        img.src = c.toDataURL('image/png');
        await img.decode().catch(() => {});
        continue;
      } catch { /* fall through to proxy fetch */ }
      // Slow path: proxy fetch → canvas (for images not pre-loaded via proxySrc)
      const proxied = img.src.startsWith('/') ? img.src : `/api/image-proxy?url=${encodeURIComponent(img.src)}`;
      const canvasData = await imgToDataUrlViaCanvas(proxied);
      if (canvasData) {
        img.src = canvasData;
        await img.decode().catch(() => {});
      } else {
        try {
          img.src = await toDataUrl(proxied);
          await img.decode().catch(() => {});
        } catch { /* keep original */ }
      }
    }

    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(card, {
        useCORS: true,
        allowTaint: false,
        scale: 2,
        backgroundColor: '#111827',
        logging: false,
        imageTimeout: 15000,
      });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile && typeof navigator.share === 'function') {
        // iOS/Android: use native share sheet so user can Save to Photos
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `amy-profile-${xUsername}.jpg`, { type: 'image/jpeg' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: 'My Amy Profile' });
        } else {
          // Share not supported — fall back to download
          const a = document.createElement('a'); a.href = dataUrl; a.download = `amy-profile-${xUsername}.jpg`; a.click();
        }
      } else {
        const a = document.createElement('a'); a.href = dataUrl; a.download = `amy-profile-${xUsername}.jpg`; a.click();
      }
    } finally {
      card.style.width = origCardWidth;
      card.style.maxWidth = origCardMaxWidth;
      card.style.padding = origCardPadding;
      if (innerFlex) { innerFlex.style.flexDirection = origFlexDir; innerFlex.style.gap = origFlexGap; }
      mobileEls.forEach((el, i) => (el.style.display = mobileOrigDisplay[i]));
      desktopEls.forEach((el, i) => (el.style.display = desktopOrigDisplay[i]));
      card.style.background = origBackground;
      card.style.backgroundImage = origBackgroundImage;
      card.style.backgroundSize = origBackgroundSize;
      card.style.backgroundPosition = origBackgroundPosition;
      card.style.backgroundRepeat = '';
      ignored.forEach(n => (n.style.display = ''));
      preserved.forEach(n => (n.style.visibility = ''));
      truncated.forEach(n => { n.style.overflow = n.dataset.origOverflow || ''; n.style.textOverflow = ''; n.style.whiteSpace = ''; });
      clamped.forEach(n => { n.style.display = n.dataset.origDisplay || ''; n.style.overflow = ''; (n.style as CSSStyleDeclaration & { webkitLineClamp: string }).webkitLineClamp = ''; });
      imgEls.forEach((img, i) => { img.src = imgOrigSrcs[i]; });
      statChildren.forEach((el, i) => { el.style.minWidth = statChildOrigMinWidth[i]; el.style.overflow = statChildOrigOverflow[i]; });
      // Restore canvas elements
      for (const { canvas, img, parent, next } of canvasSwaps) {
        img.remove();
        if (next && next.parentNode === parent) parent.insertBefore(canvas, next);
        else parent.appendChild(canvas);
      }
    }
  };

  const { discordConnected, telegramConnected, emailConnected } = socialConnections || {};

    useEffect(() => {
      if (!wallet) return;
      let cancelled = false;

      const fetchProfile = async () => {
        setIsLoading(true);
        try {
          const profileRes = await fetch(`${API_BASE_URL}/api/profile/${wallet}`);
          const profileData = await profileRes.json();
          if (profileData.success) {
            setProfile(profileData.data.profile);
            setEquippedBadges(profileData.data.badges?.equipped || []);
            if (profileData.data.social) {
              setSocialData(profileData.data.social);
            }
          }
        } catch (error) {
          console.error('Error fetching profile data:', error);
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      };

      const fetchActiveBadges = async () => {
        try {
          const res  = await fetch(`${API_BASE_URL}/api/badges/${wallet}/active`);
          const data = await res.json();
          if (data.success) {
            setActiveBadges(data.data.filter((b: BadgeData) => b.is_active));
          }
        } catch (error) {
          console.error('Error fetching active badges:', error);
        }
      };

      fetchProfile();
      fetchActiveBadges();

      return () => {
        cancelled = true;
      };
    }, [wallet]);

  const getBadgeForSlot = (slotNumber: number): BadgeData | null => {
    const equipped = equippedBadges.find(b => b.slotNumber === slotNumber);
    if (!equipped) return null;
    return activeBadges.find(b => b.badge_id === equipped.badgeId) || null;
  };

  const badgeRing = (b: BadgeData) => {
    const tier = (b.current_tier_name === 'gold' || b.current_tier_name === 'silver' || b.current_tier_name === 'bronze') ? b.current_tier_name : 'bronze';
    return BADGE_RING[tier] ?? 'ring-4 ring-gray-600';
  };

  const getAvatarUrl = () => {
    // Prioritize base64 data (stored in PostgreSQL, persists across deploys)
    if (profile?.avatarData) {
      return profile.avatarData;
    }
    // Fallback to URL (legacy, will be lost on deploy)
    if (profile?.avatarUrl) {
      return `${API_BASE_URL}${profile.avatarUrl}`;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900/80 rounded-2xl border border-gray-700/50 p-6">
        <div className="flex justify-center py-8">
          <div className="loading-spinner w-8 h-8"></div>
        </div>
      </div>
    );
  }

  const DiscordSvg = ({ className }: { className: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );

  const TelegramSvg = ({ className }: { className: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );

  const scoreCircumference = 2 * Math.PI * 21;
  const scoreFill = scoreCircumference * Math.min(Math.max(amyScore, 0), 100) / 100;

  const ScoreCard = ({ size }: { size: 'sm' | 'lg' }) => {
    const ringSize = size === 'lg' ? 54 : 58;
    const gradId = `goldRing-${size}`;
    return (
      <div className={`rounded-xl px-3 w-full flex flex-row items-center gap-2.5 ${size === 'lg' ? 'py-2' : 'py-4'}`} style={{ background: 'rgba(8,12,22,0.9)', border: '1px solid rgba(250,204,21,0.35)' }}>
        <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: ringSize, height: ringSize }}>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 48 48" fill="none" style={{ transform: 'rotate(-90deg)' }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fbbf24"/><stop offset="1" stopColor="#f59e0b"/>
              </linearGradient>
            </defs>
            <circle cx="24" cy="24" r="21" stroke="rgba(250,204,21,0.15)" strokeWidth="3"/>
            <circle
              cx="24" cy="24" r="21"
              stroke={`url(#${gradId})`}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${scoreFill} ${scoreCircumference - scoreFill}`}
            />
          </svg>
          <svg className="w-4 h-4 text-yellow-400 relative" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <div className="flex-1 flex flex-col gap-0.5 items-center text-center -ml-6">
          <span className="text-[10px] font-bold text-yellow-400 tracking-wider uppercase leading-none">Amy Score</span>
          <span className={`font-black text-yellow-400 leading-none ${size === 'lg' ? 'text-3xl' : 'text-3xl'}`}>{amyScore}</span>
          <span className="text-[9px] text-gray-400 tracking-wide leading-none">Monthly onchain score</span>
        </div>
      </div>
    );
  };

  const QrCard = ({ qrSize }: { qrSize: number }) => (
    <div className="rounded-xl px-3 pt-1.5 pb-1 flex flex-col items-center gap-0.5 w-full" style={{ background: 'rgba(8,12,22,0.9)', border: '1px solid rgba(6,182,212,0.3)' }}>
      <span className="text-[10px] font-bold text-cyan-400 tracking-[0.2em] uppercase">Join Amy</span>
      <span className="text-[11px] font-bold text-white text-center leading-tight pb-1">Scan to get 1,000 AMY points</span>
      {userReferralCode && referralUrl ? (
        <>
          <div className="rounded-md overflow-hidden ring-2 ring-white">
            <QRCodeCanvas value={referralUrl} size={qrSize} bgColor="#ffffff" fgColor="#000000" includeMargin={false} />
          </div>
          <div className="flex items-center gap-1.5 w-full">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }}/>
            <span className="text-[8px] text-cyan-400 tracking-widest uppercase pt-1">or use my code</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }}/>
          </div>
          <span className="text-cyan-400 font-mono font-black text-sm tracking-[0.15em] whitespace-nowrap">◆ {userReferralCode} ◆</span>
        </>
      ) : (
        <p className="text-[10px] text-gray-500">No referral code yet</p>
      )}
    </div>
  );

  const Socials = () => (
    <div className="flex flex-wrap gap-2 items-center">
      {/* X */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-700/50 whitespace-nowrap">
        <svg className="w-3.5 h-3.5 text-white flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        {profile?.showX && xUsername && (
          <span className="text-white text-xs">@{xUsername}</span>
        )}
      </div>
      {/* Discord */}
      {discordConnected ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#5865F2]/20 whitespace-nowrap cursor-default"
          title={socialData?.discordUsername && socialData.discordUsername !== 'connected' ? `@${socialData.discordUsername}` : 'Discord connected'}>
          <DiscordSvg className="w-3.5 h-3.5 text-[#5865F2] flex-shrink-0" />
          {profile?.showDiscord && (
            <span className="text-white text-xs">{socialData?.discordUsername && socialData.discordUsername !== 'connected' ? socialData.discordUsername : 'Connected'}</span>
          )}
        </div>
      ) : (
        <button onClick={onConnectDiscord} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#5865F2]/20 hover:bg-[#5865F2]/30 whitespace-nowrap transition-colors">
          <DiscordSvg className="w-3.5 h-3.5 text-[#5865F2] flex-shrink-0" />
          <span className="text-gray-400 text-xs">Connect</span>
        </button>
      )}
      {/* Telegram */}
      {telegramConnected ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0088cc]/20 whitespace-nowrap cursor-default"
          title={socialData?.telegramUsername && socialData.telegramUsername !== 'connected' ? `@${socialData.telegramUsername}` : 'Telegram connected'}>
          <TelegramSvg className="w-3.5 h-3.5 text-[#0088cc] flex-shrink-0" />
          {profile?.showTelegram && (
            <span className="text-white text-xs">{socialData?.telegramUsername && socialData.telegramUsername !== 'connected' ? socialData.telegramUsername : 'Connected'}</span>
          )}
        </div>
      ) : (
        <button onClick={onConnectTelegram} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0088cc]/20 hover:bg-[#0088cc]/30 whitespace-nowrap transition-colors">
          <TelegramSvg className="w-3.5 h-3.5 text-[#0088cc] flex-shrink-0" />
          <span className="text-gray-400 text-xs">Connect</span>
        </button>
      )}
    </div>
  );

  const cardBg = CARD_BACKGROUNDS.find(b => b.id === cardBgId);

  return (
    <div
      ref={cardRef}
      className="bg-gray-900/80 rounded-2xl border border-gray-700/50 p-3 mob:p-4 relative overflow-hidden"
    >
      <div data-card-inner className="relative flex flex-col mob:flex-row gap-3 mob:gap-4">

        {/* ── Left column ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">

          {/* Avatar + name/bio */}
          <div className="flex gap-3 items-start">
            <div className="relative flex-shrink-0">
              <div className={`w-20 h-20 mob:w-24 mob:h-24 rounded-full border-4 ${HOLDER_RING[tier] ?? 'border-gray-600'} overflow-hidden`}>
                {getAvatarUrl() ? (
                  <img src={proxySrc(getAvatarUrl()) ?? getAvatarUrl()!} crossOrigin="anonymous" alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <span className="text-3xl">🐻</span>
                  </div>
                )}
              </div>
              <button onClick={onEditProfile} data-ignore-capture="true" className="absolute bottom-0 right-0 w-6 h-6 flex items-center justify-center rounded-full border border-white/20 bg-gray-900 hover:bg-gray-700 transition-colors text-gray-300" title="Edit Profile">
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <h2 className="text-lg mob:text-xl font-bold text-white truncate">
                {profile?.displayName || xUsername}
              </h2>
              {profile?.bio && (
                <p className="text-gray-400 text-xs mt-1 line-clamp-2">{profile.bio}</p>
              )}
              {/* Badge slots — desktop only, aligned with bio */}
              <div data-desktop-only className="hidden mob:flex flex-wrap items-center gap-2 mt-5">
                {[1, 2, 3, 4, 5].map((slotNumber) => {
                  const badge = getBadgeForSlot(slotNumber);
                  return (
                    <div key={slotNumber} className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center overflow-hidden ${badge ? `bg-white ${badgeRing(badge)}` : 'border-2 border-gray-600/50 bg-gray-800/50 border-dashed'}`}>
                      {badge ? (
                        <img src={proxySrc(badge.badge_image) ?? badge.badge_image} crossOrigin="anonymous" alt={badge.badge_title} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <span className="text-[10px] text-gray-600">{slotNumber}</span>
                      )}
                    </div>
                  );
                })}
                <button onClick={onEditBadges} className="w-8 h-8 flex-shrink-0 rounded-full border-2 border-dashed border-gray-600 hover:border-pink-500 flex items-center justify-center transition-colors" title="Edit Badges" data-ignore-capture="true">
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Badge slots — mobile only, aligned with avatar left edge */}
          <div data-mobile-only className="flex mob:hidden items-center gap-2">
            {[1, 2, 3, 4, 5].map((slotNumber) => {
              const badge = getBadgeForSlot(slotNumber);
              return (
                <div key={slotNumber} className={`w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center overflow-hidden ${badge ? `bg-white ${badgeRing(badge)}` : 'border-2 border-gray-600/50 bg-gray-800/50 border-dashed'}`}>
                  {badge ? (
                    <img src={badge.badge_image} alt={badge.badge_title} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-[9px] text-gray-600">{slotNumber}</span>
                  )}
                </div>
              );
            })}
            <button onClick={onEditBadges} className="w-7 h-7 flex-shrink-0 rounded-full border-2 border-dashed border-gray-600 hover:border-pink-500 flex items-center justify-center transition-colors" title="Edit Badges" data-ignore-capture="true">
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Stats card */}
          <div className="rounded-xl overflow-hidden mt-5" style={{ background: 'rgba(8,12,22,0.85)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {/* Desktop: 3 col horizontal */}
            <div data-desktop-only data-desktop-stats className="hidden mob:flex divide-x divide-white/5">
              {profile?.showBalance && (
                <div className="flex-1 flex flex-col items-center justify-center gap-1.5 py-5 px-3">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M12 2l8.66 5v10L12 22l-8.66-5V7z"/></svg>
                    <span className="text-[9px] font-semibold tracking-widest text-gray-400 uppercase">AMY Balance</span>
                  </div>
                  <span className="text-white font-bold text-lg">{Number(balance || 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex-1 flex flex-col items-center justify-center gap-1.5 py-5 px-3">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="currentColor"><path d="M14 1L6 13.5h5.5L10 23l8-12.5h-5.5L14 1z"/></svg>
                  <span className="text-[9px] font-semibold tracking-widest text-gray-400 uppercase">Multiplier</span>
                </div>
                <span className="text-yellow-400 font-bold text-lg">{Number(totalMultiplier || 1).toFixed(1)}x</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-1.5 py-5 px-3">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/></svg>
                  <span className="text-[9px] font-semibold tracking-widest text-gray-400 uppercase">Points/hr</span>
                </div>
                <span className="text-green-400 font-bold text-lg">{Number(pointsPerHour || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            {/* Mobile: vertical rows */}
            <div data-mobile-only className="flex mob:hidden flex-col divide-y divide-white/5">
              {profile?.showBalance && (
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M12 2l8.66 5v10L12 22l-8.66-5V7z"/></svg>
                    <span className="text-[9px] font-semibold tracking-widest text-gray-400 uppercase">AMY Balance</span>
                  </div>
                  <span className="text-white font-bold text-base">{Number(balance || 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="currentColor"><path d="M14 1L6 13.5h5.5L10 23l8-12.5h-5.5L14 1z"/></svg>
                  <span className="text-[9px] font-semibold tracking-widest text-gray-400 uppercase">Multiplier</span>
                </div>
                <span className="text-yellow-400 font-bold text-base">{Number(totalMultiplier || 1).toFixed(1)}x</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/></svg>
                  <span className="text-[9px] font-semibold tracking-widest text-gray-400 uppercase">Points/hr</span>
                </div>
                <span className="text-green-400 font-bold text-base">{Number(pointsPerHour || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Mobile: Score + QR cards */}
          <div data-mobile-only className="flex mob:hidden flex-col gap-2">
            <ScoreCard size="sm" />
            <QrCard qrSize={100} />
            <button onClick={handleDownload} className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg border border-white/10 bg-black/40 hover:bg-white/10 transition-colors text-gray-400 self-end -mt-1" title="Download card" data-ignore-capture="true">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>

          {/* Socials */}
          <div className="mt-auto">
            <Socials />
          </div>
        </div>

        {/* ── Right column — desktop only ── */}
        <div data-desktop-only className="hidden mob:flex flex-col gap-2 flex-shrink-0" style={{ width: 245 }}>
          <div className="flex items-end gap-2">
            <div className="flex-1"><ScoreCard size="lg" /></div>
            <div className="w-7 flex-shrink-0" data-ignore-capture="true" />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1"><QrCard qrSize={105} /></div>
            <button onClick={handleDownload} className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg border border-white/10 bg-black/40 hover:bg-white/10 transition-colors text-gray-400" title="Download card" data-ignore-capture="true">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
