import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/google/start`, {
      method: "GET",
      cache: "no-store",
    });

    const data = (await response.json().catch(() => ({ error: "Invalid backend response" }))) as {
      authorization_url?: string;
      state?: string;
      code_verifier?: string;
      error?: string;
    };

    if (!response.ok || !data.authorization_url || !data.state || !data.code_verifier) {
      const frontend = process.env.FRONTEND_APP_URL || "http://localhost:3000";
      const failUrl = new URL("/", frontend);
      failUrl.searchParams.set("error", data.error || "Unable to start Google auth");
      return NextResponse.redirect(failUrl);
    }

    const redirect = NextResponse.redirect(data.authorization_url);
    redirect.cookies.set("oauth_state", data.state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });
    redirect.cookies.set("oauth_code_verifier", data.code_verifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });

    return redirect;
  } catch (error) {
    const frontend = process.env.FRONTEND_APP_URL || "http://localhost:3000";
    const failUrl = new URL("/", frontend);
    failUrl.searchParams.set("error", String(error));
    return NextResponse.redirect(failUrl);
  }
}
