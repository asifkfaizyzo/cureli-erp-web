// pharmacy-web/src/pages/marketplace-storefront/components/primitives/Toggle.jsx (do not remove this comment)
const Toggle = ({ enabled, onChange, disabled = false, size = "md" }) => {
  const dims = {
    lg: { track: "h-6 w-11",  knob: "h-4 w-4",     on: "translate-x-6",   off: "translate-x-1"   },
    md: { track: "h-5 w-9",   knob: "h-3.5 w-3.5", on: "translate-x-4.5", off: "translate-x-0.5" },
    sm: { track: "h-4 w-7",   knob: "h-3 w-3",     on: "translate-x-3.5", off: "translate-x-0.5" },
  }[size] ?? { track: "h-5 w-9", knob: "h-3.5 w-3.5", on: "translate-x-4.5", off: "translate-x-0.5" };

  return (
    <button
      type="button"
      onClick={() => !disabled && onChange?.(!enabled)}
      disabled={disabled}
      className={`
        relative inline-flex items-center rounded-full transition-colors flex-shrink-0
        ${dims.track}
        ${enabled ? "bg-emerald-500" : "bg-white/10"}
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <span className={`
        inline-block rounded-full bg-white shadow transform transition-transform
        ${dims.knob} ${enabled ? dims.on : dims.off}
      `} />
    </button>
  );
};

export default Toggle;