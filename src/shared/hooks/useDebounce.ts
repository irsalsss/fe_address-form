import { useEffect, useState } from "react";

/**
 * Returns a debounced copy of `value` that only updates after `delayMs` have
 * elapsed without a change. Use to throttle expensive reactions to fast-changing
 * input (e.g. keystrokes → network requests) without managing timers by hand.
 *
 * The timer resets on every `value` change, so only the final value in a burst
 * propagates. Cleanup clears any pending timer on unmount or change.
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
