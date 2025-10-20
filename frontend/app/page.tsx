"use client";

import { useState, useEffect } from "react";
import { categories, getCategoryById } from "@/config/tools";
import { CategoryNav } from "@/components/CategoryNav";
import { ToolGrid } from "@/components/ToolGrid";
import { useAppStore } from "@/lib/store";

export default function Home() {
  const { selectedCategoryId, setSelectedCategoryId } = useAppStore();
  
  // 获取当前选中的分类
  const selectedCategory = getCategoryById(selectedCategoryId);

  return (
    <div className="flex min-h-screen">
      {/* 左侧分类导航 */}
      <CategoryNav
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
      />

      {/* 右侧工具展示区 */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* 页头 */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {selectedCategory?.name || "在线工具集"}
            </h1>
            <p className="text-muted-foreground">
              {selectedCategory?.description || "选择左侧分类查看工具"}
            </p>
          </div>

          {/* 工具卡片网格 */}
          {selectedCategory && (
            <ToolGrid tools={selectedCategory.tools} />
          )}
        </div>
      </main>
    </div>
  );
}