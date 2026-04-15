import { NextResponse } from "next/server";
import { readAdminSession } from "@/lib/admin-auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const session = await readAdminSession();
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    return NextResponse.json({
      sessionFound: !!session,
      sessionData: session,
      cookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
