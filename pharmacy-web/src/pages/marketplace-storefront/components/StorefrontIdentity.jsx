// pharmacy-web/src/pages/marketplace-storefront/components/StorefrontIdentity.jsx (do not remove this comment)
import { Store, Edit3, Image, Type, FileText, Phone } from "lucide-react";
import SectionCard from "./primitives/SectionCard";
import SectionHeader from "./primitives/SectionHeader";
import CustomerPreviewCard from "./CustomerPreviewCard";

const StorefrontIdentity = ({ storefront, isSuperAdmin, onEditBranding }) => (
  <SectionCard>
    <SectionHeader
      icon={Store}
      title="Storefront Identity"
      subtitle="How customers see your pharmacy in the app"
      action={
        isSuperAdmin && (
          <button
            onClick={onEditBranding}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-white/50 hover:text-white/70 transition-all"
          >
            <Edit3 size={12} />
            Edit Branding
          </button>
        )
      }
    />

    <div className="p-5">
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Left: Fields */}
        <div className="flex-1 space-y-5">

          {/* Logo + Banner */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-white/25 uppercase tracking-wider font-semibold mb-2">Logo</p>
              <div className="w-20 h-20 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center overflow-hidden">
                {storefront?.logo_url
                  ? <img src={storefront.logo_url} alt="Logo" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                  : <Image size={20} className="text-white/15" />
                }
              </div>
            </div>
            <div>
              <p className="text-[10px] text-white/25 uppercase tracking-wider font-semibold mb-2">Banner</p>
              <div className="h-20 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center overflow-hidden">
                {storefront?.banner_url ? (
                  <img src={storefront.banner_url} alt="Banner" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                ) : (
                  <div className="flex items-center gap-2 text-white/15">
                    <Image size={14} />
                    <span className="text-[11px]">1200 × 400</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <p className="text-[10px] text-white/25 uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1">
              <Type size={9} /> Storefront Name
            </p>
            <div className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
              <p className={`text-sm font-semibold ${storefront?.storefront_name ? "text-white/70" : "text-white/20 italic"}`}>
                {storefront?.storefront_name || "Not set"}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-[10px] text-white/25 uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1">
              <FileText size={9} /> Description
            </p>
            <div className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
              <p className={`text-xs leading-relaxed ${storefront?.storefront_description ? "text-white/40" : "text-white/20 italic"}`}>
                {storefront?.storefront_description || "No description set"}
              </p>
            </div>
          </div>

          {/* Support Phone */}
          <div>
            <p className="text-[10px] text-white/25 uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1">
              <Phone size={9} /> Support Phone
            </p>
            <div className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
              <p className={`text-sm font-mono ${storefront?.support_phone ? "text-white/60" : "text-white/20 italic"}`}>
                {storefront?.support_phone || "Not set"}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="lg:pl-4 lg:border-l border-white/[0.05] flex justify-center lg:justify-start">
          <CustomerPreviewCard storefront={storefront} />
        </div>
      </div>
    </div>
  </SectionCard>
);

export default StorefrontIdentity;