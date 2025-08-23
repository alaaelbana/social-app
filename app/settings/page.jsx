"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../contexts/UserContext";
import Header from "../components/shared/Header";

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading, updateUser, requireAuth } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    website: "",
    twitter: "",
    linkedin: "",
    github: "",
  });

  useEffect(() => {
    if (!loading) {
      if (!requireAuth()) return;

      if (user) {
        setFormData({
          name: user.name,
          email: user.email,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
          website: user.links?.website || "",
          twitter: user.links?.twitter || "",
          linkedin: user.links?.linkedin || "",
          github: user.links?.github || "",
        });
        setImagePreview(user.image);
      }
    }
  }, [user, loading, requireAuth]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (file) => {
    if (!file.type.startsWith("image/"))
      return setError("Please select a valid image file");

    if (file.size > 5 * 1024 * 1024)
      return setError("Image size must be less than 5MB");

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    // Validate passwords
    if (
      formData.newPassword &&
      formData.newPassword !== formData.confirmPassword
    ) {
      setError("New passwords do not match");
      setIsSubmitting(false);
      return;
    }

    if (formData.newPassword && !formData.currentPassword) {
      setError("Current password is required to change password");
      setIsSubmitting(false);
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("email", formData.email);
      submitData.append("website", formData.website);
      submitData.append("twitter", formData.twitter);
      submitData.append("linkedin", formData.linkedin);
      submitData.append("github", formData.github);

      if (formData.currentPassword) {
        submitData.append("currentPassword", formData.currentPassword);
      }
      if (formData.newPassword) {
        submitData.append("newPassword", formData.newPassword);
      }
      if (selectedImage) {
        submitData.append("image", selectedImage);
      }

      const response = await fetch("/api/auth/me", {
        method: "PUT",
        body: submitData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Profile updated successfully!");
        updateUser(data.user);
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        setSelectedImage(null);
        // Update image preview with new URL if uploaded
        if (data.user.image) setImagePreview(data.user.image);
      } else {
        setError(data.error || "Failed to update profile");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#531db5]/10 via-gray-900/30 to-[#8733ff]/10">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-[#8733ff]/20 shadow-lg shadow-[#531db5]/10">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-700/50 rounded w-1/4"></div>
              <div className="h-4 bg-gray-700/50 rounded w-3/4"></div>
              <div className="space-y-3">
                <div className="h-10 bg-gray-700/50 rounded"></div>
                <div className="h-10 bg-gray-700/50 rounded"></div>
                <div className="h-10 bg-gray-700/50 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#531db5]/10 via-gray-900/40 to-[#8733ff]/10">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-[#8733ff]/20 shadow-lg shadow-[#531db5]/10">
          <h1 className="text-2xl font-bold text-white mb-6">
            Profile Settings
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Profile Image
              </label>
              <div className="flex items-center space-x-4">
                <img
                  src={imagePreview}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#8733ff]/30"
                />
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-600/50 text-white rounded-lg hover:bg-[#8733ff]/50 transition-colors backdrop-blur-sm"
                    disabled={isSubmitting}
                  >
                    Change Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageSelect(file);
                    }}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Max 5MB. Recommended: 400x400px
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800/30 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8733ff] focus:border-[#8733ff] backdrop-blur-sm"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800/30 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8733ff] focus:border-[#8733ff] backdrop-blur-sm"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Password Change */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">
                Change Password
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800/30 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8733ff] focus:border-[#8733ff] backdrop-blur-sm"
                    placeholder="Leave blank to keep current"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800/30 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8733ff] focus:border-[#8733ff] backdrop-blur-sm"
                    placeholder="Min 6 characters"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800/30 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8733ff] focus:border-[#8733ff] backdrop-blur-sm"
                    placeholder="Confirm new password"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Social Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800/30 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8733ff] focus:border-[#8733ff] backdrop-blur-sm"
                    placeholder="https://yourwebsite.com"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Twitter
                  </label>
                  <input
                    type="text"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800/30 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8733ff] focus:border-[#8733ff] backdrop-blur-sm"
                    placeholder="@username or full URL"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    LinkedIn
                  </label>
                  <input
                    type="text"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800/30 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8733ff] focus:border-[#8733ff] backdrop-blur-sm"
                    placeholder="LinkedIn profile URL"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    GitHub
                  </label>
                  <input
                    type="text"
                    name="github"
                    value={formData.github}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800/30 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8733ff] focus:border-[#8733ff] backdrop-blur-sm"
                    placeholder="GitHub username or profile URL"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="px-6 py-3 bg-gray-600/50 text-white rounded-lg hover:bg-gray-600/70 transition-colors backdrop-blur-sm"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-gradient-to-r from-[#531db5] to-[#8733ff] text-white rounded-lg hover:from-[#6d2cc7] hover:to-[#9d4aff] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#531db5]/30"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
