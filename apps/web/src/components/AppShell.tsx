import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import type { UserPublic } from "@glosspilot/shared";
import { useLogout } from "../api/auth";

const nav = [
  { to: "/", label: "Home" },
  { to: "/sites", label: "Sites" },
  { to: "/calendar", label: "Calendar" },
];

export function AppShell({
  me,
  children,
}: {
  me: UserPublic;
  children: ReactNode;
}) {
  const loc = useLocation();
  const logout = useLogout();
  const isAdmin = me.role === "ADMIN";

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-slate-900">
                G
              </div>
              <span className="font-semibold tracking-tight">GlossPilot</span>
            </Link>
            <nav className="flex gap-1 text-sm">
              {nav.map((n) => {
                const active =
                  n.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={`rounded-md px-3 py-1.5 transition ${
                      active
                        ? "bg-slate-800 text-slate-100"
                        : "text-slate-400 hover:text-slate-100"
                    }`}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-sm">
              <div className="font-medium">{me.name}</div>
              <div className="text-xs text-slate-400">
                {me.email} ·{" "}
                <span className={isAdmin ? "text-emerald-400" : "text-sky-400"}>
                  {me.role}
                </span>
              </div>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-800 text-xs font-bold">
              {me.initials}
            </div>
            <button
              onClick={() => logout.mutate()}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:border-slate-500"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
