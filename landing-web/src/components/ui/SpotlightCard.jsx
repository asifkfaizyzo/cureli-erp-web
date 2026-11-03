// landing-web/src/components/ui/SpotlightCard.jsx (do not remove this comment)

import { useRef, useState, useCallback } from "react";

const SpotlightCard = ({
  children,
  className = "",
  spotlightColor = "rgba(120, 119, 198, 0.3)",
  borderColor = "rgba(255, 255, 255, 0.1)",
  hoverBorderColor = "rgba(120, 119, 198, 0.5)",
}) => {
  const divRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = useCallback(
    (e) => {
      if (!divRef.current || isFocused) return;

      const rect = divRef.current.getBoundingClientRect();
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [isFocused]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setOpacity(0.8);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setOpacity(0);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setOpacity(0.8);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setOpacity(0);
  }, []);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-2xl transition-all duration-500 ease-out ${className}`}
      style={{
        border: `1px solid ${opacity > 0 ? hoverBorderColor : borderColor}`,
      }}
    >
      {/* Spotlight Gradient Effect */}
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-500 ease-in-out"
        style={{
          opacity,
          background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        }}
      />

      {/* Border Glow Effect */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500"
        style={{
          opacity: opacity * 0.5,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 60%)`,
          filter: "blur(20px)",
        }}
      />

      {/* Content */}
      <div className="relative z-20">{children}</div>
    </div>
  );
};

export default SpotlightCard;