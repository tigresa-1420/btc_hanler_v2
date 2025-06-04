import { useEffect, useState, useRef, useCallback } from "react";

// Define el tipo de retorno del hook
interface CountdownReturn {
  remaining: number;
  start: () => void;
  reset: () => void;
  isActive: boolean;
}

export function useCountdown({
  duration = 3,
  onExpire,
  onStart,
}: {
  duration?: number;
  onExpire?: () => void;
  onStart?: () => void;
}): CountdownReturn {
  // <-- Añade el tipo de retorno aquí
  const [remaining, setRemaining] = useState<number>(duration);
  const [isActive, setIsActive] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
    startTimeRef.current = null;
  }, []);

  const updateCountdown = useCallback(() => {
    if (!startTimeRef.current) return;

    const now = Date.now();
    const elapsed = Math.floor((now - startTimeRef.current) / 1000);
    const newRemaining = duration - elapsed;

    if (newRemaining <= 0) {
      clear();
      setRemaining(0);
      onExpire?.();
      return;
    }

    setRemaining(newRemaining);
  }, [duration, onExpire, clear]);

  const start = useCallback(() => {
    clear();
    startTimeRef.current = Date.now();
    setRemaining(duration);
    setIsActive(true);

    intervalRef.current = setInterval(updateCountdown, 1000);
    onStart?.();
  }, [duration, updateCountdown, onStart, clear]);

  const reset = useCallback(() => {
    start();
  }, [start]);

  useEffect(() => {
    return () => clear();
  }, [clear]);

  return { remaining, start, reset, isActive };
}
