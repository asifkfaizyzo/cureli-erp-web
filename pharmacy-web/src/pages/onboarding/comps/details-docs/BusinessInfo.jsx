// pharmacy-web/src/pages/onboarding/comps/details-docs/BusinessInfo.jsx (do not remove this comment)
import { useState, useEffect, useRef, useCallback } from "react";
import { updateShopInfo } from "../../../../api/shop";
import { useNavigate } from "react-router-dom";
import { Loader2, ChevronDown } from "lucide-react";

// Import loaders
import {
  loadPincodeMap,
  getPincodeData,
} from "../../../../utils/address/loadPincodeMap";
import {
  loadCityList,
  searchCities,
} from "../../../../utils/address/loadCityList";
import {
  loadStateList,
  searchStates,
} from "../../../../utils/address/loadStateList";

const BusinessInfo = ({ onContinue }) => {
  const [form, setForm] = useState({
    name: "",
    address1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Data loading states
  const [dataLoaded, setDataLoaded] = useState({
    pincode: false,
    city: false,
    state: false,
  });

  // Dropdown states
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [stateSuggestions, setStateSuggestions] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const nameRef = useRef(null);
  const cityInputRef = useRef(null);
  const stateInputRef = useRef(null);
  const cityDropdownRef = useRef(null);
  const stateDropdownRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const navigate = useNavigate();
  const shop_id = localStorage.getItem("shop_id");

  //  Auth check
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }
    if (!shop_id) {
      navigate("/signup");
      return;
    }
  }, [shop_id, navigate]);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  //  Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(e.target) &&
        !cityInputRef.current?.contains(e.target)
      ) {
        setShowCityDropdown(false);
      }
      if (
        stateDropdownRef.current &&
        !stateDropdownRef.current.contains(e.target) &&
        !stateInputRef.current?.contains(e.target)
      ) {
        setShowStateDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  //  Load pincode data lazily
  const ensurePincodeLoaded = useCallback(async () => {
    if (!dataLoaded.pincode) {
      await loadPincodeMap();
      setDataLoaded((prev) => ({ ...prev, pincode: true }));
    }
  }, [dataLoaded.pincode]);

  //  Load city data lazily
  const ensureCityLoaded = useCallback(async () => {
    if (!dataLoaded.city) {
      await loadCityList();
      setDataLoaded((prev) => ({ ...prev, city: true }));
    }
  }, [dataLoaded.city]);

  //  Load state data lazily
  const ensureStateLoaded = useCallback(async () => {
    if (!dataLoaded.state) {
      await loadStateList();
      setDataLoaded((prev) => ({ ...prev, state: true }));
    }
  }, [dataLoaded.state]);

  //  Handle form changes
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  //  Handle Pincode Input
  const handlePincodeChange = async (value) => {
    // Only allow digits
    const sanitized = value.replace(/\D/g, "").slice(0, 6);
    handleChange("pincode", sanitized);

    if (sanitized.length === 6) {
      await ensurePincodeLoaded();
      const result = getPincodeData(sanitized);
      if (result) {
        setForm((prev) => ({
          ...prev,
          pincode: sanitized,
          city: result.city,
          state: result.state,
        }));
        setShowCityDropdown(false);
        setShowStateDropdown(false);
      }
    }
  };

  //  Handle City Input with Debounce
  const handleCityChange = async (value) => {
    handleChange("city", value);
    setActiveIndex(-1);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.length < 2) {
      setCitySuggestions([]);
      setShowCityDropdown(false);
      return;
    }

    // Debounce 100ms
    debounceTimerRef.current = setTimeout(async () => {
      await ensureCityLoaded();
      const results = searchCities(value, 10);
      setCitySuggestions(results);
      setShowCityDropdown(results.length > 0);
    }, 100);
  };

  //  Handle City Selection
  const handleCitySelect = (item) => {
    setForm((prev) => ({
      ...prev,
      city: item.city,
      state: item.state,
    }));
    setShowCityDropdown(false);
    setCitySuggestions([]);
  };

  //  Handle State Input
  const handleStateChange = async (value) => {
    handleChange("state", value);
    setActiveIndex(-1);

    await ensureStateLoaded();
    const results = searchStates(value);
    setStateSuggestions(results);
    setShowStateDropdown(results.length > 0);
  };

  //  Handle State Selection
  const handleStateSelect = (state) => {
    handleChange("state", state);
    setShowStateDropdown(false);
    setStateSuggestions([]);
  };

  //  Handle State Focus (show all states)
  const handleStateFocus = async () => {
    await ensureStateLoaded();
    const results = searchStates(form.state);
    setStateSuggestions(results);
    setShowStateDropdown(true);
  };

  //  Keyboard navigation for dropdowns
  const handleKeyDown = (e, type) => {
    const suggestions = type === "city" ? citySuggestions : stateSuggestions;
    const setShow =
      type === "city" ? setShowCityDropdown : setShowStateDropdown;

    if (!suggestions.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      if (type === "city") {
        handleCitySelect(suggestions[activeIndex]);
      } else {
        handleStateSelect(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setShow(false);
      setActiveIndex(-1);
    }
  };

  //  Validation
  const validate = () => {
    let newErrors = {};

    if (!form.name.trim()) newErrors.name = "Business name is required";
    if (!form.address1.trim())
      newErrors.address1 = "Address Line 1 is required";
    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.state.trim()) newErrors.state = "State is required";
    if (!/^[0-9]{6}$/.test(form.pincode))
      newErrors.pincode = "Enter a valid 6-digit pincode";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  //  Submit
  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await updateShopInfo({
        shop_id,
        business_name: form.name,
        address_line_1: form.address1,
        address_line_2: "",
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      });
      onContinue();
    } catch (err) {
    
      alert(err?.response?.data?.message || "Failed to save business info");
    }
    setLoading(false);
  };

  return (
    <div
      className="w-full max-w-xl font-poppins h-[100vh] overflow-y-auto"
      style={{ marginLeft: "-10%", paddingTop: "20px", paddingRight: "10px" }}
    >
      <h2 className="text-[26px] font-semibold text-[#000006] mb-4">
        Business Information
      </h2>

      {/* BUSINESS NAME */}
      <label className="text-xs font-bold text-[#000060]">
        Business Name *
      </label>
      <input
        ref={nameRef}
        type="text"
        value={form.name}
        placeholder="Enter business name"
        onChange={(e) => handleChange("name", e.target.value)}
        className={`w-full mt-1 px-3 py-2 bg-white border rounded-lg ${
          errors.name ? "border-red-500" : "border-gray-300"
        } focus:ring-2 focus:ring-[#000060] transition`}
      />
      {errors.name && (
        <p className="text-red-500 text-xs mt-1 mb-2">{errors.name}</p>
      )}

      {/* ADDRESS LINE 1 */}
      <label className="text-xs font-bold text-[#000060] mt-3 block">
        Address *
      </label>
      <input
        type="text"
        value={form.address1}
        placeholder="Building, Street"
        onChange={(e) => handleChange("address1", e.target.value)}
        className={`w-full mt-1 px-3 py-2 bg-white border rounded-lg ${
          errors.address1 ? "border-red-500" : "border-gray-300"
        } focus:ring-2 focus:ring-[#000060] transition`}
      />
      {errors.address1 && (
        <p className="text-red-500 text-xs mt-1 mb-2">{errors.address1}</p>
      )}

      {/* CITY - STATE - PINCODE */}
      <div className="grid grid-cols-3 gap-3 mt-3">
        {/* PINCODE */}
        <div>
          <label className="text-xs font-bold text-[#000060]">Pincode *</label>
          <input
            type="text"
            value={form.pincode}
            maxLength={6}
            placeholder="Pincode"
            onChange={(e) => handlePincodeChange(e.target.value)}
            onFocus={ensurePincodeLoaded}
            className={`w-full mt-1 px-3 py-2 bg-white border rounded-lg ${
              errors.pincode ? "border-red-500" : "border-gray-300"
            } focus:ring-2 focus:ring-[#000060] transition`}
          />
          {errors.pincode && (
            <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>
          )}
        </div>

        {/* CITY with Autocomplete */}
        <div className="relative">
          <label className="text-xs font-bold text-[#000060]">City *</label>
          <input
            ref={cityInputRef}
            type="text"
            value={form.city}
            placeholder="City"
            onChange={(e) => handleCityChange(e.target.value)}
            onFocus={ensureCityLoaded}
            onKeyDown={(e) => handleKeyDown(e, "city")}
            autoComplete="off"
            className={`w-full mt-1 px-3 py-2 bg-white border rounded-lg ${
              errors.city ? "border-red-500" : "border-gray-300"
            } focus:ring-2 focus:ring-[#000060] transition`}
          />
          {errors.city && (
            <p className="text-red-500 text-xs mt-1">{errors.city}</p>
          )}

          {/* City Dropdown */}
          {showCityDropdown && citySuggestions.length > 0 && (
            <ul
              ref={cityDropdownRef}
              className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto"
            >
              {citySuggestions.map((item, index) => (
                <li
                  key={`${item.city}-${item.state}-${index}`}
                  onClick={() => handleCitySelect(item)}
                  className={`px-3 py-2 cursor-pointer text-sm hover:bg-[#000060] hover:text-white transition ${
                    activeIndex === index ? "bg-[#000060] text-white" : ""
                  }`}
                >
                  {item.city}, {item.state}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* STATE with Autocomplete */}
        <div className="relative">
          <label className="text-xs font-bold text-[#000060]">State *</label>
          <div className="relative">
            <input
              ref={stateInputRef}
              type="text"
              value={form.state}
              placeholder="State"
              onChange={(e) => handleStateChange(e.target.value)}
              onFocus={handleStateFocus}
              onKeyDown={(e) => handleKeyDown(e, "state")}
              autoComplete="off"
              className={`w-full mt-1 px-3 py-2 pr-8 bg-white border rounded-lg ${
                errors.state ? "border-red-500" : "border-gray-300"
              } focus:ring-2 focus:ring-[#000060] transition`}
            />
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 mt-0.5 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          {errors.state && (
            <p className="text-red-500 text-xs mt-1">{errors.state}</p>
          )}

          {/* State Dropdown */}
          {showStateDropdown && stateSuggestions.length > 0 && (
            <ul
              ref={stateDropdownRef}
              className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto"
            >
              {stateSuggestions.map((state, index) => (
                <li
                  key={state}
                  onClick={() => handleStateSelect(state)}
                  className={`px-3 py-2 cursor-pointer text-sm hover:bg-[#000060] hover:text-white transition ${
                    activeIndex === index ? "bg-[#000060] text-white" : ""
                  }`}
                >
                  {state}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-[#000060] text-white py-2 rounded-xl mt-6
                   hover:bg-[#000060d1] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Saving...
          </div>
        ) : (
          "Continue"
        )}
      </button>
    </div>
  );
};

export default BusinessInfo;
