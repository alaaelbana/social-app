import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectMongoDB from "../../../lib/mongodb";
import User from "../../../../models/User";
import { NextResponse } from "next/server";
import { rateLimit } from "@/app/lib/rate-limit";

// api/auth/signin

const postLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  limit: 20, // 20 requests per minute
  uniqueTokenPerInterval: 500,
});

const allowedOrigins = ["http://localhost:3000"];

export async function POST(request) {
  // Get the origin of the request
  const origin = request.headers.get("origin");

  try {
    // ... (your limiter, validation, and DB logic is fine)
    await postLimiter.check(request);
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    await connectMongoDB();
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // --- START OF MODIFICATIONS ---

    // 1. Define CORS headers
    const headers = new Headers();
    // Only allow trusted origins
    if (origin && allowedOrigins.includes(origin)) {
      headers.set("Access-Control-Allow-Origin", origin);
    }
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // 2. Create response with CORS headers
    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        token,
      },
      {
        status: 200,
        headers: headers, // Attach the headers here
      }
    );

    // 3. Set the cookie with cross-origin compatible settings
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: true, // `secure` must be true for SameSite=None
      sameSite: "none", // Required for cross-origin cookies
      maxAge: 7 * 24 * 60 * 60, // maxAge is in seconds, not milliseconds
      path: "/", // Important to set the path
    });

    // --- END OF MODIFICATIONS ---

    return response;
  } catch (error) {
    console.error("Signin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
