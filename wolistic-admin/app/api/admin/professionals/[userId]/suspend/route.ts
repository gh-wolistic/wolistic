import { NextResponse } from "next/server";

import { readAdminSession } from "@/lib/admin-auth";
import { backendAdminFetch } from "@/lib/backend-admin";

export async function POST(
  _request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const session = await readAdminSession();

  if (!session) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;

  try {
    const data = await backendAdminFetch(`/api/v1/admin/professionals/${params.userId}/suspend`, {
      method: "POST",
    });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to suspend professional";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
