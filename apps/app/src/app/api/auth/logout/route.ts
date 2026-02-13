import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get("app_session")?.value;

  if (sessionToken) {
    await fetch(`${BACKEND_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "x-session-token": sessionToken,
      },
    });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete("app_session");
  return response;
}
