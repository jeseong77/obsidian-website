// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Tailwind CSS 임포트
import { ThemeProvider } from "../../components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

// 웹사이트의 기본 URL (프로토콜을 포함해야 합니다)
const siteUrl = "https://www.jeseong.com";

export const metadata: Metadata = {
  // 기본 메타데이터
  title: "JS Tech Blog",
  description: "My personal second brain",
  icons: { icon: "/favicon.png" }, // public 폴더의 favicon.png

  // 오픈 그래프 메타데이터 (페이스북, 카카오톡, 디스코드 등)
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "JS Tech Blog",
    description: "My personal second brain",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 630, 
        alt: "JS Tech Blog 대표 이미지",
      },
    ],
    siteName: "JS Tech Blog",
    locale: "ko_KR",
  },

  // 트위터 카드 메타데이터
  twitter: {
    card: "summary_large_image", // 큰 이미지가 포함된 카드
    title: "JS Tech Blog",
    description: "My personal second brain",
    images: [`${siteUrl}/og-image.png`], // 트위터용 이미지 URL
    // 만약 트위터 핸들이 있다면 추가:
    // site: "@JeseongTwitterHandle", // 사이트의 트위터 핸들
    // creator: "@JeseongLeeTwitter", // 콘텐츠 작성자의 트위터 핸들
  },

  // Next.js 13.3+ 에서 권장: 모든 상대 경로 이미지/URL의 기준 URL 설정
  // 이 설정을 사용하면 openGraph.images.url 등에 상대 경로 ("/og-image.png") 사용 가능
  metadataBase: new URL(siteUrl),
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
