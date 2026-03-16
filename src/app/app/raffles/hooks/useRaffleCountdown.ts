'use client';

import { useState, useEffect } from 'react';

export function useRaffleCountdown(endsAt: string | null) {
  const [label, setLabel] = useState('');
  const [isNearEnd, setIsNearEnd] = useState(false); // < 30m
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!endsAt) return;

    const update = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      
      if (diff <= 0) {
        setLabel('0m');
        setIsExpired(true);
        setIsNearEnd(true);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);

      if (minutes < 30) {
        setLabel(`${minutes}m`);
        setIsNearEnd(true);
      } else {
        setLabel(`${hours}h`);
        setIsNearEnd(false);
      }
      setIsExpired(false);
    };

    update();
    const id = setInterval(update, 60000); // Update every minute is enough for h/m format
    return () => clearInterval(id);
  }, [endsAt]);

  return { label, isNearEnd, isExpired };
}
