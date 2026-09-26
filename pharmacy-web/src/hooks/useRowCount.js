// pharmacy-web/src/hooks/useRowCount.js (do not remove this comment)
import { useState, useEffect } from "react";

export default function useRowCount() {
  const [rows, setRows] = useState(10);

  const updateCount = () => {
    const w = window.innerWidth;

    if (w < 640) setRows(4);               // phones
    else if (w < 1024) setRows(5);         // tablets
    else if (w < 1366) setRows(6);        // laptops
    else if (w < 1920) setRows(13);        // full hd
    else setRows(14);                      // larger screens
  };

  useEffect(() => {
    updateCount();
    window.addEventListener("resize", updateCount);
    return () => window.removeEventListener("resize", updateCount);
  }, []);

  return rows;
}
