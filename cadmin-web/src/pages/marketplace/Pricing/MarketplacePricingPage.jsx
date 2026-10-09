// cadmin-web/src/pages/marketplace/Pricing/MarketplacePricingPage.jsx

import { useNavigate } from "react-router-dom";
import { Truck, Percent } from "lucide-react";
import PricingCard from "../../Fleet/Pricing/comps/PricingCard";

const PRICING_CARDS = [
  {
    id: "delivery",
    title: "Delivery Pricing",
    description:
      "Configure the service charges, delivery fees, per-km distance surcharges, and tip settings that customers pay on every marketplace order.",
    icon: Truck,
    path: "/marketplace/pricing/delivery",
  },
  {
    id: "commission",
    title: "Commission Rules",
    description:
      "Set the platform commission Cureli charges pharmacies on each marketplace order. Create multiple rate styles, assign custom rates to specific pharmacies, and temporarily waive commission.",
    icon: Percent,
    path: "/marketplace/pricing/commission",
  },
];

export default function MarketplacePricingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-50">
      <div className="px-8 py-6 bg-white border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">
          Marketplace Pricing & Commission
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Configure how customers are charged for delivery and how much Cureli
          earns from each pharmacy order.
        </p>
      </div>

      <div className="px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 max-w-5xl">
          {PRICING_CARDS.map((card) => (
            <PricingCard
              key={card.id}
              card={card}
              onClick={() => navigate(card.path)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}