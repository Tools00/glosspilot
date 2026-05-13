import { Link } from "react-router-dom";
import { useMe } from "../api/auth";
import { useSitesList } from "../api/sites";

export function HomePage() {
  const { data: me } = useMe();
  const active = useSitesList({ status: "active", pageSize: 100 });
  const planned = useSitesList({ status: "planned", pageSize: 100 });

  if (!me) return null;
  const isAdmin = me.role === "ADMIN";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {isAdmin ? "Dispatcher dashboard" : "My day"}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          v0.3.0 — Sites are live. Calendar (v0.4.0), reports (v0.5.0), photos (v0.6.0)
          to follow.
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
        <Card title="Today's reports" v="—" hint="v0.5.0" />
      </div>
    </div>
  );
}

function Card({
  title,
  v,
  hint,
  link,
}: {
  title: string;
  v: string;
  hint?: string;
  link?: string;
}) {
  const inner = (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-slate-700">
      <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-2 text-3xl font-bold">{v}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">arrives in {hint}</div>}
      {link && <div className="mt-1 text-xs text-emerald-500">View →</div>}
    </div>
  );
  return link ? <Link to={link}>{inner}</Link> : inner;
}
