import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback-secret-change-in-production";
const COOKIE_NAME = "admin_session";
const TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days in seconds

export interface SessionPayload {
  id: number;
  username: string;
  iat?: number;
  exp?: number;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify a password against a bcrypt hash
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for an admin user
 */
export async function generateToken(
  adminId: number,
  username: string,
): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const token = await new SignJWT({ id: adminId, username })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${TOKEN_EXPIRY_SECONDS}s`)
    .setIssuedAt()
    .sign(secret);
  return token;
}

/**
 * Verify and decode a JWT token
 * Returns the session payload or null if invalid
 */
export async function verifyToken(
  token: string,
): Promise<SessionPayload | null> {
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

/**
 * Get the session from cookies (server-side only)
 * Returns the session payload or null if not authenticated
 */
export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return await verifyToken(token);
}

/**
 * Create session cookie options
 */
export function getSessionCookieOptions() {
  const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge,
    path: "/",
  };
}
