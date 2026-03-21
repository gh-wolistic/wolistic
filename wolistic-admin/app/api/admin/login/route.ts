import { NextResponse } from "next/server";

import { createAdminSession, getAdminCredentials } from "@/lib/admin-auth";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  let body: LoginBody;

  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ detail: "Invalid request body" }, { status: 400 });
  }

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "").trim();

  if (!email || !password) {
    return NextResponse.json({ detail: "Email and password are required" }, { status: 400 });
  }

  try {
    const credentials = getAdminCredentials();

    if (email !== credentials.email.toLowerCase() || password !== credentials.password) {
      return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
    }

    await createAdminSession(credentials.email);

    return NextResponse.json({ authenticated: true, email: credentials.email });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
