'use client';

import { useEffect, useState } from 'react';
import { useAnimations } from '@/contexts';

const MEMES = ['🚀', '💎', '🌙', '⭐', '✨', '🔥', '💰', '🎉', '🐻', '🍯', '🏆', '💸', '📈', '🎯', '🎮', '👾'];

interface FloatingMeme {
  id: number;
  emoji: string;
  left: string;
  animationDelay: string;
  animationDuration: string;
  fontSize: string;
}

export default function FloatingMemes() {
  const { animationsEnabled } = useAnimations();
  const [memes, setMemes] = useState<FloatingMeme[]>([]);

  useEffect(() => {
    const generatedMemes: FloatingMeme[] = [];
    for (let i = 0; i < 15; i++) {
      generatedMemes.push({
        id: i,
        emoji: MEMES[Math.floor(Math.random() * MEMES.length)],
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 20}s`,
        animationDuration: `${20 + Math.random() * 10}s`,
        fontSize: `${1.5 + Math.random() * 1.5}rem`,
      });
    }
    setMemes(generatedMemes);
  }, []);

  // Don't render anything if animations are disabled
  if (!animationsEnabled) {
    return null;
  }

  return (
    <div className="fixed w-full h-full pointer-events-none z-[1] overflow-hidden">
      {memes.map((meme) => (
        <div
          key={meme.id}
          className="floating-meme"
          style={{
            left: meme.left,
            animationDelay: meme.animationDelay,
            animationDuration: meme.animationDuration,
            fontSize: meme.fontSize,
          }}
        >
          {meme.emoji}
        </div>
      ))}
    </div>
  );
}
