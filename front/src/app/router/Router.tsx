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
import { HttpProvider } from "../provider/HttpProvider";
import { NavermapsProvider } from "react-naver-maps";
import NotesFormAndDetailPreview from "../../pages/notes/NoteDetail";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Chat, { FloatingActionMenu } from "../../pages/chat/Chat.tsx";
import { WebSocketProvider } from "../provider/WebSocketProvider.tsx";
import { Clock, Mail, MessageCircle, Users } from "lucide-react";
import { useUiStore } from "../../state/ui.store.tsx";
const CLIENT_KEY = import.meta.env.VITE_NAVER_MAPS_KEY;


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

const queryClient = new QueryClient();

const Router = () => {
  const { chatOpen, toggleChatOpen } = useUiStore();

  return (
    <BrowserRouter>
      <HttpProvider>
        <NavermapsProvider ncpKeyId={CLIENT_KEY} submodules={["geocoder"]}>
          <QueryClientProvider client={queryClient}>
            <WebSocketProvider>
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
                  <Route path="/note/detail" element={<NotesFormAndDetailPreview />} />
                  <Route path="/ledger" element={<Ledger />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/settings" element={<Setting />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              {/* 플로팅 메뉴 */}
              <FloatingActionMenu
                open={chatOpen}
                onToggle={toggleChatOpen}
                items={[
                  {
                    icon: <MessageCircle className="h-4 w-4" />,
                    label: "1:1 채팅 만들기",
                    onClick: () => {
                      // TODO: 1:1 채팅 생성 모달 열기
                    },
                  },
                  {
                    icon: <Users className="h-4 w-4" />,
                    label: "그룹 채팅 만들기",
                    onClick: () => {
                      // TODO: 그룹 채팅 생성 모달 열기
                    },
                  },
                  {
                    icon: <Clock className="h-4 w-4" />,
                    label: "예약 메시지",
                    onClick: () => {
                      // TODO: 예약 메시지 관리/생성
                    },
                  },
                  {
                    icon: <Mail className="h-4 w-4" />,
                    label: "예약 메일",
                    onClick: () => {
                      // TODO: 예약 메일 관리/생성
                    },
                  },
                ]}
              />
            </WebSocketProvider>
          </QueryClientProvider>
        </NavermapsProvider>
      </HttpProvider>
    </BrowserRouter>

  );
};

export default Router;
