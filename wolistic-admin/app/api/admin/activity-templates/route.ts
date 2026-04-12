import { NextResponse } from "next/server";
import { readAdminSession } from "@/lib/admin-auth";
import { backendAdminFetch } from "@/lib/backend-admin";

export async function GET() {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await backendAdminFetch("/api/v1/partners/admin/activity-templates");
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  try {
    const data = await backendAdminFetch("/api/v1/partners/admin/activity-templates", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
