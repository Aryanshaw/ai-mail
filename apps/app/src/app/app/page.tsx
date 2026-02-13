"use client";

import { ThemeToggle } from "@/components/theme-toggle";
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

  return (
    <main className="mx-auto flex h-full w-full max-w-5xl flex-col px-6 py-8">
      <div className="mb-6 flex items-center justify-end">
        <ThemeToggle />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mail App</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Signed in as {user?.first_name} {user?.last_name}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void logout().then(() => router.replace("/"))}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm"
        >
          Logout
        </button>
      </div>
    </main>
  );
}
