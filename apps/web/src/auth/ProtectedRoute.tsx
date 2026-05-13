import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { Role } from "@glosspilot/shared";
import { useMe } from "../api/auth";

export function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: Role[];
}) {
  const { data: me, isLoading } = useMe();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }
  if (!me) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(me.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
