import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginPage } from "./pages/Login";
import { HomePage } from "./pages/Home";
import { SitesListPage } from "./pages/SitesList";
import { SiteDetailPage } from "./pages/SiteDetail";
import { CalendarPage } from "./pages/Calendar";
import { ReportsListPage } from "./pages/ReportsList";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppShellRoute } from "./auth/AppShellRoute";

const qc = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppShellRoute />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<HomePage />} />
            <Route path="/sites" element={<SitesListPage />} />
            <Route path="/sites/:id" element={<SiteDetailPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/reports" element={<ReportsListPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
