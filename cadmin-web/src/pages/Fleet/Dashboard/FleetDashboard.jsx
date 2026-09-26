// cadmin-web/src/pages/Fleet/Dashboard/FleetDashboard.jsx (do not remove this comment)
import { Truck } from "lucide-react";

export default function FleetDashboard() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-gray-400">
      <Truck size={64} className="opacity-30" />
      <h2 className="text-xl font-semibold text-gray-500">Fleet Dashboard</h2>
      <p className="text-sm">Coming soon — KPIs, charts, and delivery stats.</p>
    </div>
  );
}