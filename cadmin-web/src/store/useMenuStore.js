// cadmin-web/src/store/useMenuStore.js (do not remove this comment)
// src/store/useMenuStore.js

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useMenuStore = create(
  persist(
    (set) => ({
      activeMenu: "dashboard",
      sidebarExpanded: true,
      setActiveMenu: (menu) => set({ activeMenu: menu }),
      toggleSidebar: () =>
        set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
      breadcrumbs: ["Dashboard"],
      setBreadcrumbs: (crumbs) => set({ breadcrumbs: crumbs }),
    }),
    {
      name: "menu-storage",
      partialize: (state) => ({
        activeMenu: state.activeMenu,
      }),
    },
  ),
);
