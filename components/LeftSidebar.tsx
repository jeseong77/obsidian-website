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

// TreeNode 타입 정의
interface TreeNode {
  id: string;
  name: string;
  type: "folder" | "file";
  children?: TreeNode[];
  depth: number;
}

// LeftSidebar Props 타입 정의
interface LeftSidebarProps {
  treeData: TreeNode[];
  currentNodeId: string;
}

// TreeItem 컴포넌트 수정 (선택된 항목 텍스트 색상만 수정)
const TreeItem: React.FC<{
  node: TreeNode;
  currentNodeId: string;
  expandedFolders: Set<string>;
  toggleFolder: (id: string) => void;
}> = ({ node, currentNodeId, expandedFolders, toggleFolder }) => {
  const isFolder = node.type === "folder";
  const isExpanded = isFolder && expandedFolders.has(node.id);
  const isCurrentFile = node.type === "file" && node.id === currentNodeId;
  const indentStyle = { paddingLeft: `${node.depth * 1}rem` };

  // 공통 클래스 (이전과 동일)
  const commonClasses = `flex items-center p-1 rounded cursor-pointer 
                         hover:bg-[var(--accent-default)] hover:text-[var(--foreground)] 
                         dark:hover:bg-[var(--accent-default)] dark:hover:text-[var(--foreground)]`;

  // 선택된 파일 스타일: 라이트/다크 모두 대비 높은 텍스트 색상 적용
  const currentFileClasses = isCurrentFile
    ? `font-bold bg-[var(--accent-selected)] text-[var(--color-light-text)] dark:text-[var(--color-dark-navy)]`
    : "";

  // 아이콘 색상: 선택되지 않았을 때 (CSS 변수 사용)
  const iconColor = "var(--foreground-muted)";
  // 선택되었을 때 아이콘 색상 (텍스트 색상 상속 키워드)
  const currentIconColor = "currentColor";

  if (isFolder) {
    // 선택된 폴더는 특별한 스타일 없음 (필요시 추가)
    return (
      <li key={node.id}>
        <div
          className={`${commonClasses}`}
          style={indentStyle}
          onClick={() => toggleFolder(node.id)}
        >
          {/* 폴더 아이콘: 항상 muted 색상 사용 */}
          {isExpanded ? (
            <FolderOpenOutline
              color={iconColor} // CSS 변수 직접 전달
              height="16px"
              width="16px"
              cssClasses="mr-1 ml-1 flex-shrink-0"
            />
          ) : (
            <FolderOutline
              color={iconColor} // CSS 변수 직접 전달
              height="16px"
              width="16px"
              cssClasses="mr-1 ml-1 flex-shrink-0"
            />
          )}
          {/* 폴더 텍스트: 기본 색상 상속 */}
          <span className="truncate">{node.name}</span>
        </div>
        {/* 자식 노드 렌더링 */}
        {isExpanded && node.children && node.children.length > 0 && (
          <ul className="pl-0">
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
          href={`/?note=${node.id}`}
          // 선택 시 배경/텍스트 색상 적용됨 (currentFileClasses)
          className={`${commonClasses} ${currentFileClasses}`}
          style={indentStyle}
        >
          {/* 파일 아이콘: 선택 시 currentColor, 아닐 시 iconColor */}
          <DocumentTextOutline
            color={isCurrentFile ? currentIconColor : iconColor} // 조건부 색상 적용
            height="16px"
            width="16px"
            cssClasses="mr-1 ml-1 flex-shrink-0"
          />
          {/* 텍스트: Link 클래스에 의해 색상 결정됨 */}
          <span className="truncate">{node.name}</span>
        </Link>
      </li>
    );
  }
};

// 메인 LeftSidebar 컴포넌트 (로직은 이전 최종본과 동일하게 유지)
const LeftSidebar: React.FC<LeftSidebarProps> = ({
  treeData = [],
  currentNodeId,
}) => {
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const renderThemeIcon = () => {
    if (!mounted) return <div className="w-[18px] h-[18px]" />;
    if (resolvedTheme === "dark") {
      return <Moon color={"#FDB813"} height="18px" width="18px" />;
    } else {
      return <Sunny color={"#FACC15"} height="18px" width="18px" />;
    }
  };

  // Grid 아이콘 색상 결정 (CSS 변수 직접 사용)
  const gridIconColor = mounted ? "var(--foreground-muted)" : "transparent";

  return (
    // 기본 배경/텍스트 색상 적용 (트랜지션은 필요시 여기에 추가)
    <div className="p-4 bg-[var(--card-background)] h-full flex flex-col text-[var(--foreground)] transition-colors duration-150 ease-in-out">
      {/* 제목 (트랜지션 추가) */}
      <h2 className="text-xl font-bold mb-4 transition-colors duration-150 ease-in-out">
        Jeseong&apos;s Notes
      </h2>
      {/* 검색창 (트랜지션 추가) */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search..."
          className="w-full p-2 pr-10 border border-[var(--border-color)] rounded bg-[var(--card-background)] text-sm text-[var(--foreground)] focus:ring-sky-500 focus:border-sky-500 transition-colors duration-150 ease-in-out"
        />
        {/* 검색 아이콘: color prop에 CSS 변수 직접 전달 */}
        <SearchOutline
          color="var(--foreground-muted)"
          height="18px"
          width="18px"
          cssClasses="absolute right-3 top-1/2 transform -translate-y-1/2"
        />
      </div>
      {/* 컨트롤 버튼 영역 */}
      <div className="flex items-center justify-between mb-4">
        {/* 다크 모드 토글 버튼 (트랜지션 추가) */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors duration-150 ease-in-out"
          title="Toggle Dark Mode"
        >
          {renderThemeIcon()}
        </button>

        {/* 오른쪽 패널 토글 버튼 (트랜지션 추가) */}
        <button
          onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors duration-150 ease-in-out"
          title="Toggle Right Panel (dummy)"
        >
          {/* Grid 아이콘: color prop에 CSS 변수 직접 전달 */}
          <GridOutline color={gridIconColor} height="18px" width="18px" />
        </button>
      </div>

      {/* 탐색기 (Explorer) */}
      <div className="overflow-y-auto flex-grow">
        {/* 스티키 헤더 (트랜지션 추가) */}
        <h3 className="text-lg font-semibold mb-2 sticky top-0 bg-[var(--card-background)] py-1 z-10 transition-colors duration-150 ease-in-out">
          Explorer
        </h3>
        <ul className="text-sm space-y-1">
          {/* TreeItem 렌더링 (내부적으로 transition 및 색상 로직 적용됨) */}
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

      {/* Footer 공간 (트랜지션 추가) */}
      <div className="mt-auto pt-2 text-xs text-[var(--foreground-muted)] border-t border-[var(--border-color)] transition-colors duration-150 ease-in-out">
        {/* Footer 내용 */}
      </div>
    </div>
  );
};

export default LeftSidebar;
