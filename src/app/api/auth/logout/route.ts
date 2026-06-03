import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth-session";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.headers.append("set-cookie", clearSessionCookie());

  return response;
}
