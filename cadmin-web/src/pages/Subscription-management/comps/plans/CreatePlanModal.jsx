// cadmin-web/src/pages/Subscription-management/comps/plans/CreatePlanModal.jsx (do not remove this comment)
import {
  X,
  CreditCard,
  DollarSign,
  FileText,
  Users,
  Building2,
  Sparkles,
  Info,
  Loader2,
  ChevronDown,
  Tag,
  Calendar,
  Gift,
  Percent,
  TrendingDown,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useState } from "react";
import {
  BILLING,
  INTRO_TRIGGER_TYPE,
  INTRO_TRIGGER_CONFIG,
  getIntroPriceWarning,
} from "../../../../config/modules/subscriptionConfig";
import StyledDateFilter from "../../../../components/common/StyledDateFilter";

const initialFormState = {
  name: "",
  description: "",
  price: "",
  compare_at_price: "",
  usersLimit: "",
  branchesLimit: "",
  billingCycleMonths: 12,
  bonusMonths: "",
  promoFreeUntil: "",
  isFeatured: false,
  // Intro pricing
  introPrice: "",
  introTriggerType: "",
  introDurationYears: "",
  introEndDate: "",
};

export default function CreatePlanModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}) {
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [promoSectionOpen, setPromoSectionOpen] = useState(false);

  if (!isOpen) return null;

  // ── Derived state ────────────────────────────────────────────────────────

  const hasIntroPricing =
    formData.introPrice !== "" && formData.introTriggerType !== "";

  const introPriceWarning =
    formData.introPrice !== "" && formData.price !== ""
      ? getIntroPriceWarning(formData.introPrice, formData.price)
      : null;

  const hasPromoValues =
    formData.compare_at_price ||
    formData.bonusMonths ||
    formData.promoFreeUntil ||
    formData.introPrice;

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "introTriggerType") {
        if (value === INTRO_TRIGGER_TYPE.DURATION) {
          next.introEndDate = "";
        } else if (value === INTRO_TRIGGER_TYPE.DATE) {
          next.introDurationYears = "";
        } else {
          next.introDurationYears = "";
          next.introEndDate = "";
        }
      }

      if (field === "introPrice" && value === "") {
        next.introTriggerType = "";
        next.introDurationYears = "";
        next.introEndDate = "";
      }

      return next;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // ── Core fields ────────────────────────────────────────────────────────

    if (!formData.name.trim()) {
      newErrors.name = "Plan name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Plan name must be at least 3 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (
      formData.price === "" ||
      isNaN(Number(formData.price)) ||
      Number(formData.price) < 0
    ) {
      newErrors.price = "Valid price is required (0 for free)";
    }

    if (
      !formData.usersLimit ||
      isNaN(Number(formData.usersLimit)) ||
      Number(formData.usersLimit) < 1
    ) {
      newErrors.usersLimit = "At least 1 user required";
    }

    if (
      !formData.branchesLimit ||
      isNaN(Number(formData.branchesLimit)) ||
      Number(formData.branchesLimit) < 1
    ) {
      newErrors.branchesLimit = "At least 1 branch required";
    }

    // ── Promo fields ───────────────────────────────────────────────────────

    if (
      formData.compare_at_price !== "" &&
      formData.compare_at_price !== null
    ) {
      const comparePrice = Number(formData.compare_at_price);
      const actualPrice = Number(formData.price);
      if (isNaN(comparePrice) || comparePrice <= 0) {
        newErrors.compare_at_price = "Compare price must be a positive number";
      } else if (comparePrice <= actualPrice) {
        newErrors.compare_at_price =
          "Compare price must be greater than actual price";
      }
    }

    if (formData.bonusMonths !== "" && formData.bonusMonths !== null) {
      const bonus = Number(formData.bonusMonths);
      if (isNaN(bonus) || bonus < 0) {
        newErrors.bonusMonths = "Bonus months must be 0 or more";
      } else if (bonus > 12) {
        newErrors.bonusMonths = "Bonus months cannot exceed 12";
      }
    }

    if (formData.promoFreeUntil) {
      const promoDate = new Date(formData.promoFreeUntil);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (promoDate <= now) {
        newErrors.promoFreeUntil = "Promo date must be in the future";
      }
    }

    // ── Intro pricing fields ───────────────────────────────────────────────

    const hasIntroPrice =
      formData.introPrice !== "" && formData.introPrice !== null;
    const hasIntroTrigger =
      formData.introTriggerType !== "" && formData.introTriggerType !== null;

    if (hasIntroPrice && !hasIntroTrigger) {
      newErrors.introTriggerType = "Select when the intro period ends";
    }
    if (!hasIntroPrice && hasIntroTrigger) {
      newErrors.introPrice = "Intro price is required when a trigger is set";
    }

    if (hasIntroPrice) {
      const introVal = Number(formData.introPrice);
      if (isNaN(introVal) || introVal < 0) {
        newErrors.introPrice = "Intro price must be 0 or more";
      }
    }

    if (
      hasIntroTrigger &&
      formData.introTriggerType === INTRO_TRIGGER_TYPE.DURATION
    ) {
      if (
        formData.introDurationYears === "" ||
        formData.introDurationYears === null
      ) {
        newErrors.introDurationYears = "Duration (years) is required";
      } else {
        const dur = Number(formData.introDurationYears);
        if (isNaN(dur) || dur < 1) {
          newErrors.introDurationYears = "Duration must be at least 1 year";
        } else if (dur > 5) {
          newErrors.introDurationYears =
            "Intro duration cannot exceed 5 years";
        }
      }
    }

    if (
      hasIntroTrigger &&
      formData.introTriggerType === INTRO_TRIGGER_TYPE.DATE
    ) {
      if (!formData.introEndDate) {
        newErrors.introEndDate = "Intro end date is required";
      } else {
        const introDate = new Date(formData.introEndDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (introDate <= now) {
          newErrors.introEndDate = "Intro end date must be in the future";
        }
        if (formData.promoFreeUntil) {
          const promoDate = new Date(formData.promoFreeUntil);
          if (introDate <= promoDate) {
            newErrors.introEndDate =
              "Intro end date must be after the free promo date";
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate() || loading) return;

    const submitData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      max_users: Number(formData.usersLimit),
      max_branches: Number(formData.branchesLimit),
      billing_cycle_months: Number(formData.billingCycleMonths) || 12,
      is_featured: formData.isFeatured,
    };

    if (
      formData.compare_at_price !== "" &&
      formData.compare_at_price !== null
    ) {
      submitData.compare_at_price = Number(formData.compare_at_price);
    }

    if (
      formData.bonusMonths !== "" &&
      formData.bonusMonths !== null &&
      formData.bonusMonths !== undefined
    ) {
      submitData.bonus_months = Number(formData.bonusMonths);
    }

    if (formData.promoFreeUntil) {
      const d = new Date(formData.promoFreeUntil);
      d.setHours(23, 59, 59, 999);
      submitData.promo_free_until = d.toISOString();
    }

    if (formData.introPrice !== "" && formData.introTriggerType !== "") {
      submitData.intro_price = Number(formData.introPrice);
      submitData.intro_trigger_type = formData.introTriggerType;

      if (formData.introTriggerType === INTRO_TRIGGER_TYPE.DURATION) {
        submitData.intro_duration_years = Number(formData.introDurationYears);
      }

      if (
        formData.introTriggerType === INTRO_TRIGGER_TYPE.DATE &&
        formData.introEndDate
      ) {
        const d = new Date(formData.introEndDate);
        d.setHours(23, 59, 59, 999);
        submitData.intro_end_date = d.toISOString();
      }
    }

    onSubmit(submitData);
  };

  const handleClose = () => {
    if (loading) return;
    setFormData(initialFormState);
    setErrors({});
    setPromoSectionOpen(false);
    onClose();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl relative
                    overflow-hidden animate-[fadeIn_0.2s_ease-out]
                    max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header accent */}
        <div className="h-1.5 bg-gradient-to-r from-[#05015A] to-violet-600" />

        {/* Close */}
        <button
          className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100
                     hover:bg-[#05015A] hover:text-white transition-all duration-300
                     group z-10 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleClose}
          disabled={loading}
        >
          <X
            size={18}
            className="transition-transform duration-300 group-hover:rotate-90"
          />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#05015A]">
              Create New Plan
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              New plans are created as{" "}
              <span className="font-medium text-amber-600">DRAFT</span> and can
              be edited before activation
            </p>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg mb-6 text-xs">
            <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-blue-700">
              Draft plans can be edited freely. Once activated, plans become
              immutable and cannot be modified.
            </p>
          </div>

          {/* ── Core fields grid ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-4">
              {/* Plan Name */}
              <div>
                <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
                  <CreditCard size={14} />
                  Plan Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g., Premium Plan"
                  disabled={loading}
                  className={`w-full border-2 rounded-lg p-2.5 text-sm
                    focus:ring-2 focus:ring-[#05015A]/20 outline-none
                    transition-all duration-300
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    ${
                      errors.name
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-[#05015A] hover:border-[#05015A]/50"
                    }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
                  <FileText size={14} />
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Describe plan features and ideal customers..."
                  rows={4}
                  disabled={loading}
                  className={`w-full border-2 rounded-lg p-2.5 text-sm resize-none
                    focus:ring-2 focus:ring-[#05015A]/20 outline-none
                    transition-all duration-300
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    ${
                      errors.description
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-[#05015A] hover:border-[#05015A]/50"
                    }`}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Price */}
              <div>
                <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
                  <DollarSign size={14} />
                  Regular Price (per year)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05015A] font-medium">
                    {BILLING.currency}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                    placeholder="0 for free plan"
                    disabled={loading}
                    className={`w-full border-2 rounded-lg p-2.5 pl-8 text-sm
                      focus:ring-2 focus:ring-[#05015A]/20 outline-none
                      transition-all duration-300
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      ${
                        errors.price
                          ? "border-red-300 focus:border-red-500"
                          : "border-gray-200 focus:border-[#05015A] hover:border-[#05015A]/50"
                      }`}
                  />
                </div>
                {errors.price && (
                  <p className="text-red-500 text-xs mt-1">{errors.price}</p>
                )}
              </div>

              {/* Users & Branches */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
                    <Users size={14} />
                    Users Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usersLimit}
                    onChange={(e) => handleChange("usersLimit", e.target.value)}
                    placeholder="e.g., 10"
                    disabled={loading}
                    className={`w-full border-2 rounded-lg p-2.5 text-sm
                      focus:ring-2 focus:ring-[#05015A]/20 outline-none
                      transition-all duration-300
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      ${
                        errors.usersLimit
                          ? "border-red-300 focus:border-red-500"
                          : "border-gray-200 focus:border-[#05015A] hover:border-[#05015A]/50"
                      }`}
                  />
                  {errors.usersLimit && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.usersLimit}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
                    <Building2 size={14} />
                    Branches Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.branchesLimit}
                    onChange={(e) =>
                      handleChange("branchesLimit", e.target.value)
                    }
                    placeholder="e.g., 3"
                    disabled={loading}
                    className={`w-full border-2 rounded-lg p-2.5 text-sm
                      focus:ring-2 focus:ring-[#05015A]/20 outline-none
                      transition-all duration-300
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      ${
                        errors.branchesLimit
                          ? "border-red-300 focus:border-red-500"
                          : "border-gray-200 focus:border-[#05015A] hover:border-[#05015A]/50"
                      }`}
                  />
                  {errors.branchesLimit && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.branchesLimit}
                    </p>
                  )}
                </div>
              </div>

              {/* Featured toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-violet-50 border border-violet-100">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-violet-600" />
                  <div>
                    <p className="text-sm font-medium text-violet-900">
                      Featured Plan
                    </p>
                    <p className="text-xs text-violet-600">
                      Highlight this plan for visibility
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) =>
                      handleChange("isFeatured", e.target.checked)
                    }
                    disabled={loading}
                    className="sr-only peer"
                  />
                  <div
                    className="w-10 h-5 bg-gray-200 rounded-full peer
                                  peer-checked:bg-violet-600
                                  peer-focus:ring-2 peer-focus:ring-violet-300
                                  peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
                                  after:content-[''] after:absolute after:top-0.5 after:left-0.5
                                  after:bg-white after:rounded-full after:h-4 after:w-4
                                  after:transition-all peer-checked:after:translate-x-5
                                  transition-all"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* ── Promotional Options Accordion ────────────────────────────── */}
          <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden">
            {/* Accordion header */}
            <button
              type="button"
              onClick={() => setPromoSectionOpen((v) => !v)}
              className={`w-full flex items-center justify-between p-4
                transition-colors duration-200
                ${promoSectionOpen ? "bg-amber-50" : "bg-gray-50 hover:bg-gray-100"}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${promoSectionOpen ? "bg-amber-100" : "bg-gray-200"}`}
                >
                  <Tag
                    size={18}
                    className={
                      promoSectionOpen ? "text-amber-600" : "text-gray-500"
                    }
                  />
                </div>
                <div className="text-left">
                  <p
                    className={`text-sm font-semibold ${promoSectionOpen ? "text-amber-900" : "text-gray-700"}`}
                  >
                    Promotional Options
                  </p>
                  <p className="text-xs text-gray-500">
                    Configure discounts, bonus months, intro pricing, and launch
                    promotions
                  </p>
                </div>
                {hasPromoValues && !promoSectionOpen && (
                  <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    Configured
                  </span>
                )}
              </div>
              <ChevronDown
                size={20}
                className={`text-gray-400 transition-transform duration-300
                  ${promoSectionOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Accordion body */}
            {promoSectionOpen && (
              <div className="border-t border-gray-100 overflow-y-auto max-h-[60vh]">
                <div className="p-4 bg-white space-y-5">
                  {/* Info note */}
                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-xs">
                    <Info
                      size={14}
                      className="text-amber-600 mt-0.5 flex-shrink-0"
                    />
                    <p className="text-amber-800">
                      All promotional fields are optional. They help you run
                      marketing campaigns and introductory offers.
                    </p>
                  </div>

                  {/* ── Section A: Discount display ──────────────────────── */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Discount Display
                    </p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Compare-at price */}
                      <div>
                        <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
                          <Percent size={14} />
                          Compare-at Price (Optional)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                            {BILLING.currency}
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={formData.compare_at_price}
                            onChange={(e) =>
                              handleChange("compare_at_price", e.target.value)
                            }
                            placeholder="Original price (shown struck)"
                            disabled={loading}
                            className={`w-full border-2 rounded-lg p-2.5 pl-8 text-sm
                              focus:ring-2 focus:ring-amber-500/20 outline-none
                              transition-all duration-300
                              disabled:bg-gray-100 disabled:cursor-not-allowed
                              ${
                                errors.compare_at_price
                                  ? "border-red-300 focus:border-red-500"
                                  : "border-gray-200 focus:border-amber-500 hover:border-amber-300"
                              }`}
                          />
                        </div>
                        {errors.compare_at_price ? (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.compare_at_price}
                          </p>
                        ) : (
                          <p className="text-gray-400 text-xs mt-1">
                            Shown as strike-through price in UI
                          </p>
                        )}
                      </div>

                      {/* Bonus months */}
                      <div>
                        <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
                          <Gift size={14} />
                          Bonus Months (Optional)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="12"
                          step="1"
                          value={formData.bonusMonths}
                          onChange={(e) =>
                            handleChange("bonusMonths", e.target.value)
                          }
                          placeholder="e.g., 2 for +2 months free"
                          disabled={loading}
                          className={`w-full border-2 rounded-lg p-2.5 text-sm
                            focus:ring-2 focus:ring-amber-500/20 outline-none
                            transition-all duration-300
                            disabled:bg-gray-100 disabled:cursor-not-allowed
                            ${
                              errors.bonusMonths
                                ? "border-red-300 focus:border-red-500"
                                : "border-gray-200 focus:border-amber-500 hover:border-amber-300"
                            }`}
                        />
                        {errors.bonusMonths ? (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.bonusMonths}
                          </p>
                        ) : (
                          <p className="text-gray-400 text-xs mt-1">
                            Extra months on top of yearly plan (max 12)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Section B: Free promo until ───────────────────────── */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Launch Promotion
                    </p>
                    <div>
                      <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
                        <Calendar size={14} />
                        Free Until Date (Optional)
                      </label>
                      <div className="max-w-xs">
                        <StyledDateFilter
                          date={formData.promoFreeUntil}
                          setDate={(date) =>
                            handleChange("promoFreeUntil", date)
                          }
                        />
                      </div>
                      {errors.promoFreeUntil ? (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.promoFreeUntil}
                        </p>
                      ) : (
                        <p className="text-gray-400 text-xs mt-1">
                          Plan will be free for all shops until this date
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-dashed border-gray-200" />

                  {/* ── Section C: Intro / Two-phase pricing ─────────────── */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Two-Phase Pricing
                      </p>
                      <span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-[10px] font-semibold rounded-full">
                        New
                      </span>
                    </div>

                    <div className="p-3 bg-sky-50 rounded-lg border border-sky-100 mb-4">
                      <p className="text-xs text-sky-800">
                        <strong>How it works:</strong> Set a lower intro price
                        for the first phase, then subscribers automatically move
                        to the regular price after the intro period ends.
                        Example:{" "}
                        <em>₹999 for first 2 years, then ₹2999/year</em>
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Intro price input */}
                      <div>
                        <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
                          <TrendingDown size={14} />
                          Intro Price (Optional)
                        </label>
                        <div className="relative max-w-xs">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                            {BILLING.currency}
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={formData.introPrice}
                            onChange={(e) =>
                              handleChange("introPrice", e.target.value)
                            }
                            placeholder="e.g., 999"
                            disabled={loading}
                            className={`w-full border-2 rounded-lg p-2.5 pl-8 text-sm
                              focus:ring-2 focus:ring-sky-500/20 outline-none
                              transition-all duration-300
                              disabled:bg-gray-100 disabled:cursor-not-allowed
                              ${
                                errors.introPrice
                                  ? "border-red-300 focus:border-red-500"
                                  : "border-gray-200 focus:border-sky-500 hover:border-sky-300"
                              }`}
                          />
                        </div>
                        {errors.introPrice && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.introPrice}
                          </p>
                        )}

                        {introPriceWarning && (
                          <div
                            className="flex items-start gap-2 mt-2 p-2.5 bg-amber-50
                                            border border-amber-200 rounded-lg"
                          >
                            <AlertTriangle
                              size={14}
                              className="text-amber-600 mt-0.5 flex-shrink-0"
                            />
                            <p className="text-xs text-amber-800">
                              {introPriceWarning}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Trigger type selector */}
                      {formData.introPrice !== "" && (
                        <div>
                          <label className="text-xs font-medium text-[#05015A] mb-2 flex items-center gap-1.5">
                            <Clock size={14} />
                            When does the intro period end?
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.values(INTRO_TRIGGER_TYPE).map((type) => {
                              const config = INTRO_TRIGGER_CONFIG[type];
                              const isSelected =
                                formData.introTriggerType === type;
                              return (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() =>
                                    handleChange("introTriggerType", type)
                                  }
                                  disabled={loading}
                                  className={`p-3 rounded-xl border-2 text-left transition-all
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    ${
                                      isSelected
                                        ? "border-sky-500 bg-sky-50"
                                        : "border-gray-200 hover:border-sky-300 hover:bg-sky-50/50"
                                    }`}
                                >
                                  <p
                                    className={`text-sm font-semibold mb-0.5
                                    ${isSelected ? "text-sky-700" : "text-gray-700"}`}
                                  >
                                    {config.label}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {config.description}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                          {errors.introTriggerType && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.introTriggerType}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Duration input */}
                      {formData.introTriggerType ===
                        INTRO_TRIGGER_TYPE.DURATION && (
                        <div className="pl-4 border-l-2 border-sky-200">
                          <label className="text-xs font-medium text-[#05015A] mb-1.5 block">
                            Intro Duration (years)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            step="1"
                            value={formData.introDurationYears}
                            onChange={(e) =>
                              handleChange("introDurationYears", e.target.value)
                            }
                            placeholder="e.g., 2"
                            disabled={loading}
                            className={`w-full max-w-xs border-2 rounded-lg p-2.5 text-sm
                              focus:ring-2 focus:ring-sky-500/20 outline-none
                              transition-all duration-300
                              disabled:bg-gray-100 disabled:cursor-not-allowed
                              ${
                                errors.introDurationYears
                                  ? "border-red-300 focus:border-red-500"
                                  : "border-gray-200 focus:border-sky-500"
                              }`}
                          />
                          <p className="text-gray-400 text-xs mt-1">
                            Customer pays intro price for this many yearly
                            renewals (max 5 years)
                          </p>
                          {errors.introDurationYears && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.introDurationYears}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Date input */}
                      {formData.introTriggerType ===
                        INTRO_TRIGGER_TYPE.DATE && (
                        <div className="pl-4 border-l-2 border-sky-200">
                          <label className="text-xs font-medium text-[#05015A] mb-1.5 block">
                            {
                              INTRO_TRIGGER_CONFIG[INTRO_TRIGGER_TYPE.DATE]
                                .inputLabel
                            }
                          </label>
                          <div className="max-w-xs">
                            <StyledDateFilter
                              date={formData.introEndDate}
                              setDate={(date) =>
                                handleChange("introEndDate", date)
                              }
                            />
                          </div>
                          {formData.promoFreeUntil && (
                            <p className="text-gray-400 text-xs mt-1">
                              Must be after free promo date (
                              {new Date(
                                formData.promoFreeUntil,
                              ).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                              )
                            </p>
                          )}
                          {errors.introEndDate && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.introEndDate}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Live preview */}
                      {hasIntroPricing && (
                        <div className="p-3 bg-sky-50 rounded-xl border border-sky-200">
                          <p className="text-xs font-semibold text-sky-800 mb-2">
                            Pricing Preview:
                          </p>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-5 h-5 rounded-full bg-sky-500 text-white
                                                text-[10px] font-bold flex items-center justify-center
                                                flex-shrink-0"
                              >
                                1
                              </span>
                              <span className="text-xs text-sky-700 font-medium">
                                {BILLING.currency}
                                {Number(
                                  formData.introPrice || 0,
                                ).toLocaleString("en-IN")}
                                {BILLING.displayText}
                                {formData.introTriggerType ===
                                  INTRO_TRIGGER_TYPE.DURATION &&
                                  formData.introDurationYears && (
                                    <span className="text-sky-500 ml-1">
                                      for first {formData.introDurationYears}{" "}
                                      year
                                      {Number(formData.introDurationYears) !== 1
                                        ? "s"
                                        : ""}
                                    </span>
                                  )}
                                {formData.introTriggerType ===
                                  INTRO_TRIGGER_TYPE.DATE &&
                                  formData.introEndDate && (
                                    <span className="text-sky-500 ml-1">
                                      until{" "}
                                      {new Date(
                                        formData.introEndDate,
                                      ).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </span>
                                  )}
                              </span>
                            </div>
                            <div className="ml-2.5 text-gray-400 text-xs">
                              ↓ then
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-5 h-5 rounded-full bg-[#05015A] text-white
                                                text-[10px] font-bold flex items-center justify-center
                                                flex-shrink-0"
                              >
                                2
                              </span>
                              <span className="text-xs text-gray-700 font-medium">
                                {formData.price !== ""
                                  ? `${BILLING.currency}${Number(formData.price).toLocaleString("en-IN")}${BILLING.displayText}`
                                  : "(set regular price above)"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── General promo preview ─────────────────────────────── */}
                  {(formData.compare_at_price ||
                    formData.bonusMonths ||
                    formData.promoFreeUntil) && (
                    <div
                      className="p-3 bg-gradient-to-r from-amber-50 to-orange-50
                                    rounded-lg border border-amber-200"
                    >
                      <p className="text-xs font-semibold text-amber-800 mb-2">
                        Other Promo Preview:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {formData.compare_at_price &&
                          Number(formData.compare_at_price) >
                            Number(formData.price || 0) && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-1
                                             bg-white rounded-full text-xs border border-amber-200"
                            >
                              <span className="line-through text-gray-400">
                                {BILLING.currency}
                                {Number(
                                  formData.compare_at_price,
                                ).toLocaleString("en-IN")}
                              </span>
                              <span className="font-semibold text-green-600">
                                {BILLING.currency}
                                {Number(formData.price || 0).toLocaleString(
                                  "en-IN",
                                )}
                              </span>
                            </span>
                          )}
                        {formData.bonusMonths &&
                          Number(formData.bonusMonths) > 0 && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-1
                                             bg-emerald-100 text-emerald-700 rounded-full
                                             text-xs font-medium"
                            >
                              <Gift size={12} />+{formData.bonusMonths} months
                              free
                            </span>
                          )}
                        {formData.promoFreeUntil && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1
                                           bg-blue-100 text-blue-700 rounded-full
                                           text-xs font-medium"
                          >
                            <Calendar size={12} />
                            Free until{" "}
                            {new Date(formData.promoFreeUntil).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Action buttons ────────────────────────────────────────────── */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2.5 rounded-lg text-sm font-medium
                         border-2 border-gray-200 text-gray-600
                         hover:border-[#05015A] hover:text-[#05015A]
                         transition-all duration-300
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#05015A] text-white px-6 py-2.5 rounded-lg font-medium
                         hover:bg-[#0a0280] hover:shadow-lg hover:shadow-[#05015A]/30
                         active:scale-[0.98] transition-all duration-300
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Create Draft
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}