"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ConversionProgressProps {
  status: "idle" | "converting" | "success" | "error";
  progress: number;
  message?: string;
}

export function ConversionProgress({
  status,
  progress,
  message,
}: ConversionProgressProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  // 平滑进度条动画
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 50);
    return () => clearTimeout(timer);
  }, [progress]);

  if (status === "idle") {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {/* 转换中 */}
        {status === "converting" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="font-medium">
                  {progress < 50
                    ? "上传中..."
                    : progress < 90
                    ? "转换中..."
                    : "处理中..."}
                </span>
              </div>
              <span className="text-muted-foreground font-mono">
                {displayProgress}%
              </span>
            </div>
            <Progress value={displayProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {progress < 50 && "正在上传文件到服务器..."}
              {progress >= 50 && progress < 90 && "正在使用 ffmpeg 转换格式..."}
              {progress >= 90 && "即将完成，准备下载..."}
            </p>
          </div>
        )}

        {/* 成功 */}
        {status === "success" && (
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Alert className="bg-green-50 border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <AlertDescription className="text-green-800 font-medium">
                    {message || "转换成功！"}
                  </AlertDescription>
                  <div className="flex items-center gap-2 mt-2 text-sm text-green-700">
                    <Download className="w-4 h-4" />
                    <span>文件正在下载中...</span>
                  </div>
                </div>
              </div>
            </Alert>
          </motion.div>
        )}

        {/* 错误 */}
        {status === "error" && (
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Alert variant="destructive">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 mt-0.5" />
                <div className="flex-1">
                  <AlertDescription>
                    {message || "转换失败，请重试"}
                  </AlertDescription>
                  <p className="text-xs mt-2 opacity-80">
                    请检查文件格式是否正确，或稍后再试
                  </p>
                </div>
              </div>
            </Alert>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}