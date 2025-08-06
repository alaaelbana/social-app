"use client";
import { useState, useRef, useEffect } from "react";

export default function PostCard({
  post,
  currentUser,
  onPostUpdated,
  onPostDeleted,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(post.image?.url || null);
  const [removeImage, setRemoveImage] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes.length || 0);
  const [comments, setComments] = useState(post.comments || []);
  const [commentLoading, setCommentLoading] = useState(false);
  const fileInputRef = useRef(null);

  const isOwner = currentUser && currentUser.id === post.author._id;

  // Initialize likes and comments data
  useEffect(() => {
    setIsLiked(currentUser ? post.likes.includes(currentUser.id) : false);
  }, [currentUser]);

  const resizeImage = (file, maxWidth = 1000) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        const { width, height } = img;

        if (width <= maxWidth) return resolve(file);

        const ratio = maxWidth / width;
        canvas.width = maxWidth;
        canvas.height = height * ratio;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          },
          file.type,
          0.9
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageSelect = async (file) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      setError("Image size must be less than 10MB");
      return;
    }

    try {
      const resizedFile = await resizeImage(file);
      setSelectedImage(resizedFile);
      setImagePreview(URL.createObjectURL(resizedFile));
      setRemoveImage(false);
      setError("");
    } catch (error) {
      setError("Failed to process image");
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) {
      setError("Post content cannot be empty");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("content", editContent);

      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      if (removeImage) {
        formData.append("removeImage", "true");
      }

      const response = await fetch(`/api/posts/${post._id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        onPostUpdated(data.post);
        setIsEditing(false);
        setSelectedImage(null);
        setRemoveImage(false);
      } else {
        setError(data.error || "Failed to update post");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/posts/${post._id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onPostDeleted(post._id);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete post");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(`/api/posts/${post._id}/likes`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.isLiked);
        setLikesCount(data.likesCount);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleAddComment = async () => {
    if (!currentUser || !newComment.trim()) return;

    setCommentLoading(true);
    try {
      const response = await fetch(`/api/posts/${post._id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data.post.comments);
        setNewComment("");
        onPostUpdated(data.post);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to add comment");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const response = await fetch(
        `/api/posts/${post._id}/comments?commentId=${commentId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        const data = await response.json();
        setComments(data.post.comments);
        onPostUpdated(data.post);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete comment");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <>
      <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 mb-4 border border-[#8733ff]/20 shadow-lg shadow-[#531db5]/10">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <img
              src={post.author.image}
              alt={post.author.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h3 className="text-white font-medium">{post.author.name}</h3>
              <p className="text-gray-400 text-sm">
                {formatDate(post.createdAt)}
              </p>
            </div>
          </div>

          {isOwner && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                disabled={isLoading}
                className="text-gray-400 hover:text-white p-1 rounded transition-colors disabled:opacity-50"
                title="Edit post"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="text-gray-400 hover:text-red-400 p-1 rounded transition-colors disabled:opacity-50"
                title="Delete post"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Post Content */}
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-gray-800/30 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8733ff] focus:border-[#8733ff] resize-none backdrop-blur-sm"
              rows={3}
              maxLength={500}
              disabled={isLoading}
            />

            {/* Image Edit Section */}
            <div className="space-y-2">
              {imagePreview && !removeImage && (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Post image"
                    className="max-w-full max-h-64 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                    disabled={isLoading}
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
              )}

              <div className="flex items-center space-x-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelect(file);
                  }}
                  className="hidden"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 text-sm bg-gray-600/50 text-white rounded hover:bg-[#8733ff]/50 transition-colors backdrop-blur-sm"
                  disabled={isLoading}
                >
                  {imagePreview && !removeImage ? "Change Image" : "Add Image"}
                </button>
                {imagePreview && !removeImage && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    disabled={isLoading}
                  >
                    Remove Image
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">
                {editContent.length}/500 characters
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(post.content);
                    setImagePreview(post.image?.url || null);
                    setSelectedImage(null);
                    setRemoveImage(false);
                    setError("");
                  }}
                  disabled={isLoading}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  disabled={isLoading || !editContent.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-[#531db5] to-[#8733ff] text-white rounded-lg hover:from-[#6d2cc7] hover:to-[#9d4aff] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#531db5]/30"
                >
                  {isLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-white whitespace-pre-wrap mb-3">
              {post.content}
            </p>
            {post.image?.url && (
              <img
                src={post.image.url}
                alt="Post image"
                className="max-w-full max-h-[28rem] object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setShowFullscreen(true)}
              />
            )}
          </div>
        )}

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
          <div className="flex items-center space-x-4">
            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={!currentUser}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                isLiked
                  ? "text-red-500 bg-red-500/20 hover:bg-red-500/30 shadow-lg shadow-red-500/20"
                  : "text-gray-400 hover:text-red-500 hover:bg-red-500/10"
              } disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm`}
            >
              <svg
                className="w-5 h-5"
                fill={isLiked ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span className="text-sm">{likesCount}</span>
            </button>

            {/* Comment Button */}
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-400 hover:text-[#8733ff] hover:bg-[#8733ff]/10 transition-all duration-200 backdrop-blur-sm"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="text-sm">{comments.length}</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-700/50">
            {/* Add Comment */}
            {currentUser && (
              <div className="flex space-x-3 mb-4">
                <img
                  src={currentUser.image}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 bg-gray-800/30 border border-gray-600/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8733ff] focus:border-[#8733ff] text-sm backdrop-blur-sm"
                      maxLength={200}
                      disabled={commentLoading}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || commentLoading}
                      className="px-4 py-2 bg-gradient-to-r from-[#531db5] to-[#8733ff] text-white rounded-lg hover:from-[#6d2cc7] hover:to-[#9d4aff] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg shadow-[#531db5]/30"
                    >
                      {commentLoading ? "..." : "Post"}
                    </button>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {newComment.length}/200 characters
                  </div>
                </div>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="flex space-x-3">
                    <img
                      src={comment.user.image}
                      alt={comment.user.name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="bg-gray-800/20 rounded-lg px-3 py-2 border border-gray-600/30 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-medium text-sm">
                            {comment.user.name}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-400 text-xs">
                              {formatDate(comment.createdAt)}
                            </span>
                            {currentUser &&
                              (currentUser.id === comment.user._id ||
                                currentUser.id === post.author._id) && (
                                <button
                                  onClick={() =>
                                    handleDeleteComment(comment._id)
                                  }
                                  className="text-gray-400 hover:text-red-400 transition-colors duration-200"
                                  title="Delete comment"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              )}
                          </div>
                        </div>
                        <p className="text-white text-sm">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Fullscreen Image Modal */}
      </div>
      {showFullscreen && post.image?.url && (
        <div
          className="fixed w-screen h-screen left-0 top-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowFullscreen(false)}
        >
          <div className="relative max-w-full max-h-screen flex p-6">
            <img
              src={post.image.url}
              alt="Post image fullscreen"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/75 transition-all duration-200 backdrop-blur-sm"
            >
              <svg
                className="w-6 h-6"
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
        </div>
      )}
    </>
  );
}
