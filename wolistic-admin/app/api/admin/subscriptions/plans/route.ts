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

export async function GET(request: Request) {
  const session = await readAdminSession();
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[Subscriptions API] Session check:', { 
      hasSession: !!session, 
      email: session?.email 
    });
  }
  
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const expert_type = url.searchParams.get("expert_type");
  const qs = expert_type ? `?expert_type=${encodeURIComponent(expert_type)}` : "";

  try {
    const plans = await backendAdminFetch<SubscriptionPlan[]>(
      `/api/v1/admin/subscriptions/plans${qs}`
    );
    return NextResponse.json(plans);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch plans" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as unknown;

  try {
    const plan = await backendAdminFetch<SubscriptionPlan>(
      "/api/v1/admin/subscriptions/plans",
      { method: "POST", body: JSON.stringify(body) }
    );
    return NextResponse.json(plan, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create plan" },
      { status: 500 }
    );
  }
}
