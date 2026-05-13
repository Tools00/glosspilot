import { Link } from "react-router-dom";
import { useMe } from "../api/auth";
import { useSitesList } from "../api/sites";
import { useMyToday } from "../api/events";

export function HomePage() {
  const { data: me } = useMe();
  const active = useSitesList({ status: "active", pageSize: 100 });
  const planned = useSitesList({ status: "planned", pageSize: 100 });
  const today = useMyToday();

  if (!me) return null;
  const isAdmin = me.role === "ADMIN";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {isAdmin ? "Dispatcher dashboard" : "My day"}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          v0.4.0 — Calendar live. Reports (v0.5.0), photo uploads (v0.6.0)
          still to come.
        </p>
      </div>

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
