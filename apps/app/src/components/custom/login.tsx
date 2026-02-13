"use client";

import { useAuth } from "@/hooks/use-auth";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import Noise from "../backgrounds/noise";

type LoginProps = {
  error?: string | null;
};

export default function Login({ error }: LoginProps) {
  const { loginWithGoogle } = useAuth();

  return (
    <div className="relative z-20 flex h-full items-center justify-center px-4 py-10">
      <div className="auth-card-enter auth-card-float w-full max-w-[460px] rounded-xl p-8 backdrop-blur-2xl sm:p-10 auth-card-colors">
        <Noise />

        {/* Top ai indicator component */}
        <div className="mx-auto mb-8 flex w-fit items-center gap-3 rounded-full px-4 py-2 backdrop-blur-md auth-chip-colors">
          <span className="grid size-7 place-items-center rounded-full auth-icon-colors">
            <Sparkles className="size-4" />
          </span>
          <div className="text-left">
            <p className="text-xs font-semibold tracking-tight auth-title-colors">
              AI Mail Copilot
            </p>
            <p className="text-[11px] auth-subtitle-colors">Control your inbox with AI</p>
          </div>
        </div>

        {/* Text contents */}
        <h3 className="text-center text-xl font-semibold leading-[0.95] tracking-[-0.03em] auth-heading-colors">
          Welcome back
        </h3>
        <p className="mt-4 text-center text-sm auth-subtext-colors">
          Connect your Google account to continue
        </p>

        {/* Login buttons */}
        <Button
          onClick={loginWithGoogle}
          type="button"
          className="group mt-9 flex h-12 w-full items-center justify-center gap-3 rounded-xl border text-base font-medium transition-all duration-300 hover:-translate-y-0.5 auth-google-btn-colors cursor-pointer focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
        >
          <Image src="/icons/google.svg" alt="Google" width={20} height={20} loading="eager" />
          <span>Connect with Google</span>
        </Button>

        <p className="mt-7 text-center text-xs tracking-wide auth-disclaimer-colors">
          Gmail read access is requested only for AI-assisted inbox actions.
        </p>
        {error ? <p className="mt-3 text-center text-xs text-red-500">{error}</p> : null}
      </div>
    </div>
  );
}
