// cadmin-web/src/pages/Subscription-management/comps/SubscriptionDetailsModal.jsx (do not remove this comment)
// src/pages/Subscription-management/comps/SubscriptionDetailsModal.jsx

import { useState, useEffect } from "react";
import {
  X,
  Loader2,
  Building2,
  User,
  CreditCard,
  Calendar,
  Clock,
  AlertTriangle,
  Ban,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSubscriptionById } from "../../../api/cadminSubscriptions";
import { useToast } from "../../../components/common/Toast";
import {
  formatDate,
  formatDaysLeft,
  getDaysLeftStyle,
  getPaymentStatusBadge,
} from "../../../config/modules/subscriptionRiskConfig";

export default function SubscriptionDetailsModal({
  isOpen,
  subscription: basicSubscription,
  onClose,
  onActionComplete,
}) {
  const navigate = useNavigate();
  const toast = useToast();

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch full details when modal opens
  useEffect(() => {
    if (isOpen && basicSubscription?.subscription_id) {
      fetchDetails(basicSubscription.subscription_id);
    }
  }, [isOpen, basicSubscription?.subscription_id]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSubscription(null);
      setError(null);
    }
  }, [isOpen]);

  const fetchDetails = async (subscriptionId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getSubscriptionById(subscriptionId);
      const data = response.data?.data || response.data;
      setSubscription(data);
    } catch (err) {
      console.error("Failed to fetch subscription details:", err);
      setError(err.response?.data?.message || "Failed to load details");
      toast.error("Error", "Could not load subscription details");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Use basic data while loading full details
  const displayData = subscription || basicSubscription;

  // Determine status for styling
  const getStatusInfo = () => {
    if (!displayData) return { label: "Unknown", color: "gray", icon: Clock };

    if (!displayData.is_active) {
      return { label: "Suspended", color: "red", icon: Ban };
    }

    if (displayData.is_in_grace || displayData.grace_period_until) {
      const graceEnd = new Date(displayData.grace_period_until);
      if (graceEnd >= new Date()) {
        return { label: "In Grace Period", color: "amber", icon: AlertTriangle };
      }
    }

    if (displayData.days_until_expiry !== undefined && displayData.days_until_expiry <= 30) {
      return { label: "Expiring Soon", color: "blue", icon: Clock };
    }

    return { label: "Active", color: "emerald", icon: CheckCircle };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const handleViewShop = () => {
    const shopId = displayData?.shop_id || displayData?.shop?.shop_id;
    if (shopId) {
      navigate(`/shops?search=${shopId}`);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => onClose(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b bg-gradient-to-r ${
            statusInfo.color === "red"
              ? "from-red-500 to-red-600"
              : statusInfo.color === "amber"
              ? "from-amber-500 to-orange-500"
              : statusInfo.color === "blue"
              ? "from-blue-500 to-indigo-500"
              : "from-emerald-500 to-teal-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <StatusIcon size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {displayData?.shop_name || displayData?.shop?.business_name || "Subscription"}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-white/20 text-white text-xs font-medium rounded-full">
                    {statusInfo.label}
                  </span>
                  <span className="text-white/80 text-sm">
                    {displayData?.plan_name || displayData?.plan?.name || "Unknown Plan"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => onClose(false)}
              className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-gray-400" />
              <span className="ml-3 text-gray-500">Loading details...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-red-500">
              <AlertTriangle size={32} className="mb-2" />
              <p>{error}</p>
              <button
                onClick={() => fetchDetails(basicSubscription?.subscription_id)}
                className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Subscription Info */}
              <Section title="Subscription Details" icon={CreditCard}>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem
                    label="Status"
                    value={
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                        ${
                          statusInfo.color === "red"
                            ? "bg-red-100 text-red-700"
                            : statusInfo.color === "amber"
                            ? "bg-amber-100 text-amber-700"
                            : statusInfo.color === "blue"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        <StatusIcon size={12} />
                        {statusInfo.label}
                      </span>
                    }
                  />
                  <InfoItem
                    label="Payment Status"
                    value={
                      <PaymentBadge status={displayData?.payment_status} />
                    }
                  />
                  <InfoItem
                    label="Plan"
                    value={displayData?.plan_name || displayData?.plan?.name}
                  />
                  <InfoItem
                    label="Billing Cycle"
                    value={displayData?.billing_cycle || "Yearly"}
                  />
                </div>
              </Section>

              {/* Dates */}
              <Section title="Important Dates" icon={Calendar}>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem
                    label="Start Date"
                    value={formatDate(displayData?.start_date)}
                  />
                  <InfoItem
                    label="End Date"
                    value={formatDate(displayData?.end_date)}
                    highlight={displayData?.days_until_expiry <= 7}
                  />
                  <InfoItem
                    label="Grace Period Until"
                    value={formatDate(displayData?.grace_period_until) || "N/A"}
                  />
                  <InfoItem
                    label="Days Remaining"
                    value={
                      <span className={getDaysLeftStyle(displayData?.days_until_expiry || displayData?.days_left)}>
                        {formatDaysLeft(displayData?.days_until_expiry || displayData?.days_left)}
                      </span>
                    }
                  />
                </div>
              </Section>

              {/* Shop Info */}
              {(subscription?.shop || displayData) && (
                <Section title="Shop Information" icon={Building2}>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoItem
                      label="Business Name"
                      value={subscription?.shop?.business_name || displayData?.shop_name}
                    />
                    <InfoItem
                      label="Legal Name"
                      value={subscription?.shop?.legal_name || "—"}
                    />
                    <InfoItem
                      label="Location"
                      value={
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-gray-400" />
                          {subscription?.shop?.city || displayData?.shop_city},{" "}
                          {subscription?.shop?.state || displayData?.shop_state}
                        </span>
                      }
                    />
                    <InfoItem
                      label="GST Number"
                      value={subscription?.shop?.gst_number || "—"}
                    />
                  </div>
                </Section>
              )}

              {/* Owner Info */}
              {(subscription?.shop?.owner || displayData) && (
                <Section title="Owner Details" icon={User}>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoItem
                      label="Name"
                      value={subscription?.shop?.owner?.full_name || displayData?.owner_name}
                    />
                    <InfoItem
                      label="Email"
                      value={
                        <a
                          href={`mailto:${subscription?.shop?.owner?.email || displayData?.owner_email}`}
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Mail size={12} />
                          {subscription?.shop?.owner?.email || displayData?.owner_email || "—"}
                        </a>
                      }
                    />
                    <InfoItem
                      label="Phone"
                      value={
                        <a
                          href={`tel:${subscription?.shop?.owner?.phone_number || displayData?.owner_phone}`}
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Phone size={12} />
                          {subscription?.shop?.owner?.phone_number || displayData?.owner_phone || "—"}
                        </a>
                      }
                    />
                  </div>
                </Section>
              )}

              {/* Payment History */}
              {subscription?.payment_history && subscription.payment_history.length > 0 && (
                <Section title="Recent Payments" icon={CreditCard}>
                  <div className="space-y-2">
                    {subscription.payment_history.slice(0, 5).map((tx) => (
                      <div
                        key={tx.transaction_id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            ₹{tx.amount?.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(tx.created_at)} via {tx.provider}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tx.status === "captured" || tx.status === "completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : tx.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            ID: {displayData?.subscription_id?.slice(0, 8)}...
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleViewShop}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ExternalLink size={16} />
              View Shop
            </button>
            <button
              onClick={() => onClose(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-[#05015A] rounded-lg hover:bg-[#0a0280]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

function Section({ title, icon: Icon, children }) {
  return (
    <div>
      <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
        <Icon size={16} className="text-gray-500" />
        {title}
      </h4>
      {children}
    </div>
  );
}

function InfoItem({ label, value, highlight = false }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p
        className={`text-sm font-medium ${
          highlight ? "text-red-600" : "text-gray-900"
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );
}

function PaymentBadge({ status }) {
  const badge = getPaymentStatusBadge(status);
  return (
    <span
      className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}