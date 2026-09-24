// cadmin-web/src/store/useAdminModeStore.js (do not remove this comment)
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAdminModeStore = create(
  persist(
    (set) => ({
      activeModule: "admin", // "admin" | "marketplace" | "fleet"
      setActiveModule: (moduleId) => set({ activeModule: moduleId }),
    }),
    { name: "cadmin-active-module" }
  )
);

export const useAdminMode = () => {
  const activeModule = useAdminModeStore((s) => s.activeModule);
  const setActiveModule = useAdminModeStore((s) => s.setActiveModule);

  return {
    activeModule,
    setActiveModule,
    isAdmin: activeModule === "admin",
    isMarketplace: activeModule === "marketplace",
    isFleet: activeModule === "fleet",
  };
};

export default useAdminModeStore;