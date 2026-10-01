import { useState, useEffect } from "react";
import {
  X,
  FileText,
  MapPin,
  User,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import {
  getPrescriptionRequestById,
  getPrescriptionRequestFileUrl,
} from "../../../../api/cadminPrescriptionRequests";

const RX_STATUS_BADGE = {
  PENDING: {
    label: "Pending",
    cls: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
  },
  PARTIALLY_RESPONDED: {
    label: "Partially Responded",
    cls: "bg-blue-100 text-blue-800",
    dot: "bg-blue-500",
  },
  FULLY_RESPONDED: {
    label: "Fully Responded",
    cls: "bg-violet-100 text-violet-800",
    dot: "bg-violet-500",
  },
  ACCEPTED: {
    label: "Accepted",
    cls: "bg-teal-100 text-teal-800",
    dot: "bg-teal-500",
  },
  COMPLETED: {
    label: "Completed",
    cls: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500",
  },
  EXPIRED: {
    label: "Expired",
    cls: "bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
  },
  CANCELLED: {
    label: "Cancelled",
    cls: "bg-red-100 text-red-700",
    dot: "bg-red-400",
  },
};

const RECIPIENT_STATUS_BADGE = {
  SENT: {
    label: "Sent (Pending)",
    cls: "bg-amber-100 text-amber-800",
    icon: Clock,
  },
  QUOTE_SENT: {
    label: "Quoted",
    cls: "bg-blue-100 text-blue-800",
    icon: CheckCircle2,
  },
  ACCEPTED: {
    label: "Accepted",
    cls: "bg-teal-100 text-teal-800",
    icon: CheckCircle2,
  },
  CONVERTED: {
    label: "Converted",
    cls: "bg-emerald-100 text-emerald-800",
    icon: CheckCircle2,
  },
  DECLINED: {
    label: "Declined",
    cls: "bg-red-100 text-red-700",
    icon: XCircle,
  },
  EXPIRED: {
    label: "Expired",
    cls: "bg-gray-100 text-gray-600",
    icon: AlertCircle,
  },
};

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PrescriptionRequestDetailModal = ({ requestId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileUrls, setFileUrls] = useState({});
  const [loadingFiles, setLoadingFiles] = useState(false);

  useEffect(() => {
    if (!requestId) return;
    setLoading(true);
    setError(null);

    getPrescriptionRequestById(requestId)
      .then((res) => {
        setData(res.data?.data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load request");
      })
      .finally(() => setLoading(false));
  }, [requestId]);

  // Fetch signed URLs for prescription files
  useEffect(() => {
    if (!data?.files?.length) return;
    setLoadingFiles(true);

    const fetchUrls = async () => {
      const urls = {};
      for (const file of data.files) {
        try {
          const res = await getPrescriptionRequestFileUrl(
            requestId,
            file.file_id,
          );
          urls[file.file_id] = res.data?.data?.url;
        } catch {
          urls[file.file_id] = null;
        }
      }
      setFileUrls(urls);
      setLoadingFiles(false);
    };

    fetchUrls();
  }, [data?.files, requestId]);

  const statusCfg = data
    ? RX_STATUS_BADGE[data.status] || {
        label: data.status,
        cls: "bg-gray-100 text-gray-700",
        dot: "bg-gray-400",
      }
    : null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center">
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {data?.request_number || "Prescription Request"}
              </h2>
              {statusCfg && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusCfg.cls}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}
                  />
                  {statusCfg.label}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-teal-600" />
            </div>
          )}

          {error && (
            <div className="text-center py-20 text-red-600 font-medium">
              {error}
            </div>
          )}

          {data && !loading && (
            <>
              {/* ── Customer Info ── */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Customer
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User size={14} className="text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {data.customer?.full_name || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={14} className="text-gray-400" />
                    <a
                      href={
                        data.customer?.phone
                          ? `tel:${data.customer.phone}`
                          : undefined
                      }
                      className="font-mono text-teal-700 hover:underline font-medium"
                    >
                      {data.customer?.phone || "—"}
                    </a>
                  </div>
                </div>
              </div>

              {/* ── Delivery Address ── */}
              {data.delivery_address && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Delivery Address
                  </h3>
                  <div className="flex items-start gap-2 text-sm text-gray-700">
                    <MapPin
                      size={14}
                      className="text-gray-400 mt-0.5 flex-shrink-0"
                    />
                    <span>
                      {[
                        data.delivery_address.address_line_1,
                        data.delivery_address.address_line_2,
                        data.delivery_address.landmark,
                        data.delivery_address.city,
                        data.delivery_address.state,
                        data.delivery_address.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                </div>
              )}

              {/* ── Prescription Files ── */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Prescription Files ({data.files?.length || 0})
                </h3>
                {loadingFiles ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                    <Loader2 size={16} className="animate-spin" /> Loading
                    files...
                  </div>
                ) : data.files?.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {data.files.map((file) => (
                      <div
                        key={file.file_id}
                        className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50"
                      >
                        {fileUrls[file.file_id] ? (
                          <a
                            href={fileUrls[file.file_id]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            {file.mime_type?.startsWith("image/") ? (
                              <img
                                src={fileUrls[file.file_id]}
                                alt={file.original_name}
                                className="w-full h-32 object-cover hover:opacity-90 transition-opacity"
                              />
                            ) : (
                              <div className="w-full h-32 flex flex-col items-center justify-center gap-2 text-gray-500">
                                <FileText size={24} />
                                <span className="text-xs truncate px-2 max-w-full">
                                  {file.original_name}
                                </span>
                              </div>
                            )}
                          </a>
                        ) : (
                          <div className="w-full h-32 flex items-center justify-center text-gray-400">
                            <ImageIcon size={24} />
                          </div>
                        )}
                        <div className="px-2 py-1.5 text-[10px] text-gray-500 truncate">
                          {file.original_name}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No files attached</p>
                )}
              </div>

              {/* ── Pharmacy Recipients ── */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Pharmacies ({data.recipients?.length || 0})
                </h3>
                {data.recipients?.map((r) => {
                  const rStatus = RECIPIENT_STATUS_BADGE[r.status] || {
                    label: r.status,
                    cls: "bg-gray-100 text-gray-700",
                    icon: AlertCircle,
                  };
                  const StatusIcon = rStatus.icon;

                  return (
                    <div
                      key={r.recipient_id}
                      className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">
                              {r.shop_name}
                            </span>
                            <span className="text-xs text-gray-400">
                              • {r.branch_name}
                            </span>
                            {r.distance_km != null && (
                              <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                {r.distance_km} km away
                              </span>
                            )}
                          </div>

                          {/* ── Branch / Shop Phone ── */}
                          {r.phone ? (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <a
                                href={`tel:${r.phone}`}
                                className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-md transition-colors"
                              >
                                <Phone size={11} className="text-teal-600" />
                                {r.phone}
                              </a>
                             
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              No phone number registered
                            </span>
                          )}
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0 self-start sm:self-auto ${rStatus.cls}`}
                        >
                          <StatusIcon size={12} />
                          {rStatus.label}
                        </span>
                      </div>

                      {r.decline_reason && (
                        <div className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
                          Reason: {r.decline_reason}
                        </div>
                      )}

                      {r.quote_items?.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-gray-600">
                            Quote Items:
                          </span>
                          <div className="bg-gray-50 rounded-lg overflow-hidden">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-gray-100 text-gray-600">
                                  <th className="text-left px-3 py-1.5">
                                    Medicine
                                  </th>
                                  <th className="text-center px-2 py-1.5">
                                    Qty
                                  </th>
                                  <th className="text-right px-3 py-1.5">
                                    Price
                                  </th>
                                  <th className="text-right px-3 py-1.5">
                                    Total
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {r.quote_items.map((item) => (
                                  <tr
                                    key={item.quote_item_id}
                                    className="border-t border-gray-100"
                                  >
                                    <td className="px-3 py-1.5">
                                      <span
                                        className={
                                          item.is_available
                                            ? "text-gray-900"
                                            : "text-red-500 line-through"
                                        }
                                      >
                                        {item.medicine_name}
                                      </span>
                                      {item.is_substitute && (
                                        <span className="ml-1 text-[9px] text-amber-600 font-bold">
                                          (Sub)
                                        </span>
                                      )}
                                      {!item.is_available && (
                                        <span className="ml-1 text-[9px] text-red-500 font-bold">
                                          (N/A)
                                        </span>
                                      )}
                                    </td>
                                    <td className="text-center px-2 py-1.5 text-gray-700">
                                      {item.quantity}
                                    </td>
                                    <td className="text-right px-3 py-1.5 text-gray-700">
                                      ₹{item.unit_price}
                                    </td>
                                    <td className="text-right px-3 py-1.5 font-semibold text-gray-900">
                                      ₹{item.line_total}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-4 text-[10px] text-gray-400">
                        <span>Sent: {fmtDate(r.sent_at)}</span>
                        {r.quote_sent_at && (
                          <span>Quoted: {fmtDate(r.quote_sent_at)}</span>
                        )}
                        {r.accepted_at && (
                          <span>Accepted: {fmtDate(r.accepted_at)}</span>
                        )}
                        {r.declined_at && (
                          <span>Declined: {fmtDate(r.declined_at)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Timeline ── */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-1 text-xs text-gray-500">
                <div>
                  <span className="font-semibold text-gray-700">Created:</span>{" "}
                  {fmtDate(data.created_at)}
                </div>
                {data.expires_at && (
                  <div>
                    <span className="font-semibold text-gray-700">
                      Expires:
                    </span>{" "}
                    {fmtDate(data.expires_at)}
                  </div>
                )}
                {data.completed_at && (
                  <div>
                    <span className="font-semibold text-gray-700">
                      Completed:
                    </span>{" "}
                    {fmtDate(data.completed_at)}
                  </div>
                )}
                {data.cancelled_at && (
                  <div>
                    <span className="font-semibold text-gray-700">
                      Cancelled:
                    </span>{" "}
                    {fmtDate(data.cancelled_at)}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionRequestDetailModal;
