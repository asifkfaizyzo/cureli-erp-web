// cadmin-web/src/pages/marketplace/Orders/comps/tabs/OverviewTab.jsx (do not remove this comment)
import {
  Store,
  User,
  MapPin,
  Copy,
  Check,
  CreditCard,
  Receipt,
  UserCircle,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "../../../../../components/common/Toast";

const fmtAmount = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const buildMapsUrl = (lat, lng) =>
  `https://www.google.com/maps/search/?api=1&query=${Number(lat)},${Number(lng)}`;

const CopyLocationButton = ({ latitude, longitude }) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  if (latitude == null || longitude == null) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildMapsUrl(latitude, longitude));
      setCopied(true);
      toast.success("Copied", "Maps pin link copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy Failed", "Unable to copy link.");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md border transition-all ${
        copied
          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
          : "bg-white text-[#05015A] border-gray-200 hover:bg-gray-50"
      }`}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy Pin"}
    </button>
  );
};

const SectionTitle = ({ icon: Icon, title, action }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-md bg-[#05015A]/5 flex items-center justify-center">
        <Icon size={12} className="text-[#05015A]" />
      </div>
      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
        {title}
      </p>
    </div>
    {action}
  </div>
);

const DetailRow = ({ label, value, mono = false }) => (
  <div className="flex items-start justify-between gap-4 py-1.5 border-b border-gray-50 last:border-0">
    <span className="text-xs text-gray-500 w-36 flex-shrink-0">{label}</span>
    <span
      className={`text-xs font-semibold text-gray-800 text-right ${mono ? "font-mono" : ""}`}
    >
      {value || "—"}
    </span>
  </div>
);

const Card = ({ children }) => (
  <div className="bg-white rounded-xl border border-gray-200/60 p-4 shadow-sm">
    {children}
  </div>
);

const FULFILLMENT_LABELS = {
  INSTANT_DELIVERY: "Instant Delivery",
  PICKUP: "Pickup",
  SAME_DAY: "Same Day Delivery",
  NEXT_DAY: "Next Day Delivery",
};

const OverviewTab = ({ order }) => {
  const isPickup = order.fulfillment_type === "PICKUP";

  // ── Correctness-check merge: delivery_fee + km_surcharge into one value ──
  const combinedDelivery = isPickup
    ? 0
    : parseFloat(
        ((Number(order.delivery_fee) || 0) + (Number(order.km_surcharge) || 0)).toFixed(2),
      );
  const deliveryLabel =
    !isPickup && order.distance_km > 0
      ? `Delivery Fee (${order.distance_km} km)`
      : isPickup
        ? "Delivery Fee (Pickup)"
        : "Delivery Fee";

  return (
    <div className="space-y-4">
      {/* Row 1: Shop, Customer, Delivery/Pickup Address */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card>
          <SectionTitle
            icon={Store}
            title="Shop & Branch"
            action={
              <CopyLocationButton
                latitude={order.branch?.latitude}
                longitude={order.branch?.longitude}
              />
            }
          />
          <DetailRow label="Shop" value={order.shop?.business_name} />
          <DetailRow
            label="Location"
            value={
              order.shop
                ? [order.shop.city, order.shop.state].filter(Boolean).join(", ")
                : null
            }
          />
          <DetailRow label="Branch" value={order.branch?.branch_name} />
          <DetailRow label="Branch Type" value={order.branch?.branch_type} />
        </Card>

        <Card>
          <SectionTitle icon={User} title="Customer" />
          <DetailRow label="Name" value={order.customer_name} />
          <DetailRow label="Phone" value={order.customer_phone} mono />
          <DetailRow label="Account" value={order.customer?.status} />
          <DetailRow label="Email" value={order.customer?.email} />
        </Card>

        <Card>
          <SectionTitle
            icon={MapPin}
            title={isPickup ? "Pickup Location" : "Delivery Address"}
            action={
              !isPickup ? (
                <CopyLocationButton
                  latitude={order.delivery_address?.latitude}
                  longitude={order.delivery_address?.longitude}
                />
              ) : null
            }
          />
          {isPickup && (
            <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-orange-50 border border-orange-200">
              <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">
                Customer Pickup — No delivery address
              </p>
              {order.customer_pickup_code && (
                <p className="text-xs font-extrabold text-orange-800 font-mono mt-1 tracking-widest">
                  Pickup Code: {order.customer_pickup_code}
                </p>
              )}
            </div>
          )}
          <div className="text-xs text-gray-700 leading-relaxed space-y-1 mt-1">
            {order.delivery_address?.recipient_name && (
              <p className="font-bold">
                {order.delivery_address.recipient_name}
                {order.delivery_address.recipient_phone
                  ? ` · ${order.delivery_address.recipient_phone}`
                  : ""}
              </p>
            )}
            <p>{order.delivery_address?.address_line_1}</p>
            {order.delivery_address?.address_line_2 && (
              <p>{order.delivery_address.address_line_2}</p>
            )}
            {order.delivery_address?.landmark && (
              <p className="text-gray-500 italic">
                Landmark: {order.delivery_address.landmark}
              </p>
            )}
            <p className="font-medium text-[#05015A]">
              {[
                order.delivery_address?.city,
                order.delivery_address?.state,
                order.delivery_address?.pincode,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        </Card>
      </div>

      {/* Row 2: Billing Breakdown, Payment Details, Patient Info */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card>
          <SectionTitle icon={Receipt} title="Billing Breakdown" />
          <div className="space-y-0">
            <DetailRow
              label="Fulfillment"
              value={FULFILLMENT_LABELS[order.fulfillment_type] || order.fulfillment_type}
            />
            <DetailRow label="Subtotal" value={fmtAmount(order.subtotal)} />
            <DetailRow
              label="Service Charge"
              value={fmtAmount(order.service_charge)}
            />
            <DetailRow
              label={deliveryLabel}
              value={isPickup || combinedDelivery === 0 ? "FREE" : fmtAmount(combinedDelivery)}
            />
            {Number(order.packing_charge) > 0 && (
              <DetailRow
                label="Packing Charge"
                value={fmtAmount(order.packing_charge)}
              />
            )}
            <DetailRow label="Tip" value={fmtAmount(order.tip)} />
            {order.gst_amount > 0 && (
              <>
                <div className="flex items-center justify-between gap-4 py-1.5 border-b border-gray-50">
                  <span className="text-xs text-gray-500 w-36 flex-shrink-0">
                    GST ({order.gst_rate}% · {order.gst_type === "IGST" ? "IGST" : "CGST+SGST"})
                  </span>
                  <span className="text-xs font-semibold text-gray-800 text-right">
                    {fmtAmount(order.gst_amount)}
                  </span>
                </div>
                {Array.isArray(order.gst_breakdown) && order.gst_breakdown.length > 0 && (
                  <div className="ml-4 space-y-0.5 py-1 border-b border-gray-50">
                    {order.gst_breakdown.map((g, i) => (
                      <div key={i} className="flex items-center justify-between gap-4 py-0.5">
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {g.component === "medicine_subtotal" ? "On Subtotal"
                            : g.component === "service_charge" ? "On Service"
                            : g.component === "delivery_charge" ? "On Delivery"
                            : g.component === "packing_charge" ? "On Packing"
                            : g.component}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          ₹{Number(g.base).toFixed(2)} × {order.gst_rate}% = ₹{Number(g.gst).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            {order.coupon_code && (
              <DetailRow
                label={`Coupon (${order.coupon_code})`}
                value={`-${fmtAmount(order.coupon_discount_amount)}`}
              />
            )}
            {order.loyalty_points_redeemed > 0 && (
              <DetailRow
                label={`Loyalty (${order.loyalty_points_redeemed} pts)`}
                value={`-${fmtAmount(order.loyalty_discount_amount)}`}
              />
            )}
            <div className="flex items-center justify-between gap-4 py-2 mt-1 border-t-2 border-gray-200">
              <span className="text-sm font-bold text-gray-900">
                Grand Total
              </span>
              <span className="text-sm font-extrabold text-[#05015A]">
                {fmtAmount(order.total_amount)}
              </span>
            </div>
            {order.loyalty_points_earned > 0 && (
              <p className="text-[10px] text-emerald-600 font-semibold mt-1 text-right">
                +{order.loyalty_points_earned} loyalty points earned
              </p>
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle icon={CreditCard} title="Payment Details" />
          <DetailRow label="Method" value={order.payment_method} />
          <DetailRow label="Status" value={order.payment_status} />
          {order.razorpay_order_id && (
            <DetailRow label="RZP Order" value={order.razorpay_order_id} mono />
          )}
          {order.razorpay_payment_id && (
            <DetailRow
              label="RZP Payment"
              value={order.razorpay_payment_id}
              mono
            />
          )}
          <DetailRow
            label="Auto Completed"
            value={order.auto_completed ? "Yes" : "No"}
          />
        </Card>

        <Card>
          <SectionTitle icon={UserCircle} title="Patient Info" />
          {order.patient_is_self ? (
            <p className="text-xs text-gray-500 font-medium">
              Patient is the account holder
            </p>
          ) : (
            <>
              <DetailRow label="Patient Name" value={order.patient_name} />
              <DetailRow
                label="Age"
                value={order.patient_age ? `${order.patient_age} yrs` : null}
              />
              <DetailRow label="Sex" value={order.patient_sex} />
            </>
          )}
          {order.notes && (
            <div className="mt-3 pt-2 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Notes
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">
                {order.notes}
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default OverviewTab;
