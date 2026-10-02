import { create } from 'zustand'

/** Discrete UI state. Only changes on meaningful events, so React re-renders stay rare. */
interface UiState {
  /** Index of the chapter the viewer is currently at. */
  active: number
  setActive: (i: number) => void
  /** True once textures are loaded and shaders compiled — the loading screen can leave. */
  ready: boolean
  setReady: () => void
}

export const useUi = create<UiState>((set) => ({
  active: 0,
  setActive: (active) => set({ active }),
  ready: false,
  setReady: () => set({ ready: true }),
}))
