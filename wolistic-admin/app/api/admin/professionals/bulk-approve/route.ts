import { NextResponse } from "next/server";

import { readAdminSession } from "@/lib/admin-auth";
import { backendAdminFetch } from "@/lib/backend-admin";

type BulkApproveBody = {
  userIds?: string[];
  minProfileCompleteness?: number;
};

export async function POST(request: Request) {
  const session = await readAdminSession();

  if (!session) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  let body: BulkApproveBody;
  try {
    body = (await request.json()) as BulkApproveBody;
  } catch {
    return NextResponse.json({ detail: "Invalid request body" }, { status: 400 });
  }

  const userIds = Array.isArray(body.userIds) ? body.userIds.filter((id) => typeof id === "string" && id.trim().length > 0) : [];
  if (userIds.length === 0) {
    return NextResponse.json({ detail: "At least one user ID is required" }, { status: 400 });
  }

  const minProfileCompleteness = Number.isFinite(body.minProfileCompleteness)
    ? Math.max(0, Math.min(100, Number(body.minProfileCompleteness)))
    : 90;

  try {
    const data = await backendAdminFetch("/api/v1/admin/professionals/bulk-approve", {
      method: "POST",
      body: JSON.stringify({ userIds, minProfileCompleteness }),
    });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to bulk approve professionals";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
