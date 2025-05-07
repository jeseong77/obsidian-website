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
// 예시: import type { TreeNode } from "../../lib/utils";
// 또는 import type { TreeNode } from "@/types";
// 우선은 이전처럼 @/app/page를 사용하되, 공유 파일로 옮기는 것을 권장합니다.
import type { TreeNode } from "../lib/utils";

// LeftSidebar Props 타입 정의 (TreeNode는 이제 임포트된 타입을 사용)
interface LeftSidebarProps {
  treeData: TreeNode[];
  currentNodeId: string;
}

// TreeItem 컴포넌트
const TreeItem: React.FC<{
  node: TreeNode; // 임포트된 TreeNode 타입 사용
  currentNodeId: string;
  expandedFolders: Set<string>;
  toggleFolder: (id: string) => void;
}> = ({ node, currentNodeId, expandedFolders, toggleFolder }) => {
  const isFolder = node.type === "folder";
  const isExpanded = isFolder && expandedFolders.has(node.id);
  const isCurrentFile = node.type === "file" && node.id === currentNodeId;
  const indentStyle = { paddingLeft: `${node.depth * 1}rem` };

  // 👇 commonClasses 패딩 수정: p-1 -> px-2 py-1 (요청하신 여백 조정)
  const commonClasses = `flex items-center px-2 py-1 rounded cursor-pointer 
                         hover:bg-[var(--accent-default)] hover:text-[var(--foreground)] 
                         dark:hover:bg-[var(--accent-default)] dark:hover:text-[var(--foreground)]`;

  // 선택된 파일 스타일: 라이트/다크 모두 대비 높은 텍스트 색상 적용 (제공해주신 코드와 동일)
  const currentFileClasses = isCurrentFile
    ? `font-bold bg-[var(--accent-selected)] text-[var(--color-light-text)] dark:text-[var(--color-dark-navy)]`
    : "";

  const iconColor = "var(--foreground-muted)";
  const currentIconColor = "currentColor";

  if (isFolder) {
    return (
      <li key={node.id}>
        <div
          className={`${commonClasses}`}
          style={indentStyle}
          onClick={() => toggleFolder(node.id)}
        >
          {isExpanded ? (
            <FolderOpenOutline
              color={iconColor}
              height="16px"
              width="16px"
              cssClasses="mr-1 ml-1 flex-shrink-0" // 제공해주신 코드와 동일
            />
          ) : (
            <FolderOutline
              color={iconColor}
              height="16px"
              width="16px"
              cssClasses="mr-1 ml-1 flex-shrink-0" // 제공해주신 코드와 동일
            />
          )}
          <span className="truncate">{node.name}</span>
        </div>
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
          className={`${commonClasses} ${currentFileClasses}`}
          style={indentStyle}
        >
          <DocumentTextOutline
            color={isCurrentFile ? currentIconColor : iconColor}
            height="16px"
            width="16px"
            cssClasses="mr-1 ml-1 flex-shrink-0" // 제공해주신 코드와 동일
          />
          <span className="truncate">{node.name}</span>
        </Link>
      </li>
    );
  }
};

// 메인 LeftSidebar 컴포넌트 (제공해주신 코드와 동일)
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

  const gridIconColor = mounted ? "var(--foreground-muted)" : "transparent";

  return (
    <div className="p-4 bg-[var(--card-background)] h-full flex flex-col text-[var(--foreground)] transition-colors duration-150 ease-in-out">
      <h2 className="text-xl font-bold mb-4 transition-colors duration-150 ease-in-out">
        Jeseong&apos;s Notes
      </h2>
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search..."
          className="w-full p-2 pr-10 border border-[var(--border-color)] rounded bg-[var(--card-background)] text-sm text-[var(--foreground)] focus:ring-sky-500 focus:border-sky-500 transition-colors duration-150 ease-in-out"
        />
        <SearchOutline
          color="var(--foreground-muted)"
          height="18px"
          width="18px"
          cssClasses="absolute right-3 top-1/2 transform -translate-y-1/2"
        />
      </div>
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
      <div className="overflow-y-auto flex-grow">
        <h3 className="text-lg font-semibold mb-2 sticky top-0 bg-[var(--card-background)] py-1 z-10 transition-colors duration-150 ease-in-out">
          Explorer
        </h3>
        <ul className="text-sm space-y-1">
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
      <div className="mt-auto pt-2 text-xs text-[var(--foreground-muted)] border-t border-[var(--border-color)] transition-colors duration-150 ease-in-out">
        {/* Footer 내용 */}
      </div>
    </div>
  );
};

export default LeftSidebar;
