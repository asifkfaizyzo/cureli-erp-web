// cadmin-web/src/hooks/useDebounce.js (do not remove this comment)
// cadmin-web/src/hooks/useDebounce.js

import { useState, useEffect } from "react";

/**
 * Debounce a value
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in ms (default 300)
 * @returns {any} - Debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
