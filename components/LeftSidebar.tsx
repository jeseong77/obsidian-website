// components/LeftSidebar.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  SearchOutline,
  Sunny,
  Moon,
  GridOutline,
  FolderOutline,
  FolderOpenOutline,
  DocumentTextOutline,
} from "react-ionicons";

import type { TreeNode } from "../lib/utils";

interface LeftSidebarProps {
  treeData: TreeNode[];
  currentNodeId: string;
  onToggleRightPanel: () => void; // Prop 추가
}

const TreeItem: React.FC<{
  node: TreeNode;
  currentNodeId: string;
  expandedFolders: Set<string>;
  toggleFolder: (id: string) => void;
}> = ({ node, currentNodeId, expandedFolders, toggleFolder }) => {
  const isFolder = node.type === "folder";
  const isExpanded = isFolder && expandedFolders.has(node.id);
  const isCurrentFile = node.type === "file" && node.id === currentNodeId;
  const textColorClass = "text-[var(--accent-selected-foreground)]";

  const indentStyle = { paddingLeft: `${node.depth * 1}rem` };

  const commonClasses = `flex items-center px-2 py-1 rounded transition-colors duration-150 ease-in-out
                         hover:bg-[var(--accent-default)] hover:text-[var(--accent-selected-foreground)]
                         dark:hover:bg-[var(--accent-default)] dark:hover:text-[var(--accent-selected-foreground)]`;

  const activeItemClasses = `font-bold bg-[var(--accent-selected)] text-[var(--accent-selected-foreground)]`;

  const iconColor = "var(--foreground-muted)";
  const currentIconColor = "currentColor";

  if (isFolder) {
    const isCurrentFolderRepresentativeActive = node.id === currentNodeId;

    return (
      <li key={node.id}>
        <div
          className={`${commonClasses} ${
            isCurrentFolderRepresentativeActive ? activeItemClasses : ""
          }`}
          style={indentStyle}
        >
          {/* 확장/축소 아이콘 - 클릭 시 토글 */}
          <span
            onClick={(e) => {
              e.stopPropagation(); // Link 클릭 이벤트 전파 방지
              toggleFolder(node.id);
            }}
            className="cursor-pointer mx-1 p-1 -ml-1" // 클릭 영역 확보 및 마진 조정
          >
            {isExpanded ? (
              <FolderOpenOutline
                color={
                  isCurrentFolderRepresentativeActive
                    ? currentIconColor
                    : iconColor
                }
                height="16px"
                width="16px"
                cssClasses="flex-shrink-0 mx-1"
              />
            ) : (
              <FolderOutline
                color={
                  isCurrentFolderRepresentativeActive
                    ? currentIconColor
                    : iconColor
                }
                height="16px"
                width="16px"
                cssClasses="flex-shrink-0 mx-1"
              />
            )}
          </span>

          {/* 폴더 이름 - 클릭 시 대표 노트로 이동 */}
          {/* Link 컴포넌트는 자체적으로 cursor-pointer를 가질 수 있으므로 div의 onClick은 제거 */}
          <Link
            href={`/?note=${node.id}`}
            className={`truncate flex-grow ${
              isCurrentFolderRepresentativeActive ? "" : "cursor-pointer"
            } ${!isCurrentFolderRepresentativeActive ? textColorClass : ""}`}
            onClick={(e) => {
              // 만약 Link 클릭 시 폴더 토글도 원한다면 여기에 로직 추가 가능, 하지만 보통은 분리
              // toggleFolder(node.id); // 필요하다면 추가
            }}
          >
            {node.name}
          </Link>
        </div>
        {/* 자식 노드 렌더링 */}
        {isExpanded && node.children && node.children.length > 0 && (
          <ul className="pl-0">
            {node.children.map((child) => (
              <TreeItem
                key={child.id} // 자식 노드의 key도 고유해야 함
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
          className={`${commonClasses} ${
            isCurrentFile ? activeItemClasses : textColorClass
          }`}
          style={indentStyle}
        >
          <DocumentTextOutline
            color={isCurrentFile ? currentIconColor : iconColor}
            height="16px"
            width="16px"
            cssClasses="mx-1 flex-shrink-0"
          />
          <span className="truncate">{node.name}</span>
        </Link>
      </li>
    );
  }
};

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  treeData = [],
  currentNodeId,
  onToggleRightPanel,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // const [isRightPanelOpen, setIsRightPanelOpen] = useState(true); // 현재 미사용으로 주석 처리 또는 제거 가능

  useEffect(
    () => {
      setMounted(true);
      // 초기 로드 시 현재 노트의 모든 상위 폴더를 펼치는 로직 (선택 사항)
      // if (currentNodeId) {
      //   const parts = currentNodeId.split('/');
      //   const pathsToExpand = new Set<string>();
      //   let currentPath = '';
      //   for (let i = 0; i < parts.length - 1; i++) { // 마지막 파일 이름은 제외
      //     currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
      //     pathsToExpand.add(currentPath);
      //   }
      //   setExpandedFolders(pathsToExpand);
      // }
    },
    [
      /* currentNodeId */
    ]
  ); // currentNodeId 변경 시 상위 폴더 자동 펼침을 원하면 주석 해제

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
    return resolvedTheme === "light" ? (
      <Sunny color={"#FACC15"} height="18px" width="18px" />
    ) : (
      <Moon color={"#FDB813"} height="18px" width="18px" />
    );
  };

  const gridIconColor = mounted ? "var(--foreground-muted)" : "transparent";

  return (
    <div className="p-4 bg-[var(--card-background)] h-full flex flex-col text-[var(--foreground)] transition-colors duration-150 ease-in-out">
      <h2 className="text-xl font-bold mb-4 transition-colors duration-150 ease-in-out">
        Jeseong&apos;s
      </h2>
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
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors duration-150 ease-in-out"
          title="Toggle Dark Mode"
        >
          {renderThemeIcon()}
        </button>
        <button
          onClick={onToggleRightPanel} // 전달받은 핸들러 호출
          className="p-2 hover:bg-[var(--accent-default)] dark:hover:bg-[var(--dark-button-icon-hover-bg,var(--accent-default))] rounded transition-colors duration-150 ease-in-out"
          title="Toggle Right Panel"
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
              key={node.id} // 폴더와 파일이 같은 id를 가질 수 없으므로 node.id로 충분
              node={node}
              currentNodeId={currentNodeId}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
            />
          ))}
        </ul>
      </div>
      <div className="mt-auto pt-2 text-xs text-[var(--foreground-muted)] border-t border-[var(--border-color)] transition-colors duration-150 ease-in-out">
        {/* Footer */}
      </div>
    </div>
  );
};

export default LeftSidebar;
// components/LeftSidebar.tsx
