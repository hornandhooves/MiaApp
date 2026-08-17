/**
 * Estado local de UI (no de dominio): el nav sheet.
 */
import { create } from "zustand";

interface UiState {
  sheetOpen: boolean;
  openSheet: () => void;
  closeSheet: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sheetOpen: false,
  openSheet: () => set({ sheetOpen: true }),
  closeSheet: () => set({ sheetOpen: false }),
}));
