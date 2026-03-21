import { NextResponse } from "next/server";

import { readAdminSession } from "@/lib/admin-auth";
import { backendAdminFetch } from "@/lib/backend-admin";

type TierUpdateBody = {
  tier?: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const session = await readAdminSession();

  if (!session) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;

  let body: TierUpdateBody;
  try {
    body = (await request.json()) as TierUpdateBody;
  } catch {
    return NextResponse.json({ detail: "Invalid request body" }, { status: 400 });
  }

  const tier = String(body.tier || "").trim().toLowerCase();
  if (!["basic", "premium", "elite"].includes(tier)) {
    return NextResponse.json({ detail: "Invalid tier" }, { status: 400 });
  }

  try {
    const data = await backendAdminFetch(
      `/api/v1/admin/professionals/${params.userId}/tier?tier=${encodeURIComponent(tier)}`,
      {
        method: "POST",
      }
    );
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update tier";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
