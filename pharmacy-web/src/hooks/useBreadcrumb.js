// pharmacy-web/src/hooks/useBreadcrumb.js (do not remove this comment)
// src/hooks/useBreadcrumb.js

import { useEffect } from "react";
import { useMenuStore } from "../store/useMenuStore";

/**
 * Hook to set breadcrumbs for pages not in the sidebar
 * @param {string[]} breadcrumbs - Array of breadcrumb labels
 * @param {string} [menuId] - Optional menu ID to set as active (for sidebar highlighting)
 */
export const useBreadcrumb = (breadcrumbs, menuId = null) => {
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);
  const setActiveMenu = useMenuStore((s) => s.setActiveMenu);

  useEffect(() => {
    if (breadcrumbs?.length > 0) {
      setBreadcrumbs(breadcrumbs);
    }
    
    if (menuId) {
      setActiveMenu(menuId);
    }
  }, [breadcrumbs, menuId, setBreadcrumbs, setActiveMenu]);
};

export default useBreadcrumb;