import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface UiState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  setTheme: (t: 'light' | 'dark') => void
  toggleSidebar: () => void
  chatOpen: boolean
  toggleChatOpen: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarOpen: true,
      setTheme: (t) => set({ theme: t }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      chatOpen: false,
      toggleChatOpen: () => set((e) => ({ chatOpen: !e.chatOpen }))
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ theme: s.theme, sidebarOpen: s.sidebarOpen }),
    }
  )
)
