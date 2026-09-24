// cadmin-web/src/pages/Communications/pages/Enquiries/components/EnquiryReplyModal.jsx (do not remove this comment)
import { X, Send, Loader2, AlertCircle, Mail, FileText, User } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { replyToEnquiry } from "../../../../../api/cadminEnquiries";
import { useToast } from "../../../../../components/common/Toast";
import { useAuth } from "../../../../../context/AuthContext";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
};

const EnquiryReplyModal = ({ enquiry, isOpen, onClose, onSuccess }) => {
  const toast = useToast();
  const { admin } = useAuth();
  
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && enquiry) {
      const defaultSubject = `Re: Enquiry ${enquiry.enquiry_number || ""}`;
      setFormData({
        subject: defaultSubject,
        message: "",
      });
      setErrors({});
    }
  }, [isOpen, enquiry]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isSubmitting, onClose]);

  const validate = useCallback(() => {
    const newErrors = {};

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = "Subject must be at least 5 characters";
    } else if (formData.subject.trim().length > 200) {
      newErrors.subject = "Subject must be less than 200 characters";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    } else if (formData.message.trim().length > 5000) {
      newErrors.message = "Message must be less than 5000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || !enquiry?.enquiry_id) return;

    setIsSubmitting(true);

    try {
      const response = await replyToEnquiry(enquiry.enquiry_id, {
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });

      let emailSent = false;
      if (response?.data?.data?.emailSent !== undefined) {
        emailSent = response.data.data.emailSent;
      } else if (response?.data?.emailSent !== undefined) {
        emailSent = response.data.emailSent;
      } else if (response?.emailSent !== undefined) {
        emailSent = response.emailSent;
      }

      if (emailSent) {
        toast.success("Reply Sent", `Email sent to ${enquiry.email}`);
      } else {
        toast.warning("Reply Saved", "Reply saved but email could not be sent.");
      }

      setFormData({ subject: "", message: "" });
      onSuccess?.();
    } catch (error) {
      console.error("Reply error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to send reply. Please try again.";
      toast.error("Reply Failed", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (!isOpen) return null;

  const adminName = admin?.name || admin?.username || "Admin";
  const adminEmail = admin?.email || "support@cureli.com";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 font-poppins">
          <motion.div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={() => !isSubmitting && onClose()}
          />

          <motion.div
            className="relative bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-3 bg-gradient-to-r from-[#000060] to-[#0000a0] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
                  <Send className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Reply to Enquiry</h2>
                  <p className="text-xs text-white/70">{enquiry?.enquiry_number}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Horizontal Content Layout */}
            <form onSubmit={handleSubmit} className="flex">
              {/* Left Panel - Original Message */}
              <div className="w-2/5 p-4 bg-gray-50 border-r border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Original Message
                  </span>
                </div>
                
                <div className="space-y-3">
                  {/* Customer Info */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#000060]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[#000060] font-bold text-sm">
                        {enquiry?.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm truncate">{enquiry?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{enquiry?.email}</p>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="p-3 bg-white rounded-lg border border-gray-200 max-h-40 overflow-y-auto custom-scrollbar">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {enquiry?.message}
                    </p>
                  </div>

                  {/* Reply From Info */}
                  <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs text-blue-700">Replying as:</span>
                    </div>
                    <p className="text-xs font-medium text-blue-900 mt-1 truncate">
                      {adminName} {adminEmail && `(${adminEmail})`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Panel - Reply Form */}
              <div className="w-3/5 p-4 flex flex-col">
                {/* Subject */}
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    maxLength={200}
                    className={`w-full px-3 py-2 border ${
                      errors.subject
                        ? "border-red-300 bg-red-50/50"
                        : "border-gray-200 focus:border-[#000060]"
                    } rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#000060]/10 disabled:opacity-50 transition-all`}
                    placeholder="Email subject line"
                  />
                  {errors.subject && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.subject}
                    </p>
                  )}
                </div>

                {/* Message */}
                <div className="flex-1 flex flex-col mb-3">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    maxLength={5000}
                    className={`flex-1 min-h-[180px] px-3 py-2 border ${
                      errors.message
                        ? "border-red-300 bg-red-50/50"
                        : "border-gray-200 focus:border-[#000060]"
                    } rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#000060]/10 resize-none disabled:opacity-50 transition-all leading-relaxed`}
                    placeholder="Type your response..."
                  />
                  <div className="flex justify-between mt-1">
                    {errors.message ? (
                      <p className="text-red-500 text-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.message}
                      </p>
                    ) : (
                      <span></span>
                    )}
                    <span className={`text-xs ${formData.message.length > 4500 ? "text-red-500" : "text-gray-400"}`}>
                      {formData.message.length.toLocaleString()}/5,000
                    </span>
                  </div>
                </div>

                {/* Email Notice & Actions */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email will be sent to <strong>{enquiry?.email}</strong></span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !formData.subject.trim() || !formData.message.trim()}
                      className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#000060] to-[#0000a0] rounded-lg hover:shadow-lg hover:shadow-[#000060]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Reply
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EnquiryReplyModal;
