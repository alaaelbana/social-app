import { NextResponse } from "next/server";
import connectMongoDB from "../../../../lib/mongodb";
import Post from "../../../../../models/Post";
import { getCurrentUser } from "../../../../lib/auth";
import mongoose from "mongoose";
import { rateLimit } from "@/app/lib/rate-limit";

// api/posts/[id]/likes

const postLimiter = rateLimit({
  interval: 60 * 1000, // 30 minute
  limit: 100, // 100 requests per minute
  uniqueTokenPerInterval: 500,
});

// POST - Toggle like on a post
export async function POST(request, { params }) {
  try {
    await postLimiter.check(request);
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    await connectMongoDB();

    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const userId = user._id;
    const isLiked = post.likes.includes(userId);

    let updatedPost;
    if (isLiked) {
      // Unlike the post
      updatedPost = await Post.findByIdAndUpdate(
        id,
        { $pull: { likes: userId } },
        { new: true }
      ).populate("author", "name email image");
    } else {
      // Like the post
      updatedPost = await Post.findByIdAndUpdate(
        id,
        { $addToSet: { likes: userId } },
        { new: true }
      ).populate("author", "name email image");
    }

    return NextResponse.json(
      {
        message: isLiked ? "Post unliked" : "Post liked",
        post: updatedPost,
        isLiked: !isLiked,
        likesCount: updatedPost.likes.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Toggle like error:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
