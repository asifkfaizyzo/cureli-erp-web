// pharmacy-web/src/pages/settings/plans/comps/ComplianceModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/settings/plans/comps/ComplianceModal.jsx

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Users,
  Building2,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Info,
  User,
  Store,
  AlertTriangle,
  UserMinus,
  ArrowRightLeft,
  ChevronDown,
  Check,
} from "lucide-react";
import { getDowngradeCompliance } from "../../../../api/subscription";

/**
 * Custom Styled Dropdown Component with Portal for overflow fix
 */
const StyledDropdown = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 160; // max-h-40 = 160px

      // Determine if dropdown should open upward or downward
      const openUpward =
        spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      setDropdownPosition({
        top: openUpward ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        openUpward,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-xs rounded-xl border-2 transition-all duration-200 ${
          isOpen
            ? "border-blue-400 ring-2 ring-blue-100 bg-white shadow-sm"
            : value
              ? "border-blue-200 bg-blue-50/50 hover:border-blue-300"
              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedOption ? (
            <>
              <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Building2 size={10} className="text-blue-600" />
              </div>
              <span className="text-gray-900 font-medium truncate">
                {selectedOption.label}
              </span>
              {selectedOption.isMain && (
                <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
                  MAIN
                </span>
              )}
            </>
          ) : (
            <>
              <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Building2 size={10} className="text-gray-400" />
              </div>
              <span className="text-gray-400">{placeholder}</span>
            </>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown
            size={14}
            className={isOpen ? "text-blue-500" : "text-gray-400"}
          />
        </motion.div>
      </button>

      {/* Portal-style dropdown rendered at document level */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{
              opacity: 0,
              y: dropdownPosition.openUpward ? 8 : -8,
              scale: 0.96,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: dropdownPosition.openUpward ? 8 : -8,
              scale: 0.96,
            }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              position: "fixed",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 9999,
            }}
            className="bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden"
          >
            <div className="max-h-40 overflow-y-auto py-1">
              {options.length === 0 ? (
                <div className="px-3 py-3 text-xs text-gray-400 text-center">
                  <Store size={16} className="mx-auto mb-1 opacity-50" />
                  No branches available
                </div>
              ) : (
                options.map((option, index) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left transition-all duration-150 ${
                      value === option.value
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                        value === option.value ? "bg-blue-100" : "bg-gray-100"
                      }`}
                    >
                      <Building2
                        size={10}
                        className={
                          value === option.value
                            ? "text-blue-600"
                            : "text-gray-400"
                        }
                      />
                    </div>
                    <span className="flex-1 truncate font-medium">
                      {option.label}
                    </span>
                    {option.isMain && (
                      <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">
                        MAIN
                      </span>
                    )}
                    {value === option.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0"
                      >
                        <Check size={10} className="text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/**
 * Animated Status Badge
 */
const StatusBadge = ({ isCompliant, current, limit, label, hint }) => (
  <div className="flex items-center gap-2">
    <div
      className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-300 ${
        isCompliant ? "bg-emerald-100" : "bg-red-100"
      }`}
    >
      {isCompliant ? (
        <CheckCircle size={14} className="text-emerald-600" />
      ) : (
        <XCircle size={14} className="text-red-600" />
      )}
    </div>
    <span className="text-sm text-gray-600">{label}:</span>
    <span
      className={`text-sm font-semibold transition-colors duration-300 ${
        isCompliant ? "text-emerald-600" : "text-red-600"
      }`}
    >
      {current}/{limit === -1 ? "∞" : limit}
    </span>
    {hint && <span className="text-xs text-red-500">{hint}</span>}
  </div>
);

/**
 * ComplianceModal
 * Step B: Select users to disable and branches to deactivate
 */
const ComplianceModal = ({
  targetPlan,
  analysis,
  onComplete,
  onBack,
  onClose,
}) => {
  // Data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [counts, setCounts] = useState(null);

  // Selection state
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);

  // Branch user handling state
  const [branchUserActions, setBranchUserActions] = useState({});

  // Load compliance data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getDowngradeCompliance(targetPlan.plan_id);
      const payload = response.data?.data || response.data;

      setUsers(payload.users || []);
      setBranches(payload.branches || []);
      setCounts(payload.counts || null);
    } catch (err) {
      console.error("Failed to load compliance data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [targetPlan.plan_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get users for a specific branch
  const getUsersForBranch = useCallback(
    (branchId) => {
      const branch = branches.find((b) => b.branch_id === branchId);
      if (!branch) return [];
      return users.filter((user) => user.branch_name === branch.branch_name);
    },
    [users, branches],
  );

  // Get user reassignments
  const userReassignments = useMemo(() => {
    const reassignments = [];

    selectedBranches.forEach((branchId) => {
      const action = branchUserActions[branchId];
      if (action?.action === "reassign" && action.targetBranchId) {
        const branchUsers = getUsersForBranch(branchId);
        branchUsers.forEach((user) => {
          if (!selectedUsers.includes(user.user_id)) {
            reassignments.push({
              userId: user.user_id,
              fromBranchId: branchId,
              toBranchId: action.targetBranchId,
            });
          }
        });
      }
    });

    return reassignments;
  }, [selectedBranches, branchUserActions, getUsersForBranch, selectedUsers]);

  // Get all users that will be disabled
  const allUsersToDisable = useMemo(() => {
    const toDisable = new Set(selectedUsers);

    selectedBranches.forEach((branchId) => {
      const action = branchUserActions[branchId];
      if (!action || action.action === "disable") {
        const branchUsers = getUsersForBranch(branchId);
        branchUsers.forEach((u) => toDisable.add(u.user_id));
      }
    });

    return Array.from(toDisable);
  }, [selectedUsers, selectedBranches, branchUserActions, getUsersForBranch]);

  // Get available branches for reassignment
  const availableBranchesForReassign = useMemo(() => {
    return branches.filter((b) => !selectedBranches.includes(b.branch_id));
  }, [branches, selectedBranches]);

  // Check if all branch user actions are resolved
  const allBranchActionsResolved = useMemo(() => {
    return selectedBranches.every((branchId) => {
      const branchUsers = getUsersForBranch(branchId);
      if (branchUsers.length === 0) return true;

      const action = branchUserActions[branchId];
      if (!action) return false;

      if (action.action === "reassign" && !action.targetBranchId) {
        return false;
      }

      return true;
    });
  }, [selectedBranches, branchUserActions, getUsersForBranch]);

  // Calculate compliance status
  const calculateCompliance = () => {
    if (!counts || typeof counts.activeUsers !== "number") {
      return {
        users: false,
        branches: false,
        overall: false,
        activeUsersAfter: 0,
        activeBranchesAfter: 0,
        userLimit: 0,
        branchLimit: 0,
      };
    }

    const activeUsersAfter = counts.activeUsers - allUsersToDisable.length;
    const activeBranchesAfter = counts.activeBranches - selectedBranches.length;

    const userLimit = counts.userLimit === -1 ? Infinity : counts.userLimit;
    const branchLimit =
      counts.branchLimit === -1 ? Infinity : counts.branchLimit;

    const usersCompliant = activeUsersAfter <= userLimit;
    const branchesCompliant =
      activeBranchesAfter <= branchLimit && activeBranchesAfter >= 1;

    return {
      users: usersCompliant,
      branches: branchesCompliant,
      overall: usersCompliant && branchesCompliant && allBranchActionsResolved,
      activeUsersAfter,
      activeBranchesAfter,
      userLimit: counts.userLimit,
      branchLimit: counts.branchLimit,
    };
  };

  const compliance = calculateCompliance();

  // Check if a user is from a branch being deactivated
  const isUserFromDeactivatedBranch = useCallback(
    (userId) => {
      const user = users.find((u) => u.user_id === userId);
      if (!user) return false;

      const userBranch = branches.find(
        (b) => b.branch_name === user.branch_name,
      );
      if (!userBranch) return false;

      return selectedBranches.includes(userBranch.branch_id);
    },
    [users, branches, selectedBranches],
  );

  // Check if a user's branch is set to "disable all"
  const isUserBranchSetToDisable = useCallback(
    (userId) => {
      const user = users.find((u) => u.user_id === userId);
      if (!user) return false;

      const userBranch = branches.find(
        (b) => b.branch_name === user.branch_name,
      );
      if (!userBranch) return false;

      if (!selectedBranches.includes(userBranch.branch_id)) return false;

      const action = branchUserActions[userBranch.branch_id];
      return !action || action.action === "disable";
    },
    [users, branches, selectedBranches, branchUserActions],
  );

  // Toggle user selection
  const toggleUser = (userId) => {
    const user = users.find((u) => u.user_id === userId);
    if (!user) return;

    const userBranch = branches.find((b) => b.branch_name === user.branch_name);
    const isFromDeactivatedBranch =
      userBranch && selectedBranches.includes(userBranch.branch_id);

    if (isFromDeactivatedBranch) {
      const action = branchUserActions[userBranch.branch_id];
      if (!action || action.action === "disable") {
        return;
      }
    }

    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  // Toggle branch selection
  const toggleBranch = (branchId) => {
    const isSelected = selectedBranches.includes(branchId);

    if (!isSelected) {
      const activeBranchesAfter =
        counts.activeBranches - selectedBranches.length - 1;
      if (activeBranchesAfter < 1) {
        alert("You must keep at least one active branch.");
        return;
      }

      const branchUsers = getUsersForBranch(branchId);
      if (branchUsers.length > 0) {
        setBranchUserActions((prev) => ({
          ...prev,
          [branchId]: { action: "disable" },
        }));
      }
    } else {
      const branchUsers = getUsersForBranch(branchId);
      const branchUserIds = branchUsers.map((u) => u.user_id);

      setSelectedUsers((prev) =>
        prev.filter((id) => !branchUserIds.includes(id)),
      );

      setBranchUserActions((prev) => {
        const newActions = { ...prev };
        delete newActions[branchId];
        return newActions;
      });
    }

    setSelectedBranches((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId],
    );
  };

  // Set branch user action
  const setBranchAction = (branchId, action, targetBranchId = null) => {
    setBranchUserActions((prev) => ({
      ...prev,
      [branchId]: {
        action,
        targetBranchId: action === "reassign" ? targetBranchId : null,
      },
    }));

    if (action === "disable") {
      const branchUsers = getUsersForBranch(branchId);
      const branchUserIds = branchUsers.map((u) => u.user_id);
      setSelectedUsers((prev) =>
        prev.filter((id) => !branchUserIds.includes(id)),
      );
    }
  };

  // Handle continue
  const handleContinue = () => {
    if (!compliance.overall) return;

    onComplete({
      usersToDisable: allUsersToDisable,
      branchesToDeactivate: selectedBranches,
      userReassignments: userReassignments,
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
          <div className="w-12 h-12 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">
            Loading compliance data...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 max-w-md shadow-2xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <p className="text-gray-900 font-semibold text-center">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              onClick={loadData}
              className="px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const needsUserAction = analysis.excessUsers > 0;
  const needsBranchAction = analysis.excessBranches > 0;

  // Get selected branch with users for the action panel
  const selectedBranchesWithUsers = selectedBranches
    .map((branchId) => {
      const branch = branches.find((b) => b.branch_id === branchId);
      const branchUsers = getUsersForBranch(branchId);
      return {
        branch,
        users: branchUsers,
        action: branchUserActions[branchId],
      };
    })
    .filter((item) => item.branch && item.users.length > 0);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl relative overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Accent */}
        <div className="h-1.5 bg-gradient-to-r from-orange-500 to-red-500" />
        {/* Header - No animation */}
        <div className="px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={24} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Downgrade to {targetPlan?.name}
                </h2>
                <p className="text-gray-500 text-sm mt-0.5">
                  Review and resolve the following items before proceeding
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-6">
            <StatusBadge
              isCompliant={compliance.users}
              current={compliance.activeUsersAfter}
              limit={compliance.userLimit}
              label="Users"
              hint={
                !compliance.users
                  ? `(disable ${
                      compliance.activeUsersAfter - compliance.userLimit
                    } more)`
                  : null
              }
            />

            <div className="w-px h-6 bg-gray-300" />

            <StatusBadge
              isCompliant={compliance.branches}
              current={compliance.activeBranchesAfter}
              limit={compliance.branchLimit}
              label="Branches"
            />

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full">
              <Info size={12} className="text-blue-500" />
              <span className="text-xs text-blue-600 font-medium">
                Min 1 branch required
              </span>
            </div>
          </div>

          <div
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all ${
              compliance.overall
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {compliance.overall ? (
              <>
                <CheckCircle size={14} />
                Ready to proceed
              </>
            ) : (
              <>
                <AlertTriangle size={14} />
                Action required
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left: Users Panel */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col bg-white">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Users size={14} className="text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Users</h3>
                  <p className="text-[10px] text-gray-500">
                    {users.length} available
                  </p>
                </div>
              </div>
              {needsUserAction && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-semibold">
                  -{analysis.excessUsers}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {users.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <User size={20} className="opacity-50" />
                  </div>
                  <p className="text-xs font-medium">No users to manage</p>
                </div>
              ) : (
                users.map((user) => {
                  const isDirectlySelected = selectedUsers.includes(
                    user.user_id,
                  );
                  const isFromDeactivatedBranch = isUserFromDeactivatedBranch(
                    user.user_id,
                  );
                  const isBranchSetToDisable = isUserBranchSetToDisable(
                    user.user_id,
                  );
                  const isBeingReassigned = userReassignments.some(
                    (r) => r.userId === user.user_id,
                  );

                  const isMarkedForDisable =
                    isDirectlySelected || isBranchSetToDisable;
                  const canClick = !isBranchSetToDisable;

                  let bgClass =
                    "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm";

                  if (isBranchSetToDisable) {
                    bgClass =
                      "bg-gradient-to-r from-red-50 to-orange-50 border-red-200";
                  } else if (isDirectlySelected) {
                    bgClass = "bg-red-50 border-red-200";
                  } else if (isBeingReassigned) {
                    bgClass =
                      "bg-blue-50 border-blue-200 hover:border-blue-300";
                  }

                  return (
                    <div
                      key={user.user_id}
                      onClick={() => canClick && toggleUser(user.user_id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${bgClass} ${
                        canClick ? "cursor-pointer" : "cursor-default"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isMarkedForDisable
                            ? "bg-red-100"
                            : isBeingReassigned
                              ? "bg-blue-100"
                              : "bg-gray-100"
                        }`}
                      >
                        <User
                          size={14}
                          className={
                            isMarkedForDisable
                              ? "text-red-600"
                              : isBeingReassigned
                                ? "text-blue-600"
                                : "text-gray-500"
                          }
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium text-sm truncate ${
                            isMarkedForDisable
                              ? "text-red-700 line-through"
                              : isBeingReassigned
                                ? "text-blue-700"
                                : "text-gray-900"
                          }`}
                        >
                          {user.full_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.branch_name}
                        </p>
                      </div>

                      {/* Status badges */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isBeingReassigned && !isDirectlySelected && (
                          <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <ArrowRightLeft size={8} />
                            move
                          </span>
                        )}
                        {isBranchSetToDisable && (
                          <span className="text-[9px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                            auto
                          </span>
                        )}
                        {isDirectlySelected &&
                          isFromDeactivatedBranch &&
                          !isBranchSetToDisable && (
                            <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                              manual
                            </span>
                          )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Users Summary */}
            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100/50 border-t border-gray-200">
              <div className="flex items-center gap-3">
                {allUsersToDisable.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 rounded-lg">
                    <UserMinus size={12} className="text-red-600" />
                    <span className="text-xs text-red-600">Disabling:</span>
                    <span className="text-sm font-bold text-red-700">
                      {allUsersToDisable.length}
                    </span>
                  </div>
                )}
                {userReassignments.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-lg">
                    <ArrowRightLeft size={12} className="text-blue-600" />
                    <span className="text-xs text-blue-600">Moving:</span>
                    <span className="text-sm font-bold text-blue-700">
                      {userReassignments.length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle: Branches Panel */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col bg-white">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Building2 size={14} className="text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Branches
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    {branches.length} available
                  </p>
                </div>
              </div>
              {needsBranchAction && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-semibold">
                  -{analysis.excessBranches}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {branches.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Store size={20} className="opacity-50" />
                  </div>
                  <p className="text-xs font-medium">No branches to manage</p>
                </div>
              ) : (
                branches.map((branch) => {
                  const isSelected = selectedBranches.includes(
                    branch.branch_id,
                  );
                  const canDeactivate =
                    (counts?.activeBranches || 0) - selectedBranches.length >
                      1 || isSelected;
                  const branchUsers = getUsersForBranch(branch.branch_id);
                  const hasUsers = branchUsers.length > 0;
                  const currentAction = branchUserActions[branch.branch_id];
                  const manuallyDisabledCount = branchUsers.filter((u) =>
                    selectedUsers.includes(u.user_id),
                  ).length;

                  let bgClass =
                    "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm";

                  if (!canDeactivate && !isSelected) {
                    bgClass = "bg-gray-50 border-gray-200 opacity-50";
                  } else if (isSelected) {
                    bgClass =
                      "bg-gradient-to-r from-red-50 to-orange-50 border-red-200";
                  }

                  return (
                    <div
                      key={branch.branch_id}
                      onClick={() =>
                        canDeactivate && toggleBranch(branch.branch_id)
                      }
                      className={`p-3 rounded-xl border transition-all ${bgClass} ${
                        canDeactivate ? "cursor-pointer" : "cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isSelected ? "bg-red-100" : "bg-gray-100"
                          }`}
                        >
                          <Building2
                            size={14}
                            className={
                              isSelected ? "text-red-600" : "text-gray-500"
                            }
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p
                              className={`font-medium text-sm truncate ${
                                isSelected
                                  ? "text-red-700 line-through"
                                  : "text-gray-900"
                              }`}
                            >
                              {branch.branch_name}
                            </p>
                            {branch.is_main && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">
                                MAIN
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {branch.user_count} user
                            {branch.user_count !== 1 ? "s" : ""}
                          </p>
                        </div>
                        {isSelected && hasUsers && (
                          <span
                            className={`text-[10px] px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${
                              currentAction?.action === "reassign"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {currentAction?.action === "reassign" ? (
                              <>
                                → {branchUsers.length - manuallyDisabledCount}
                                {manuallyDisabledCount > 0 && (
                                  <span className="text-red-600 ml-1">
                                    ✕{manuallyDisabledCount}
                                  </span>
                                )}
                              </>
                            ) : (
                              <>✕ {branchUsers.length}</>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Branches Summary */}
            {selectedBranches.length > 0 && (
              <div className="px-4 py-3 bg-gradient-to-r from-red-50 to-orange-50 border-t border-red-100">
                <div className="flex items-center gap-2 text-red-700">
                  <Building2 size={14} />
                  <span className="text-sm font-medium">
                    {selectedBranches.length} branch
                    {selectedBranches.length > 1 ? "es" : ""} deactivating
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Branch User Actions Panel */}
          <div className="w-1/3 flex flex-col bg-gradient-to-b from-gray-50 to-white">
            <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertTriangle size={16} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  Branch Users
                </h3>
                <p className="text-[10px] text-gray-500">
                  Configure what happens to users
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {selectedBranchesWithUsers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                    <UserMinus size={24} className="opacity-50" />
                  </div>
                  <p className="text-sm font-medium">
                    Select a branch with users
                  </p>
                  <p className="text-xs mt-1">to configure user actions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedBranchesWithUsers.map(
                    ({ branch, users: branchUsers, action }) => {
                      const manuallyDisabledUsers = branchUsers.filter((u) =>
                        selectedUsers.includes(u.user_id),
                      );

                      return (
                        <div
                          key={branch.branch_id}
                          className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
                        >
                          {/* Header */}
                          <div className="px-4 py-3 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
                                <Building2 size={12} className="text-red-600" />
                              </div>
                              <span className="text-sm font-semibold text-red-700">
                                {branch.branch_name}
                              </span>
                            </div>
                            <span className="text-xs text-red-600 font-medium bg-red-100 px-2 py-0.5 rounded-full">
                              {branchUsers.length} user
                              {branchUsers.length > 1 ? "s" : ""}
                            </span>
                          </div>

                          {/* Action Options */}
                          <div className="p-3 space-y-2">
                            {/* Disable Option */}
                            <label
                              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                action?.action === "disable"
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`action-${branch.branch_id}`}
                                checked={action?.action === "disable"}
                                onChange={() =>
                                  setBranchAction(branch.branch_id, "disable")
                                }
                                className="w-4 h-4 text-red-600 focus:ring-red-500"
                              />
                              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                <UserMinus size={14} className="text-red-600" />
                              </div>
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-900">
                                  Disable all users
                                </span>
                                <p className="text-xs text-gray-500">
                                  {branchUsers.length} user
                                  {branchUsers.length > 1 ? "s" : ""} will lose
                                  access
                                </p>
                              </div>
                            </label>

                            {/* Reassign Option */}
                            {availableBranchesForReassign.length > 0 && (
                              <div
                                className={`rounded-xl border-2 transition-all overflow-visible ${
                                  action?.action === "reassign"
                                    ? "border-blue-300 bg-blue-50"
                                    : "border-gray-200"
                                }`}
                              >
                                <label className="flex items-center gap-3 p-3 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`action-${branch.branch_id}`}
                                    checked={action?.action === "reassign"}
                                    onChange={() =>
                                      setBranchAction(
                                        branch.branch_id,
                                        "reassign",
                                      )
                                    }
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                  />
                                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <ArrowRightLeft
                                      size={14}
                                      className="text-blue-600"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <span className="text-sm font-medium text-gray-900">
                                      Reassign to another branch
                                    </span>
                                    <p className="text-xs text-gray-500">
                                      Move users to keep them active
                                    </p>
                                  </div>
                                </label>

                                {action?.action === "reassign" && (
                                  <div className="px-3 pb-3 space-y-3">
                                    <StyledDropdown
                                      value={action.targetBranchId || ""}
                                      onChange={(value) =>
                                        setBranchAction(
                                          branch.branch_id,
                                          "reassign",
                                          value,
                                        )
                                      }
                                      placeholder="Select target branch..."
                                      options={availableBranchesForReassign.map(
                                        (b) => ({
                                          value: b.branch_id,
                                          label: b.branch_name,
                                          isMain: b.is_main,
                                        }),
                                      )}
                                    />

                                    {manuallyDisabledUsers.length > 0 && (
                                      <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                                        <AlertTriangle
                                          size={14}
                                          className="text-amber-600 mt-0.5 flex-shrink-0"
                                        />
                                        <div className="text-xs text-amber-700">
                                          <span className="font-medium">
                                            {manuallyDisabledUsers.length} user
                                            {manuallyDisabledUsers.length > 1
                                              ? "s"
                                              : ""}
                                          </span>{" "}
                                          will be disabled instead
                                        </div>
                                      </div>
                                    )}

                                    <p className="text-xs text-blue-600 flex items-center gap-1.5">
                                      <Info size={12} />
                                      Click users in left panel to disable
                                      individually
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Affected Users Preview */}
                          <div className="px-3 pb-3">
                            <p className="text-xs text-gray-500 mb-2 font-medium">
                              Affected users:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {branchUsers.slice(0, 4).map((user) => {
                                const isManuallyDisabled =
                                  manuallyDisabledUsers.some(
                                    (u) => u.user_id === user.user_id,
                                  );
                                return (
                                  <span
                                    key={user.user_id}
                                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                      isManuallyDisabled
                                        ? "bg-red-100 text-red-700 line-through"
                                        : action?.action === "reassign"
                                          ? "bg-blue-100 text-blue-700"
                                          : "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    {user.full_name}
                                  </span>
                                );
                              })}
                              {branchUsers.length > 4 && (
                                <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">
                                  +{branchUsers.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </div>

            {/* Action Required Warning */}
            {selectedBranches.length > 0 && !allBranchActionsResolved && (
              <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-200 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-600" />
                <span className="text-xs text-amber-700 font-medium">
                  Configure all branch user actions to continue
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100/50 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-xl transition-all font-medium"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="flex items-center gap-4">
            {!compliance.overall && (
              <span className="text-sm text-red-600 font-medium">
                {!compliance.users
                  ? `Disable ${
                      compliance.activeUsersAfter - compliance.userLimit
                    } more user${
                      compliance.activeUsersAfter - compliance.userLimit > 1
                        ? "s"
                        : ""
                    }`
                  : !compliance.branches
                    ? "Deactivate more branches"
                    : !allBranchActionsResolved
                      ? "Configure branch actions"
                      : "Complete required actions"}
              </span>
            )}
            <button
              onClick={handleContinue}
              disabled={!compliance.overall}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25 disabled:shadow-none"
            >
              Continue
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ComplianceModal;
