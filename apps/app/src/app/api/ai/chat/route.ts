import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("app_session")?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const backendResponse = await fetch(`${BACKEND_URL}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-token": sessionToken,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const payload = await backendResponse
      .json()
      .catch(() => ({ error: "Invalid backend response" }));

    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    console.error("Error in POST /api/ai/chat:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
