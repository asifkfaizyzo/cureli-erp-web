// pharmacy-web/src/pages/marketplace-onboarding/components/StorefrontPreviewCard.jsx (do not remove this comment)
// src/pages/marketplace-onboarding/components/StorefrontPreviewCard.jsx

import { Phone, Store, MapPin, Clock } from "lucide-react";

/**
 * Resolve a stored proxy path to a full URL for <img> rendering.
 * Stored value is always "/api/files/..." — prefix with backend origin.
 * Same helper as in StorefrontStep.jsx.
 */
const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${import.meta.env.VITE_API_URL}${url}`;
};

/**
 * Customer-facing storefront preview mock.
 * Shows exactly how the storefront will appear to customers.
 */
const StorefrontPreviewCard = ({
  storefront,
  branches = [],
  enabledBranchIds = [],
  branchConfigs = {},
}) => {
  const enabledBranches = branches.filter(
    (b) =>
      enabledBranchIds.includes(b.branch_id) &&
      branchConfigs[b.branch_id]?.marketplace_enabled
  );

  const logoSrc = resolveImageUrl(storefront.logo_url);
  const bannerSrc = resolveImageUrl(storefront.banner_url);

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Phone mockup frame */}
      <div className="relative bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl ring-1 ring-white/10">
        {/* Screen */}
        <div className="bg-white rounded-[2rem] overflow-hidden">

          {/* Banner */}
          <div className="relative h-28 flex items-end p-4">
            {bannerSrc ? (
              <img
                src={bannerSrc}
                alt="Banner"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600" />
            )}

            {/* Logo */}
            <div
              className="relative z-10 w-12 h-12 rounded-xl  shadow-lg
              flex items-center justify-center overflow-hidden"
            >
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store size={20} className="text-indigo-600" />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="p-4">
            <h3 className="font-bold text-gray-900 text-base leading-tight">
              {storefront.storefront_name || "Your Pharmacy Name"}
            </h3>
            <p className="text-gray-500 text-xs mt-1 leading-relaxed line-clamp-2">
              {storefront.storefront_description ||
                "Your pharmacy description will appear here."}
            </p>

            {/* Contact */}
            {storefront.support_phone && (
              <div className="flex items-center gap-1.5 mt-2">
                <Phone size={11} className="text-gray-400" />
                <span className="text-xs text-gray-500">
                  {storefront.support_phone}
                </span>
              </div>
            )}

            {/* Branches */}
            {enabledBranches.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Pickup / Delivery from
                </p>
                {enabledBranches.slice(0, 2).map((branch) => {
                  const config = branchConfigs[branch.branch_id] || {};
                  return (
                    <div
                      key={branch.branch_id}
                      className="flex items-start gap-2 mb-1.5"
                    >
                      <MapPin
                        size={11}
                        className="text-indigo-400 mt-0.5 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">
                          {branch.branch_name}
                        </p>
                        {config.is_24_hours ? (
                          <p className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Clock size={9} /> Open 24 hours
                          </p>
                        ) : config.opening_time ? (
                          <p className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Clock size={9} /> {config.opening_time} –{" "}
                            {config.closing_time}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                {enabledBranches.length > 2 && (
                  <p className="text-[10px] text-indigo-400 mt-1">
                    +{enabledBranches.length - 2} more locations
                  </p>
                )}
              </div>
            )}

            {/* CTA */}
            <button
              type="button"
              disabled
              className="w-full mt-3 py-2 bg-indigo-600 text-white text-xs
                font-semibold rounded-xl"
            >
              Order Now
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-white/30 text-xs mt-4">
        Customer view preview
      </p>
    </div>
  );
};

export default StorefrontPreviewCard;