'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/constants';
import { useRaffleCountdown } from '../hooks/useRaffleCountdown';

interface Raffle {
  id: number;
  title: string;
  prize_description: string;
  image_url: string;
  ticket_cost: number;
  status: 'TNM' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  countdown_hours: number;
  ends_at: string | null;
  total_tickets: number;
  unique_participants: number;
  total_points_committed: number;
  slot_id?: string;
  novelty_name?: string;
}

interface PrizeCarouselProps {
  raffles: Raffle[];
  onSelectRaffle: (raffle: Raffle) => void;
}

const DEFAULT_NOVELTIES = [
  '/novelty-1.png',
  '/novelty-2.png',
  '/novelty-3.png',
  '/novelty-4.png',
  '/novelty-5.png',
];
const DEFAULT_FRAME = '/frame.png';

const NOVELTY_MAP: Record<string, string> = {
  lamp: '/novelty-1.png',
  tennis: '/novelty-2.png',
  boombox: '/novelty-3.png',
  cooker: '/novelty-4.png',
  teddy: '/novelty-5.png',
  'teddy bear': '/novelty-5.png',
  speaker: '/novelty-3.png',
};

// Frame interior viewport — values driven by CSS variables so mobile can override via globals.css
const INT_TOP    = 'var(--carousel-int-top, 10.5%)';
const INT_LEFT   = 'var(--carousel-int-left, 12.5%)';
const INT_RIGHT  = 'var(--carousel-int-right, 12.5%)';
const INT_BOTTOM = 'var(--carousel-int-bottom, 17%)';

// Small helper for the LIVE timer pill
function LiveTimerPill({ endsAt }: { endsAt: string }) {
  const { label } = useRaffleCountdown(endsAt);
  return (
    <div 
      className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap z-[15]"
      style={{ 
        bottom: '54%', // Sits consistently above the prize boxes
        background: 'rgba(0,0,0,0.65)',
        color: 'white',
        borderRadius: '10px',
        padding: '4px 10px',
        fontSize: 'clamp(10px, 1.2vw, 14px)',
        fontWeight: 600,
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      LIVE &bull; {label}
    </div>
  );
}

// Pure display component — no event handlers, pointer-events: none so the
// transparent wrapper never eats clicks meant for the backdrop.
function PrizeItem({ raffle, noveltyIndex, noveltyItems }: { raffle: Raffle; noveltyIndex: number; noveltyItems: string[] }) {
  const noveltyIdx = noveltyIndex % noveltyItems.length;
  
  const normalizedNovelty = (raffle.novelty_name || '').trim().toLowerCase();
  const noveltySrc = normalizedNovelty && NOVELTY_MAP[normalizedNovelty]
    ? NOVELTY_MAP[normalizedNovelty]
    : noveltyItems[noveltyIdx];

  const isCooker = noveltySrc.includes('novelty-4');
  const isLive = raffle.status === 'LIVE' && raffle.ends_at;

  return (
    <div
      className="flex-shrink-0"
      style={{ width: 'clamp(120px, 28vw, 370px)', pointerEvents: 'none' }}
    >
      {/*
        Padding-bottom aspect-ratio trick (115% tall relative to width).
        Works in ALL browsers including old Safari — unlike aspect-ratio CSS
        which doesn't reliably establish a containing-block height for
        absolutely-positioned children's percentage heights.
      */}
      <div style={{ position: 'relative', width: '100%', paddingBottom: '115%' }}>
        <div className="absolute inset-0">

          {/* Timer Pill for LIVE raffles */}
          {isLive && raffle.ends_at && <LiveTimerPill endsAt={raffle.ends_at} />}

          {/* Novelty — back of belt, sits behind prize */}
          <img
            src={noveltySrc}
            alt=""
            className="absolute left-1/2 object-contain drop-shadow-lg"
            style={{
              bottom: isCooker ? '-1%' : '2%',
              height: isCooker ? '62%' : '80%',
              width: isCooker ? '140%' : 'auto',
              maxWidth: 'none',
              transform: 'translateX(-50%)',
              objectPosition: 'bottom',
              zIndex: 1,
            }}
            draggable={false}
          />

          {/* Prize image — front of belt */}
          {raffle.image_url ? (
            <div 
              className="absolute left-1/2" 
              style={{ 
                bottom: '2%', 
                height: '48%', 
                width: '100%', 
                transform: 'translateX(-50%) scale(0.75)', 
                zIndex: 2 
              }}
            >
              <img
                src={raffle.image_url}
                alt={raffle.title}
                className={`w-full h-full object-contain drop-shadow-xl ${isLive ? 'animate-pulse-subtle' : ''}`}
                style={{ 
                  objectPosition: 'bottom',
                  filter: isLive ? 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.4))' : 'none'
                }}
                draggable={false}
              />
            </div>
          ) : (
            <div
              className={`absolute left-1/2 flex items-center justify-center bg-blue-600/80 rounded border-2 ${isLive ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'border-yellow-400/60'}`}
              style={{ bottom: '2%', height: '48%', width: '70%', transform: 'translateX(-50%) scale(0.75)', zIndex: 2 }}
            >
              <span className="text-white font-black text-center leading-tight px-1"
                style={{ fontSize: 'clamp(7px, 1vw, 10px)' }}>
                {raffle.title}
              </span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function PrizeCarousel({ raffles, onSelectRaffle }: PrizeCarouselProps) {
  const [noveltyItems, setNoveltyItems] = useState<string[]>(DEFAULT_NOVELTIES);
  const [frameUrl, setFrameUrl] = useState(DEFAULT_FRAME);
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/carousel-settings`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          if (Array.isArray(d.data.novelties) && d.data.novelties.length > 0) setNoveltyItems(d.data.novelties);
          if (d.data.frame) setFrameUrl(d.data.frame);
        }
      })
      .catch(() => {});
  }, []);

  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const animRef = useRef<number | null>(null);
  const isDragging = useRef(false);
  const dragStart = useRef(0);
  const dragOffset = useRef(0);
  const isPaused = useRef(false);
  const resumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalWidthRef = useRef(0);
  const wasDragged = useRef(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const items = raffles.length > 0 ? [...raffles, ...raffles, ...raffles] : [];

  const startAnimation = useCallback(() => {
    isPaused.current = false;
    const animate = () => {
      const TW = totalWidthRef.current;
      if (!isPaused.current && trackRef.current && TW > 0) {
        // Scale speed by viewport width so mobile matches desktop visually
        // Desktop (~1400px) → 0.45 px/frame, mobile (~400px) → ~0.13 px/frame
        const speed = (window.innerWidth / 1400) * 0.45;
        offsetRef.current += speed;
        if (offsetRef.current > 0) offsetRef.current -= TW;
        if (offsetRef.current < -TW * 2) offsetRef.current += TW;
        trackRef.current.style.transform = `translateX(${offsetRef.current}px)`;
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
  }, []);

  const resumeAfterDelay = useCallback(() => {
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
    resumeTimeout.current = setTimeout(() => { isPaused.current = false; }, 1200);
  }, []);

  useEffect(() => {
    if (raffles.length === 0) return;
    const t = setTimeout(() => {
      if (!trackRef.current) return;
      const oneSetWidth = trackRef.current.scrollWidth / 3;
      totalWidthRef.current = oneSetWidth;
      offsetRef.current = -oneSetWidth;
      startAnimation();
    }, 80);
    return () => {
      clearTimeout(t);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
    };
  }, [raffles.length, startAnimation]);

  // Mathematical click detection — does NOT rely on elementFromPoint or
  // overflow:hidden clipping (both are unreliable for off-screen items).
  // Uses the known track offset + measured item stride to find which item
  // is under the cursor, then verifies its center is within the visible bounds.
  const fireClickAt = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current || !trackRef.current || raffles.length === 0) return;

    const containerRect = containerRef.current.getBoundingClientRect();

    // Click must be inside the visible container rectangle
    if (
      clientX < containerRect.left || clientX > containerRect.right ||
      clientY < containerRect.top  || clientY > containerRect.bottom
    ) return;

    // Measure the per-item stride (width + gap) from the first two children.
    // getBoundingClientRect includes the current translateX on the track so the
    // transform cancels out in the difference — giving the pure layout stride.
    const children = trackRef.current.children;
    if (children.length < 2) return;
    const stride = (children[1] as HTMLElement).getBoundingClientRect().left
                 - (children[0] as HTMLElement).getBoundingClientRect().left;
    if (stride <= 0) return;

    // Convert the click's screen X into track-local coordinates
    // (before the translateX transform is applied).
    const trackLocalX = clientX - containerRect.left - offsetRef.current;
    if (trackLocalX < 0) return;

    const itemIndex = Math.floor(trackLocalX / stride);
    if (itemIndex < 0 || itemIndex >= raffles.length * 3) return;

    // Verify the item's center is actually inside the visible container.
    // This rejects items that are entering/leaving but whose slot the user
    // clicked on while the prize image itself isn't yet in view.
    const itemCenterScreen = containerRect.left + (itemIndex * stride + stride / 2) + offsetRef.current;
    if (itemCenterScreen < containerRect.left || itemCenterScreen > containerRect.right) return;

    onSelectRaffle(raffles[itemIndex % raffles.length]);
  }, [raffles, onSelectRaffle]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = e.clientX;
    dragOffset.current = offsetRef.current;
    isPaused.current = true;
    wasDragged.current = false;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const delta = e.clientX - dragStart.current;
    if (Math.abs(delta) > 6) wasDragged.current = true;
    offsetRef.current = dragOffset.current + delta;
    if (trackRef.current) trackRef.current.style.transform = `translateX(${offsetRef.current}px)`;
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    const dragged = wasDragged.current;
    isDragging.current = false;
    wasDragged.current = false;
    resumeAfterDelay();
    if (!dragged) fireClickAt(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    dragStart.current = e.touches[0].clientX;
    dragOffset.current = offsetRef.current;
    isPaused.current = true;
    wasDragged.current = false;
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dx = e.touches[0].clientX - dragStart.current;
    const dy = touchStartPos.current ? e.touches[0].clientY - touchStartPos.current.y : 0;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 8) wasDragged.current = true;
    offsetRef.current = dragOffset.current + dx;
    if (trackRef.current) trackRef.current.style.transform = `translateX(${offsetRef.current}px)`;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dragged = wasDragged.current;
    const startPos = touchStartPos.current;
    isDragging.current = false;
    wasDragged.current = false;
    touchStartPos.current = null;
    resumeAfterDelay();
    if (!dragged && startPos) {
      fireClickAt(startPos.x, startPos.y);
      e.preventDefault();
    }
  };

  return (
    /*
      Padding-bottom aspect-ratio trick for the outer carousel (1366:768 = 56.22%).
      Replaces aspect-ratio CSS which doesn't establish containing-block height
      reliably in Safari < 15.4, causing backdrop/belt/items to all render at 0px tall.
    */
    <div className="select-none" style={{ position: 'relative', width: '100%', paddingBottom: '56.22%' }}>
      <div className="absolute inset-0">

        {/* Dark TV-bezel border rings */}
        <div
          className="carousel-bezel absolute pointer-events-none"
          style={{
            top: '1%', bottom: '1%',
            left: '8%', right: '8%',
            boxShadow: '0 0 0 10px #111111, 0 0 0 20px rgba(0,0,0,0.45)',
            zIndex: 0,
          }}
        />

        {/* Interior container — clips to frame's transparent opening */}
        <div
          className="absolute overflow-hidden"
          style={{ top: INT_TOP, left: INT_LEFT, right: INT_RIGHT, bottom: INT_BOTTOM }}
        >
          {/* Amy backdrop */}
          <img
            src="/backdrop.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />

          {raffles.length > 0 ? (
            <div
              ref={containerRef}
              className="absolute inset-0 overflow-hidden cursor-pointer"
              style={{ touchAction: 'pan-y', zIndex: 3 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => { isDragging.current = false; wasDragged.current = false; resumeAfterDelay(); }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Conveyor belt */}
              <div
                className="absolute bottom-0 left-0 right-0 pointer-events-none"
                style={{ height: '35%', overflow: 'hidden' }}
              >
                <img
                  src="/conveyor-belt.png"
                  alt=""
                  className="absolute inset-0 w-full h-full"
                  style={{ objectFit: 'cover', objectPosition: '50% 62%' }}
                  draggable={false}
                />
              </div>

              <div
                ref={trackRef}
                className="absolute flex items-end"
                style={{ gap: '2px', top: 0, left: 0, right: 0, bottom: '1%' }}
              >
                {items.map((raffle, idx) => (
                  <PrizeItem
                    key={`${raffle.id}-${idx}`}
                    raffle={raffle}
                    noveltyIndex={idx % raffles.length}
                    noveltyItems={noveltyItems}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 5 }}>
              <div className="text-center bg-black/50 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/10">
                <p className="text-white font-black text-sm drop-shadow-lg">No active raffles right now!</p>
                <p className="text-gray-300 text-xs mt-0.5 opacity-80">Check back soon ✨</p>
              </div>
            </div>
          )}
        </div>

        {/* Gold frame — on top, transparent center lets scene show through */}
        <img
          src={frameUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={{ zIndex: 10 }}
          draggable={false}
        />

      </div>
    </div>
  );
}
