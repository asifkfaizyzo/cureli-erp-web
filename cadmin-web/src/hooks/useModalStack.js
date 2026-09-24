// cadmin-web/src/hooks/useModalStack.js (do not remove this comment)
// cadmin/src/hooks/useModalStack.js

import { useState, useCallback, useRef } from "react";

const BASE_Z = 50;

export function useModalStack() {
  const counterRef = useRef(0);
  const [stack, setStack] = useState({});

  const bringToFront = useCallback((modalId) => {
    counterRef.current += 1;
    setStack((prev) => ({ ...prev, [modalId]: counterRef.current }));
  }, []);

  const getZ = useCallback(
    (modalId) => {
      const order = stack[modalId] || 0;
      return BASE_Z + order;
    },
    [stack]
  );

  return { bringToFront, getZ };
}