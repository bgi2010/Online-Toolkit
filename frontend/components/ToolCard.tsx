"use client";

import { Tool } from "@/config/tools";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  // 只有 mp3-to-wav 已实现
  const isImplemented = tool.id === "mp3-to-wav";

  const handleClick = (e: React.MouseEvent) => {
    if (!isImplemented) {
      e.preventDefault();
      toast.info("该工具暂未开发", {
        description: "敬请期待后续更新",
        duration: 3000,
      });
    }
  };

  const CardWrapper = isImplemented ? Link : "div";

  return (
    <CardWrapper
      href={isImplemented ? tool.path : "#"}
      target={isImplemented ? "_blank" : undefined}
      rel={isImplemented ? "noopener noreferrer" : undefined}
      onClick={handleClick}
    >
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {tool.name}
            {isImplemented && (
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </CardTitle>
          <CardDescription>{tool.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground">
              {tool.category}
            </span>
            {!isImplemented && (
              <span className="text-xs text-muted-foreground bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                开发中
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </CardWrapper>
  );
}