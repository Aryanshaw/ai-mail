import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get("app_session")?.value;

  if (!sessionToken) {
    return NextResponse.json({ authenticated: false });
  }

  const response = await fetch(`${BACKEND_URL}/auth/me`, {
    method: "GET",
    headers: {
      "x-session-token": sessionToken,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json({ authenticated: false });
  }

  const payload = await response.json();
  return NextResponse.json(payload);
}
