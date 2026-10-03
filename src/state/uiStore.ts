import { create } from 'zustand'
import type { WorkCategory } from '../content/types'

/** Discrete UI state. Only changes on meaningful events, so React re-renders stay rare. */
interface UiState {
  /** Index of the chapter the viewer is currently at. */
  active: number
  setActive: (i: number) => void

  /** True once textures are loaded and shaders compiled — the loading screen can leave. */
  ready: boolean
  setReady: () => void
  /** Asset loading progress 0–100, reported from inside the 3D chunk. */
  progress: number
  setProgress: (p: number) => void

  /** The work whose project panel is open (the camera focuses its moon). */
  openWorkId: string | null
  openWork: (id: string) => void
  closeWork: () => void

  /** Category whose "view all" grid is open. */
  viewAll: WorkCategory | null
  openViewAll: (c: WorkCategory) => void
  closeViewAll: () => void

  /** Moon under the pointer (id), for highlight + cursor. */
  hovered: string | null
  setHovered: (id: string | null) => void

  /** Something the star guide is saying right now, instead of the current stop's line. */
  remark: { text: string; id: number } | null
  /** Make the guide say `text` for a few seconds. */
  say: (text: string) => void
  clearRemark: () => void

  /** Tool whose project links are shown in the asteroid belt (hover or tap). */
  tool: string | null
  setTool: (name: string | null) => void
}

export const useUi = create<UiState>((set) => ({
  active: 0,
  setActive: (active) => set({ active }),
  ready: false,
  setReady: () => set({ ready: true }),
  progress: 0,
  setProgress: (progress) => set({ progress }),
  openWorkId: null,
  // Opening a work from the grid replaces the grid with the panel.
  openWork: (id) => set({ openWorkId: id, viewAll: null }),
  closeWork: () => set({ openWorkId: null }),
  viewAll: null,
  openViewAll: (viewAll) => set({ viewAll, openWorkId: null }),
  closeViewAll: () => set({ viewAll: null }),
  hovered: null,
  setHovered: (hovered) => set({ hovered }),
  remark: null,
  say: (text) => set((s) => ({ remark: { text, id: (s.remark?.id ?? 0) + 1 } })),
  clearRemark: () => set({ remark: null }),
  tool: null,
  setTool: (tool) => set({ tool }),
}))

/** True while any modal layer (panel or grid) is open. */
export const isModalOpen = (s: Pick<UiState, 'openWorkId' | 'viewAll'>) => !!s.openWorkId || !!s.viewAll

// Tool hover with a grace period: the camera drifts and the list sits below the badge,
// so leaving clears the selection only if the pointer doesn't come back shortly.
let toolTimer = 0
export function hoverTool(name: string) {
  window.clearTimeout(toolTimer)
  useUi.getState().setTool(name)
}
export function leaveTool(name: string) {
  window.clearTimeout(toolTimer)
  toolTimer = window.setTimeout(() => {
    if (useUi.getState().tool === name) useUi.getState().setTool(null)
  }, 700)
}
