// cadmin-web/src/pages/marketplace/Shops/comps/ShopOverviewTab.jsx (do not remove this comment)
// cadmin-web/src/pages/marketplace/Shops/comps/ShopOverviewTab.jsx
// Full updated file — only changes are: import AnimatePresence/motion,
// import EditStorefrontModal, add state + button + modal render

import {
  Store, MapPin, Phone, Mail, User, FileText,
  Calendar, CreditCard, ShieldOff, ShieldCheck,
  CheckCircle2, XCircle, Loader2, AlertTriangle, Edit2,
} from "lucide-react";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { blockMarketplaceShop } from "../../../../api/cadminMarketplaceShops";
import EditStorefrontModal from "./EditStorefrontModal";
import { resolveFileUrl } from "../../../../utils/resolveFileUrl";

// ── All existing helpers stay exactly the same ─────────────────
const fmt = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const InfoCard = ({ title, action, children }) => (
  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
    <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200
      flex items-center justify-between">
      <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
        {title}
      </h4>
      {action}
    </div>
    <div className="p-4 space-y-3">{children}</div>
  </div>
);

const Field = ({ icon: Icon, label, value, color = "gray" }) => (
  <div className="flex items-start gap-3">
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center
      flex-shrink-0 ${
        color === "emerald" ? "bg-emerald-50" :
        color === "amber" ? "bg-amber-50" :
        color === "red" ? "bg-red-50" : "bg-gray-50"
      }`}>
      <Icon size={14} className={
        color === "emerald" ? "text-emerald-600" :
        color === "amber" ? "text-amber-600" :
        color === "red" ? "text-red-600" : "text-gray-400"
      } />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">
        {label}
      </p>
      <div className="text-sm text-gray-800 mt-0.5 break-words">
        {value || "—"}
      </div>
    </div>
  </div>
);

const BlockSection = ({ shop, onUpdated }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isActive = shop.is_active;

  const handleToggle = async () => {
    setLoading(true);
    setError("");
    try {
      await blockMarketplaceShop(shop.shop_id, isActive);
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update shop status");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${
      isActive ? "bg-gray-50 border-gray-200" : "bg-red-50 border-red-200"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">Access Control</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isActive ? "Shop is currently accessible" : "Shop is blocked"}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold
          px-2.5 py-1 rounded-full border ${isActive
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-red-50 text-red-700 border-red-200"
          }`}>
          {isActive ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
          {isActive ? "Active" : "Blocked"}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-3 p-2.5 bg-red-100
          border border-red-200 rounded-lg">
          <AlertTriangle size={13} className="text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2
            text-sm font-medium rounded-lg transition-colors ${isActive
              ? "text-red-600 hover:bg-red-100 border border-red-200"
              : "text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
            }`}
        >
          {isActive ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
          {isActive ? "Block Shop" : "Unblock Shop"}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-600 text-center">
            {isActive
              ? "This will block the shop and suspend marketplace access."
              : "This will restore shop access."}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={loading}
              className="flex-1 py-2 text-sm text-gray-600 hover:bg-gray-200
                rounded-lg transition-colors border border-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleToggle}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2
                text-sm font-medium rounded-lg transition-colors disabled:opacity-50
                ${isActive
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              {loading
                ? "Processing..."
                : isActive ? "Confirm Block" : "Confirm Unblock"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main ───────────────────────────────────────────────────────
const ShopOverviewTab = ({ shop, onUpdated }) => {
  const mp = shop.marketplaceProfile;
  const [showEditStorefront, setShowEditStorefront] = useState(false);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 max-w-6xl">
        {/* Left Column */}
        <div className="space-y-4">
          <InfoCard title="Shop Information">
            <Field icon={Store} label="Business Name" value={shop.business_name} />
            <Field icon={FileText} label="Legal Name" value={shop.legal_name} />
            <Field icon={FileText} label="GST Number" value={shop.gst_number} />
            <Field
              icon={MapPin}
              label="Address"
              value={[
                shop.address_line_1, shop.address_line_2,
                shop.city, shop.state, shop.pincode,
              ].filter(Boolean).join(", ")}
            />
            <Field icon={Calendar} label="Registered" value={fmt(shop.created_at)} />
          </InfoCard>

          <InfoCard title="Owner Details">
            <Field icon={User} label="Full Name" value={shop.owner?.full_name} />
            <Field icon={Mail} label="Email" value={shop.owner?.email} />
            <Field icon={Phone} label="Phone" value={shop.owner?.phone_number} />
          </InfoCard>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Marketplace Profile — with Edit button */}
          <InfoCard
            title="Marketplace Profile"
            action={
              mp && (
                <button
                  onClick={() => setShowEditStorefront(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg
                    text-xs font-medium text-[#05015A] hover:bg-[#05015A]/[0.06]
                    border border-[#05015A]/20 transition-colors"
                >
                  <Edit2 size={11} />
                  Edit
                </button>
              )
            }
          >
            {mp ? (
              <>
                <Field
                  icon={Store}
                  label="Status"
                  value={
                    <span className={`inline-flex items-center text-xs
                      font-semibold px-2.5 py-1 rounded-full border ${
                        mp.marketplace_status === "LIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : mp.marketplace_status === "DRAFT"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : mp.marketplace_status === "SUSPENDED"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      }`}>
                      {mp.marketplace_status}
                    </span>
                  }
                  color={
                    mp.marketplace_status === "LIVE" ? "emerald" :
                    mp.marketplace_status === "DRAFT" ? "amber" :
                    mp.marketplace_status === "SUSPENDED" ? "red" : "gray"
                  }
                />

                {/* Logo thumbnail */}
                {mp.logo_url && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center
                      justify-center flex-shrink-0 overflow-hidden border border-gray-100">
                      <img
  src={resolveFileUrl(mp.logo_url)}
  alt="Logo"
  className="w-full h-full object-contain"
/>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-medium
                        uppercase tracking-wide">
                        Logo
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Uploaded</p>
                    </div>
                  </div>
                )}

                <Field icon={Store} label="Storefront Name" value={mp.storefront_name} />
                <Field icon={Phone} label="Support Phone" value={mp.support_phone} />
                <Field
                  icon={CheckCircle2}
                  label="Onboarding"
                  value={
                    mp.onboarding_completed ? (
                      <span className="text-emerald-600 font-medium">Completed</span>
                    ) : (
                      <span className="text-amber-600 font-medium">Incomplete</span>
                    )
                  }
                  color={mp.onboarding_completed ? "emerald" : "amber"}
                />
              </>
            ) : (
              <div className="text-center py-6">
                <Store size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No marketplace profile</p>
                <p className="text-xs text-gray-400 mt-1">Onboarding not started</p>
              </div>
            )}
          </InfoCard>

          <InfoCard title="Subscription">
            <Field
              icon={CreditCard}
              label="Plan"
              value={
                shop.currentSubscription ? (
                  <div className="space-y-1">
                    <p className="font-medium">
                      {shop.currentSubscription.plan?.name || "—"}
                    </p>
                    <p className={`text-xs ${
                      shop.currentSubscription.status === "active"
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}>
                      {shop.currentSubscription.status}
                    </p>
                    {shop.currentSubscription.end_date && (
                      <p className="text-xs text-gray-500">
                        Ends {fmt(shop.currentSubscription.end_date)}
                      </p>
                    )}
                  </div>
                ) : (
                  "No active subscription"
                )
              }
              color={
                shop.currentSubscription?.status === "active"
                  ? "emerald"
                  : "gray"
              }
            />
          </InfoCard>

          <BlockSection shop={shop} onUpdated={onUpdated} />
        </div>
      </div>

      {/* Edit Storefront Modal */}
      <AnimatePresence>
        {showEditStorefront && (
          <EditStorefrontModal
            shop={shop}
            onClose={() => setShowEditStorefront(false)}
            onSaved={() => {
              setShowEditStorefront(false);
              onUpdated();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ShopOverviewTab;