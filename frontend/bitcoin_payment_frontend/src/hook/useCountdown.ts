import { useEffect, useState, useRef, useCallback } from "react";

export function useCountdown({
  key = "countdownStart",
  duration = 300,
  onExpire,
  onStart,
}: {
  key?: string;
  duration?: number;
  onExpire?: () => void;
  onStart?: () => void;
}) {
  const [remaining, setRemaining] = useState<number>(duration);
  const [isActive, setIsActive] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clear = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
  };

  const updateCountdown = useCallback(
    (startTime: number) => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const newRemaining = duration - elapsed;

      if (newRemaining <= 0) {
        clear();
        setRemaining(0);
        localStorage.removeItem(key);
        if (onExpire) onExpire();
        return;
      }

      setRemaining(newRemaining);
    },
    [duration, key, onExpire]
  );

  const start = useCallback(() => {
    const stored = localStorage.getItem(key);
    const startTime = stored ? parseInt(stored) : Date.now();

    if (!stored) {
      localStorage.setItem(key, startTime.toString());
    }

    updateCountdown(startTime);

    intervalRef.current = setInterval(() => {
      updateCountdown(startTime);
    }, 1000);

    setIsActive(true);
    if (onStart) onStart();
  }, [key, updateCountdown]);

  const reset = useCallback(() => {
    clear();
    const newStart = Date.now();
    localStorage.setItem(key, newStart.toString());
    setRemaining(duration);

    intervalRef.current = setInterval(() => {
      updateCountdown(newStart);
    }, 1000);

    setIsActive(true);
  }, [duration, key, updateCountdown]);

  useEffect(() => {
    return () => clear(); // cleanup on unmount
  }, []);

  return { remaining, start, reset, isActive };
}
