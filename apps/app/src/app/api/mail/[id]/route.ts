import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = request.cookies.get("app_session")?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const backendResponse = await fetch(`${BACKEND_URL}/mail/${id}`, {
      method: "GET",
      headers: {
        "x-session-token": sessionToken,
      },
      cache: "no-store",
    });

    const payload = await backendResponse
      .json()
      .catch(() => ({ error: "Invalid backend response" }));
    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    console.error("Error in GET /api/mail/[id]:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
