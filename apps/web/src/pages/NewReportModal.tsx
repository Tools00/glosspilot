import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createReportSchema, type CreateReportInput } from "@glosspilot/shared";
import { useCreateReport } from "../api/reports";
import { useSitesList } from "../api/sites";
import { ApiError } from "../api/client";

export function NewReportModal({
  defaultSiteId,
  onClose,
}: {
  defaultSiteId?: number;
  onClose: () => void;
}) {
  const sites = useSitesList({ pageSize: 100 });
  const create = useCreateReport();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CreateReportInput>({
    resolver: zodResolver(createReportSchema),
    defaultValues: {
      siteId: defaultSiteId ?? (undefined as unknown as number),
      summary: "",
    },
  });

  const onSubmit = async (values: CreateReportInput) => {
    try {
      await create.mutateAsync(values);
      onClose();
    } catch (e) {
      setError("root", {
        message: e instanceof ApiError ? e.message : "Create failed",
      });
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
          <h2 className="text-lg font-semibold">New report</h2>
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
              defaultValue={defaultSiteId ?? ""}
              disabled={defaultSiteId !== undefined}
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

          <Field label="Summary (what happened on site)" error={errors.summary?.message}>
            <textarea
              className={`${input} h-40`}
              placeholder="What was done, materials used, issues encountered…"
              {...register("summary")}
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
              {isSubmitting ? "Creating…" : "Submit report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const input =
  "w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-60";

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
