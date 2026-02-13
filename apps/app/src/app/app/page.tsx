"use client";

import LiquidWave from "@/components/backgrounds/new-liquid";
import { MailWorkspace } from "@/components/custom/mail/workspace";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AppHomePage() {
  const router = useRouter();
  const { loading, isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/");
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return <main className="h-full w-full" />;
  }

  const fullName = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "AI Mail User";

  return (
    <main className="relative h-full w-full overflow-hidden">
      <LiquidWave
        className="absolute inset-0 z-0"
        style={{ zIndex: 0 }}
        color1="#ffffff"
        color2="#d4d4d4"
        color3="#a3a3a3"
        autoDemo={true}
        />

      <div className="absolute inset-0 z-20">
        <MailWorkspace fullName={fullName} onLogout={() => void logout().then(() => router.replace("/"))} />
      </div>
    </main>
  );
}
