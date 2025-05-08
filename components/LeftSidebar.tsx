// components/LeftSidebar.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  SearchOutline,
  Sunny, // 채워진 아이콘
  Moon, // 채워진 아이콘
  GridOutline,
  FolderOutline,
  FolderOpenOutline,
  DocumentTextOutline,
} from "react-ionicons";

// 👇 공유 타입 파일에서 TreeNode 임포트 (경로는 실제 프로젝트 구조에 맞게 정확히 수정 필요)
import type { TreeNode } from "../lib/utils"; // 예시 경로: lib/utils.ts에 정의 가정

// LeftSidebar Props 타입 정의
interface LeftSidebarProps {
  treeData: TreeNode[];
  currentNodeId: string; // 정규화된 슬러그
}

// TreeItem 컴포넌트
const TreeItem: React.FC<{
  node: TreeNode; // 임포트된 TreeNode 타입 사용 (id는 슬러그, name은 원본 제목)
  currentNodeId: string; // 정규화된 슬러그
  expandedFolders: Set<string>;
  toggleFolder: (id: string) => void; // id는 슬러그
}> = ({ node, currentNodeId, expandedFolders, toggleFolder }) => {
  const isFolder = node.type === "folder";
  const isExpanded = isFolder && expandedFolders.has(node.id);
  const isCurrentFile = node.type === "file" && node.id === currentNodeId;
  const indentStyle = { paddingLeft: `${node.depth * 1}rem` };

  // 공통 클래스 (패딩 및 호버 효과)
  const commonClasses = `flex items-center  px-2 py-1 rounded cursor-pointer transition-colors duration-150 ease-in-out
                         hover:bg-[var(--accent-default)] hover:text-[var(--accent-selected-foreground)]
                         dark:hover:bg-[var(--accent-default)] dark:hover:text-[var(--accent-selected-foreground)]`;

  // 선택된 파일 스타일 (배경색 + 고대비 텍스트 색상)
  const currentFileClasses = isCurrentFile
    ? `font-bold bg-[var(--accent-selected)] text-[var(--accent-selected-foreground)]`
    : "";

  // 아이콘 색상 변수
  const iconColor = "var(--foreground-muted)";
  const currentIconColor = "currentColor"; // 선택 시 텍스트 색상 상속

  if (isFolder) {
    return (
      <li key={node.id}>
        <div
          className={`${commonClasses}`} // 폴더는 기본 스타일만 적용
          style={indentStyle}
          onClick={() => toggleFolder(node.id)} // 폴더 ID(슬러그) 전달
        >
          {/* 폴더 아이콘 */}
          {isExpanded ? (
            <FolderOpenOutline
              color={iconColor} // 항상 muted 색상
              height="16px"
              width="16px"
              cssClasses="mx-1 flex-shrink-0" // 오른쪽 마진으로 아이콘/텍스트 간격
            />
          ) : (
            <FolderOutline
              color={iconColor} // 항상 muted 색상
              height="16px"
              width="16px"
              cssClasses="mx-1 flex-shrink-0"
            />
          )}
          {/* 폴더 이름 (원본 제목) */}
          <span className="truncate">{node.name}</span>
        </div>
        {/* 자식 노드 렌더링 */}
        {isExpanded && node.children && node.children.length > 0 && (
          <ul className="pl-0">
            {" "}
            {/* 자식 노드 들여쓰기 (선택 사항) */}
            {node.children.map((child) => (
              <TreeItem
                key={child.id}
                node={child}
                currentNodeId={currentNodeId}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
              />
            ))}
          </ul>
        )}
      </li>
    );
  } else {
    // 파일인 경우
    return (
      <li key={node.id}>
        <Link
          href={`/?note=${node.id}`} // node.id는 정규화된 슬러그
          className={`${commonClasses} ${currentFileClasses}`} // 선택 시 스타일 적용
          style={indentStyle}
        >
          <DocumentTextOutline
            color={isCurrentFile ? currentIconColor : iconColor}
            height="16px"
            width="16px"
            cssClasses="mx-1 flex-shrink-0"
          />
          {/* 파일 이름 (원본 제목) */}
          <span className="truncate">{node.name}</span>
        </Link>
      </li>
    );
  }
};

// 메인 LeftSidebar 컴포넌트
const LeftSidebar: React.FC<LeftSidebarProps> = ({
  treeData = [],
  currentNodeId,
}) => {
  // 오른쪽 패널 관련 상태 (이 기능이 실제로 필요 없다면 제거 가능)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  // 폴더 확장 상태
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  // 테마 관련 상태 및 함수
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 폴더 확장/축소 함수
  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        // 같은 레벨의 다른 폴더는 닫거나, 여러 폴더를 열 수 있도록 허용 (현재: 여러 폴더 허용)
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  // 테마 변경 함수
  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  // 테마 아이콘 렌더링 함수
  const renderThemeIcon = () => {
    if (!mounted) return <div className="w-[18px] h-[18px]" />; // 마운트 전 Placeholder
    // 라이트 모드 -> 다크 전환 아이콘 (Sun)
    if (resolvedTheme === "light") {
      return <Sunny color={"#FACC15"} height="18px" width="18px" />;
    }
    // 다크 모드 -> 라이트 전환 아이콘 (Moon)
    else {
      return <Moon color={"#FDB813"} height="18px" width="18px" />;
    }
  };

  // Grid 아이콘 색상 결정 (마운트 확인 후 CSS 변수 사용)
  const gridIconColor = mounted ? "var(--foreground-muted)" : "transparent";

  return (
    // 최상위 컨테이너: 패딩, 배경, 높이, flex 설정, 기본 텍스트 색상, 전환 효과
    <div className="p-4 bg-[var(--card-background)] h-full flex flex-col text-[var(--foreground)] transition-colors duration-150 ease-in-out">
      {/* 제목 */}
      <h2 className="text-xl font-bold mb-4 transition-colors duration-150 ease-in-out">
        Jeseong&apos;s Notes
      </h2>
      {/* 검색창 */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search..."
          className="w-full p-2 pr-10 border border-[var(--border-color)] rounded bg-[var(--card-background)] text-sm text-[var(--foreground)] focus:ring-sky-500 focus:border-sky-500 transition-colors duration-150 ease-in-out placeholder:text-[var(--foreground-muted)]"
        />
        <SearchOutline
          color="var(--foreground-muted)"
          height="18px"
          width="18px"
          cssClasses="absolute right-3 top-1/2 transform -translate-y-1/2"
        />
      </div>
      {/* 컨트롤 버튼 영역 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors duration-150 ease-in-out"
          title="Toggle Dark Mode"
        >
          {renderThemeIcon()}
        </button>
        <button
          onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors duration-150 ease-in-out"
          title="Toggle Right Panel (dummy)"
        >
          <GridOutline color={gridIconColor} height="18px" width="18px" />
        </button>
      </div>
      {/* 탐색기 (Explorer) */}
      <div className="overflow-y-auto flex-grow">
        <h3 className="text-lg font-semibold mb-2 sticky top-0 bg-[var(--card-background)] py-1 z-10 transition-colors duration-150 ease-in-out">
          Explorer
        </h3>
        <ul className="text-sm space-y-1">
          {/* 트리 아이템 렌더링 */}
          {treeData.map((node) => (
            <TreeItem
              key={node.id}
              node={node}
              currentNodeId={currentNodeId}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
            />
          ))}
        </ul>
      </div>
      {/* Footer 공간 */}
      <div className="mt-auto pt-2 text-xs text-[var(--foreground-muted)] border-t border-[var(--border-color)] transition-colors duration-150 ease-in-out">
        {/* Footer 내용이 있다면 여기에 추가 */}
      </div>
    </div>
  );
};

export default LeftSidebar;
