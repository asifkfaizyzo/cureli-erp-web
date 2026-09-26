// cadmin-web/src/pages/shops-management/comps/tabs/ShopSubscriptionTab.jsx (do not remove this comment)
// src/components/Shops/tabs/ShopSubscriptionTab.jsx

import {
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Gift,
  Sparkles,
  Tag,
  Users,
  GitBranch,
} from "lucide-react";

const ShopSubscriptionTab = ({ shop }) => {
  if (!shop) return null;

  const currentSub = shop.currentSubscription;
  const allSubscriptions = shop.subscriptions || [];
  const transactions = shop.paymentTransactions || [];

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getPlanName = (plan) => {
    if (!plan) return "N/A";
    return plan.name || "Unknown Plan";
  };

  const formatLimit = (value) => {
    if (value === -1) return "Unlimited";
    return value ?? "N/A";
  };

  const getStatusBadge = (status, isActive) => {
    if (isActive && status === "active") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
          <CheckCircle size={10} /> Active
        </span>
      );
    }
    if (status === "expired" || !isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <XCircle size={10} /> Expired
        </span>
      );
    }
    if (status === "cancelled") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          <XCircle size={10} /> Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <Clock size={10} /> {status}
      </span>
    );
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return "N/A";
    const rupees = Number(price);
    if (rupees === 0) return "FREE";
    return `₹${rupees.toLocaleString("en-IN")}`;
  };

  const isPromoActive = (plan) => {
    if (!plan?.promo_free_until) return false;
    return new Date(plan.promo_free_until) > new Date();
  };

  const renderPromoBadges = (plan) => {
    if (!plan) return null;

    const badges = [];

    if (isPromoActive(plan)) {
      badges.push(
        <span
          key="promo"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
        >
          <Calendar size={10} />
          Free until {formatDate(plan.promo_free_until)}
        </span>
      );
    }

    if (plan.bonus_months && plan.bonus_months > 0) {
      badges.push(
        <span
          key="bonus"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"
        >
          <Gift size={10} />
          +{plan.bonus_months} months
        </span>
      );
    }

    if (plan.compare_at_price && plan.compare_at_price > plan.price) {
      const discount = Math.round(
        ((plan.compare_at_price - plan.price) / plan.compare_at_price) * 100
      );
      badges.push(
        <span
          key="discount"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700"
        >
          <Tag size={10} />
          {discount}% off
        </span>
      );
    }

    if (plan.type === "CUSTOM") {
      badges.push(
        <span
          key="custom"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700"
        >
          <Sparkles size={10} />
          Custom
        </span>
      );
    }

    return badges.length > 0 ? (
      <div className="flex flex-wrap gap-1.5 mt-2">{badges}</div>
    ) : null;
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <CreditCard size={16} className="text-gray-500" />
            Current Subscription
          </h3>
        </div>

        <div className="p-5">
          {currentSub ? (
            <div className="space-y-4">
              {/* Main Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Plan</p>
                  <p className="font-semibold text-gray-900">{getPlanName(currentSub.plan)}</p>
                  {renderPromoBadges(currentSub.plan)}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(currentSub.status, currentSub.is_active)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Billing Cycle</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {currentSub.billing_cycle || "Yearly"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Payment Status</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {currentSub.payment_status || "N/A"}
                  </p>
                </div>
              </div>

              {/* Dates & Limits */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Start Date</p>
                  <p className="font-medium text-gray-900">{formatDate(currentSub.start_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">End Date</p>
                  <p className="font-medium text-gray-900">{formatDate(currentSub.end_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Max Users</p>
                  <div className="flex items-center gap-1">
                    <Users size={14} className="text-gray-400" />
                    <span className="font-medium text-gray-900">{formatLimit(currentSub.user_limit_snapshot)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Max Branches</p>
                  <div className="flex items-center gap-1">
                    <GitBranch size={14} className="text-gray-400" />
                    <span className="font-medium text-gray-900">{formatLimit(currentSub.branch_limit_snapshot)}</span>
                  </div>
                </div>
              </div>

              {/* Price */}
              {currentSub.plan && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">Price:</span>
                    {currentSub.plan.compare_at_price && currentSub.plan.compare_at_price > currentSub.plan.price ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 line-through">
                          {formatPrice(currentSub.plan.compare_at_price)}
                        </span>
                        <span className="text-lg font-semibold text-emerald-600">
                          {formatPrice(currentSub.plan.price)}
                        </span>
                        <span className="text-xs text-gray-500">/year</span>
                      </div>
                    ) : (
                      <span className="text-lg font-semibold text-gray-900">
                        {formatPrice(currentSub.plan.price)}
                        <span className="text-xs text-gray-500 ml-1">/year</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CreditCard size={32} className="mx-auto text-gray-300 mb-2" />
              <p>No active subscription</p>
            </div>
          )}
        </div>
      </div>

      {/* Subscription History */}
      {allSubscriptions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" />
              Subscription History
              <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-xs">
                {allSubscriptions.length}
              </span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Plan</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Start</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">End</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {allSubscriptions.map((sub, index) => (
                  <tr
                    key={sub.subscription_id}
                    className={`border-b border-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{getPlanName(sub.plan)}</span>
                        {sub.plan?.bonus_months > 0 && (
                          <span className="text-xs text-emerald-600">+{sub.plan.bonus_months}mo</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          sub.plan?.type === "CUSTOM"
                            ? "bg-violet-100 text-violet-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {sub.plan?.type || "PRE_MADE"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(sub.start_date)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(sub.end_date)}</td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(sub.status, sub.is_active)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Transactions */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <CreditCard size={16} className="text-gray-500" />
              Recent Transactions
              <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-xs">
                {transactions.length}
              </span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Transaction ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Plan</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Amount</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Provider</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn, index) => (
                  <tr
                    key={txn.transaction_id}
                    className={`border-b border-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {txn.transaction_id?.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-gray-900">{getPlanName(txn.subscription?.plan)}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{formatPrice(txn.amount)}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{txn.provider}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          txn.status === "captured" || txn.status === "success"
                            ? "bg-emerald-100 text-emerald-700"
                            : txn.status === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(txn.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopSubscriptionTab;