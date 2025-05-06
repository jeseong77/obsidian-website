// components/LeftSidebar.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link"; // 페이지 이동을 위해 next/link 임포트
import {
  SearchOutline,
  SunnyOutline,
  MoonOutline,
  GridOutline,
  FolderOutline,
  FolderOpenOutline,
  DocumentTextOutline,
} from "react-ionicons";

// TreeNode 타입을 여기서 다시 정의하거나, page.tsx에서 export한 것을 import
interface TreeNode {
  id: string;
  name: string;
  type: "folder" | "file";
  children?: TreeNode[];
  depth: number;
}

// LeftSidebar가 받을 Props 타입 정의
interface LeftSidebarProps {
  treeData: TreeNode[]; // 트리 구조 데이터
  currentNodeId: string;
}

// 트리의 각 항목(폴더 또는 파일)을 렌더링하는 재귀 컴포넌트
const TreeItem: React.FC<{
  node: TreeNode;
  currentNodeId: string;
  expandedFolders: Set<string>;
  toggleFolder: (id: string) => void;
}> = ({ node, currentNodeId, expandedFolders, toggleFolder }) => {
  const isFolder = node.type === "folder";
  const isExpanded = isFolder && expandedFolders.has(node.id);
  const isCurrent = node.type === "file" && node.id === currentNodeId;

  // 들여쓰기 스타일 계산
  const indentStyle = { paddingLeft: `${node.depth * 1}rem` }; // 깊이 * 1rem

  if (isFolder) {
    return (
      <li key={node.id}>
        <div
          className={`flex items-center p-1 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700`}
          style={indentStyle}
          onClick={() => toggleFolder(node.id)} // 폴더 클릭 시 토글 함수 호출
        >
          {isExpanded ? (
            <FolderOpenOutline
              color={"#888"}
              height="16px"
              width="16px"
              cssClasses="mr-1 flex-shrink-0"
            />
          ) : (
            <FolderOutline
              color={"#888"}
              height="16px"
              width="16px"
              cssClasses="mr-1 flex-shrink-0"
            />
          )}
          <span className="truncate">{node.name}</span>
        </div>
        {/* 폴더가 확장되었고 자식이 있으면 자식 노드들을 재귀적으로 렌더링 */}
        {isExpanded && node.children && node.children.length > 0 && (
          <ul className="pl-0">
            {" "}
            {/* 추가 들여쓰기는 TreeItem 내부에서 처리 */}
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
          className={`flex items-center p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
            isCurrent ? "font-bold bg-gray-200 dark:bg-gray-600" : ""
          }`}
          style={indentStyle}
        >
          <DocumentTextOutline
            color={"#888"}
            height="16px"
            width="16px"
            cssClasses="mr-1 flex-shrink-0"
          />
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  // 열린 폴더들의 ID를 저장하는 Set 상태
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  // 폴더 ID를 받아서 expandedFolders 상태를 토글하는 함수
  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId); // 이미 열려있으면 닫기
      } else {
        newSet.add(folderId); // 닫혀있으면 열기
      }
      return newSet;
    });
  };

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 h-full flex flex-col text-gray-800 dark:text-gray-200">
      {/* ... (제목, 검색, 컨트롤 버튼 부분은 이전과 동일) ... */}
      <h2 className="text-xl font-bold mb-4">Jeseong&apos;s Notes</h2>
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search..."
          className="w-full p-2 pr-10 border rounded bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
        />
        <SearchOutline
          color={"#888"}
          height="18px"
          width="18px"
          cssClasses="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
      </div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="Toggle Dark Mode (dummy)"
        >
          {isDarkMode ? (
            <SunnyOutline color={"#cbd5e1"} height="18px" width="18px" />
          ) : (
            <MoonOutline color={"#4b5563"} height="18px" width="18px" />
          )}
        </button>
        <button
          onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="Toggle Right Panel (dummy)"
        >
          <GridOutline
            color={isDarkMode ? "#cbd5e1" : "#4b5563"}
            height="18px"
            width="18px"
          />
        </button>
      </div>

      {/* 탐색기 (Explorer) - 트리 뷰 렌더링 */}
      <div className="overflow-y-auto flex-grow">
        {" "}
        {/* 스크롤 추가 */}
        <h3 className="text-lg font-semibold mb-2 sticky top-0 bg-gray-100 dark:bg-gray-800 py-1">
          Explorer
        </h3>
        <ul className="text-sm space-y-1">
          {/* treeData를 순회하며 TreeItem 컴포넌트 렌더링 */}
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
      <div className="mt-auto pt-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-300 dark:border-gray-700">
        {/* 추가 정보 */}
      </div>
    </div>
  );
};

export default LeftSidebar;
