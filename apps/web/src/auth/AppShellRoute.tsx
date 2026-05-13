import { Outlet } from "react-router-dom";
import { useMe } from "../api/auth";
import { AppShell } from "../components/AppShell";

export function AppShellRoute() {
  const { data: me } = useMe();
  if (!me) return null; // ProtectedRoute parent guards this
  return (
    <AppShell me={me}>
      <Outlet />
    </AppShell>
  );
}
