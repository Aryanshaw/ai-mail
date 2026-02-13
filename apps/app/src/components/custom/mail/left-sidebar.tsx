import { NavItemKey } from "@/components/custom/mail/types";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Archive, Compass, Inbox, LogOut, PenSquare, SendHorizontal } from "lucide-react";
import Image from "next/image";

interface LeftSidebarProps {
  activeNav: NavItemKey;
  onNavChange: (nav: NavItemKey) => void;
  user:any,
  onLogout: () => void;
}

const navItems = [
  { key: "inbox" as const, label: "Inbox", icon: Inbox, count: 12 },
  { key: "sent" as const, label: "Sent", icon: SendHorizontal, count: null },
  { key: "compose" as const, label: "Compose", icon: PenSquare, count: null },
  { key: "archived" as const, label: "Archived", icon: Archive, count: null },
  { key: "discover" as const, label: "Discover", icon: Compass, count: null },
];

export function LeftSidebar({ activeNav, onNavChange, user, onLogout }: LeftSidebarProps) {

  const fullName = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "AI Mail User";
  function getInitials(name:string) {
    return name
      .split(" ")
      .map(word => word[0].toUpperCase())
      .join("");
  }
  
  return (
    <aside className="mail-glass-card mail-sidebar-separator flex h-full min-h-0 flex-col p-2 lg:w-[220px]">
      {/* App identity for instant orientation. */}
      <div className="mb-4 rounded-2xl border border-white/30 bg-white/35 p-4 dark:border-white/10 dark:bg-white/6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-400">AI Mail</p>
        <div className="flex gap-2 pt-2 pb-2 items-center">
          {
            user?.avatar ? (
              <Image alt="avatar" src={user?.avatar} width={25} height={20} loading="eager" className="rounded-full"/>
            ): (
              <div className="text-xs rounded-full backdrop-2xl bg-white dark:bg-black/20 p-2 border border-sm">
                  {getInitials(fullName)}
              </div>
            )
          }
          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{fullName}</p>
        </div>
        <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
          Inbox copilot for fast triage,
          <br />
          summaries, and polished replies.
        </p>
      </div>

      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavChange(item.key)}
              className={`group flex w-full cursor-pointer items-center justify-between rounded-md border px-3 py-2.5 text-left transition-all duration-300 ${
                isActive
                  ? "border-white/50 bg-white/60 text-zinc-900 shadow-sm dark:border-white/25 dark:bg-white/12 dark:text-zinc-100"
                  : "border-transparent text-zinc-700 hover:border-white/35 hover:bg-white/42 dark:text-zinc-300 dark:hover:border-white/15 dark:hover:bg-white/8"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Icon className="size-4" />
                {item.label}
              </span>
              {item.count ? (
                <span className="rounded-full border border-white/45 bg-white/58 px-2 py-0.5 text-[11px] font-semibold dark:border-white/20 dark:bg-white/10">
                  {item.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="mail-divider my-4" />

      {/* Footer utilities stay pinned to the bottom of the sidebar. */}
      <div className="mt-auto space-y-2">
        <div className="rounded-md border border-black/10 dark:border-white/30 bg-white/35 p-2 px-4 dark:border-white/10 dark:bg-white/6 flex items-center justify-between w-full">
          <ThemeToggle /> 
          <p className="dark:text-gray-300 text-gray-800 text-sm">  
            Theme toggle
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={onLogout}
          className="w-full cursor-pointer p-4 rounded-md border border-black-10 dark:border-white/45 bg-white/62 text-zinc-800 hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15"
        >
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
