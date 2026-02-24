import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback-secret-change-in-production";

interface SessionPayload {
  id: number;
  username: string;
  iat?: number;
  exp?: number;
}

async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.id as number,
      username: payload.username as string,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to login page
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Check for session cookie
  const token = request.cookies.get("admin_session")?.value;

  if (!token) {
    return handleUnauthorized(request);
  }

  // Verify token
  const session = await verifyToken(token);

  if (!session) {
    return handleUnauthorized(request);
  }

  // Token is valid, allow access
  return NextResponse.next();
}

function handleUnauthorized(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // For API routes, return 401 JSON
  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // For admin pages, redirect to login
  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

// Configure which routes the middleware should run on
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
