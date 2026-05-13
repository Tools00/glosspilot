import { useMe, useLogout } from "../api/auth";

export function HomePage() {
  const { data: me } = useMe();
  const logout = useLogout();

  if (!me) return null; // ProtectedRoute should have redirected

  const isAdmin = me.role === "ADMIN";

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-slate-900">
              G
            </div>
            <span className="font-semibold tracking-tight">GlossPilot</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-sm">
              <div className="font-medium">{me.name}</div>
              <div className="text-xs text-slate-400">
                {me.email} ·{" "}
                <span
                  className={
                    isAdmin ? "text-emerald-400" : "text-sky-400"
                  }
                >
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

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">
            {isAdmin ? "Dispatcher dashboard" : "My day"}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            v0.2.0 — auth wired end-to-end. Real content arrives in v0.3.0 (sites)
            and v0.4.0 (calendar).
          </p>
        </div>

        {isAdmin ? <AdminStub /> : <WorkerStub />}
      </main>
    </div>
  );
}

function AdminStub() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card title="Active sites" v="—" hint="v0.3.0" />
      <Card title="Today's reports" v="—" hint="v0.5.0" />
      <Card title="Low-stock materials" v="—" hint="v0.5.0" />
    </div>
  );
}

function WorkerStub() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Today's jobs" v="—" hint="v0.4.0" />
      <Card title="Pending reports" v="—" hint="v0.5.0" />
    </div>
  );
}

function Card({ title, v, hint }: { title: string; v: string; hint: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-2 text-3xl font-bold">{v}</div>
      <div className="mt-1 text-xs text-slate-500">arrives in {hint}</div>
    </div>
  );
}
