import { NextResponse } from "next/server";
import { readAdminSession } from "@/lib/admin-auth";
import { backendAdminFetch } from "@/lib/backend-admin";

export async function GET(request: Request) {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const professional_id = url.searchParams.get("professional_id");
  const qs = professional_id ? `?professional_id=${encodeURIComponent(professional_id)}` : "";

  try {
    const records = await backendAdminFetch<unknown[]>(
      `/api/v1/admin/subscriptions/billing${qs}`
    );
    return NextResponse.json(records);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch billing records" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as unknown;

  try {
    const record = await backendAdminFetch<unknown>(
      "/api/v1/admin/subscriptions/billing",
      { method: "POST", body: JSON.stringify(body) }
    );
    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create billing record" },
      { status: 500 }
    );
  }
}
