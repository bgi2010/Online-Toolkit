"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { getToolById } from "@/config/tools";
import { FileUpload, FileUploadRef } from "@/components/FileUpload";
import { ConversionProgress } from "@/components/ConversionProgress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { convertMp3ToWav, downloadFile, triggerDownload, simulateConversionProgress } from "@/lib/api";

export default function ToolDetailPage() {
  const params = useParams();
  const toolId = params.toolId as string;
  const tool = getToolById(toolId);
  
  const fileUploadRef = useRef<FileUploadRef>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "converting" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  // 如果工具不存在，显示 404
  if (!tool) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">工具不存在</h1>
          <p className="text-muted-foreground mb-4">请返回首页选择其他工具</p>
          <Link href="/">
            <Button>返回首页</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleFilesSelect = (files: File[]) => {
    setSelectedFiles(files);
    setStatus("idle");
    setProgress(0);
    setMessage("");
  };

  const handleFileRemove = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (newFiles.length === 0) {
      setStatus("idle");
      setProgress(0);
      setMessage("");
    }
  };

  const handleConvert = async () => {
    if (selectedFiles.length === 0) return;

    setStatus("converting");
    setProgress(0);
    setMessage("");

    let cleanupSimulation: (() => void) | null = null;

    try {
      // 开始转换，带上传进度回调
      const responsePromise = convertMp3ToWav(selectedFiles, (uploadProgress) => {
        setProgress(uploadProgress);
      });

      // 上传完成后，模拟转换进度（50%-90%）
      // 多文件转换时间更长
      const conversionDuration = selectedFiles.length > 1 ? 5000 : 3000;
      setTimeout(() => {
        cleanupSimulation = simulateConversionProgress(
          (conversionProgress) => {
            setProgress(conversionProgress);
          },
          50,
          90,
          conversionDuration
        );
      }, 500);

      // 等待 API 响应
      const response = await responsePromise;

      // 清理模拟进度
      if (cleanupSimulation) {
        (cleanupSimulation as () => void)(); // 强制断言其为可调用的函数类型
      }

      // 设置为 100%
      setProgress(100);

      if (response.status === "success" && response.downloadUrl) {
        setStatus("success");
        setMessage(response.message);
        
        // 构建完整下载 URL
        const fullDownloadUrl = downloadFile(response.filename || "");

        // 延迟 1 秒后自动触发下载
        setTimeout(() => {
          const downloadFilename = selectedFiles.length === 1
            ? selectedFiles[0].name.replace(".mp3", ".wav")
            : "converted_files.zip";
          
          triggerDownload(fullDownloadUrl, downloadFilename);
        }, 1000);
      } else {
        throw new Error(response.message || "转换失败");
      }
    } catch (error) {
      // 清理模拟进度
      if (cleanupSimulation) {
        (cleanupSimulation as () => void)(); // 强制断言其为可调用的函数类型
      }
      
      setStatus("error");
      setProgress(0);
      setMessage(error instanceof Error ? error.message : "转换失败，请重试");
    }
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setStatus("idle");
    setProgress(0);
    setMessage("");
    fileUploadRef.current?.reset();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 工具标题 */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{tool.name}</h1>
            <p className="text-muted-foreground">{tool.description}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：操作区 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 文件上传 */}
              <Card>
                <CardHeader>
                  <CardTitle>上传文件</CardTitle>
                  <CardDescription>
                    选择单个或多个 mp3 文件，或选择包含 mp3 文件的文件夹
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FileUpload
                    ref={fileUploadRef}
                    accept=".mp3"
                    maxSize={100}
                    multiple={true}
                    onFilesSelect={handleFilesSelect}
                    onFileRemove={handleFileRemove}
                    disabled={status === "converting"}
                  />

                  {/* 转换按钮 */}
                  {selectedFiles.length > 0 && (
                    <div className="flex gap-3">
                      <Button
                        onClick={handleConvert}
                        disabled={status === "converting"}
                        className="flex-1"
                        size="lg"
                      >
                        {status === "converting" 
                          ? `转换中 (${selectedFiles.length} 个文件)...` 
                          : `开始转换 (${selectedFiles.length} 个文件)`}
                      </Button>
                      {(status === "success" || status === "error") && (
                        <Button
                          onClick={handleReset}
                          variant="outline"
                          size="lg"
                        >
                          重新上传
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 转换进度 */}
              <ConversionProgress
                status={status}
                progress={progress}
                message={message}
              />
            </div>

            {/* 右侧：使用说明 */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    使用说明
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold mb-2">支持格式</h3>
                    <p className="text-muted-foreground">
                      输入格式：.mp3<br />
                      输出格式：.wav (PCM 16-bit, 44.1kHz)
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">上传方式</h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li>点击"选择文件"上传单个或多个文件</li>
                        <li>点击"选择文件夹"批量上传文件夹中的所有 mp3</li>
                        <li>直接拖拽文件或文件夹到上传区域</li>
                    </ul>
                  </div>

                  <div>
                <h3 className="font-semibold mb-2">文件限制</h3>
                <p className="text-muted-foreground">
                  单个文件最大 100MB<br />
                  支持批量转换多个文件
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">转换说明</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>单文件：输出 .wav 文件</li>
                  <li>多文件：输出 .zip 压缩包</li>
                  <li>转换完成后自动下载</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">注意事项</h3>
                <p className="text-muted-foreground">
                  • 多文件转换时间较长，请耐心等待<br />
                  • 文件仅临时存储，不会保留<br />
                  • 请勿上传敏感信息<br />
                  • 批量转换结果打包为 ZIP 下载
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</div>
  );
}