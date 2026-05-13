import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useNavigate } from "react-router-dom";
import { loginSchema, type LoginInput } from "@glosspilot/shared";
import { useLogin, useMe } from "../api/auth";
import { ApiError } from "../api/client";

export function LoginPage() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "dispatch@glosspilot.dev", password: "demo" },
  });

  if (me) return <Navigate to="/" replace />;

  const onSubmit = async (values: LoginInput) => {
    try {
      await login.mutateAsync(values);
      navigate("/", { replace: true });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Login failed";
      setError("root", { message: msg });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 font-bold text-slate-900">
            G
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight">GlossPilot</div>
            <div className="text-xs text-slate-400">Field-ops dashboard</div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">Email</span>
            <input
              type="email"
              autoComplete="email"
              {...register("email")}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            {errors.email && (
              <span className="mt-1 block text-xs text-rose-400">{errors.email.message}</span>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              {...register("password")}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            {errors.password && (
              <span className="mt-1 block text-xs text-rose-400">{errors.password.message}</span>
            )}
          </label>

          {errors.root && (
            <div className="rounded-lg border border-rose-900 bg-rose-950/40 px-3 py-2 text-xs text-rose-300">
              {errors.root.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 space-y-1 text-xs text-slate-500">
          <div>Demo logins:</div>
          <div>
            <code className="text-slate-400">dispatch@glosspilot.dev</code> / <code>demo</code>{" "}
            <span className="text-emerald-500">(ADMIN)</span>
          </div>
          <div>
            <code className="text-slate-400">crew1@glosspilot.dev</code> / <code>demo</code>{" "}
            <span className="text-sky-400">(WORKER)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
