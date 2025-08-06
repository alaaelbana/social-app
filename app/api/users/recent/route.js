import { NextResponse } from "next/server";
import connectMongoDB from "@/app/lib/mongodb";
import User from "@/models/User";
import { rateLimit } from "@/app/lib/rate-limit";

// api/users/recent

// GET - Fetch posts with pagination
const getLimiter = rateLimit({
  interval: 60 * 1000,
  limit: 100, // 100 requests per minute
  uniqueTokenPerInterval: 500,
});

export async function GET(request) {
  try {
    await getLimiter.check(request);
    await connectMongoDB();

    // Get the 100 most recently registered users
    const recentUsers = await User.find({})
      .select("name email image links createdAt")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Format the response
    const formattedUsers = recentUsers.map((user) => ({
      id: user._id,
      name: user.name,
      image: user.image,
      links: user.links || {
        website: "",
        twitter: "",
        linkedin: "",
        github: "",
      },
      joinedAt: user.createdAt,
    }));

    return NextResponse.json({ users: formattedUsers }, { status: 200 });
  } catch (error) {
    console.error("Get recent users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
