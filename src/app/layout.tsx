// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Tailwind CSS 임포트
import { ThemeProvider } from "../../components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Obsidian Website",
  description: "My personal knowledge base",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning 추가
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        {/* ThemeProvider로 children 감싸기 */}
        <ThemeProvider
          attribute="class" // 'class' 속성으로 테마 제어 (<html> 태그에 'dark' 클래스 추가/제거)
          defaultTheme="system" // 기본 테마는 시스템 설정 따름
          enableSystem // 시스템 테마 변경 감지 활성화
          // disableTransitionOnChange // 테마 변경 시 깜빡임 방지 (선택 사항)
        >
          {children} {/* 페이지 컴포넌트들이 여기에 렌더링됨 */}
        </ThemeProvider>
      </body>
    </html>
  );
}
