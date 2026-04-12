import { NextResponse } from "next/server";
import { readAdminSession } from "@/lib/admin-auth";
import { backendAdminFetch } from "@/lib/backend-admin";

type AdjustPayload = {
  user_id: string;
  amount: number;
  notes: string;
};

type AdjustResult = {
  user_id: string;
  amount: number;
  new_balance: number;
  transaction_id: number;
};

export async function POST(request: Request) {
  const session = await readAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: AdjustPayload;
  try {
    body = (await request.json()) as AdjustPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { user_id, amount, notes } = body;
  if (!user_id || typeof amount !== "number" || amount === 0 || !notes?.trim()) {
    return NextResponse.json(
      { error: "user_id, non-zero amount, and notes are required" },
      { status: 400 },
    );
  }

  try {
    const result = await backendAdminFetch<AdjustResult>("/api/v1/coins/admin/adjust", {
      method: "POST",
      body: JSON.stringify({ user_id, amount, notes }),
    });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Adjustment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
