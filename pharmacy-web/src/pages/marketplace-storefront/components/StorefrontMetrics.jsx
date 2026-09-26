// pharmacy-web/src/pages/marketplace-storefront/components/StorefrontMetrics.jsx (do not remove this comment)
import { Globe, Building2, Truck, ShoppingBag } from "lucide-react";
import MetricCard from "./primitives/MetricCard";

const StorefrontMetrics = ({
  storefront,
  isLive,
  isSuspended,
  enabledBranchCount,
  totalBranchCount,
  deliveryEnabledCount,
  pickupEnabledCount,
}) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    <MetricCard
      icon={Globe}
      label="Status"
      value={
        storefront?.marketplace_status === "LIVE"      ? "Live"      :
        storefront?.marketplace_status === "SUSPENDED" ? "Suspended" : "—"
      }
      accent={
        isLive      ? "bg-emerald-500/15" :
        isSuspended ? "bg-amber-500/15"   : "bg-white/[0.06]"
      }
    />
    <MetricCard
      icon={Building2}
      label="Active Branches"
      value={`${enabledBranchCount} / ${totalBranchCount}`}
    />
    <MetricCard
      icon={Truck}
      label="Delivery"
      value={
        deliveryEnabledCount > 0
          ? `${deliveryEnabledCount} branch${deliveryEnabledCount > 1 ? "es" : ""}`
          : "None enabled"
      }
    />
    <MetricCard
      icon={ShoppingBag}
      label="Pickup"
      value={
        pickupEnabledCount > 0
          ? `${pickupEnabledCount} branch${pickupEnabledCount > 1 ? "es" : ""}`
          : "None enabled"
      }
    />
  </div>
);

export default StorefrontMetrics;