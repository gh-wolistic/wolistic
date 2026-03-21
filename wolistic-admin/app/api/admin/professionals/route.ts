import { NextResponse } from "next/server";

import { readAdminSession } from "@/lib/admin-auth";
import { backendAdminFetch } from "@/lib/backend-admin";

type AdminProfessionalListResponse = {
  total: number;
  limit: number;
  offset: number;
  items: Array<Record<string, unknown>>;
};

export async function GET(request: Request) {
  const session = await readAdminSession();

  if (!session) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "pending";

  try {
    const data = await backendAdminFetch<AdminProfessionalListResponse>(
      `/api/v1/admin/professionals?status=${encodeURIComponent(status)}`
    );
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load professionals";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
