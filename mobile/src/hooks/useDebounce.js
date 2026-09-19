import { useState, useEffect } from 'react';

/**
 * Debounces a fast-updating state value (e.g. search input on mobile).
 *
 * @param {any} value - Input value to debounce
 * @param {number} delay - Delay in ms (default 300ms)
 * @returns {any} Debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
