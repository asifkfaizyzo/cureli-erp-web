// pharmacy-web/src/pages/onboarding/comps/pending/IdentityForm.jsx (do not remove this comment)
import { useState, useRef, useEffect, useCallback } from "react";
import {
  saveUsername,
  completeSignup,
  checkUsernameAvailability,
} from "../../../../api/auth";
import { Loader2, Check, AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import { useAuthStore } from "../../../../store/useAuthStore";
// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const IdentityForm = ({ pending_id, onContinue, onNext }) => {
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState({});
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  // Username suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  // Real-time availability check
  const [availabilityStatus, setAvailabilityStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const debouncedUsername = useDebounce(username, 500);

  const usernameRef = useRef(null);

  const getNameFromStorage = useCallback(() => {
    const fullName = localStorage.getItem("user_name");

    // If we have fullName, split it
    if (fullName) {
      const nameParts = fullName.trim().split(/\s+/);
      return {
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
      };
    }

    return { firstName: "", lastName: "" };
  }, []);

  const { firstName, lastName } = getNameFromStorage();

  // Generate username variations from name
  const generateUsernameVariations = useCallback((first, last) => {
    const variations = [];
    const cleanFirst = (first || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "");
    const cleanLast = (last || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "");

    if (!cleanFirst) return variations;

    // Base patterns
    const patterns = [];

    // Pattern 1: firstname (if >= 4 chars)
    if (cleanFirst.length >= 4) {
      patterns.push(cleanFirst);
    }

    // Pattern 2: firstname_lastname
    if (cleanLast) {
      patterns.push(`${cleanFirst}_${cleanLast}`);
      // Pattern 3: firstnamelastname
      patterns.push(`${cleanFirst}${cleanLast}`);
      // Pattern 4: f_lastname
      patterns.push(`${cleanFirst.charAt(0)}_${cleanLast}`);
      // Pattern 5: firstname_l
      patterns.push(`${cleanFirst}_${cleanLast.charAt(0)}`);
    }

    // Pattern 6: firstname + random 2-digit
    patterns.push(`${cleanFirst}${Math.floor(Math.random() * 90 + 10)}`);

    // Pattern 7: firstname + random 3-digit
    patterns.push(`${cleanFirst}${Math.floor(Math.random() * 900 + 100)}`);

    // Pattern 8: firstname_random 2-digit
    patterns.push(`${cleanFirst}_${Math.floor(Math.random() * 90 + 10)}`);

    // Add unique patterns
    patterns.forEach((p) => {
      if (p.length >= 4 && !variations.includes(p)) {
        variations.push(p);
      }
    });

    return variations.slice(0, 8); // Return up to 8 variations for checking
  }, []);

  // Generate and check username suggestions
  const generateSuggestions = useCallback(async () => {
    const { firstName: first, lastName: last } = getNameFromStorage();

    if (!first) {
      setSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    setSuggestions([]);

    try {
      const variations = generateUsernameVariations(first, last);
      const availableSuggestions = [];

      // Check each variation for availability
      for (const variation of variations) {
        if (availableSuggestions.length >= 4) break; // Stop after finding 4 available

        try {
          const res = await checkUsernameAvailability(variation);
          if (res.data?.data?.available) {
            availableSuggestions.push(variation);
          } else if (res.data?.data?.suggestions) {
            // If backend provides suggestions, add unique ones
            const backendSuggestions = res.data.data.suggestions.filter(
              (s) => !availableSuggestions.includes(s)
            );
            availableSuggestions.push(...backendSuggestions);
          }
        } catch (err) {
          console.error(`Failed to check ${variation}:`, err);
        }
      }

      // If we still don't have enough, generate with timestamps
      const cleanFirst = (first || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, "");
      let attempts = 0;

      while (availableSuggestions.length < 4 && attempts < 10) {
        attempts++;
        const timestamp = Date.now().toString().slice(-4);
        const randomNum = Math.floor(Math.random() * 100);
        const newSuggestion = `${cleanFirst}_${timestamp}${randomNum}`;

        if (
          !availableSuggestions.includes(newSuggestion) &&
          newSuggestion.length >= 4
        ) {
          try {
            const res = await checkUsernameAvailability(newSuggestion);
            if (res.data?.data?.available) {
              availableSuggestions.push(newSuggestion);
            }
          } catch (err) {
            // Skip this suggestion on error
            console.error(`Failed to check ${newSuggestion}:`, err);
          }
        }
      }

      setSuggestions(availableSuggestions.slice(0, 4));
    } catch (err) {
      console.error("Failed to generate suggestions:", err);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [getNameFromStorage, generateUsernameVariations]);

  // Generate suggestions on mount
  useEffect(() => {
    generateSuggestions();
  }, []); // Run once on mount

  // Check availability when username changes
  useEffect(() => {
    const checkAvailability = async () => {
      const trimmedUsername = debouncedUsername.toLowerCase().trim();

      if (!trimmedUsername || trimmedUsername.length < 4) {
        setAvailabilityStatus(null);
        return;
      }

      // Validate format
      if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
        setAvailabilityStatus(null);
        return;
      }

      setAvailabilityStatus("checking");

      try {
        const res = await checkUsernameAvailability(trimmedUsername);
        const available = res.data?.data?.available;
        setAvailabilityStatus(available ? "available" : "taken");
      } catch (err) {
        console.error("Username check error:", err);
        setAvailabilityStatus(null);
      }
    };

    checkAvailability();
  }, [debouncedUsername]);

  // Trigger success animation
  useEffect(() => {
    if (usernameSaved) {
      setShowSuccess(true);
    }
  }, [usernameSaved]);

  const validate = () => {
    const err = {};

    if (!username.trim()) {
      err.username = "Username is required";
    } else if (username.trim().length < 4) {
      err.username = "Username must be at least 4 characters";
    } else if (!/^[a-z0-9_]+$/.test(username.toLowerCase())) {
      err.username = "Only lowercase letters, numbers, and underscores allowed";
    } else if (availabilityStatus === "taken") {
      err.username = "This username is already taken";
    } else if (availabilityStatus === "checking") {
      err.username = "Please wait for availability check";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      await saveUsername({
        pending_id,
        username: username.toLowerCase().trim(),
      });

      setErrors({});
      setUsernameSaved(true);
    } catch (err) {
      setErrors({
        username: err?.response?.data?.message || "Username error",
      });
      setUsernameSaved(false);
      setShowSuccess(false);
    }

    setLoading(false);
  };

  const handleNextClick = async () => {
    if (!usernameSaved) return;

    try {
      const res = await completeSignup({ pending_id });

      const { user, shop, access_token } = res.data.data;

      setAuth({
        access_token,
        user_id: user.user_id,
        shop_id: shop.shop_id,
        branch_id: null, // Super admin has no branch yet
        role: user.role, // "super_admin"
        user_name: `${user.first_name} ${user.last_name}`.trim(),
        branch_name: null,
      });

      onNext();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to complete signup");
    }
  };

  // Reset saved state when username changes
  const handleUsernameChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(value);
    setSelectedSuggestion(null);
    if (usernameSaved) {
      setUsernameSaved(false);
      setShowSuccess(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setUsername(suggestion);
    setSelectedSuggestion(suggestion);
    setAvailabilityStatus("available"); // We know it's available
    if (usernameSaved) {
      setUsernameSaved(false);
      setShowSuccess(false);
    }
  };

  // Render availability status
  const renderAvailabilityIndicator = () => {
    if (!username || username.length < 4) return null;

    switch (availabilityStatus) {
      case "checking":
        return (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5">
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          </div>
        );
      case "available":
        return (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-scale-in">
              <Check className="w-3 h-3 text-white" />
            </div>
          </div>
        );
      case "taken":
        return (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5">
            <AlertCircle className="w-5 h-5 text-red-500 animate-shake" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-md mt-6 px-3" style={{ marginLeft: "-20%" }}>
      <h2 className="text-2xl font-bold text-[#000006]">Create Username</h2>

      <p className="text-gray-500 text-sm mt-1">
        Choose a username for your account. You can log in using this username.
      </p>

      <hr className="my-4 border-gray-300" />

      <label className="text-xs font-medium text-[#000060]">Username *</label>

      {/* INPUT WITH SUCCESS/ERROR STATES */}
      <div className="relative">
        <input
          type="text"
          ref={usernameRef}
          placeholder="Enter username"
          className={`w-full mt-1 px-3 py-2 pr-10 rounded-lg bg-white border text-gray-700 text-sm
            transition-all duration-300 ease-out
            ${
              errors.username
                ? "border-red-500 focus:ring-2 focus:ring-red-200"
                : usernameSaved
                ? "border-green-500 focus:ring-2 focus:ring-green-200 bg-green-50"
                : availabilityStatus === "available"
                ? "border-green-500 focus:ring-2 focus:ring-green-200"
                : availabilityStatus === "taken"
                ? "border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-gray-300 focus:ring-2 focus:ring-[#000060]/20"
            }`}
          value={username}
          onChange={handleUsernameChange}
        />

        {/* SUCCESS CHECKMARK ICON (saved) */}
        {usernameSaved && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5">
            <div className="animate-scale-in">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white animate-check-stroke" />
              </div>
            </div>
          </div>
        )}

        {/* AVAILABILITY INDICATOR (not saved yet) */}
        {!usernameSaved && !errors.username && renderAvailabilityIndicator()}

        {/* ERROR ICON */}
        {errors.username && !usernameSaved && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5">
            <AlertCircle className="w-5 h-5 text-red-500 animate-shake" />
          </div>
        )}
      </div>

      {/* AVAILABILITY MESSAGE */}
      {!usernameSaved &&
        !errors.username &&
        availabilityStatus === "available" && (
          <p className="text-green-600 text-xs mt-1 flex items-center gap-1 animate-slide-down">
            <Check className="w-3 h-3" />
            Username is available!
          </p>
        )}

      {!usernameSaved && !errors.username && availabilityStatus === "taken" && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1 animate-slide-down">
          <AlertCircle className="w-3 h-3" />
          This username is already taken
        </p>
      )}

      {/* ERROR MESSAGE */}
      {errors.username && (
        <p className="text-red-500 text-xs mt-1 animate-slide-down">
          {errors.username}
        </p>
      )}

      {/* USERNAME SUGGESTIONS */}
      {!usernameSaved && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">
              Suggested usernames
            </span>
            <button
              onClick={generateSuggestions}
              disabled={loadingSuggestions}
              className="text-xs text-[#000060] hover:text-[#000080] flex items-center gap-1 disabled:opacity-50 transition-colors"
            >
              <RefreshCw
                className={`w-3 h-3 ${
                  loadingSuggestions ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {loadingSuggestions ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating suggestions...</span>
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-all duration-200
                    ${
                      selectedSuggestion === suggestion
                        ? "bg-[#000060] text-white border-[#000060]"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-[#000060] hover:text-[#000060]"
                    }
                    animate-fade-in
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  @{suggestion}
                </button>
              ))
            ) : firstName ? (
              <span className="text-xs text-gray-400 py-1">
                No suggestions available. Try refreshing.
              </span>
            ) : (
              <span className="text-xs text-gray-400 py-1">
                Enter your name to get suggestions
              </span>
            )}
          </div>
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {showSuccess && usernameSaved && (
        <div className="flex items-center gap-2 mt-2 animate-slide-down">
          <Sparkles className="w-4 h-4 text-green-500 animate-pulse" />
          <p className="text-green-600 text-sm font-medium">
            Username saved successfully!
          </p>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        {/* SUBMIT USERNAME WITH SPINNER */}
        <button
          onClick={handleSubmit}
          disabled={
            loading ||
            usernameSaved ||
            availabilityStatus === "checking" ||
            availabilityStatus === "taken"
          }
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300
            ${
              usernameSaved
                ? "bg-green-500 text-white cursor-default"
                : "bg-[#000060] text-white hover:bg-[#000060d1] disabled:bg-gray-400 disabled:cursor-not-allowed"
            }`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </div>
          ) : usernameSaved ? (
            <div className="flex items-center justify-center gap-2 animate-scale-in">
              <Check className="h-4 w-4" />
              Saved!
            </div>
          ) : (
            "Save Username"
          )}
        </button>

        {/* NEXT BUTTON WITH ATTENTION ANIMATION */}
        <button
          onClick={handleNextClick}
          disabled={!usernameSaved}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 
            ${
              usernameSaved
                ? "bg-[#000060] text-white hover:bg-[#000060d1] animate-pulse-subtle shadow-lg shadow-[#000060]/30"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
        >
          {usernameSaved ? (
            <span className="flex items-center justify-center gap-2">
              Continue
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </span>
          ) : (
            "Next"
          )}
        </button>
      </div>

      {/* STYLE TAG FOR CUSTOM ANIMATIONS */}
      <style jsx>{`
        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes slide-down {
          0% {
            transform: translateY(-10px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          20%,
          60% {
            transform: translateX(-5px);
          }
          40%,
          80% {
            transform: translateX(5px);
          }
        }

        @keyframes check-stroke {
          0% {
            stroke-dashoffset: 100;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes pulse-subtle {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)
            forwards;
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out forwards;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default IdentityForm;
