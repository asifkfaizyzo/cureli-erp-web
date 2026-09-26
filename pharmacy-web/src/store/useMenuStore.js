// pharmacy-web/src/store/useMenuStore.js (do not remove this comment)
// src/store/useMenuStore.js

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useMenuStore = create(
  persist(
    (set) => ({
      activeMenu: "dashboard",
      sidebarExpanded: true,
      breadcrumbs: ["Dashboard"],

      setActiveMenu: (menu) => set({ activeMenu: menu }),
      
      toggleSidebar: () =>
        set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),

      setBreadcrumbs: (crumbs) => set({ breadcrumbs: crumbs }),

      navigateTo: (menuId, breadcrumbs) =>
        set({ activeMenu: menuId, breadcrumbs }),

      resetToDefault: () =>
        set({ activeMenu: "dashboard", breadcrumbs: ["Dashboard"] }),
    }),
    {
      name: "menu-storage",
      partialize: (state) => ({
        activeMenu: state.activeMenu,
        breadcrumbs: state.breadcrumbs,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state?.activeMenu || !state?.breadcrumbs?.length) {
          state?.resetToDefault?.();
        }
      },
    }
  )
);