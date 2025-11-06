import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { secureStorage } from "../shared/lib/secureStorage";
import type { User } from "../shared/types/AuthType";



interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User;
  isAuthenticated: boolean;
  // actions
  setSession: (accessToken: string, refreshToken: string | null, user: User) => void;
  setAccessToken: (accessToken: string | null) => void;
  clearSession: () => void;
  logout: () => void; // 인터셉터에서 사용할 별칭
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      get isAuthenticated() {
        return !!get().accessToken && !!get().user;
      },

      setSession: (accessToken, refreshToken, user) =>
        set({ accessToken, refreshToken: refreshToken ?? get().refreshToken, user }),

      setAccessToken: (accessToken) => set({ accessToken }),

      clearSession: () => set({ accessToken: null, refreshToken: null, user: null }),

      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: "session",
      storage: createJSONStorage(() => secureStorage),
      // persist 대상만 명시 (access/refresh/user)
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
      }),
    }
  )
);
