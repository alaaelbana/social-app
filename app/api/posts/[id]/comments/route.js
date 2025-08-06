import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Post from "@/models/Post";
import { getCurrentUser } from "@/app/lib/auth";
import connectMongoDB from "@/app/lib/mongodb";
import { rateLimit } from "@/app/lib/rate-limit";

// api/posts/[id]/comments

const postLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  limit: 10, // 10 requests per minute
  uniqueTokenPerInterval: 500,
});

// POST - Add a comment to a post
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
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    if (content.length > 200) {
      return NextResponse.json(
        { error: "Comment must be 200 characters or less" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    await connectMongoDB();

    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const newComment = {
      user: user._id,
      content: content.trim(),
      createdAt: new Date(),
    };

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $push: { comments: newComment } },
      { new: true }
    )
      .populate("author", "name email image")
      .populate("comments.user", "name image");

    return NextResponse.json(
      {
        message: "Comment added successfully",
        post: updatedPost,
        comment: newComment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add comment error:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a comment from a post
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json(
        { error: "Comment ID is required" },
        { status: 400 }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(commentId)
    ) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await connectMongoDB();

    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if user owns the comment or the post
    if (
      comment.user.toString() !== user._id.toString() &&
      post.author.toString() !== user._id.toString()
    ) {
      return NextResponse.json(
        {
          error:
            "You can only delete your own comments or comments on your posts",
        },
        { status: 403 }
      );
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $pull: { comments: { _id: commentId } } },
      { new: true }
    )
      .populate("author", "name email image")
      .populate("comments.user", "name image");

    return NextResponse.json(
      {
        message: "Comment deleted successfully",
        post: updatedPost,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
