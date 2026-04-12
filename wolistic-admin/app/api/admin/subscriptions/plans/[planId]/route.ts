import { NextResponse } from "next/server";
import { readAdminSession } from "@/lib/admin-auth";
import { backendAdminFetch } from "@/lib/backend-admin";

type SubscriptionPlan = {
  id: number;
  expert_type: string;
  name: string;
  tier: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  features: string[];
  limits: Record<string, unknown>;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = await params;
  const body = (await request.json()) as unknown;

  try {
    const plan = await backendAdminFetch<SubscriptionPlan>(
      `/api/v1/admin/subscriptions/plans/${planId}`,
      { method: "PATCH", body: JSON.stringify(body) }
    );
    return NextResponse.json(plan);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update plan" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = await params;

  try {
    await backendAdminFetch<void>(
      `/api/v1/admin/subscriptions/plans/${planId}`,
      { method: "DELETE" }
    );
    return new Response(null, { status: 204 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete plan" },
      { status: 500 }
    );
  }
}
