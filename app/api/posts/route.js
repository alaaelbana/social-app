import { NextResponse } from "next/server";
import connectMongoDB from "../../lib/mongodb";
import Post from "../../../models/Post";
import { getCurrentUser } from "../../lib/auth";
import cloudinary from "../../lib/cloudinary";
import { rateLimit } from "@/app/lib/rate-limit";
import sharp from "sharp";

// api/posts

// GET - Fetch posts with pagination
const getLimiter = rateLimit({
  interval: 1 * 60 * 1000, // 2 minute
  limit: 100, // 100 requests per minute
  uniqueTokenPerInterval: 500,
});

export async function GET(request) {
  try {
    await getLimiter.check(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    await connectMongoDB();

    const posts = await Post.find()
      .populate("author", "name email image")
      .populate("comments.user", "name image")
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPosts = await Post.countDocuments();
    const hasMore = skip + posts.length < totalPosts;

    return NextResponse.json(
      {
        posts,
        pagination: {
          page,
          limit,
          total: totalPosts,
          hasMore,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const postLimiter = rateLimit({
  interval: 30 * 60 * 1000, // 30 minute
  limit: 5, // 5 requests per minute
  uniqueTokenPerInterval: 500,
});

// POST - Create new post
export async function POST(request) {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  try {
    await postLimiter.check(request);
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401, headers: corsHeaders }
      );
    }

    const formData = await request.formData();
    const content = formData.get("content");
    const image = formData.get("image");

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Post content is required" },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: "Post content must be 500 characters or less" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectMongoDB();

    let imageData = null;

    // Handle image upload if present
    // Handle image upload if present
    if (image && image.size > 0) {
      try {
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Check image dimensions using sharp (recommended) or canvas API
        const metadata = await sharp(buffer).metadata();

        // check image format
        if (metadata.format !== "webp") {
          return NextResponse.json(
            {
              error: "Image format must be webp",
              details: {
                currentFormat: metadata.format,
                allowedFormats: "webp",
              },
            },
            { status: 400, headers: corsHeaders }
          );
        }
        // Validate image width
        if (metadata.width > 1000) {
          return NextResponse.json(
            {
              error: "Image width exceeds maximum allowed size of 1000px",
              details: { currentWidth: metadata.width, maxAllowed: 1000 },
            },
            { status: 400, headers: corsHeaders }
          );
        }

        const base64 = `data:image/webp;base64,${buffer.toString("base64")}`;
        const uploadResult = await cloudinary.uploader.upload(base64, {
          folder: "social-app/posts",
        });

        imageData = {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        };
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload image" },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    const postData = { content: content.trim(), author: user._id };

    if (imageData) postData.image = imageData;

    const newPost = await Post.create(postData);

    // Populate the author information for the response
    await newPost.populate("author", "name email image");

    return NextResponse.json(
      { message: "Post created successfully", post: newPost },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
