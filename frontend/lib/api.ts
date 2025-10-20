import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 分钟超时
  headers: {
    "Content-Type": "application/json",
  },
});

export interface ConvertResponse {
  status: "success" | "error";
  downloadUrl?: string;
  message: string;
  filename?: string;
  fileCount?: number;
}

/**
 * 上传并转换 mp3 文件为 wav（支持批量）
 */
export async function convertMp3ToWav(
  files: File[],
  onProgress?: (progress: number) => void
): Promise<ConvertResponse> {
  const formData = new FormData();
  
  // 添加所有文件
  files.forEach((file) => {
    formData.append("files", file);
  });

  try {
    const response = await apiClient.post<ConvertResponse>(
      "/api/convert/mp3-to-wav",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            // 上传进度占 0-50%
            const uploadProgress = Math.round(
              (progressEvent.loaded * 50) / progressEvent.total
            );
            onProgress?.(uploadProgress);
          }
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.detail || error.message;
      throw new Error(message);
    }
    throw error;
  }
}

/**
 * 下载文件
 */
export function downloadFile(filename: string): string {
  return `${API_BASE_URL}/api/download/${filename}`;
}

/**
 * 触发浏览器下载
 */
export function triggerDownload(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  
  // 延迟移除，确保下载触发
  setTimeout(() => {
    document.body.removeChild(link);
  }, 100);
}

/**
 * 模拟转换进度（50%-90%）
 */
export function simulateConversionProgress(
  onProgress: (progress: number) => void,
  startProgress: number = 50,
  endProgress: number = 90,
  duration: number = 3000
): () => void {
  const steps = 20;
  const increment = (endProgress - startProgress) / steps;
  const interval = duration / steps;
  
  let currentProgress = startProgress;
  
  const timer = setInterval(() => {
    currentProgress += increment;
    if (currentProgress >= endProgress) {
      currentProgress = endProgress;
      clearInterval(timer);
    }
    onProgress(Math.round(currentProgress));
  }, interval);

  // 返回清理函数
  return () => clearInterval(timer);
}