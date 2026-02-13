import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET() {
  const response = await fetch(`${BACKEND_URL}/auth/google/start`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.redirect(new URL("/", process.env.FRONTEND_APP_URL || "http://localhost:3000"));
  }

  const data = (await response.json()) as {
    authorization_url: string;
    state: string;
    code_verifier: string;
  };

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
}
