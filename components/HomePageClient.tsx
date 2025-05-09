// components/HomePageClient.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react"; // useEffect는 현재 직접 사용되지 않지만, 향후 필요할 수 있어 유지
import AppBar from "./AppBar";
import LeftSidebar from "./LeftSidebar";
import NoteGraph from "./NoteGraph";
import type { TreeNode } from "../lib/utils"; // 경로를 lib/utils.ts로 가정

// react-markdown 및 플러그인 임포트
import ReactMarkdown, { type Components } from "react-markdown";
import Link from "next/link";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import remarkWikiLink from "remark-wiki-link";

// react-syntax-highlighter 및 스타일 임포트
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { CSSProperties } from "react";
import { filenameToSlug } from "../lib/utils"; // 경로를 lib/utils.ts로 가정

// 아이콘 임포트 (예시, 실제 사용하는 아이콘 라이브러리 및 아이콘으로 교체)
import { ScanOutline } from "react-ionicons"; // 또는 Expand, Maximize 등
import type { ProcessedNode } from "../lib/notes-processor";

// HomePageClient props 타입 정의
interface HomePageClientProps {
  initialNodes: { id: string; label: string }[];
  initialEdges: { id: string; source: string; target: string }[];
  title: string;
  markdownContent: string;
  requestedNoteId: string;
  treeData: TreeNode[];
  notesMapByFullPathSlug: Map<string, ProcessedNode> | null; // 타입 추가
  notesMapBySimpleSlug: Map<string, Set<string>> | null;
}

// code 렌더러의 props 타입을 위한 인터페이스
interface CustomCodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export default function HomePageClient({
  initialNodes,
  initialEdges,
  title,
  markdownContent,
  requestedNoteId,
  treeData,
  notesMapByFullPathSlug,
  notesMapBySimpleSlug,
}: HomePageClientProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  // 오른쪽 패널 토글 함수
  const toggleRightPanel = useCallback(() => {
    setIsRightPanelOpen((prev) => !prev);
  }, []);

  const wikiLinkOptions = {
    pageResolver: (name: string) => {
      // name은 [[링크 대상]] 안의 텍스트입니다. 예: "Kernel", "Operating Systems/Kernel"
      // 1. 입력된 name 자체를 .md 확장자 제거 후 슬러그화 (사용자가 경로 포함하여 입력했을 수도 있음)
      const permalinkAsSlug = filenameToSlug(name.replace(/\.md$/, ""));

      // 2. 전체 경로 슬러그 맵에서 직접 찾아봅니다.
      if (
        notesMapByFullPathSlug &&
        notesMapByFullPathSlug.has(permalinkAsSlug)
      ) {
        return [permalinkAsSlug]; // 정확히 일치하는 전체 경로 슬러그 반환
      }

      // 3. 단순 파일명 슬러그 맵에서 찾아봅니다. (사용자가 파일명만 입력한 경우)
      //    이때 permalinkAsSlug는 실제로는 단순 파일명 슬러그일 가능성이 높습니다.
      //    (예: 사용자가 [[Kernel]] 입력 -> name="Kernel" -> permalinkAsSlug="kernel")
      if (notesMapBySimpleSlug && notesMapBySimpleSlug.has(permalinkAsSlug)) {
        const possibleFullSlugs = notesMapBySimpleSlug.get(permalinkAsSlug);
        if (possibleFullSlugs && possibleFullSlugs.size > 0) {
          // 여러 개의 전체 경로가 매칭될 수 있습니다. (예: /notes/kernel, /projects/kernel)
          // remark-wiki-link는 배열의 첫 번째 것을 사용합니다.
          // TODO: 모호성 해결 로직을 추가할 수 있습니다 (예: 현재 페이지와 가장 가까운 경로 우선 등)
          //       지금은 첫 번째 것을 반환합니다.
          return Array.from(possibleFullSlugs);
        }
      }

      // 4. 위에서 찾지 못했다면, 입력된 permalinkAsSlug를 그대로 사용 (최후의 수단)
      return [permalinkAsSlug];
    },
    hrefTemplate: (resolvedPermalink: string) => {
      // pageResolver가 반환한 (잠재적으로 전체 경로가 포함된) 슬러그를 사용합니다.
      return `/?note=${resolvedPermalink}`;
    },
    wikiLinkClassName: "internal-link",
    aliasDivider: "|",
  };

  const customMarkdownComponents: Components = {
    code({ node, inline, className, children, ...props }: CustomCodeProps) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={materialDark as any}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    a: ({ node, children, href, ...props }) => {
      if (href && href.startsWith("/?note=")) {
        const { className: anchorClassName, ...restProps } = props;
        return (
          <Link
            href={href}
            {...restProps}
            className={`internal-link ${anchorClassName || ""}`}
          >
            {children}
          </Link>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    },
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full max-w-screen-xl mx-auto bg-[var(--background)] transition-colors duration-150 ease-in-out">
      {/* AppBar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50">
        <AppBar siteTitle="Jeseong's" onToggleSidebar={toggleMobileSidebar} />
      </div>

      {/* 모바일용 Left Sidebar */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={toggleMobileSidebar}
          aria-hidden="true"
        ></div>
      )}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-[var(--card-background)] shadow-xl p-4 z-40
                   transform transition-transform ease-in-out duration-300 md:hidden
                   ${
                     isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
                   }`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <LeftSidebar
          treeData={treeData}
          currentNodeId={requestedNoteId}
          onToggleRightPanel={toggleRightPanel} // 핸들러 전달
        />
        <button
          onClick={toggleMobileSidebar}
          className="mt-auto p-2 w-full text-left bg-[var(--accent-default)] hover:bg-[var(--accent-selected)] text-[var(--foreground)] dark:text-[var(--foreground)] rounded transition-colors duration-150 ease-in-out"
        >
          Close
        </button>
      </div>

      {/* md, lg 화면: 고정된 사이드바 */}
      <div className="hidden md:flex md:flex-col md:w-64 h-full border-r border-[var(--border-color)] bg-[var(--card-background)] overflow-y-auto flex-shrink-0 transition-colors duration-150 ease-in-out">
        <LeftSidebar
          treeData={treeData}
          currentNodeId={requestedNoteId}
          onToggleRightPanel={toggleRightPanel} // 핸들러 전달
        />
      </div>

      {/* Main Content Area (MD 파일 내용 + 그래프) */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto pt-16 md:pt-0">
        {/* 중앙 콘텐츠 영역 (MD 파일) */}
        <div className="p-6 bg-[var(--card-background)] text-[var(--foreground)] lg:flex-1 lg:overflow-y-auto transition-colors duration-150 ease-in-out">
          <h1 className="text-3xl font-bold mb-4 text-[var(--foreground)] transition-colors duration-150 ease-in-out">
            {title || requestedNoteId}
          </h1>
          <div className="prose dark:prose-invert max-w-none">
            {markdownContent ? (
              <ReactMarkdown
                remarkPlugins={[
                  remarkGfm,
                  remarkBreaks,
                  [remarkWikiLink, wikiLinkOptions],
                ]}
                rehypePlugins={[rehypeRaw]}
                components={customMarkdownComponents}
              >
                {markdownContent}
              </ReactMarkdown>
            ) : (
              <p className="text-[var(--foreground-muted)] transition-colors duration-150 ease-in-out">
                Note <span className="font-semibold">{requestedNoteId}</span>{" "}
                not found or content is empty.
              </p>
            )}
          </div>
        </div>

        {/* 그래프 영역 - sm, md 화면에서 MD 파일 아래에 표시 (lg에서는 숨김) */}
        <div className="w-full p-3 border-t border-[var(--border-color)] bg-[var(--card-background)] transition-colors duration-150 ease-in-out lg:hidden">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2 px-1">
            Knowledge Graph
          </h2>
          <div className="w-full h-64 md:h-80 rounded-md border border-[var(--border-color)] overflow-hidden">
            {" "}
            {/* overflow-hidden 추가 */}
            <NoteGraph
              initialNodes={initialNodes}
              initialEdges={initialEdges}
              currentNodeId={requestedNoteId}
            />
          </div>
        </div>

        {/* 오른쪽 "Knowledge Tree" 영역 (lg 화면에서만 표시) */}
        {isRightPanelOpen && (
          <div
            className={
              "hidden lg:flex lg:flex-col lg:w-1/3 p-4 border-l border-[var(--border-color)] bg-[var(--card-background)]"
            } // ✨ 전체 패널의 왼쪽 경계선 유지, 패딩(p-4) 유지
            // 애니메이션 관련 클래스는 일단 제거 (필요시 나중에 추가)
          >
            {/* 🌟 "Knowledge Tree" 영역 전체를 감싸는 내부 카드 스타일 (이곳에 border 적용) */}
            <div className="relative flex-grow flex flex-col rounded-md ">
              {" "}
              {/* ✨ 여기에 메인 내부 카드 경계선 */}
              {/* 헤더: 제목과 버튼 - 패딩으로 내부 여백 조정 */}
              <div className="flex justify-between items-center p-3 mb-2 flex-shrink-0">
                {" "}
                {/* ✨ 헤더 내부 패딩 */}
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  Knowledge Tree
                </h2>
                <button
                  onClick={() => {
                    console.log(
                      "Knowledge Tree 내부의 Scan 아이콘 클릭됨 - 기능 정의 필요"
                    );
                  }}
                  className="p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)] rounded-md"
                  aria-label="Expand Knowledge Tree"
                >
                  <ScanOutline
                    color="currentColor"
                    height="20px"
                    width="20px"
                  />
                </button>
              </div>
              {/* NoteGraph를 포함할 내용 영역 - 패딩으로 내부 여백 조정, 자체 border는 제거 */}
              <div className="flex-grow w-full min-h-0 overflow-hidden rounded-b-md p-3 pt-0">
                {" "}
                {/* ✨ 내용 영역 패딩 (pt-0으로 위쪽 패딩은 헤더 mb로 대체), 둥근 모서리 하단만 적용 */}
                {/* rounded-md는 이미 부모 div에 있으므로 여기서는 rounded-b-md만 필요할 수 있음 */}
                <div className="w-full h-full">
                  <NoteGraph
                    initialNodes={initialNodes}
                    initialEdges={initialEdges}
                    currentNodeId={requestedNoteId}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {/* 오른쪽 "Knowledge Tree" 영역 끝 */}
      </main>
    </div>
  );
}
// HomePageClient.tsx
