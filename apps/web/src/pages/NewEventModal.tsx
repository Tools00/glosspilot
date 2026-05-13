import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEventSchema, type CreateEventInput } from "@glosspilot/shared";
import { useCreateEvent } from "../api/events";
import { useSitesList } from "../api/sites";
import { useUsers } from "../api/users";
import { ApiError } from "../api/client";

export function NewEventModal({
  defaultStart,
  defaultEnd,
  onClose,
}: {
  defaultStart?: string;
  defaultEnd?: string;
  onClose: () => void;
}) {
  const sites = useSitesList({ pageSize: 100 });
  const users = useUsers();
  const create = useCreateEvent();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      siteId: undefined as unknown as number,
      title: "",
      note: "",
      startDate: defaultStart ?? "",
      endDate: defaultEnd ?? defaultStart ?? "",
      workerIds: [],
    },
  });

  const onSubmit = async (values: CreateEventInput) => {
    try {
      await create.mutateAsync(values);
      onClose();
    } catch (e) {
      setError("root", { message: e instanceof ApiError ? e.message : "Create failed" });
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h2 className="text-lg font-semibold">New event</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100">
            ✕
          </button>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5"
        >
          <Field label="Site" error={errors.siteId?.message}>
            <select
              className={input}
              {...register("siteId", { valueAsNumber: true })}
              defaultValue=""
            >
              <option value="" disabled>
                Select a site…
              </option>
              {sites.data?.items
                .filter((s) => s.status !== "archived")
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.clientName} — {s.address}
                  </option>
                ))}
            </select>
          </Field>

          <Field label="Title" error={errors.title?.message}>
            <input className={input} placeholder="e.g. Volker Bremer — Ceramic" {...register("title")} />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Start date" error={errors.startDate?.message}>
              <input type="date" className={input} {...register("startDate")} />
            </Field>
            <Field label="End date" error={errors.endDate?.message}>
              <input type="date" className={input} {...register("endDate")} />
            </Field>
          </div>

          <Field label="Note">
            <textarea
              className={`${input} h-20`}
              placeholder="Optional details…"
              {...register("note")}
            />
          </Field>

          <Field label="Assigned workers">
            <Controller
              control={control}
              name="workerIds"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {users.data
                    ?.filter((u) => u.role === "WORKER")
                    .map((u) => {
                      const selected = field.value?.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() =>
                            field.onChange(
                              selected
                                ? field.value!.filter((id) => id !== u.id)
                                : [...(field.value ?? []), u.id],
                            )
                          }
                          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${
                            selected
                              ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                              : "border-slate-700 text-slate-400 hover:border-slate-500"
                          }`}
                        >
                          <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-800 text-[10px] font-bold">
                            {u.initials}
                          </span>
                          {u.name}
                        </button>
                      );
                    })}
                </div>
              )}
            />
          </Field>

          {errors.root && (
            <div className="rounded-lg border border-rose-900 bg-rose-950/40 px-3 py-2 text-xs text-rose-300">
              {errors.root.message}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              {isSubmitting ? "Creating…" : "Create event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const input =
  "w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-rose-400">{error}</span>}
    </label>
  );
}
