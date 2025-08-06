"use client";
import { useState, useRef, useEffect, useTransition } from "react";
import { useUser } from "@/app/contexts/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PostForm() {
  const { user: currentUser, loading } = useUser();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const resizeImage = (file, maxWidth = 1000) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        const { width, height } = img;

        // Always convert to WebP for optimization, even if no resizing is needed
        const ratio = width > maxWidth ? maxWidth / width : 1;
        canvas.width = width > maxWidth ? maxWidth : width;
        canvas.height = height * ratio;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            // Generate WebP filename
            const originalName = file.name.replace(/\.[^/.]+$/, "");
            const webpFileName = `${originalName}.webp`;

            const resizedFile = new File([blob], webpFileName, {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          },
          "image/webp",
          0.9
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageSelect = async (file) => {
    if (!file.type.startsWith("image/"))
      return setError("Please select a valid image file");

    if (file.size > 10 * 1024 * 1024)
      return setError("Image size must be less than 10MB"); // 10MB limit

    try {
      const resizedFile = await resizeImage(file);
      setSelectedImage(resizedFile);
      setImagePreview(URL.createObjectURL(resizedFile));
      setError("");
    } catch (error) {
      setError("Failed to process image");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleImageSelect(files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return setError("Please write something to post");
    setError("");
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("content", content);
        if (selectedImage) formData.append("image", selectedImage);
        const res = await fetch("/api/posts", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok) {
          setContent("");
          removeImage();
          router.refresh();
        } else {
          setError(data.error || "Failed to create post");
        }
      } catch (error) {
        toast.error(ToastMessage("حدث خطأ ما"));
      }
    });
  };

  useEffect(() => {
    const handlePaste = (event) => {
      if (event.clipboardData && event.clipboardData.items) {
        const item = event.clipboardData.items[0];
        const imageType = item.type;
        if (
          imageType === "image/png" ||
          imageType === "image/jpeg" ||
          imageType === "image/webp"
        ) {
          console.log("item: ", item);
          const file = item.getAsFile();

          handleImageSelect(file);
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[23rem] bg-black/20 backdrop-blur-sm rounded-xl p-6 mb-6 border border-[#8733ff]/20 shadow-lg shadow-[#531db5]/10">
        <div className="space-y-4 animate-pulse">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 rounded-full bg-gray-700/50 flex-shrink-0"></div>
            <div className="flex-1">
              <div className="w-full bg-gray-700/30 rounded-lg h-[6.2rem] mb-5"></div>
              <div className="border-2 border-dashed border-gray-600/30 rounded-lg p-4">
                <div className="text-center py-4">
                  <div className="w-8 h-8 bg-gray-700/30 rounded mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-700/30 rounded w-48 mx-auto mb-1"></div>
                  <div className="h-3 bg-gray-700/30 rounded w-32 mx-auto"></div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-6">
                <div className="h-4 bg-gray-700/30 rounded w-24"></div>
                <div className="h-8 bg-gray-700/30 rounded w-16"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Link
        className="min-h-[23rem] flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-xl p-6 mb-6 border border-[#8733ff]/20 shadow-lg shadow-[#531db5]/10"
        href="/login"
      >
        <div className="flex flex-col items-center justify-center h-full space-y-6 mb-6">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#531db5] to-[#8733ff] rounded-full">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">
              Join the conversation
            </h3>
            <p className="text-gray-300 text-lg mb-4">
              Please{" "}
              <span className="text-[#8733ff] hover:text-[#9d4aff] font-medium transition-colors inline-flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                login
              </span>{" "}
              to create a post
            </p>
            <div className="flex items-center justify-center space-x-4 text-gray-400 text-sm">
              <div className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 448 512"
                >
                  <path d="M384 32H64C28.65 32 0 60.65 0 96v320c0 35.35 28.65 64 64 64h320c35.35 0 64-28.65 64-64V96c0-35.35-28.7-64-64-64M192 256c0 1.684-.37 3.266-.496 4.916l86.42 43.21C289.2 294.2 303.8 288 320 288c35.35 0 64 28.65 64 64s-28.65 64-64 64-64-28.65-64-64c0-1.684.37-3.266.496-4.916L170.1 303.9c-11.3 9.9-25.9 16.1-42.1 16.1-35.35 0-64-28.65-64-64s28.65-64 64-64c16.19 0 30.81 6.211 42.08 16.12l86.42-43.21c-.1-1.61-.5-3.21-.5-4.91 0-35.35 28.65-64 64-64s64 28.65 64 64-28.65 64-64 64c-16.19 0-30.81-6.211-42.08-16.12L191.5 251.1c.1 1.6.5 3.2.5 4.9"></path>
                </svg>
                Share your thoughts
              </div>
              <div className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
                Upload images
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="min-h-[23rem] bg-black/20 backdrop-blur-sm rounded-xl p-6 mb-6 border border-[#8733ff]/20 shadow-lg shadow-[#531db5]/10">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start space-x-4">
          <img
            src={currentUser.image}
            alt={currentUser.name}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full bg-gray-800/30 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8733ff] focus:border-[#8733ff] resize-none backdrop-blur-sm"
              rows={3}
              maxLength={500}
              disabled={isPending}
            />

            {/* Image Upload Area */}
            <div
              className={`mt-3 border-2 border-dashed rounded-lg p-4 transition-colors ${
                isDragOver
                  ? "border-[#8733ff] bg-[#8733ff]/10"
                  : "border-gray-600/50 hover:border-[#8733ff]/50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageSelect(file);
                }}
                className="hidden"
                disabled={isPending}
              />

              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full max-h-64 rounded-lg mx-auto"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage();
                    }}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                    disabled={isPending}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <svg
                    className="w-8 h-8 text-gray-400 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-gray-400 text-sm">
                    Drag and drop an image here, or click to select
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Images will be resized to max 1000px width
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-400">
                {content.length}/500 characters
              </span>
              <button
                type="submit"
                disabled={isPending || !content.trim()}
                className="px-8 py-2 bg-gradient-to-r from-[#531db5] to-[#8733ff] text-white rounded-lg hover:from-[#6d2cc7] hover:to-[#9d4aff] focus:outline-none focus:ring-2 focus:ring-[#8733ff] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-[#531db5]/30"
              >
                {isPending ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 backdrop-blur-sm">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </form>
    </div>
  );
}
