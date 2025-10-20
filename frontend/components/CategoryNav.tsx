"use client";

import { Category } from "@/config/tools";
import { cn } from "@/lib/utils";

interface CategoryNavProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
}

export function CategoryNav({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryNavProps) {
  return (
    <nav className="w-64 border-r bg-card p-4">
      <h2 className="text-lg font-semibold mb-4 px-3">工具分类</h2>
      <ul className="space-y-1">
        {categories.map((category) => (
          <li key={category.id}>
            <button
              onClick={() => onSelectCategory(category.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                selectedCategoryId === category.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              )}
            >
              <div className="font-medium">{category.name}</div>
              <div className="text-xs mt-0.5 opacity-80">
                {category.tools.length} 个工具
              </div>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}