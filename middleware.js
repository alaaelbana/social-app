// file: middleware.ts
import { NextResponse } from "next/server";

// Define a whitelist of origins that are allowed to make requests.
const allowedOrigins = ["http://localhost:3000", "http://localhost:3001"];
export function middleware(request) {
  // Get the origin of the request
  const origin = request.headers.get("origin");

  // --- Handle Preflight (OPTIONS) requests ---
  // The browser sends this first to check if the actual request is safe to send.
  if (request.method === "OPTIONS") {
    // Check if the origin is in our whitelist
    if (origin && allowedOrigins.includes(origin)) {
      return new NextResponse(null, {
        status: 204, // No Content
        headers: {
          "Access-Control-Allow-Origin": origin, // Use the specific origin
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true", // This is crucial
          "Access-Control-Max-Age": "86400", // Cache preflight for 24 hours
        },
      });
    }
    // If the origin is not in the whitelist, the browser will block the request.
    // We can return a simple response here.
    return new NextResponse(null, { status: 200 });
  }

  // --- Handle Actual API Requests (GET, POST, etc.) ---

  // This is your original logic to add the 'x-version' header.
  // We keep this exactly as you had it.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-version", "13");
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add the necessary CORS headers to the response for the actual request.
  // We only do this if the origin is in our allowed list.
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true"); // This is crucial
  }

  return response;
}

// Ensure the middleware runs on all your API routes
export const config = {
  matcher: "/api/:path*",
};
