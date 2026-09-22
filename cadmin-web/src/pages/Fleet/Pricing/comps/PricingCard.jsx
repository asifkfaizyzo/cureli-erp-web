// cadmin-web/src/pages/Fleet/Pricing/comps/PricingCard.jsx
import { ChevronRight } from "lucide-react";

export default function PricingCard({ card, onClick }) {
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

      <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{card.title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed flex-1">{card.description}</p>

      <div className="flex items-center gap-1 mt-4 text-[#05015A] text-xs font-medium">
        <span>Manage</span>
        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
}