import PostsFeedClient from "./PostsFeedClient";

async function getInitialPosts() {
  try {
    // Fetch first 2 pages (20 posts) from the server
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/posts?page=1&limit=20`,
      { cache: "no-store" }
    );
    if (!response.ok) throw new Error("Failed to fetch posts");
    const data = await response.json();
    // Combine posts from both pages
    return data;
  } catch (error) {
    console.error("Error fetching initial posts:", error);
    return [];
  }
}

export default async function PostsFeed({ newPost = null }) {
  const { posts, pagination } = await getInitialPosts();

  return (
    <PostsFeedClient
      hasMoreServer={pagination?.hasMore}
      initialPosts={posts}
      newPost={newPost}
    />
  );
}
