// components/HomePageClient.tsx
"use client";

import React, { useState, useEffect } from "react"; // useEffect는 현재 직접 사용되지 않지만, 향후 필요할 수 있어 유지
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

// HomePageClient props 타입 정의
interface HomePageClientProps {
  initialNodes: { id: string; label: string }[];
  initialEdges: { id: string; source: string; target: string }[];
  title: string;
  markdownContent: string;
  requestedNoteId: string;
  treeData: TreeNode[];
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
}: HomePageClientProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const wikiLinkOptions = {
    hrefTemplate: (permalink: string) => {
      const slug = filenameToSlug(permalink);
      return `/?note=${slug}`;
    },
    wikiLinkClassName: "internal-link",
    aliasDivider: "|", // 명시적으로 구분자 지정 (기본값이지만 확인차)
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
        <LeftSidebar treeData={treeData} currentNodeId={requestedNoteId} />
        <button
          onClick={toggleMobileSidebar}
          className="mt-auto p-2 w-full text-left bg-[var(--accent-default)] hover:bg-[var(--accent-selected)] text-[var(--foreground)] dark:text-[var(--foreground)] rounded transition-colors duration-150 ease-in-out"
        >
          Close
        </button>
      </div>

      {/* md, lg 화면: 고정된 사이드바 */}
      <div className="hidden md:flex md:flex-col md:w-64 h-full border-r border-[var(--border-color)] bg-[var(--card-background)] overflow-y-auto flex-shrink-0 transition-colors duration-150 ease-in-out">
        <LeftSidebar treeData={treeData} currentNodeId={requestedNoteId} />
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
        <div className="hidden lg:flex lg:flex-col lg:w-1/3 p-4 border-[var(--border-color)] bg-[var(--card-background)] transition-colors duration-150 ease-in-out">
          {/* 안쪽 박스에 relative 추가 및 flex-col로 내부 요소 정렬, 둥근 모서리 */}
          <div className="relative flex-grow p-3 border border-[var(--border-color)] flex flex-col">
            <div className="flex justify-between items-center mb-2 flex-shrink-0">
              {" "}
              {/* 타이틀과 아이콘이 줄어들지 않도록 */}
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Knowledge Tree
              </h2>
              <button
                onClick={() =>
                  console.log("Graph expand icon clicked (modal TBD)")
                }
                className="p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)] rounded-md" // 둥근 모서리 추가
                aria-label="Expand Knowledge Tree"
              >
                <ScanOutline color="currentColor" height="20px" width="20px" />
              </button>
            </div>
            {/* NoteGraph를 포함할 내부 div, 높이 조절 */}
            <div className="flex-grow w-full min-h-0 overflow-hidden rounded-md">
              {" "}
              {/* 그래프 컨테이너도 둥근 모서리 및 overflow-hidden */}
              {/* 예시: lg에서 고정 높이, xl에서 다른 높이. 필요에 맞게 조절 */}
              <div className="w-full h-[300px] sm:h-[350px] md:h-[400px] lg:h-[400px]">
                {" "}
                {/* 타이틀 영역 높이(h2+mb-2)를 제외한 나머지 채우기 시도 */}
                <NoteGraph
                  initialNodes={initialNodes}
                  initialEdges={initialEdges}
                  currentNodeId={requestedNoteId}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
