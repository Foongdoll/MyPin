// src/state/session.store.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { secureStorage } from '../shared/lib/secureStorage'

interface SessionState {
  jwt: string | null
  isAuthenticated: boolean
  user: { uuid: number; name: string } | null
  setSession: (jwt: string, user: SessionState['user']) => void
  clearSession: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      jwt: null,
      isAuthenticated: false,
      user: null,
      setSession: (jwt, user) => set({ jwt, user }),
      clearSession: () => set({ jwt: null, user: null }),
    }),
    {
      name: 'session',
      storage: createJSONStorage(() => secureStorage),
      partialize: (s) => ({ jwt: s.jwt, user: s.user }),
    }
  )
)
