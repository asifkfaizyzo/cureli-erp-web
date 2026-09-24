// cadmin-web/src/pages/Fleet/Pricing/comps/FleetPricingPage.jsx (do not remove this comment)
// cadmin-web/src/pages/Fleet/Pricing/FleetPricingPage.jsx
import { useNavigate } from "react-router-dom";
import { BadgeIndianRupee, Trophy } from "lucide-react";
import PricingCard from "./comps/PricingCard";
import TeamRiderNotice from "./comps/TeamRiderNotice";

const PRICING_CARDS = [
  {
    id: "base-pay",
    title: "Base Pay & Surge Rules",
    description:
      "Configure the two-leg delivery fare model (rider → pharmacy → customer) with customizable distance slabs, minimum floor payouts, and manual surge multipliers for rain, festivals, and peak-demand windows.",
    icon: BadgeIndianRupee,
    path: "/fleet/pricing/base-pay",
  },
  {
    id: "incentives",
    title: "Incentives & Quests Engine",
    description:
      "Build reusable incentive templates with up to 6-tier reward steppers, set qualifying conditions (online hours, denials, cancellations), and assign daily, weekly, or holiday-special quests to riders on the calendar.",
    icon: Trophy,
    path: "/fleet/pricing/incentives",
  },
];

export default function FleetPricingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-50">
      <div className="px-8 py-6 bg-white border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Fleet Earnings & Pricing</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage rider compensation models, surge multipliers, and performance-based incentive campaigns.
        </p>
      </div>

      <div className="px-8 py-8 space-y-6">
        <div className="max-w-5xl">
          <TeamRiderNotice />
        </div>

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