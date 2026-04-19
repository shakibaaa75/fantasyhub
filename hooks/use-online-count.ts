'use client';

import { useState, useEffect } from 'react';

export function useOnlineCount() {
  const [count, setCount] = useState(127);

  useEffect(() => {
    const id = setInterval(() => {
      setCount((prev) => {
        const delta = Math.floor(Math.random() * 7) - 3;
        return Math.max(90, Math.min(200, prev + delta));
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return count;
}