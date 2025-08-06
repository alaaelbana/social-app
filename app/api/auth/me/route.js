import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectMongoDB from "@/app/lib/mongodb";
import cloudinary from "@/app/lib/cloudinary";
import User from "@/models/User";
import { getCurrentUser } from "@/app/lib/auth";
import { rateLimit } from "@/app/lib/rate-limit";

// api/auth/me

const getLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  limit: 100, // 100 requests per minute
  uniqueTokenPerInterval: 500,
});

export async function GET(request) {
  try {
    await getLimiter.check(request);
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" });
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          image: user.image,
          links: user.links || {
            website: "",
            twitter: "",
            linkedin: "",
            github: "",
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const putLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  limit: 10, // 10 requests per minute
  uniqueTokenPerInterval: 500,
});
export async function PUT(request) {
  try {
    await putLimiter.check(request);
    await connectMongoDB();
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get("name");
    const email = formData.get("email");
    const currentPassword = formData.get("currentPassword");
    const newPassword = formData.get("newPassword");
    const image = formData.get("image");
    const website = formData.get("website") || "";
    const twitter = formData.get("twitter") || "";
    const linkedin = formData.get("linkedin") || "";
    const github = formData.get("github") || "";

    const updateData = {};

    // Validate and update name
    if (name && name.trim()) {
      updateData.name = name.trim();
    }

    // Validate and update email
    if (email && email !== user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }

      // Check if email already exists
      const existingUser = await User.findOne({
        email,
        _id: { $ne: user._id },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    // Update password if provided
    if (currentPassword && newPassword) {
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters" },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      updateData.password = hashedPassword;
    }

    // Handle image upload
    if (image && image.size > 0) {
      try {
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                resource_type: "image",
                folder: "social-app/profiles",
                format: "webp",
                transformation: [
                  { width: 400, height: 400, crop: "fill", gravity: "face" },
                  { quality: "auto" },
                  { fetch_format: "webp" },
                ],
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            )
            .end(buffer);
        });

        updateData.image = result.secure_url;
      } catch (error) {
        console.error("Image upload error:", error);
        return NextResponse.json(
          { error: "Failed to upload image" },
          { status: 500 }
        );
      }
    }

    // Update links
    updateData.links = {
      website,
      twitter,
      linkedin,
      github,
    };

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(user._id, updateData, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json(
      {
        message: "Profile updated successfully",
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          image: updatedUser.image,
          links: updatedUser.links,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
