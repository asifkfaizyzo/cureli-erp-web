// cadmin-web/src/pages/AppConfig/AppConfigPage.jsx (do not remove this comment)
// cadmin-web/src/pages/AppConfig/AppConfigPage.jsx

import { useNavigate } from "react-router-dom";
import {
  Images,
  LayoutGrid,
  ChevronRight,
  LayoutDashboard,
  Gift,
  Ticket,
} from "lucide-react";

const CONFIG_CARDS = [
  {
    id: "categories",
    title: "Category Display",
    description:
      "Manage images and visibility for the 12 marketplace category cards shown on the mobile home screen and All Categories grid.",
    icon: LayoutGrid,
    path: "/marketplace/app-config/categories",
  },
  {
    id: "banners",
    title: "Home Banners",
    description:
      "Configure the hero carousel slides and strip banners on the mobile home screen. Set images, text, and CTA actions for each.",
    icon: Images,
    path: "/marketplace/app-config/banners",
  },
  {
    id: "home-screen",
    title: "Home Screen Layout",
    description:
      "Control which sections appear on the mobile home screen, edit section titles and text, and manage the order and visibility of product feed categories.",
    icon: LayoutDashboard,
    path: "/marketplace/app-config/home-screen",
  },
  {
    id: "loyalty",
    title: "Loyalty Program",
    description:
      "Configure dynamic point earning rates, point valuation in rupees, minimum checkout requirements, order caps, and automated point expiry rules.",
    icon: Gift,
    path: "/marketplace/app-config/loyalty",
  },
  {
    id: "coupons",
    title: "Coupons & Discounts",
    description:
      "Create promotional codes, configure percentage or flat rupee discounts, enforce customer usage limits, and manage campaign validity periods.",
    icon: Ticket,
    path: "/marketplace/app-config/coupons",
  },
];

function ConfigCard({ card, onClick }) {
  const Icon = card.icon;

  return (
    <button
      onClick={onClick}
      className="
        group relative flex flex-col text-left
        bg-white border border-gray-200 rounded-2xl
        p-6 hover:border-[#05015A]/30 hover:shadow-md
        transition-all duration-200 cursor-pointer
      "
    >
      <div className="w-12 h-12 rounded-xl bg-[#05015A]/8 flex items-center justify-center mb-4 group-hover:bg-[#05015A]/12 transition-colors">
        <Icon size={22} className="text-[#05015A]" />
      </div>

      <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
        {card.title}
      </h3>
      <p className="text-xs text-gray-500 leading-relaxed flex-1">
        {card.description}
      </p>

      <div className="flex items-center gap-1 mt-4 text-[#05015A] text-xs font-medium">
        <span>Manage</span>
        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
}

export default function AppConfigPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-50">
      <div className="px-8 py-6 bg-white border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">App Configuration</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Control marketplace display, banners, promotions, and reward systems for Cureli mobile app customers.
        </p>
      </div>

      <div className="px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 max-w-5xl">
          {CONFIG_CARDS.map((card) => (
            <ConfigCard
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