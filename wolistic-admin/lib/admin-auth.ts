import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

const SESSION_COOKIE = "wolistic_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

type SessionPayload = {
  email: string;
  exp: number;
};

function base64url(value: string): string {
  return Buffer.from(value, "utf-8").toString("base64url");
}

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing ADMIN_SESSION_SECRET environment variable");
  }
  return secret;
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", getSessionSecret()).update(encodedPayload).digest("base64url");
}

export async function createAdminSession(email: string): Promise<void> {
  const payload: SessionPayload = {
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  const value = `${encodedPayload}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function readAdminSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const [encodedPayload, tokenSignature] = token.split(".");
  if (!encodedPayload || !tokenSignature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const providedBuffer = Buffer.from(tokenSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8")) as SessionPayload;
    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    if (!payload.email) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function getAdminCredentials(): { email: string; password: string } {
  const email = process.env.ADMIN_DASHBOARD_EMAIL || process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.ADMIN_DASHBOARD_PASSWORD || process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Missing admin dashboard credentials. Set ADMIN_DASHBOARD_EMAIL and ADMIN_DASHBOARD_PASSWORD."
    );
  }

  return { email, password };
}
