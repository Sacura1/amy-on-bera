'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

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

// 5 novelty items — assigned by raffle.id % 5
const NOVELTY_ITEMS = [
  '/novelty-1.png', // lamp
  '/novelty-2.png', // tennis rackets + balls
  '/novelty-3.png', // MP3 speaker
  '/novelty-4.png', // cooker stove (flat, needs special treatment)
  '/novelty-5.png', // teddy bear
];

// Frame interior viewport percentages within frame.png (tune if needed)
const INT_TOP    = '10.5%';
const INT_LEFT   = '12.5%';
const INT_RIGHT  = '12.5%';
const INT_BOTTOM = '17%';

function useCountdown(endsAt: string | null) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!endsAt) return;
    const update = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Drawing...'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return timeLeft;
}

function PrizeItem({ raffle, noveltyIndex, onClick }: { raffle: Raffle; noveltyIndex: number; onClick: () => void }) {
  const noveltyIdx = noveltyIndex % NOVELTY_ITEMS.length;
  const isCooker = noveltyIdx === 3;
  const pointerDown = useRef(false);
  const pointerStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  return (
    <div
      className="flex-shrink-0 cursor-pointer"
      style={{ width: 'clamp(68px, 10vw, 120px)' }}
      onPointerDown={(e) => {
        pointerDown.current = true;
        pointerStart.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        if (!pointerDown.current) return;
        const dx = e.clientX - pointerStart.current.x;
        const dy = e.clientY - pointerStart.current.y;
        if (dx * dx + dy * dy > 25) pointerDown.current = false; // >5px threshold
      }}
      onPointerUp={() => {
        if (pointerDown.current) {
          pointerDown.current = false;
          onClick();
        }
      }}
    >
      <div
        className="relative w-full"
        style={{ height: 'clamp(75px, 14vw, 165px)' }}
      >
        {/* Novelty — behind the gift, bottom-aligned on the conveyor surface */}
        <img
          src={NOVELTY_ITEMS[noveltyIdx]}
          alt=""
          className="absolute bottom-0 left-1/2 object-contain drop-shadow-lg"
          style={{
            height: isCooker ? '63%' : '104%',
            width: isCooker ? '180%' : 'auto',
            maxWidth: 'none',
            transform: 'translateX(-50%)',
            zIndex: 1,
          }}
          draggable={false}
        />

        {/* Gift / prize image — larger, in front, partially overlapping novelty */}
        {raffle.image_url ? (
          <img
            src={raffle.image_url}
            alt={raffle.title}
            className="absolute bottom-0 left-1/2 object-contain drop-shadow-xl"
            style={{ height: '72%', maxWidth: 'none', transform: 'translateX(-50%)', objectPosition: 'bottom', zIndex: 2 }}
            draggable={false}
          />
        ) : (
          <div
            className="absolute bottom-0 left-1/2 flex items-center justify-center bg-blue-600/80 rounded border-2 border-yellow-400/60"
            style={{ height: '84%', width: '90%', transform: 'translateX(-50%)', zIndex: 2 }}
          >
            <span className="text-white font-black text-center leading-tight px-1"
              style={{ fontSize: 'clamp(7px, 1vw, 10px)' }}>
              {raffle.title}
            </span>
          </div>
        )}

      </div>
    </div>
  );
}

export default function PrizeCarousel({ raffles, onSelectRaffle }: PrizeCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const animRef = useRef<number | null>(null);
  const isDragging = useRef(false);
  const isClick = useRef(false);
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
        offsetRef.current -= 0.45;
        if (offsetRef.current < -TW * 2) offsetRef.current += TW;
        if (offsetRef.current > -TW) offsetRef.current -= TW;
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
    isClick.current = true;
    dragStart.current = e.clientX;
    dragOffset.current = offsetRef.current;
    isPaused.current = true;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    if (Math.abs(e.clientX - dragStart.current) > 4) isClick.current = false;
    offsetRef.current = dragOffset.current + (e.clientX - dragStart.current);
    if (trackRef.current) trackRef.current.style.transform = `translateX(${offsetRef.current}px)`;
  };
  const handleMouseUp = () => { isDragging.current = false; resumeAfterDelay(); };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    isClick.current = true;
    dragStart.current = e.touches[0].clientX;
    dragOffset.current = offsetRef.current;
    isPaused.current = true;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    if (Math.abs(e.touches[0].clientX - dragStart.current) > 4) isClick.current = false;
    offsetRef.current = dragOffset.current + (e.touches[0].clientX - dragStart.current);
    if (trackRef.current) trackRef.current.style.transform = `translateX(${offsetRef.current}px)`;
  };
  const handleTouchEnd = () => { isDragging.current = false; resumeAfterDelay(); };

  return (
    <div
      className="relative select-none mx-auto"
      style={{
        aspectRatio: '1366 / 768',
        width: 'min(100%, calc((100vh - 220px) * 1366 / 768))',
      }}
    >
      {/* Dark TV-bezel border rings — inset to match frame.png's actual visual edge
          (frame.png is 1536×1024 inside a 1366:768 container → ~8% transparent side bars) */}
      <div
        className="absolute pointer-events-none"
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
          /* Prizes + belt — fills the full interior so belt pins to the very bottom */
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
            {/* Conveyor belt — wrapper clips to just the belt surface */}
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
                  onClick={() => {
                    if (isClick.current) {
                      isClick.current = false;
                      onSelectRaffle(raffle);
                    }
                  }}
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
        src="/frame.png"
        alt=""
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        style={{ zIndex: 10 }}
        draggable={false}
      />
    </div>
  );
}
