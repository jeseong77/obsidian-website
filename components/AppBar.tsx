// components/AppBar.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
// react-ionicons에서 아이콘 임포트
import { MenuOutline, SearchOutline, Sunny, Moon } from "react-ionicons";

// AppBar 컴포넌트의 props 타입 정의
interface AppBarProps {
  siteTitle?: string;
  onToggleSidebar: () => void;
}

const AppBar: React.FC<AppBarProps> = ({
  siteTitle = "My Notes",
  onToggleSidebar,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Search submitted:", searchTerm);
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  // 테마 아이콘 렌더링 (react-ionicons 사용 및 색상 적용 - 이전과 동일, 올바른 버전)
  const renderThemeChanger = () => {
    if (!mounted) {
      return <div className="w-6 h-6" />; // 아이콘 크기만큼 공간 확보 (24px)
    }
    if (resolvedTheme === "dark") {
      // 다크 모드 활성화 시 (라이트 모드로 전환 버튼)
      return <Moon color={"#FDB813"} height="24px" width="24px" />; // 따스한 노란색 달
    } else {
      // 라이트 모드 활성화 시 (다크 모드로 전환 버튼)
      return <Sunny color={"#FACC15"} height="24px" width="24px" />; // 노란색 해
    }
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full px-4 py-3 bg-[var(--card-background)] text-[var(--foreground)] shadow-md h-16 transition-colors duration-150 ease-in-out">
      <div className="flex items-center">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
          className="p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none mr-2 transition-colors duration-150 ease-in-out" // 포커스 링은 일단 유지 (필요시 이전 답변처럼 제거)
        >
          <MenuOutline color="currentColor" height="24px" width="24px" />
        </button>
        <h1 className="text-xl font-semibold hidden sm:block transition-colors duration-150 ease-in-out">
          {siteTitle}
        </h1>
      </div>

      {/* 오른쪽 섹션: 검색 + 다크 모드 토글 */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* 검색창 */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative hidden md:block"
        >
          <input
            type="search"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 pr-4 py-2 w-40 sm:w-64 text-sm text-[var(--foreground)] bg-[var(--card-background)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors duration-150 ease-in-out placeholder:text-[var(--foreground-muted)]"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--foreground-muted)] transition-colors duration-150 ease-in-out">
            <SearchOutline color="currentColor" height="20px" width="20px" />
          </div>
        </form>
        {/* 모바일용 검색 아이콘 버튼 */}
        <button
          className="p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 md:hidden text-[var(--foreground-muted)] transition-colors duration-150 ease-in-out"
          aria-label="Search"
        >
          <SearchOutline color="currentColor" height="20px" width="20px" />
        </button>

        {/* 다크 모드 토글 버튼 */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Dark Mode"
          // 👇 className 수정: themeIconColorClass 제거, 포커스 스타일은 이전 답변 참고하여 적용
          className={`p-2 rounded-md 
                     hover:bg-black/5 dark:hover:bg-white/5 
                     focus:outline-none focus:bg-black/5 dark:focus:bg-white/5 
                     transition-colors duration-150 ease-in-out`}
        >
          {/* 👇 버튼 내용을 renderThemeChanger() 호출로 수정 */}
          {renderThemeChanger()}
        </button>
      </div>
    </header>
  );
};

export default AppBar;
