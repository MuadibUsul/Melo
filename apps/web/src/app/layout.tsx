import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "\u58f0\u6210\u97f3\u4e50",
  description:
    "\u97f3\u4e50\u6536\u542c\u3001\u53d1\u73b0\u3001\u699c\u5355\u3001\u5206\u7c7b\u4e0e AI \u521b\u4f5c\u53d1\u5e03\u5e73\u53f0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
