import { useEffect, useState, useRef, useCallback } from "react";

export function useCountdown({
  key = "countdownStart",
  duration = 3,
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

  const removeKeyFromList = useCallback(() => {
    const keys = JSON.parse(localStorage.getItem("countdownKeys") || "[]");
    const filtered = keys.filter((k: string) => k !== key);
    localStorage.setItem("countdownKeys", JSON.stringify(filtered));
  }, [key]);

  const updateCountdown = useCallback(
    (startTime: number) => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const newRemaining = duration - elapsed;

      if (newRemaining <= 0) {
        clear();
        setRemaining(0);
        localStorage.removeItem(key);
        removeKeyFromList();
        if (onExpire) onExpire();
        return;
      }

      setRemaining(newRemaining);
    },
    [duration, key, onExpire, removeKeyFromList]
  );

  const registerKey = useCallback(() => {
    const keys = JSON.parse(localStorage.getItem("countdownKeys") || "[]");
    if (!keys.includes(key)) {
      keys.push(key);
      localStorage.setItem("countdownKeys", JSON.stringify(keys));
    }
  }, [key]);

  const start = useCallback(() => {
    const stored = localStorage.getItem(key);
    const startTime = stored ? parseInt(stored) : Date.now();

    if (!stored) {
      localStorage.setItem(key, startTime.toString());
    }

    registerKey();
    updateCountdown(startTime);

    intervalRef.current = setInterval(() => {
      updateCountdown(startTime);
    }, 1000);

    setIsActive(true);
    if (onStart) onStart();
  }, [key, updateCountdown, registerKey, onStart]);

  const reset = useCallback(() => {
    clear();
    const newStart = Date.now();
    localStorage.setItem(key, newStart.toString());
    registerKey();
    setRemaining(duration);

    intervalRef.current = setInterval(() => {
      updateCountdown(newStart);
    }, 1000);

    setIsActive(true);
  }, [duration, key, updateCountdown, registerKey]);

  useEffect(() => {
    return () => clear();
  }, []);

  return { remaining, start, reset, isActive };
}
