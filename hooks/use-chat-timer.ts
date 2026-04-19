'use client';

import { useState, useEffect, useCallback } from 'react';

export function useChatTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const start = useCallback(() => {
    setSeconds(0);
    setRunning(true);
  }, []);

  const stop = useCallback(() => setRunning(false), []);

  const formatted = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return { seconds, formatted, start, stop };
}