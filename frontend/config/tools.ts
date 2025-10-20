export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  path: string;
  icon?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  tools: Tool[];
}

export const categories: Category[] = [
  {
    id: "format-conversion",
    name: "格式转换",
    description: "音频、视频格式转换工具",
    tools: [
      {
        id: "mp3-to-wav",
        name: "mp3 转换为 wav",
        description: "将 mp3 音频文件转换为 wav 格式",
        category: "format-conversion",
        path: "/tools/mp3-to-wav",
      },
      {
        id: "mkv-to-mp4",
        name: "mkv 转换为 mp4",
        description: "将 mkv 视频文件转换为 mp4 格式",
        category: "format-conversion",
        path: "/tools/mkv-to-mp4",
      },
    ],
  },
  {
    id: "file-processing",
    name: "文件处理",
    description: "PDF、Excel 等文件处理工具",
    tools: [
      {
        id: "pdf-watermark",
        name: "PDF 添加水印",
        description: "为 PDF 文件添加文字或图片水印",
        category: "file-processing",
        path: "/tools/pdf-watermark",
      },
      {
        id: "pdf-merge",
        name: "PDF 文件合并",
        description: "将多个 PDF 文件合并为一个",
        category: "file-processing",
        path: "/tools/pdf-merge",
      },
      {
        id: "excel-to-json",
        name: "Excel 转 JSON",
        description: "将 Excel 文件转换为 JSON 格式",
        category: "file-processing",
        path: "/tools/excel-to-json",
      },
    ],
  },
  {
    id: "video-processing",
    name: "视频文件处理",
    description: "视频编辑与处理工具",
    tools: [
      {
        id: "video-trim",
        name: "视频截取",
        description: "截取视频片段",
        category: "video-processing",
        path: "/tools/video-trim",
      },
      {
        id: "video-ocr",
        name: "视频文字提取",
        description: "从视频中提取文字内容",
        category: "video-processing",
        path: "/tools/video-ocr",
      },
    ],
  },
];

// 根据 ID 获取工具
export function getToolById(id: string): Tool | undefined {
  for (const category of categories) {
    const tool = category.tools.find((t) => t.id === id);
    if (tool) return tool;
  }
  return undefined;
}

// 根据分类 ID 获取分类
export function getCategoryById(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}