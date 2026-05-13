import { Link } from "react-router-dom";
import { useMe } from "../api/auth";
import { useSitesList } from "../api/sites";
import { useMyToday } from "../api/events";
import { useDashboard } from "../api/dashboard";

export function HomePage() {
  const { data: me } = useMe();
  const isAdmin = me?.role === "ADMIN";
  const dashboard = useDashboard(isAdmin === true);
  const active = useSitesList({ status: "active", pageSize: 100 });
  const planned = useSitesList({ status: "planned", pageSize: 100 });
  const today = useMyToday();

  if (!me) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {isAdmin ? "Dispatcher dashboard" : "My day"}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          v0.5.0 — Reports + dashboard aggregates live. Photo uploads (v0.6.0) next.
        </p>
      </div>

      {isAdmin ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card
              title="Active sites"
              v={fmt(dashboard.data?.activeSitesCount)}
              link="/sites?status=active"
            />
            <Card
              title="Planned sites"
              v={fmt(dashboard.data?.plannedSitesCount)}
              link="/sites?status=planned"
            />
            <Card
              title="Today's reports"
              v={fmt(dashboard.data?.todaysReportsCount)}
              link="/reports"
            />
            <Card
              title="Today's events"
              v={fmt(dashboard.data?.todaysActiveEvents)}
              link="/calendar"
            />
          </div>

          {dashboard.data && dashboard.data.lowStockMaterials.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Low stock ({dashboard.data.lowStockMaterials.length})
              </h2>
              <div className="space-y-2">
                {dashboard.data.lowStockMaterials.map((m) => {
                  const pct = Math.max(0, Math.round(m.remainingPct * 100));
                  return (
                    <Link
                      key={m.id}
                      to={`/sites/${m.site.id}`}
                      className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3 transition hover:border-slate-700"
                    >
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ background: m.site.color }}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {m.name}
                          {m.variant && (
                            <span className="ml-2 text-xs text-slate-500">
                              ({m.variant})
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          {m.site.clientName} · {m.takenQty} / {m.neededQty} used
                        </div>
                      </div>
                      <div className="text-xs text-amber-400">{pct}% left</div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {dashboard.data && dashboard.data.recentReports.length > 0 && (
            <section className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Recent reports
                </h2>
                <Link to="/reports" className="text-xs text-emerald-400">
                  View all →
                </Link>
              </div>
              <div className="space-y-2">
                {dashboard.data.recentReports.map((r) => (
                  <article
                    key={r.id}
                    className="rounded-xl border border-slate-800 bg-slate-900/50 p-3"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: r.site.color }}
                        />
                        <Link
                          to={`/sites/${r.site.id}`}
                          className="font-medium text-slate-200 hover:text-emerald-400"
                        >
                          {r.site.clientName}
                        </Link>
                        <span>·</span>
                        <span>
                          {r.user.name} ({r.user.initials})
                        </span>
                      </span>
                      <span>{new Date(r.reportedAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-300">
                      {r.summary}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card
            title="Active sites"
            v={String(active.data?.total ?? "—")}
            link="/sites?status=active"
          />
          <Card
            title="Planned sites"
            v={String(planned.data?.total ?? "—")}
            link="/sites?status=planned"
          />
          <Card
            title="My jobs today"
            v={String(today.data?.length ?? "—")}
            link="/calendar"
          />
        </div>
      )}

      {today.data && today.data.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Today's schedule
          </h2>
          <div className="space-y-2">
            {today.data.map((ev) => (
              <Link
                key={ev.id}
                to={`/sites/${ev.site.id}`}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3 transition hover:border-slate-700"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: ev.color }}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">{ev.title}</div>
                  <div className="text-xs text-slate-400">
                    {ev.site.clientName} · {ev.site.address}
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  {ev.startDate} → {ev.endDate}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function fmt(n?: number) {
  return n === undefined ? "—" : String(n);
}

function Card({
  title,
  v,
  link,
}: {
  title: string;
  v: string;
  link?: string;
}) {
  const inner = (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-slate-700">
      <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-2 text-3xl font-bold">{v}</div>
      {link && <div className="mt-1 text-xs text-emerald-500">View →</div>}
    </div>
  );
  return link ? <Link to={link}>{inner}</Link> : inner;
}
