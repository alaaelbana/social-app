"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        if (!data.success) return null;
        setUser(data.user);
      } else setUser(null);
    } catch (error) {
      console.log("Auth check failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (userData) => setUser(userData);

  const logout = () => (window.location.href = "/login");

  const requireAuth = () => {
    if (!loading && !user) {
      router.push("/login");
      return false;
    }
    return true;
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const value = {
    user,
    loading,
    updateUser,
    logout,
    requireAuth,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserContext;
