import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("app_session")?.value;

    if (sessionToken) {
      const backendResponse = await fetch(`${BACKEND_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "x-session-token": sessionToken,
        },
      });

      if (!backendResponse.ok) {
        const errorPayload = await backendResponse.json().catch(() => ({ error: "Logout failed" }));
        return NextResponse.json(errorPayload, { status: backendResponse.status });
      }
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.delete("app_session");
    return response;
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
