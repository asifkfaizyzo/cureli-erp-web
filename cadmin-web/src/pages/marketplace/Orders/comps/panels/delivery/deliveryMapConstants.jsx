// cadmin-web/src/pages/marketplace/Orders/comps/panels/delivery/deliveryMapConstants.jsx (do not remove this comment)
import { lightMapStyle } from "../../../../../../constants/mapStyle";

// ─────────────────────────────────────────────
// SHARED UI PRIMITIVES (used across delivery sub-components)
// ─────────────────────────────────────────────

export const SectionTitle = ({ icon: Icon, title, action = null }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-md bg-[#05015A]/5 flex items-center justify-center flex-shrink-0">
        <Icon size={12} className="text-[#05015A]" />
      </div>
      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
        {title}
      </p>
    </div>
    {action}
  </div>
);

export const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-xl border border-gray-200/60 p-4 shadow-sm ${className}`}
  >
    {children}
  </div>
);

// ─────────────────────────────────────────────
// MAP CONSTANTS & CONFIGURATION
// ─────────────────────────────────────────────

export const MAP_OPTIONS = {
  styles: lightMapStyle,
  disableDefaultUI: true,
  zoomControl: true,
  clickableIcons: false,
  gestureHandling: "cooperative",
};

export const PHARMACY_MARKER_SVG = {
  path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  fillColor: "#05015A",
  fillOpacity: 1,
  strokeWeight: 1.5,
  strokeColor: "#FFFFFF",
  scale: 1.4,
  anchor: { x: 12, y: 22 },
};

export const CUSTOMER_MARKER_SVG = {
  path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  fillColor: "#6A20CD",
  fillOpacity: 1,
  strokeWeight: 1.5,
  strokeColor: "#FFFFFF",
  scale: 1.4,
  anchor: { x: 12, y: 22 },
};

const CIRCLE_SVG_PATH = "M 0, 0 m -6, 0 a 6,6 0 1,0 12,0 a 6,6 0 1,0 -12,0";

export const RIDER_DOT_SVG = (isBusy, isSelected) => ({
  path: CIRCLE_SVG_PATH,
  fillColor: isSelected ? "#05015A" : isBusy ? "#F59E0B" : "#10B981",
  fillOpacity: 1,
  strokeWeight: isSelected ? 2.5 : 1.5,
  strokeColor: "#FFFFFF",
  scale: isSelected ? 1.4 : 1.1,
});

export const ROUTE_LINE_OPTIONS = {
  strokeColor: "#6366F1",
  strokeOpacity: 0.8,
  strokeWeight: 3,
  icons: [
    {
      icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 2 },
      offset: "0",
      repeat: "10px",
    },
  ],
};

// ─────────────────────────────────────────────
// FORMATTING / MATH HELPERS
// ─────────────────────────────────────────────

export const fmtTime = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return (
    Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.3 * 100) /
    100
  );
}