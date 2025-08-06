import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import connectMongoDB from "./mongodb";
import User from "../../models/User";

// Verify JWT token from cookies
export async function verifyToken(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

// Get current user from token
export async function getCurrentUser(request) {
  try {
    const decoded = await verifyToken(request);

    if (!decoded) return null;

    await connectMongoDB();
    const user = await User.findById(decoded.userId).select("-password");

    return user;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

// Middleware to protect routes
export function withAuth(handler) {
  return async (request, context) => {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Add user to request context
    request.user = user;
    return handler(request, context);
  };
}

// Check if user is authenticated (for client-side)
export async function checkAuth(request) {
  const user = await getCurrentUser(request);
  return { isAuthenticated: !!user, user: user || null };
}
