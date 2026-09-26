// pharmacy-web/src/pages/marketplace-onboarding/components/GoLiveCelebration.jsx (do not remove this comment)
// src/pages/marketplace-onboarding/components/GoLiveCelebration.jsx

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Rocket, Sparkles, Globe, Zap } from "lucide-react";

const GoLiveCelebration = ({ onComplete, storeName = "Your Pharmacy" }) => {
  const [phase, setPhase] = useState(0);

  // Pre-compute particle data so random values don't re-roll on re-render
  const particles = useMemo(
    () =>
      [...Array(24)].map((_, i) => ({
        size: Math.random() * 4 + 2,
        angle: i * 15,
        distance: 120 + Math.random() * 180,
        duration: 1.2 + Math.random() * 0.6,
        delay: Math.random() * 0.3,
        color: i % 3 === 0 ? "#34d399" : i % 3 === 1 ? "#818cf8" : "#fbbf24",
      })),
    []
  );

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1200);
    const t2 = setTimeout(() => setPhase(2), 2200);
    const t3 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 5000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#010015]/95 backdrop-blur-xl"
    >
      {/* ── Background particles (phase 1+) ──────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {phase >= 1 &&
          particles.map((p, i) => (
            <motion.div
              key={`p-${i}`}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                left: "50%",
                top: "50%",
                marginLeft: -p.size / 2,
                marginTop: -p.size / 2,
                background: p.color,
              }}
              initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
              animate={{
                scale: [0, 1.5, 0],
                x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
                y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
                opacity: [0, 1, 0],
              }}
              transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
            />
          ))}
      </div>

      {/* ── Expanding rings (phase 1+) ───────────────────────── */}
      {phase >= 1 && (
        <>
          {[
            { size: 400, color: "border-emerald-500/20", dur: 1.5, d: 0 },
            { size: 600, color: "border-indigo-500/15", dur: 1.8, d: 0.15 },
            { size: 800, color: "border-emerald-400/10", dur: 2.2, d: 0.3 },
          ].map((ring, i) => (
            <motion.div
              key={`ring-${i}`}
              className={`absolute rounded-full border ${ring.color}`}
              initial={{ width: 0, height: 0, opacity: 0.6 }}
              animate={{ width: ring.size, height: ring.size, opacity: 0 }}
              transition={{ duration: ring.dur, ease: "easeOut", delay: ring.d }}
            />
          ))}
        </>
      )}

      {/* ── Single persistent center container ───────────────── */}
      <div className="relative z-10 flex flex-col items-center">
        {/*
          Everything lives here in one DOM tree.
          We crossfade layers instead of swapping nodes,
          so nothing jumps position.
        */}

        {/* ── Icon area (fixed 128×128 container) ────────────── */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* LAYER: Rocket (visible phase 0, fades out at phase 1) */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 1, scale: 1 }}
            animate={{
              opacity: phase >= 1 ? 0 : 1,
              scale: phase >= 1 ? 1.4 : 1,
            }}
            transition={{ duration: 0.35, ease: "easeIn" }}
            style={{ pointerEvents: phase >= 1 ? "none" : "auto" }}
          >
            {/* Glow */}
            <motion.div
              className="absolute w-24 h-24 rounded-full bg-indigo-500/20 blur-2xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />

            {/* Rocket box */}
            <motion.div
              className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20
                border border-indigo-500/30 flex items-center justify-center"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.4, repeat: Infinity }}
              >
                <Rocket size={40} className="text-indigo-400" />
              </motion.div>
            </motion.div>

            {/* Flames */}
            <motion.div
              className="absolute -bottom-1 flex gap-0.5"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.2, repeat: Infinity }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="rounded-full bg-gradient-to-b from-amber-400 to-orange-500"
                  style={{ width: 4 - i, height: 8 + i * 4 }}
                  animate={{
                    height: [8 + i * 4, 14 + i * 4, 8 + i * 4],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{ duration: 0.15 + i * 0.05, repeat: Infinity }}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* LAYER: Checkmark (fades in at phase 1, shrinks at phase 2) */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: phase >= 1 ? 1 : 0,
              scale: phase >= 2 ? 0.55 : phase >= 1 ? 1 : 0,
            }}
            transition={
              phase >= 2
                ? { duration: 0.5, ease: "easeInOut" }
                : { type: "spring", stiffness: 300, damping: 18, delay: phase >= 1 ? 0.05 : 0 }
            }
          >
            {/* Success glow */}
            <motion.div
              className="absolute w-44 h-44 rounded-full bg-emerald-500/10 blur-3xl"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: phase >= 1 ? 0.4 : 0,
                scale: phase >= 1 ? 1 : 0.5,
              }}
              transition={{ duration: 1 }}
            />

            {/* Circle + check */}
            <div className="relative w-28 h-28">
              {/* Ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-emerald-500/30"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: phase >= 1 ? 1 : 0,
                  opacity: phase >= 1 ? 1 : 0,
                }}
                transition={{ duration: 0.3, delay: 0.1 }}
              />

              {/* Filled */}
              <motion.div
                className="absolute inset-1.5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600"
                initial={{ scale: 0 }}
                animate={{ scale: phase >= 1 ? 1 : 0 }}
                transition={{ type: "spring", stiffness: 250, damping: 15, delay: 0.05 }}
              />

              {/* SVG check */}
              <svg className="absolute inset-0 w-full h-full p-7" viewBox="0 0 24 24" fill="none">
                <motion.path
                  d="M4 12.5L9.5 18L20 6"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: phase >= 1 ? 1 : 0 }}
                  transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
                />
              </svg>

              {/* Sparkles */}
              {[0, 90, 180, 270].map((angle, i) => (
                <motion.div
                  key={angle}
                  className="absolute"
                  style={{ top: "50%", left: "50%", marginTop: -6, marginLeft: -6 }}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                  animate={
                    phase >= 1
                      ? {
                          scale: [0, 1, 0],
                          x: Math.cos((angle * Math.PI) / 180) * 55,
                          y: Math.sin((angle * Math.PI) / 180) * 55,
                          opacity: [0, 1, 0],
                        }
                      : {}
                  }
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.06 }}
                >
                  <Sparkles size={12} className="text-amber-400" />
                </motion.div>
              ))}

              {/* Persistent pulse ring (phase 2+) */}
              {phase >= 2 && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-emerald-400"
                  animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                />
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Launching text (phase 0 only) ──────────────────── */}
        <motion.p
          className="text-white/40 text-sm font-medium mt-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 0 ? 1 : 0, y: phase >= 1 ? -8 : 0 }}
          transition={{ duration: 0.25 }}
        >
          Launching...
        </motion.p>

        {/* ── Text content (phase 2) ─────────────────────────── */}
        <motion.div
          className="flex flex-col items-center mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 15 }}
          transition={{ duration: 0.4, delay: phase >= 2 ? 0.1 : 0 }}
          style={{ pointerEvents: phase >= 2 ? "auto" : "none" }}
        >
          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 8 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full
              bg-emerald-500/10 border border-emerald-500/20 mb-4"
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-emerald-400"
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">
              Now Live
            </span>
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 8 }}
            transition={{ delay: 0.35 }}
            className="text-3xl lg:text-4xl font-bold text-white text-center mb-2"
          >
            You're Live!
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 8 }}
            transition={{ delay: 0.5 }}
            className="text-white/35 text-sm text-center max-w-sm leading-relaxed mb-2"
          >
            <span className="text-white/60 font-medium">{storeName}</span>{" "}
            is now visible on Cureli Mobile
          </motion.p>

          {/* Feature badges */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 8 }}
            transition={{ delay: 0.65 }}
            className="flex items-center gap-3 mt-4"
          >
            {[
              { icon: Globe, label: "Discoverable" },
              { icon: Zap, label: "Accepting Orders" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: phase >= 2 ? 1 : 0,
                  scale: phase >= 2 ? 1 : 0.8,
                }}
                transition={{ delay: 0.75 + i * 0.1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                  bg-white/[0.04] border border-white/[0.08]"
              >
                <item.icon size={12} className="text-white/30" />
                <span className="text-[11px] text-white/40 font-medium">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* Redirect hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 2 ? 1 : 0 }}
            transition={{ delay: 1.2 }}
            className="mt-8 flex items-center gap-2"
          >
            <motion.div
              className="w-1 h-1 rounded-full bg-white/20"
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-[10px] text-white/15">
              Redirecting you shortly...
            </span>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default GoLiveCelebration;