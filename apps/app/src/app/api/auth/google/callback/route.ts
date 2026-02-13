import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const FRONTEND_URL = process.env.FRONTEND_APP_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const expectedState = request.cookies.get("oauth_state")?.value;
    const codeVerifier = request.cookies.get("oauth_code_verifier")?.value;

    if (!code || !state || !expectedState || !codeVerifier) {
      const failUrl = new URL("/", FRONTEND_URL);
      failUrl.searchParams.set("error", "Missing OAuth callback data");
      return NextResponse.redirect(failUrl);
    }

    const callbackResponse = await fetch(`${BACKEND_URL}/auth/google/callback`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code,
        state,
        expected_state: expectedState,
        code_verifier: codeVerifier,
        user_agent: request.headers.get("user-agent"),
        ip_address: request.headers.get("x-forwarded-for"),
      }),
      cache: "no-store",
    });

    const payload = (await callbackResponse
      .json()
      .catch(() => ({ error: "Invalid backend response" }))) as {
      session_token?: string;
      expires_at?: string;
      error?: string;
    };

    if (!callbackResponse.ok || !payload.session_token) {
      const fail = NextResponse.redirect(
        new URL(
          `/?error=${encodeURIComponent(payload.error || "Google auth callback failed")}`,
          FRONTEND_URL
        )
      );
      fail.cookies.delete("oauth_state");
      fail.cookies.delete("oauth_code_verifier");
      return fail;
    }

    const success = NextResponse.redirect(new URL("/app", FRONTEND_URL));
    success.cookies.delete("oauth_state");
    success.cookies.delete("oauth_code_verifier");
    success.cookies.set("app_session", payload.session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return success;
  } catch (error) {
    const fail = NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(String(error))}`, FRONTEND_URL)
    );
    fail.cookies.delete("oauth_state");
    fail.cookies.delete("oauth_code_verifier");
    return fail;
  }
}
