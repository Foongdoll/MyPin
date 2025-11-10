import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Home from "../../pages/home/Home";
import Login from "../../pages/auth/Login";
import Header from "../layout/Header";
import Sidebar from "../layout/Sidebar";
import Join from "../../pages/auth/Join";
import Schedule from "../../pages/schedule/Schedule";
import Notes from "../../pages/notes/Notes";
import Ledger from "../../pages/ledger/Ledger";
import Setting from "../../pages/setting/Setting";
import { useSessionStore } from "../../state/session.store";

const Layout = () => (
  <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
    <Header />
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  </div>
);

const useAuthStatus = () => {
  const isAuthenticated = useSessionStore((state) => Boolean(state.accessToken && state.user));
  const [hydrated, setHydrated] = useState(() => useSessionStore.persist.hasHydrated?.() ?? false);

  useEffect(() => {
    if (useSessionStore.persist.hasHydrated?.()) {
      setHydrated(true);
    }
    const unsub = useSessionStore.persist.onFinishHydration?.(() => setHydrated(true));
    return () => {
      unsub?.();
    };
  }, []);

  return { isAuthenticated, hydrated };
};

const PublicOnly = () => {
  const { isAuthenticated, hydrated } = useAuthStatus();
  if (!hydrated) return null;
  return isAuthenticated ? <Navigate to="/home" replace /> : <Outlet />;
};

const ProtectedLayout = () => {
  const { isAuthenticated, hydrated } = useAuthStatus();
  if (!hydrated) return null;
  return isAuthenticated ? <Layout /> : <Navigate to="/login" replace />;
};

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnly />}>
          <Route index element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/join" element={<Join />} />
        </Route>

        <Route element={<ProtectedLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/settings" element={<Setting />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
