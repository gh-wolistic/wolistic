import { NextResponse } from "next/server";
import { readAdminSession } from "@/lib/admin-auth";
import { backendAdminFetch } from "@/lib/backend-admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subscriptionId } = await params;
  const body = (await request.json()) as unknown;

  try {
    const sub = await backendAdminFetch<unknown>(
      `/api/v1/admin/subscriptions/assigned/${subscriptionId}`,
      { method: "PATCH", body: JSON.stringify(body) }
    );
    return NextResponse.json(sub);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to patch subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subscriptionId } = await params;

  try {
    await backendAdminFetch<void>(
      `/api/v1/admin/subscriptions/assigned/${subscriptionId}`,
      { method: "DELETE" }
    );
    return new Response(null, { status: 204 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete subscription" },
      { status: 500 }
    );
  }
}
