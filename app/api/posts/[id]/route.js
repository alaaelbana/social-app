import { NextResponse } from "next/server";
import connectMongoDB from "../../../lib/mongodb";
import Post from "../../../../models/Post";
import { getCurrentUser } from "../../../lib/auth";
import cloudinary from "../../../lib/cloudinary";
import mongoose from "mongoose";
import { rateLimit } from "@/app/lib/rate-limit";

// api/posts/[id]

const putLimiter = rateLimit({
  interval: 5 * 60 * 1000, // 5 minute
  limit: 10, // 10 requests per minute
  uniqueTokenPerInterval: 500,
});
// PUT - Update post
export async function PUT(request, { params }) {
  try {
    await putLimiter.check(request);
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const formData = await request.formData();
    const content = formData.get("content");
    const image = formData.get("image");
    const removeImage = formData.get("removeImage") === "true";

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Post content is required" },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: "Post content must be 500 characters or less" },
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

    // Check if user owns the post
    if (post.author.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: "You can only edit your own posts" },
        { status: 403 }
      );
    }

    const updateData = { content: content.trim() };

    // Handle image removal
    if (removeImage && post.image?.publicId) {
      try {
        await cloudinary.uploader.destroy(post.image.publicId);
        updateData.image = undefined;
      } catch (error) {
        console.error("Error removing image:", error);
      }
    }

    // Handle new image upload
    if (image && image.size > 0) {
      try {
        // Remove old image if exists
        if (post.image?.publicId) {
          await cloudinary.uploader.destroy(post.image.publicId);
        }

        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload new image to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                resource_type: "image",
                folder: "social-app/posts",
                transformation: [
                  { width: 1000, crop: "limit" },
                  { quality: "auto" },
                  { fetch_format: "auto" },
                ],
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            )
            .end(buffer);
        });

        updateData.image = {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        };
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload image" },
          { status: 500 }
        );
      }
    }

    const updatedPost = await Post.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("author", "name email image");

    return NextResponse.json(
      {
        message: "Post updated successfully",
        post: updatedPost,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete post
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    await connectMongoDB();

    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user owns the post
    if (post.author.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: "You can only delete your own posts" },
        { status: 403 }
      );
    }

    // Delete image from Cloudinary if exists
    if (post.image?.publicId) {
      try {
        await cloudinary.uploader.destroy(post.image.publicId);
      } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
      }
    }

    await Post.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Post deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
