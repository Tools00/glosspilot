import { useMemo, useState } from "react";
import { useMe } from "../api/auth";
import { useEventsRange } from "../api/events";
import {
  monthGrid,
  monthLabel,
  WEEKDAYS,
  inRange,
  toISODate,
} from "../lib/calendar";
import { EventDetailModal } from "./EventDetailModal";
import { NewEventModal } from "./NewEventModal";

export function CalendarPage() {
  const { data: me } = useMe();
  const today = useMemo(() => toISODate(new Date()), []);
  const [{ y, m }, setYM] = useState(() => {
    const d = new Date();
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
  });
  const [showMine, setShowMine] = useState(false);
  const [openEventId, setOpenEventId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState<{ from?: string; to?: string } | null>(null);

  const grid = useMemo(() => monthGrid(y, m), [y, m]);
  const from = grid[0]!;
  const to = grid[grid.length - 1]!;

  const isAdmin = me?.role === "ADMIN";
  const userIdFilter = showMine && me ? me.id : undefined;
  const { data: eventsList = [], isLoading } = useEventsRange(from, to, userIdFilter);

  // Group events per day for rendering.
  const eventsByDay = useMemo(() => {
    const map = new Map<string, typeof eventsList>();
    for (const day of grid) map.set(day, []);
    for (const ev of eventsList) {
      for (const day of grid) {
        if (inRange(day, ev.startDate, ev.endDate)) {
          map.get(day)!.push(ev);
        }
      }
    }
    return map;
  }, [grid, eventsList]);

  const prev = () => setYM(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }));
  const next = () => setYM(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }));
  const goToday = () => {
    const d = new Date();
    setYM({ y: d.getUTCFullYear(), m: d.getUTCMonth() });
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{monthLabel(y, m)}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {isLoading ? "Loading…" : `${eventsList.length} event(s) this view`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-xs">
            <input
              type="checkbox"
              checked={showMine}
              onChange={(e) => setShowMine(e.target.checked)}
              className="accent-emerald-500"
            />
            <span>Mine only</span>
          </label>
          <button
            onClick={prev}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:border-slate-500"
          >
            ←
          </button>
          <button
            onClick={goToday}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:border-slate-500"
          >
            Today
          </button>
          <button
            onClick={next}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:border-slate-500"
          >
            →
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowNew({})}
              className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              + New event
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800">
        <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900/70 text-xs uppercase text-slate-500">
          {WEEKDAYS.map((w) => (
            <div key={w} className="px-2 py-2 text-center">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((day) => {
            const dayDate = new Date(day);
            const isThisMonth = dayDate.getUTCMonth() === m;
            const isToday = day === today;
            const events = eventsByDay.get(day) ?? [];
            return (
              <div
                key={day}
                onClick={() =>
                  isAdmin && setShowNew({ from: day, to: day })
                }
                className={`min-h-[100px] border-b border-r border-slate-800 p-1.5 text-xs transition ${
                  isThisMonth ? "bg-slate-900/30" : "bg-slate-950/50 text-slate-600"
                } ${isAdmin ? "cursor-pointer hover:bg-slate-900/60" : ""}`}
              >
                <div
                  className={`mb-1 flex items-center justify-between ${
                    isToday ? "font-bold text-emerald-400" : ""
                  }`}
                >
                  <span>{dayDate.getUTCDate()}</span>
                  {isToday && (
                    <span className="rounded bg-emerald-500/20 px-1 text-[10px] text-emerald-400">
                      today
                    </span>
                  )}
                </div>
                <div className="space-y-0.5">
                  {events.slice(0, 3).map((ev) => (
                    <button
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenEventId(ev.id);
                      }}
                      className="block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium text-slate-100 hover:brightness-110"
                      style={{ background: `${ev.color}cc` }}
                      title={ev.title}
                    >
                      {ev.title}
                    </button>
                  ))}
                  {events.length > 3 && (
                    <div className="text-[10px] text-slate-500">
                      +{events.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {openEventId !== null && (
        <EventDetailModal id={openEventId} onClose={() => setOpenEventId(null)} />
      )}
      {showNew !== null && (
        <NewEventModal
          defaultStart={showNew.from}
          defaultEnd={showNew.to}
          onClose={() => setShowNew(null)}
        />
      )}
    </div>
  );
}
