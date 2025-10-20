import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "在线工具集平台",
  description: "提供音频转换、文件处理等在线工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {/* 顶部导航栏 */}
        <header className="border-b bg-background">
          <div className="container mx-auto px-4 h-16 flex items-center">
            <Link href="/" className="text-xl font-bold text-primary">
              在线工具集
            </Link>
            <nav className="ml-auto flex items-center gap-6">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                首页
              </Link>
              <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                关于
              </Link>
            </nav>
          </div>
        </header>
        
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}