// cadmin-web/src/context/AuthContext.jsx (do not remove this comment)
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { getMyProfile, logoutAdmin } from "../api/cadminProfile";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [pendingCounts, setPendingCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem("cadmin_access_token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await getMyProfile();
      const { profile, pendingCounts: counts } = response.data.data;

      setAdmin(profile);
      setPendingCounts(counts);
      setError(null);

      const currentPath = window.location.pathname;
      const publicPaths = [
        "/",
        "/login",
        "/admin-forgot-password",
        "/reset-password",
      ];
      if (publicPaths.includes(currentPath)) {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(" [AuthContext] Profile fetch failed:", err.response?.data);

      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("cadmin_access_token");
        navigate("/");
        return;
      }

      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!admin) return;
    const interval = setInterval(
      async () => {
        try {
          const response = await getMyProfile();
          setPendingCounts(response.data.data.pendingCounts);
        } catch (err) {
          console.error("Failed to refresh pending counts:", err);
        }
      },
      2 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, [admin]);

  const logout = useCallback(async () => {
    try {
      await logoutAdmin();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("cadmin_access_token");
      setAdmin(null);
      setPendingCounts(null);
      navigate("/");
    }
  }, [navigate]);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        admin,
        pendingCounts,
        loading,
        error,
        logout,
        refreshProfile,
        isAuthenticated: !!admin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export default AuthContext;
