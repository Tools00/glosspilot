import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSiteSchema, type CreateSiteInput } from "@glosspilot/shared";
import { useCreateSite } from "../api/sites";
import { ApiError } from "../api/client";

export function NewSiteModal({ onClose }: { onClose: () => void }) {
  const create = useCreateSite();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CreateSiteInput>({
    resolver: zodResolver(createSiteSchema),
    defaultValues: {
      clientName: "",
      address: "",
      color: "#2C5F2E",
      status: "planned",
      totalUnits: 1,
      tasks: [{ name: "Exterior wash", unit: "car", total: 1, position: 0 }],
      materials: [{ name: "Shampoo", neededQty: 0.2, perUnit: 0.2 }],
    },
  });

  const tasks = useFieldArray({ control, name: "tasks" });
  const mats = useFieldArray({ control, name: "materials" });

  const onSubmit = async (values: CreateSiteInput) => {
    try {
      await create.mutateAsync(values);
      onClose();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Create failed";
      setError("root", { message: msg });
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h2 className="text-lg font-semibold">New site</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100"
          >
            ✕
          </button>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Client name" error={errors.clientName?.message}>
              <input className={input} {...register("clientName")} />
            </Field>
            <Field label="Address" error={errors.address?.message}>
              <input className={input} {...register("address")} />
            </Field>
            <Field label="Color (hex)" error={errors.color?.message}>
              <input className={input} {...register("color")} />
            </Field>
            <Field label="Status">
              <select className={input} {...register("status")}>
                <option value="planned">planned</option>
                <option value="active">active</option>
                <option value="completed">completed</option>
              </select>
            </Field>
            <Field label="Total units" error={errors.totalUnits?.message}>
              <input
                type="number"
                className={input}
                {...register("totalUnits", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Start date">
              <input type="date" className={input} {...register("startDate")} />
            </Field>
            <Field label="End date">
              <input type="date" className={input} {...register("endDate")} />
            </Field>
          </div>

          <ArraySection
            title="Tasks"
            onAdd={() =>
              tasks.append({ name: "", unit: "car", total: 1, position: tasks.fields.length })
            }
            onRemove={tasks.remove}
            fields={tasks.fields}
            renderField={(i) => (
              <div className="grid gap-2 sm:grid-cols-4">
                <input
                  placeholder="Name"
                  className={input}
                  {...register(`tasks.${i}.name` as const)}
                />
                <input
                  placeholder="Unit"
                  className={input}
                  {...register(`tasks.${i}.unit` as const)}
                />
                <input
                  type="number"
                  placeholder="Total"
                  className={input}
                  {...register(`tasks.${i}.total` as const, { valueAsNumber: true })}
                />
                <input
                  type="number"
                  placeholder="Position"
                  className={input}
                  {...register(`tasks.${i}.position` as const, { valueAsNumber: true })}
                />
              </div>
            )}
          />

          <ArraySection
            title="Materials"
            onAdd={() =>
              mats.append({ name: "", variant: null, neededQty: 0, perUnit: 0 })
            }
            onRemove={mats.remove}
            fields={mats.fields}
            renderField={(i) => (
              <div className="grid gap-2 sm:grid-cols-4">
                <input
                  placeholder="Name"
                  className={input}
                  {...register(`materials.${i}.name` as const)}
                />
                <input
                  placeholder="Variant"
                  className={input}
                  {...register(`materials.${i}.variant` as const)}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Needed"
                  className={input}
                  {...register(`materials.${i}.neededQty` as const, { valueAsNumber: true })}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Per unit"
                  className={input}
                  {...register(`materials.${i}.perUnit` as const, { valueAsNumber: true })}
                />
              </div>
            )}
          />

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
              {isSubmitting ? "Creating…" : "Create site"}
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

function ArraySection({
  title,
  fields,
  renderField,
  onAdd,
  onRemove,
}: {
  title: string;
  fields: { id: string }[];
  renderField: (i: number) => React.ReactNode;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
        <button
          type="button"
          onClick={onAdd}
          className="text-xs text-emerald-400 hover:text-emerald-300"
        >
          + add
        </button>
      </div>
      <div className="space-y-2">
        {fields.map((f, i) => (
          <div key={f.id} className="flex items-start gap-2">
            <div className="flex-1">{renderField(i)}</div>
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="mt-1 text-xs text-slate-500 hover:text-rose-400"
            >
              ✕
            </button>
          </div>
        ))}
        {fields.length === 0 && (
          <div className="text-xs text-slate-500">No {title.toLowerCase()} yet.</div>
        )}
      </div>
    </div>
  );
}
