"use client";

import { useState, useRef, ChangeEvent, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, File, X, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // MB
  multiple?: boolean;
  onFilesSelect: (files: File[]) => void;
  onFileRemove?: (index: number) => void;
  disabled?: boolean;
}

export interface FileUploadRef {
  reset: () => void;
}

export const FileUpload = forwardRef<FileUploadRef, FileUploadProps>(
  function FileUpload(
    {
      accept = ".mp3",
      maxSize = 100,
      multiple = true,
      onFilesSelect,
      onFileRemove,
      disabled = false,
    },
    ref
  ) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [error, setError] = useState<string>("");
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    // 暴露重置方法给父组件
    useImperativeHandle(ref, () => ({
      reset: () => {
        setSelectedFiles([]);
        setError("");
        if (inputRef.current) {
          inputRef.current.value = "";
        }
        if (folderInputRef.current) {
          folderInputRef.current.value = "";
        }
      },
    }));

    const validateFiles = (files: File[]): File[] => {
      const acceptedTypes = accept.split(",").map((type) => type.trim());
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      const oversizedFiles: string[] = [];

      for (const file of files) {
        const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
        
        // 验证文件类型
        if (!acceptedTypes.includes(fileExtension)) {
          invalidFiles.push(file.name);
          continue;
        }

        // 验证文件大小
        const fileSizeMB = file.size / 1024 / 1024;
        if (fileSizeMB > maxSize) {
          oversizedFiles.push(file.name);
          continue;
        }

        validFiles.push(file);
      }

      // 设置错误信息
      if (invalidFiles.length > 0) {
        setError(`以下文件格式不支持: ${invalidFiles.join(", ")}`);
      } else if (oversizedFiles.length > 0) {
        setError(`以下文件超过 ${maxSize}MB: ${oversizedFiles.join(", ")}`);
      } else {
        setError("");
      }

      return validFiles;
    };

    const handleFilesChange = (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      const validFiles = validateFiles(fileArray);

      if (validFiles.length > 0) {
        setSelectedFiles(validFiles);
        onFilesSelect(validFiles);
      }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
      handleFilesChange(e.target.files);
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      handleFilesChange(files);
    };

    const handleRemoveFile = (index: number) => {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);
      setError("");
      
      if (newFiles.length === 0) {
        if (inputRef.current) inputRef.current.value = "";
        if (folderInputRef.current) folderInputRef.current.value = "";
      }
      
      onFileRemove?.(index);
    };

    const handleFileClick = () => {
      if (!disabled) {
        inputRef.current?.click();
      }
    };

    const handleFolderClick = () => {
      if (!disabled) {
        folderInputRef.current?.click();
      }
    };

    const getTotalSize = () => {
      return selectedFiles.reduce((sum, file) => sum + file.size, 0);
    };

    return (
      <div className="space-y-4">
        {/* 拖拽上传区域 */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-accent/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm font-medium mb-3">
            拖拽文件或文件夹到此处
          </p>
          
          {/* 按钮组 */}
          <div className="flex gap-3 justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFileClick}
              disabled={disabled}
            >
              <Upload className="w-4 h-4 mr-2" />
              选择文件
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFolderClick}
              disabled={disabled}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              选择文件夹
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-3">
            支持 {accept} 格式，单个文件最大 {maxSize}MB
          </p>
        </div>

        {/* 隐藏的文件输入 */}
        <Input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />

        {/* 隐藏的文件夹输入 */}
        <Input
          ref={folderInputRef}
          type="file"
          accept={accept}
          // @ts-ignore - webkitdirectory 是非标准属性
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />

        {/* 错误提示 */}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* 已选择的文件列表 */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>已选择 {selectedFiles.length} 个文件</span>
              <span className="text-muted-foreground">
                共 {(getTotalSize() / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between p-2 bg-accent rounded-md"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <File className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    disabled={disabled}
                    className="flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }
);