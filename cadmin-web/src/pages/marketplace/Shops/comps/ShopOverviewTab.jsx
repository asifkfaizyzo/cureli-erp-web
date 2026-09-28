// cadmin-web/src/pages/marketplace/Shops/comps/ShopOverviewTab.jsx (do not remove this comment)
// cadmin-web/src/pages/marketplace/Shops/comps/ShopOverviewTab.jsx

import {
  Store,
  MapPin,
  Phone,
  Mail,
  User,
  FileText,
  Calendar,
  CreditCard,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Edit2,
  Wallet,
  Lock,
  Database,
  ChevronDown,
  ChevronUp,
  Globe,
  EyeOff,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toggleShopMarketplaceVisibility } from "../../../../api/cadminMarketplaceShops";
import EditStorefrontModal from "./EditStorefrontModal";
import EditBankDetailsModal from "./EditBankDetailsModal";
import { resolveFileUrl } from "../../../../utils/resolveFileUrl";

const fmt = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const InfoCard = ({ title, action, children }) => (
  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
    <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
        {title}
      </h4>
      {action}
    </div>
    <div className="p-4 space-y-3">{children}</div>
  </div>
);

const Field = ({ icon: Icon, label, value, color = "gray" }) => (
  <div className="flex items-start gap-3">
    <div
      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        color === "emerald"
          ? "bg-emerald-50"
          : color === "amber"
            ? "bg-amber-50"
            : color === "red"
              ? "bg-red-50"
              : "bg-gray-50"
      }`}
    >
      <Icon
        size={14}
        className={
          color === "emerald"
            ? "text-emerald-600"
            : color === "amber"
              ? "text-amber-600"
              : color === "red"
                ? "text-red-600"
                : "text-gray-400"
        }
      />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
        {label}
      </p>
      <div className="text-sm text-gray-800 mt-0.5 break-words">
        {value || "—"}
      </div>
    </div>
  </div>
);

// ── NEW: Marketplace Visibility Toggle Card ────────────────────
const VisibilityToggleCard = ({ shop, onUpdated }) => {
  const mp = shop.marketplaceProfile;
  const isVerified = mp?.marketplace_status === "LIVE";
  const isVisible = mp?.is_live === true;
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleToggle = async () => {
    if (!isVerified) return;
    setToggling(true);
    setError("");
    try {
      await toggleShopMarketplaceVisibility(shop.shop_id, !isVisible);
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to toggle visibility");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div
      className={`p-5 rounded-xl border-2 transition-all ${
        !isVerified
          ? "bg-gray-50 border-gray-200"
          : isVisible
            ? "bg-emerald-50/50 border-emerald-200"
            : "bg-orange-50/50 border-orange-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              !isVerified
                ? "bg-gray-100"
                : isVisible
                  ? "bg-emerald-100"
                  : "bg-orange-100"
            }`}
          >
            {!isVerified ? (
              <XCircle size={22} className="text-gray-400" />
            ) : isVisible ? (
              <Globe size={22} className="text-emerald-600" />
            ) : (
              <EyeOff size={22} className="text-orange-500" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">
              Visible on Marketplace
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {!isVerified
                ? "Shop must be Verified before it can be visible"
                : isVisible
                  ? "Customers can see this shop and place orders"
                  : "Shop is hidden from customer search results"}
            </p>
          </div>
        </div>

        {isVerified && (
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`relative inline-flex items-center rounded-full transition-colors flex-shrink-0 ${
              isVisible ? "bg-emerald-500" : "bg-gray-300"
            } ${toggling ? "opacity-60 cursor-wait" : "cursor-pointer"}`}
            style={{ width: "48px", height: "26px" }}
          >
            {toggling && (
              <Loader2
                size={12}
                className="animate-spin text-white absolute left-1/2 -translate-x-1/2"
              />
            )}
            {!toggling && (
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                  isVisible ? "translate-x-[22px]" : "translate-x-[3px]"
                }`}
              />
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Link to main shop page for blocking/suspension */}
      <div className="mt-4 pt-3 border-t border-gray-200/60">
        <button
          onClick={() =>
            navigate(`/shops?search=${encodeURIComponent(shop.business_name)}`)
          }
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#05015A] transition-colors"
        >
          <ExternalLink size={12} />
          Block / Suspend shop → Go to Shop Management
        </button>
      </div>
    </div>
  );
};

// ── Main ───────────────────────────────────────────────────────
const ShopOverviewTab = ({ shop, onUpdated }) => {
  const mp = shop.marketplaceProfile;
  const [showEditStorefront, setShowEditStorefront] = useState(false);
  const [showEditBank, setShowEditBank] = useState(false);
  const [draftOpen, setDraftOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 max-w-6xl">
        {/* Left Column */}
        <div className="space-y-4">
          {/* ── Visibility Toggle (prominent, top of page) ── */}
          <VisibilityToggleCard shop={shop} onUpdated={onUpdated} />

          <InfoCard title="Shop Information">
            <Field
              icon={Store}
              label="Business Name"
              value={shop.business_name}
            />
            <Field icon={FileText} label="Legal Name" value={shop.legal_name} />
            <Field icon={FileText} label="GST Number" value={shop.gst_number} />
            <Field
              icon={MapPin}
              label="Address"
              value={[
                shop.address_line_1,
                shop.address_line_2,
                shop.city,
                shop.state,
                shop.pincode,
              ]
                .filter(Boolean)
                .join(", ")}
            />
            <Field
              icon={Calendar}
              label="Registered Date"
              value={fmt(shop.created_at)}
            />
          </InfoCard>

          <InfoCard title="Owner Details">
            <Field
              icon={User}
              label="Full Name"
              value={shop.owner?.full_name}
            />
            <Field icon={Mail} label="Email" value={shop.owner?.email} />
            <Field
              icon={Phone}
              label="Phone"
              value={shop.owner?.phone_number}
            />
          </InfoCard>

          <InfoCard
            title="Banking & Payout Details"
            action={
              mp && (
                <button
                  onClick={() => setShowEditBank(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#05015A] hover:bg-[#05015A]/[0.06] border border-[#05015A]/20 transition-colors"
                >
                  <Edit2 size={11} /> Edit Bank
                </button>
              )
            }
          >
            {mp ? (
              <div className="space-y-3">
                <Field
                  icon={User}
                  label="Account Holder"
                  value={mp.bank_account_holder}
                />
                <Field icon={Wallet} label="Bank Name" value={mp.bank_name} />
                <Field
                  icon={MapPin}
                  label="Branch Name"
                  value={mp.bank_branch_name}
                />
                <Field icon={Lock} label="IFSC Code" value={mp.bank_ifsc} />
                <Field
                  icon={CreditCard}
                  label="Account Number"
                  value={mp.bank_account_number}
                />
                <Field icon={FileText} label="MMID" value={mp.bank_mmid} />
                <Field icon={FileText} label="UPI VPA" value={mp.bank_vpa} />
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">
                No marketplace profile yet
              </p>
            )}
          </InfoCard>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <InfoCard
            title="Marketplace Profile"
            action={
              mp && (
                <button
                  onClick={() => setShowEditStorefront(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#05015A] hover:bg-[#05015A]/[0.06] border border-[#05015A]/20 transition-colors"
                >
                  <Edit2 size={11} /> Edit Assets
                </button>
              )
            }
          >
            {mp ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Field
                    icon={Store}
                    label="Status"
                    value={
                      <span
                        className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          mp.marketplace_status === "LIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : mp.marketplace_status === "DRAFT"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : mp.marketplace_status === "SUSPENDED"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {mp.marketplace_status === "LIVE"
                          ? "Verified"
                          : mp.marketplace_status}
                      </span>
                    }
                  />
                  <Field
                    icon={CheckCircle2}
                    label="Onboarding"
                    value={
                      mp.onboarding_completed ? (
                        <span className="text-emerald-600 font-bold text-xs">
                          Complete
                        </span>
                      ) : (
                        <span className="text-amber-600 font-bold text-xs">
                          Incomplete
                        </span>
                      )
                    }
                  />
                </div>

                {mp.banner_url && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                      Storefront Banner
                    </p>
                    <div className="w-full h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      <img
                        src={resolveFileUrl(mp.banner_url)}
                        alt="Banner"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {mp.logo_url && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200">
                      <img
                        src={resolveFileUrl(mp.logo_url)}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                        Store Logo
                      </p>
                      <p className="text-xs text-emerald-600 font-medium">
                        Uploaded
                      </p>
                    </div>
                  </div>
                )}

                <Field
                  icon={Store}
                  label="Storefront Name"
                  value={mp.storefront_name}
                />
                <Field
                  icon={Phone}
                  label="Support Contact"
                  value={mp.support_phone}
                />
                <Field
                  icon={FileText}
                  label="Description"
                  value={mp.storefront_description}
                />

                <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
                  <div className="text-[10px] text-gray-400">
                    Registered:{" "}
                    <span className="text-gray-600 font-medium">
                      {fmt(mp.created_at)}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 text-right">
                    Last Sync:{" "}
                    <span className="text-gray-600 font-medium">
                      {fmt(mp.updated_at)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <Store size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No marketplace profile</p>
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
                    <p className="font-semibold text-gray-800">
                      {shop.currentSubscription.plan?.name || "—"}
                    </p>
                    <p
                      className={`text-xs font-medium ${shop.currentSubscription.status === "active" ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {shop.currentSubscription.status?.toUpperCase()}
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
            />
          </InfoCard>

          {mp?.onboarding_draft && (
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <button
                onClick={() => setDraftOpen(!draftOpen)}
                className="w-full px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Database size={13} className="text-[#05015A]" /> Onboarding
                  Draft Data
                </span>
                {draftOpen ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>
              {draftOpen && (
                <div className="p-4 bg-gray-900 text-gray-300 font-mono text-xs rounded-b-lg overflow-x-auto max-h-64">
                  <pre>{JSON.stringify(mp.onboarding_draft, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
      <AnimatePresence>
        {showEditBank && (
          <EditBankDetailsModal
            shop={shop}
            onClose={() => setShowEditBank(false)}
            onSaved={() => {
              setShowEditBank(false);
              onUpdated();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ShopOverviewTab;
