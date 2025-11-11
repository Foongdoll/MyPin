import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { secureStorage } from "../shared/lib/secureStorage";
import type { User } from "../shared/types/AuthType";

type LogoutReason = "manual" | "expired" | "unknown";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";

const revokeServerSession = async (refreshToken: string | null) => {
  if (!refreshToken) return;
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch (error) {
    console.warn("[session] Failed to synchronize logout with server", error);
  }
};

interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  logoutSignal: number;
  logoutReason: LogoutReason | null;
  setSession: (accessToken: string, refreshToken: string | null, user: User | null) => void;
  setAccessToken: (accessToken: string | null) => void;
  clearSession: () => void;
  logout: (options?: { reason?: LogoutReason }) => Promise<void>;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      logoutSignal: 0,
      logoutReason: null,

      setSession: (accessToken, refreshToken, user) =>
        set({
          accessToken,
          refreshToken: refreshToken ?? get().refreshToken,
          user,
          logoutReason: null,
        }),

      setAccessToken: (accessToken) => set({ accessToken }),

      clearSession: () => set({ accessToken: null, refreshToken: null, user: null }),

      logout: async (options) => {
        const refreshToken = get().refreshToken;
        await revokeServerSession(refreshToken);
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          logoutReason: options?.reason ?? "unknown",
          logoutSignal: Date.now(),
        });        
      },
    }),
    {
      name: "session",
      storage: createJSONStorage(() => secureStorage),
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
      }),
    }
  )
);
