// pharmacy-web/src/store/useAuthStore.js (do not remove this comment)
// src/store/useAuthStore.js

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { decodeJWT, isTokenExpired, getUserFromToken } from "../utils/jwt";
import {
  roleHasPermission,
  roleHasAnyPermission,
  canAccessRoute,
} from "../config/permissions";

const BRANCH_MODE = {
  GLOBAL: "GLOBAL",
  BRANCH: "BRANCH",
};

const initialBranchContext = {
  mode: BRANCH_MODE.GLOBAL,
  branch_id: null,
  branch_name: null,
};

const initialState = {
  isAuthenticated: false,
  isInitialized: false,
  isLoading: true,
  user: null,
  permissions: [],
  shopName: null,
  branchContext: { ...initialBranchContext },
};

const ALL_STORAGE_KEYS = [
  "access_token",
  "user_id",
  "shop_id",
  "user_name",
  "username",
  "branch_name",
  "shop_name",
  "cureli-auth-storage",
  "cureli-setup-storage",
  "menu-storage",
];

export const clearAllAppStorage = () => {
  ALL_STORAGE_KEYS.forEach((key) => {
    try { localStorage.removeItem(key); } catch {}
  });
  try { sessionStorage.clear(); } catch {}
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      initialize: () => {
        const token = localStorage.getItem("access_token");

        if (token && !isTokenExpired(token)) {
          const tokenUser = getUserFromToken(token);

          if (tokenUser) {
            const role = tokenUser.role;
            const isSuperAdmin = role === "super_admin";
            const persistedState = get();

            // Priority: persisted zustand → localStorage → ""
            const resolvedName =
              persistedState.user?.name ||
              localStorage.getItem("user_name") ||
              "";

            const resolvedUsername =
              persistedState.user?.username ||
              localStorage.getItem("username") ||
              "";

            let branchContext;
            if (isSuperAdmin) {
              if (
                persistedState.branchContext?.mode === BRANCH_MODE.BRANCH &&
                persistedState.branchContext?.branch_id
              ) {
                branchContext = persistedState.branchContext;
              } else {
                branchContext = {
                  mode: BRANCH_MODE.GLOBAL,
                  branch_id: null,
                  branch_name: null,
                };
              }
            } else {
              branchContext = {
                mode: BRANCH_MODE.BRANCH,
                branch_id: tokenUser.branch_id || null,
                branch_name:
                  persistedState.branchContext?.branch_name ||
                  localStorage.getItem("branch_name") ||
                  null,
              };
            }

            set({
              isAuthenticated: true,
              isInitialized: true,
              isLoading: false,
              user: {
                user_id:  tokenUser.user_id,
                shop_id:  tokenUser.shop_id,
                role:     tokenUser.role,
                status:   tokenUser.status,
                name:     resolvedName,
                username: resolvedUsername,
              },
              shopName:
                persistedState.shopName ||
                localStorage.getItem("shop_name") ||
                null,
              branchContext,
            });
            return;
          }
        }

        set({ ...initialState, isInitialized: true, isLoading: false });
      },

      setAuth: (data) => {
        const {
          access_token,
          user_id,
          shop_id,
          branch_id,
          branch_name,
          shop_name,
          role,
          user_name,
          username,
        } = data;

        localStorage.setItem("access_token", access_token);
        localStorage.setItem("user_id", user_id);
        if (shop_id)     localStorage.setItem("shop_id", shop_id);
        if (user_name)   localStorage.setItem("user_name", user_name);
        if (username)    localStorage.setItem("username", username);
        if (branch_name) localStorage.setItem("branch_name", branch_name);
        if (shop_name)   localStorage.setItem("shop_name", shop_name);

        const tokenUser = getUserFromToken(access_token);
        const isSuperAdmin = role === "super_admin";

        const branchContext = isSuperAdmin
          ? { mode: BRANCH_MODE.GLOBAL, branch_id: null, branch_name: null }
          : {
              mode: BRANCH_MODE.BRANCH,
              branch_id: branch_id || tokenUser?.branch_id || null,
              branch_name: branch_name || null,
            };

        set({
          isAuthenticated: true,
          isInitialized: true,
          isLoading: false,
          user: {
            user_id,
            shop_id,
            role:     role || tokenUser?.role,
            status:   tokenUser?.status,
            name:     user_name || "",
            username: username  || "",
          },
          shopName: shop_name || null,
          branchContext,
        });
      },

      setPermissions: (permissions) => set({ permissions }),

      logout: () => {
        clearAllAppStorage();
        set({
          ...initialState,
          isInitialized: true,
          isLoading: false,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setGlobalBranch: () => {
        const { user } = get();
        if (!user || user.role !== "super_admin") return false;
        set({
          branchContext: {
            mode: BRANCH_MODE.GLOBAL,
            branch_id: null,
            branch_name: null,
          },
        });
        return true;
      },

      setBranch: (branch_id, branch_name) => {
        const { user } = get();
        if (!user) return false;
        if (user.role !== "super_admin") return false;
        if (!branch_id) return false;
        set({
          branchContext: {
            mode: BRANCH_MODE.BRANCH,
            branch_id,
            branch_name: branch_name || null,
          },
        });
        if (branch_name) localStorage.setItem("branch_name", branch_name);
        return true;
      },

      isGlobalMode: () => get().branchContext.mode === BRANCH_MODE.GLOBAL,
      isBranchMode: () => get().branchContext.mode === BRANCH_MODE.BRANCH,
      canWrite: () =>
        get().branchContext.mode === BRANCH_MODE.BRANCH &&
        !!get().branchContext.branch_id,

      hasPermission: (permission) => {
        const { user, permissions } = get();
        if (!user) return false;
        if (permissions.length > 0) {
          if (permissions.includes("*")) return true;
          return permissions.includes(permission);
        }
        return roleHasPermission(user.role, permission);
      },

      hasAnyPermission: (...perms) => {
        const { user, permissions } = get();
        if (!user) return false;
        if (permissions.length > 0) {
          if (permissions.includes("*")) return true;
          return perms.some((p) => permissions.includes(p));
        }
        return roleHasAnyPermission(user.role, perms);
      },

      hasRole: (...roles) => {
        const { user } = get();
        if (!user) return false;
        return roles.includes(user.role);
      },

      canAccess: (route) => {
        const { user } = get();
        if (!user) return false;
        return canAccessRoute(user.role, route);
      },

      isSuperAdmin: () => get().user?.role === "super_admin",

      updateToken: (newToken) => {
        localStorage.setItem("access_token", newToken);
        const tokenUser = getUserFromToken(newToken);
        if (tokenUser) {
          set((state) => ({ user: { ...state.user, ...tokenUser } }));
        }
      },

      isTokenValid: () => {
        const token = localStorage.getItem("access_token");
        return token && !isTokenExpired(token);
      },

      getToken: () => localStorage.getItem("access_token"),
    }),
    {
      name: "cureli-auth-storage",
      version: 2,
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user:            state.user,
        shopName:        state.shopName,
        branchContext:   state.branchContext,
      }),
      migrate: (persistedState, version) => {
        if (version === 1) {
          const oldBranchName = persistedState.branchName;
          delete persistedState.branchName;
          persistedState.branchContext = {
            mode: BRANCH_MODE.GLOBAL,
            branch_id: null,
            branch_name: oldBranchName || null,
          };
        }
        return persistedState;
      },
    },
  ),
);

export const selectIsAuthenticated = (state) => state.isAuthenticated;
export const selectIsInitialized   = (state) => state.isInitialized;
export const selectIsLoading       = (state) => state.isLoading;
export const selectUser            = (state) => state.user;
export const selectUserRole        = (state) => state.user?.role;
export const selectIsSuperAdmin    = (state) => state.user?.role === "super_admin";
export const selectShopName        = (state) => state.shopName;
export const selectBranchContext   = (state) => state.branchContext;
export const selectBranchMode      = (state) => state.branchContext.mode;
export const selectBranchId        = (state) => state.branchContext.branch_id;
export const selectBranchName      = (state) => state.branchContext.branch_name;
export const selectIsGlobalMode    = (state) => state.branchContext.mode === "GLOBAL";
export const selectIsBranchMode    = (state) => state.branchContext.mode === "BRANCH";
export const selectCanWrite        = (state) =>
  state.branchContext.mode === "BRANCH" && !!state.branchContext.branch_id;

export { BRANCH_MODE };