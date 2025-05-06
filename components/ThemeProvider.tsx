// components/ThemeProvider.tsx
"use client"; // 이 컴포넌트는 클라이언트 측 상태와 훅을 사용합니다.

import React, { useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
// 'next-themes/dist/types' 경로는 next-themes 버전에 따라 'next-themes'로 바뀔 수 있습니다.
import type { ThemeProviderProps } from "next-themes";

// ThemeProvider 컴포넌트 정의
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // 클라이언트 측에서 컴포넌트가 마운트되었는지 확인하는 상태
  // 서버 렌더링 결과와 클라이언트 첫 렌더링 결과 불일치(hydration mismatch)를 방지
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 컴포넌트가 클라이언트에서 마운트되면 상태를 true로 변경
    setMounted(true);
  }, []);

  // 아직 마운트되지 않았다면, 실제 UI 렌더링을 피하기 위해 null 반환
  // (또는 children을 그대로 반환하여 초기 렌더링 후 테마 적용)
  if (!mounted) {
    return null;
  }

  // 마운트된 후에는 next-themes의 ThemeProvider를 렌더링
  // 전달받은 props (attribute="class", defaultTheme="system" 등)를 그대로 넘겨줌
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
