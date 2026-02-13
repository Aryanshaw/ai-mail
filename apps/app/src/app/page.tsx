"use client";

import LiquidWave from "@/components/backgrounds/new-liquid";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Login from "@/components/custom/login";

export default function HomePage() {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/app");
    }
  }, [loading, isAuthenticated, router]);

  if (loading || isAuthenticated) {
    return <div className="h-full w-full flex items-center justify-center bg-background" />;
  }

  return (
    <div className="relative h-full w-full overflow-hidden auth-page-colors">
      <LiquidWave
        className="absolute inset-0 z-0"
        style={{ zIndex: 0 }}
        color1="#ffffff"
        color2="#d4d4d4"
        color3="#a3a3a3"
        autoDemo={true}
      />

      <div className="pointer-events-none absolute inset-0 z-10 auth-overlay-colors" />
      <div className="pointer-events-none absolute inset-0 z-10 auth-noise-colors" />

      <div className="absolute right-5 top-5 z-30">
        <ThemeToggle />
      </div>

      <div className="absolute inset-0 m-auto z-20 flex items-center justify-center h-fit w-fit">
        <Login />
      </div>
    </div>
  );
}
