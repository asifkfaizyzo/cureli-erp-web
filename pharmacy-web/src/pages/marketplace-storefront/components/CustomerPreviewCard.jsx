// pharmacy-web/src/pages/marketplace-storefront/components/CustomerPreviewCard.jsx (do not remove this comment)
import { Store, Star, Truck, ShoppingBag, Image, Eye } from "lucide-react";

const CustomerPreviewCard = ({ storefront }) => (
  <div className="w-full max-w-[300px]">
    <p className="text-[10px] text-white/20 uppercase tracking-wider font-semibold mb-2.5 flex items-center gap-1.5">
      <Eye size={10} /> Customer Preview
    </p>

    <div className="rounded-2xl border border-white/10 bg-[#0a0a1a] overflow-hidden shadow-2xl shadow-black/40">

      {/* Banner */}
      <div className="h-24 bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-transparent relative overflow-hidden">
        {storefront?.banner_url ? (
          <img
            src={storefront.banner_url}
            alt="Banner"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Image size={18} className="text-white/10" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#0a0a1a]" />
      </div>

      {/* Logo + Name */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="flex items-end gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/[0.08] border-2 border-[#0a0a1a] flex items-center justify-center overflow-hidden flex-shrink-0">
            {storefront?.logo_url ? (
              <img
                src={storefront.logo_url}
                alt="Logo"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            ) : (
              <Store size={18} className="text-white/20" />
            )}
          </div>
          <div className="pb-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {storefront?.storefront_name || "Your Pharmacy"}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Star size={10} className="text-white/20 fill-white/10" />
              <span className="text-[10px] text-white/25">Not yet rated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="px-4 mt-3 flex items-center gap-1.5 flex-wrap">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-semibold text-emerald-400">
          <Truck size={8} /> Delivery
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-semibold text-blue-400">
          <ShoppingBag size={8} /> Pickup
        </span>
      </div>

      {/* Description */}
      <div className="px-4 mt-3 pb-4">
        <p className="text-[11px] text-white/30 leading-relaxed line-clamp-3">
          {storefront?.storefront_description || "No description set yet."}
        </p>
      </div>
    </div>
  </div>
);

export default CustomerPreviewCard;