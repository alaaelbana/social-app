"use client";
import { useState, useEffect, useCallback } from "react";
import PostCard from "./PostCard";
import { useUser } from "@/app/contexts/UserContext";

export default function PostsFeedClient({
  initialPosts,
  newPost,
  hasMoreServer,
}) {
  const { user: currentUser } = useUser();
  const [posts, setPosts] = useState(initialPosts || []);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(hasMoreServer);
  const [page, setPage] = useState(2);
  const [error, setError] = useState("");

  // Add new post to the beginning of the feed
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 1000 &&
        !loadingMore &&
        hasMore
      ) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadingMore, hasMore]);

  const fetchPosts = async (pageNum) => {
    try {
      setLoadingMore(true);
      const response = await fetch(`/api/posts?page=${pageNum}&limit=10`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      const data = await response.json();
      setPosts((prevPosts) => [...prevPosts, ...data.posts]);
      setHasMore(data.pagination?.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError("Failed to load posts");
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) fetchPosts(page + 1);
  }, [page, loadingMore, hasMore]);

  const handlePostUpdated = (updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === updatedPost._id ? updatedPost : post
      )
    );
  };

  const handlePostDeleted = (postId) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
  };

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center backdrop-blur-sm shadow-lg">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => {
            setError("");
            fetchPosts(page);
          }}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {posts.length === 0 ? (
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-8 text-center border border-[#8733ff]/20 shadow-lg shadow-[#531db5]/10">
          <p className="text-gray-300 text-lg">No posts yet</p>
          <p className="text-gray-400 mt-2">Be the first to share something!</p>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUser={currentUser}
              onPostUpdated={handlePostUpdated}
              onPostDeleted={handlePostDeleted}
            />
          ))}

          {loadingMore && (
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 animate-pulse border border-[#8733ff]/20 shadow-lg shadow-[#531db5]/10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-700/50 rounded-full"></div>
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-gray-700/50 rounded"></div>
                  <div className="w-16 h-3 bg-gray-700/50 rounded"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-4 bg-gray-700/50 rounded"></div>
                <div className="w-3/4 h-4 bg-gray-700/50 rounded"></div>
              </div>
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <div className="text-center py-8">
              <p className="text-gray-300">You've reached the end!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
