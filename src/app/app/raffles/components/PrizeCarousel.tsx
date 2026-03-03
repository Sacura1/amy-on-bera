'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/constants';

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

// Frame interior viewport — values driven by CSS variables so mobile can override via globals.css
const INT_TOP    = 'var(--carousel-int-top, 10.5%)';
const INT_LEFT   = 'var(--carousel-int-left, 12.5%)';
const INT_RIGHT  = 'var(--carousel-int-right, 12.5%)';
const INT_BOTTOM = 'var(--carousel-int-bottom, 17%)';

function PrizeItem({ raffle, noveltyIndex, noveltyItems, onClick }: { raffle: Raffle; noveltyIndex: number; noveltyItems: string[]; onClick: () => void }) {
  const noveltyIdx = noveltyIndex % noveltyItems.length;
  const isCooker = noveltyIdx === 3;
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const lastTouchTime = useRef(0);

  return (
    <div
      className="flex-shrink-0 cursor-pointer"
      style={{ width: 'clamp(120px, 28vw, 370px)' }}
      onTouchStart={(e) => {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        if (!touchStart.current) return;
        const dx = e.changedTouches[0].clientX - touchStart.current.x;
        const dy = e.changedTouches[0].clientY - touchStart.current.y;
        touchStart.current = null;
        if (dx * dx + dy * dy <= 100) {
          e.preventDefault();
          lastTouchTime.current = Date.now();
          onClick();
        }
      }}
      onClick={() => {
        if (Date.now() - lastTouchTime.current > 500) onClick();
      }}
    >
      {/*
        Padding-bottom aspect-ratio trick (115% tall relative to width).
        Works in ALL browsers including old Safari — unlike aspect-ratio CSS
        which doesn't reliably establish a containing-block height for
        absolutely-positioned children's percentage heights.
      */}
      <div style={{ position: 'relative', width: '100%', paddingBottom: '115%' }}>
        <div className="absolute inset-0">

          {/* Novelty — back of belt, sits behind prize */}
          <img
            src={noveltyItems[noveltyIdx]}
            alt=""
            className="absolute left-1/2 object-contain drop-shadow-lg"
            style={{
              bottom: isCooker ? '-1%' : '5%',
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
            <img
              src={raffle.image_url}
              alt={raffle.title}
              className="absolute left-1/2 object-contain drop-shadow-xl"
              style={{ bottom: '-1%', height: '52%', maxWidth: 'none', transform: 'translateX(-50%)', objectPosition: 'bottom', zIndex: 2 }}
              draggable={false}
            />
          ) : (
            <div
              className="absolute left-1/2 flex items-center justify-center bg-blue-600/80 rounded border-2 border-yellow-400/60"
              style={{ bottom: '-1%', height: '52%', width: '90%', transform: 'translateX(-50%)', zIndex: 2 }}
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
  const offsetRef = useRef(0);
  const animRef = useRef<number | null>(null);
  const isDragging = useRef(false);
  const dragStart = useRef(0);
  const dragOffset = useRef(0);
  const isPaused = useRef(false);
  const resumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalWidthRef = useRef(0);

  const items = raffles.length > 0 ? [...raffles, ...raffles, ...raffles] : [];

  const startAnimation = useCallback(() => {
    isPaused.current = false;
    const animate = () => {
      const TW = totalWidthRef.current;
      if (!isPaused.current && trackRef.current && TW > 0) {
        offsetRef.current += 0.45;
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

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = e.clientX;
    dragOffset.current = offsetRef.current;
    isPaused.current = true;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    offsetRef.current = dragOffset.current + (e.clientX - dragStart.current);
    if (trackRef.current) trackRef.current.style.transform = `translateX(${offsetRef.current}px)`;
  };
  const handleMouseUp = () => { isDragging.current = false; resumeAfterDelay(); };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    dragStart.current = e.touches[0].clientX;
    dragOffset.current = offsetRef.current;
    isPaused.current = true;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    offsetRef.current = dragOffset.current + (e.touches[0].clientX - dragStart.current);
    if (trackRef.current) trackRef.current.style.transform = `translateX(${offsetRef.current}px)`;
  };
  const handleTouchEnd = () => { isDragging.current = false; resumeAfterDelay(); };

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
              className="absolute inset-0 overflow-hidden"
              style={{ touchAction: 'pan-y', zIndex: 3 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Conveyor belt */}
              <div
                className="absolute bottom-0 left-0 right-0 pointer-events-none"
                style={{ height: '30%', overflow: 'hidden' }}
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
                    onClick={() => onSelectRaffle(raffle)}
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
