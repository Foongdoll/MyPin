import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { secureStorage } from "../shared/lib/secureStorage";
import type { User } from "../shared/types/AuthType";

interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setSession: (accessToken: string, refreshToken: string | null, user: User | null) => void;
  setAccessToken: (accessToken: string | null) => void;
  clearSession: () => void;
  logout: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      setSession: (accessToken, refreshToken, user) =>
        set({ accessToken, refreshToken: refreshToken ?? get().refreshToken, user }),

      setAccessToken: (accessToken) => set({ accessToken }),

      clearSession: () => set({ accessToken: null, refreshToken: null, user: null }),

      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
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
