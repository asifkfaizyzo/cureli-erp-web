// pharmacy-web/src/store/useSetupStore.js (do not remove this comment)
// src/store/useSetupStore.js

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Setup Wizard Store
 * Manages the post-plan setup flow state with localStorage persistence
 *
 * IMPORTANT RULES:
 * - Super Admin (SA) is NOT counted in user limits
 * - Each Staff/Branch Admin belongs to exactly ONE branch
 * - Each branch can have only ONE Branch Admin
 * - 3 Steps: Branches → Users → Review
 */

const initialState = {
  isSetupComplete: false,
  isInitialized: false,
  currentStep: 1,

  planLimits: {
    plan_id: null,
    plan_name: "",
    max_branches: 1,
    max_users: 1,
  },

  branches: [],
  users: [],

  superAdmin: {
    user_id: null,
    name: "",
  },

  error: null,
};

export const useSetupStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      // ============================================
      // INITIALIZATION
      // ============================================

      initializeSetup: ({ planLimits, superAdmin, forceRefresh = false }) => {
        const state = get();

        // Force refresh means clear everything and start fresh
        if (forceRefresh) {
  
          set({
            isSetupComplete: false,
            isInitialized: false,
            currentStep: 1,
            branches: [],
            users: [],
            error: null,
          });
        }

        // Skip if already complete and not forcing
        if (state.isSetupComplete && !forceRefresh) {
      
          return;
        }

      

        set({
          isInitialized: true,
          isSetupComplete: false,
          planLimits: {
            plan_id: planLimits.plan_id,
            plan_name: planLimits.plan_name,
            max_branches: planLimits.max_branches,
            max_users: planLimits.max_users,
          },
          superAdmin: {
            user_id: superAdmin.user_id,
            name: superAdmin.name,
          },
          error: null,
        });
      },

      isStoreReady: () => {
        const state = get();
        return state.isInitialized && state.planLimits.plan_id !== null;
      },

      setCurrentStep: (step) => set({ currentStep: step }),

      // ============================================
      // BRANCH MANAGEMENT
      // ============================================

      addBranch: (branchData) => {
        const state = get();
        const { branches, planLimits, isInitialized } = state;

        if (!isInitialized) {
          console.error(" Store not initialized!");
          return {
            success: false,
            error: "Setup not initialized. Please refresh the page.",
          };
        }

        if (
          planLimits.max_branches !== -1 &&
          branches.length >= planLimits.max_branches
        ) {
          return {
            success: false,
            error: `Branch limit reached (${planLimits.max_branches} max)`,
          };
        }

        const temp_id = `branch_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        const newBranch = {
          temp_id,
          branch_name: branchData.branch_name,
          address_line_1: branchData.address_line_1 || "",
          city: branchData.city || "",
          state: branchData.state || "",
          pincode: branchData.pincode || "",
          contact_number: branchData.contact_number || "",
        };

        set({
          branches: [...branches, newBranch],
          error: null,
        });

       
        return { success: true, branch: newBranch };
      },

      updateBranch: (temp_id, updates) => {
        const state = get();
        set({
          branches: state.branches.map((b) =>
            b.temp_id === temp_id ? { ...b, ...updates } : b,
          ),
        });
      },

      removeBranch: (temp_id) => {
        const state = get();

        const newBranches = state.branches.filter((b) => b.temp_id !== temp_id);
        const newUsers = state.users.filter(
          (u) => u.branch_temp_id !== temp_id,
        );

        set({
          branches: newBranches,
          users: newUsers,
        });
      },

      canAddBranch: () => {
        const state = get();
        const { max_branches } = state.planLimits;
        if (max_branches === -1) return true;
        return state.branches.length < max_branches;
      },

      // ============================================
      // BRANCH ADMIN HELPERS
      // ============================================

      branchHasAdmin: (branch_temp_id, excludeUserTempId = null) => {
        const state = get();
        return state.users.some(
          (u) =>
            u.branch_temp_id === branch_temp_id &&
            u.role === "branch_admin" &&
            u.temp_id !== excludeUserTempId,
        );
      },

      getBranchesWithoutAdmin: (excludeUserTempId = null) => {
        const state = get();
        const branchesWithAdmin = new Set(
          state.users
            .filter(
              (u) =>
                u.role === "branch_admin" && u.temp_id !== excludeUserTempId,
            )
            .map((u) => u.branch_temp_id),
        );

        return state.branches.filter((b) => !branchesWithAdmin.has(b.temp_id));
      },

      getBranchAdmin: (branch_temp_id) => {
        const state = get();
        return (
          state.users.find(
            (u) =>
              u.branch_temp_id === branch_temp_id && u.role === "branch_admin",
          ) || null
        );
      },

      // ============================================
      // USER MANAGEMENT
      // ============================================

      addUser: (userData) => {
        const state = get();
        const { users, planLimits, isInitialized } = state;

        if (!isInitialized) {
          console.error(" Store not initialized!");
          return {
            success: false,
            error: "Setup not initialized. Please refresh the page.",
          };
        }

        if (
          planLimits.max_users !== -1 &&
          users.length >= planLimits.max_users
        ) {
          return {
            success: false,
            error: `User limit reached (${planLimits.max_users} max)`,
          };
        }

        const phoneExists = users.some(
          (u) => u.phone_number === userData.phone_number,
        );
        if (phoneExists) {
          return { success: false, error: "Phone number already exists" };
        }

        const usernameExists = users.some(
          (u) => u.username.toLowerCase() === userData.username.toLowerCase(),
        );
        if (usernameExists) {
          return { success: false, error: "Username already exists" };
        }

        if (userData.role === "branch_admin") {
          const branchHasAdmin = users.some(
            (u) =>
              u.branch_temp_id === userData.branch_temp_id &&
              u.role === "branch_admin",
          );

          if (branchHasAdmin) {
            return {
              success: false,
              error:
                "This branch already has a Branch Admin. Each branch can only have one.",
            };
          }
        }

        const temp_id = `user_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        const newUser = {
          temp_id,
          full_name: userData.full_name,
          phone_number: userData.phone_number,
          username: userData.username.toLowerCase(),
          password: userData.password,
          role: userData.role,
          branch_temp_id: userData.branch_temp_id,
        };

        set({
          users: [...users, newUser],
          error: null,
        });

        return { success: true, user: newUser };
      },

      updateUser: (temp_id, updates) => {
        const state = get();
        const existingUser = state.users.find((u) => u.temp_id === temp_id);

        if (!existingUser) {
          return { success: false, error: "User not found" };
        }

        const newRole = updates.role || existingUser.role;
        const newBranchId =
          updates.branch_temp_id || existingUser.branch_temp_id;

        if (newRole === "branch_admin") {
          const branchHasOtherAdmin = state.users.some(
            (u) =>
              u.branch_temp_id === newBranchId &&
              u.role === "branch_admin" &&
              u.temp_id !== temp_id,
          );

          if (branchHasOtherAdmin) {
            return {
              success: false,
              error:
                "This branch already has a Branch Admin. Each branch can only have one.",
            };
          }
        }

        if (
          updates.phone_number &&
          updates.phone_number !== existingUser.phone_number
        ) {
          const phoneExists = state.users.some(
            (u) =>
              u.phone_number === updates.phone_number && u.temp_id !== temp_id,
          );
          if (phoneExists) {
            return { success: false, error: "Phone number already exists" };
          }
        }

        if (
          updates.username &&
          updates.username.toLowerCase() !== existingUser.username.toLowerCase()
        ) {
          const usernameExists = state.users.some(
            (u) =>
              u.username.toLowerCase() === updates.username.toLowerCase() &&
              u.temp_id !== temp_id,
          );
          if (usernameExists) {
            return { success: false, error: "Username already exists" };
          }
        }

        set({
          users: state.users.map((u) =>
            u.temp_id === temp_id ? { ...u, ...updates } : u,
          ),
        });

        return { success: true };
      },

      removeUser: (temp_id) => {
        const state = get();
        set({
          users: state.users.filter((u) => u.temp_id !== temp_id),
        });
      },

      canAddUser: () => {
        const state = get();
        const { max_users } = state.planLimits;
        if (max_users === -1) return true;
        return state.users.length < max_users;
      },

      // ============================================
      // COMPUTED VALUES
      // ============================================

      getRemainingBranches: () => {
        const state = get();
        const { max_branches } = state.planLimits;
        if (max_branches === -1) return Infinity;
        return Math.max(0, max_branches - state.branches.length);
      },

      getRemainingUsers: () => {
        const state = get();
        const { max_users } = state.planLimits;
        if (max_users === -1) return Infinity;
        return Math.max(0, max_users - state.users.length);
      },

      canProceed: (step) => {
        const state = get();
        switch (step) {
          case 1:
            return state.branches.length >= 1;
          case 2:
            return true;
          case 3:
            return state.branches.length >= 1;
          default:
            return false;
        }
      },

      getUsersForBranch: (branch_temp_id) => {
        const state = get();
        return state.users.filter((u) => u.branch_temp_id === branch_temp_id);
      },

      getSubmissionData: () => {
        const state = get();
        return {
          branches: state.branches.map((b) => ({
            temp_id: b.temp_id,
            branch_name: b.branch_name,
            address_line_1: b.address_line_1 || null,
            city: b.city || null,
            state: b.state || null,
            pincode: b.pincode || null,
            contact_number: b.contact_number || null,
          })),
          users: state.users.map((u) => ({
            temp_id: u.temp_id,
            full_name: u.full_name,
            phone_number: u.phone_number,
            username: u.username,
            password: u.password,
            role: u.role,
            branch_temp_id: u.branch_temp_id,
          })),
        };
      },

      // ============================================
      // SETUP COMPLETION
      // ============================================

      completeSetup: () => {
        set({
          isSetupComplete: true,
          currentStep: 3,
          error: null,
        });
      },

      resetSetup: () => {

        set({
          isSetupComplete: false,
          isInitialized: false,
          currentStep: 1,
          planLimits: {
            plan_id: null,
            plan_name: "",
            max_branches: 1,
            max_users: 1,
          },
          branches: [],
          users: [],
          superAdmin: {
            user_id: null,
            name: "",
          },
          error: null,
        });
      },

      clearSetupData: () => {
        set({
          branches: [],
          users: [],
          currentStep: 1,
          error: null,
        });
      },

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),
    }),
    {
      name: "cureli-setup-storage",
      version: 5, // Bumped version to clear old data
      partialize: (state) => ({
        isSetupComplete: state.isSetupComplete,
        isInitialized: state.isInitialized,
        currentStep: state.currentStep,
        planLimits: state.planLimits,
        branches: state.branches,
        users: state.users,
        superAdmin: state.superAdmin,
      }),
    },
  ),
);

// Selectors
export const selectBranchCount = (state) => state.branches.length;
export const selectUserCount = (state) => state.users.length;
export const selectIsInitialized = (state) => state.isInitialized;
export const selectCanAddBranch = (state) => {
  const { max_branches } = state.planLimits;
  return max_branches === -1 || state.branches.length < max_branches;
};
export const selectCanAddUser = (state) => {
  const { max_users } = state.planLimits;
  return max_users === -1 || state.users.length < max_users;
};
