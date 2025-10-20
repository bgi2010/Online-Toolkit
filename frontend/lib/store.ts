import { create } from "zustand";

interface AppState {
  selectedCategoryId: string;
  setSelectedCategoryId: (categoryId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedCategoryId: "format-conversion", // 默认选中第一个分类
  setSelectedCategoryId: (categoryId: string) =>
    set({ selectedCategoryId: categoryId }),
}));