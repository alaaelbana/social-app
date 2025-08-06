"use client";
import { useState } from "react";
import Link from "next/link";
import { useUser } from "../../contexts/UserContext";
import Logo from "../icons/Logo";

export default function Header() {
  const { user, loading, logout } = useUser();
  const [isDisabled, setIsDisabled] = useState(false);

  const handleLogout = async () => {
    try {
      setIsDisabled(true);
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsDisabled(false);
    }
  };

  return (
    <header className="bg-indigo-950/10 backdrop-blur-md border-b border-[#8733ff]/10 sticky top-0 z-50 shadow-lg shadow-[#531db5]/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Logo width={40} height={26} />
            <span className="text-xl font-bold text-white">SocialApp</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            {loading ? (
              <div className="flex space-x-2">
                <div className="w-20 h-8 bg-gray-700/50 rounded animate-pulse"></div>
                <div className="w-20 h-8 bg-gray-700/50 rounded animate-pulse"></div>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <Link href="/settings" className="flex items-center space-x-3">
                  <img
                    src={user.image}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-white font-medium">{user.name}</span>
                </Link>

                <button
                  disabled={isDisabled}
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-[#531db5] to-[#8733ff] text-white rounded-md hover:from-[#6d2cc7] hover:to-[#9d4aff] transition-all duration-200 shadow-lg shadow-[#531db5]/30"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
