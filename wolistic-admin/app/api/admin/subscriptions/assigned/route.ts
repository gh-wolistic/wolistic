import { NextResponse } from "next/server";
import { readAdminSession } from "@/lib/admin-auth";
import { backendAdminFetch } from "@/lib/backend-admin";

export async function GET(request: Request) {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";

  try {
    const assigned = await backendAdminFetch<unknown[]>(
      `/api/v1/admin/subscriptions/assigned${qs}`
    );
    return NextResponse.json(assigned);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch assigned subscriptions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as unknown;

  try {
    const sub = await backendAdminFetch<unknown>(
      "/api/v1/admin/subscriptions/assigned",
      { method: "POST", body: JSON.stringify(body) }
    );
    return NextResponse.json(sub, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to assign subscription" },
      { status: 500 }
    );
  }
}
