// components/HomePageClient.tsx
"use client";

import React, { useState, useEffect } from "react";
import AppBar from "./AppBar";
import LeftSidebar from "./LeftSidebar";
import NoteGraph from "./NoteGraph";
import type { TreeNode } from "../lib/utils";

// react-markdown 및 플러그인 임포트
import ReactMarkdown, { type Components } from "react-markdown";
import Link from "next/link"; // Next.js Link 컴포넌트
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import remarkWikiLink from "remark-wiki-link";

// react-syntax-highlighter 및 스타일 임포트
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism"; // 또는 원하는 테마
import type { CSSProperties } from "react";
import { filenameToSlug } from "../lib/utils";

// HomePageClient props 타입 정의
interface HomePageClientProps {
  initialNodes: { id: string; label: string }[]; // 이 initialNodes의 id는 이미 정규화되어 있어야 함
  initialEdges: { id: string; source: string; target: string }[];
  title: string;
  markdownContent: string;
  requestedNoteId: string; // 이 ID도 정규화된 형태여야 함
  treeData: TreeNode[]; // 이 treeData의 id도 정규화된 형태여야 함
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

  // useEffect는 현재 mounted 상태 확인용으로는 직접 사용하지 않으므로 주석 처리
  // useEffect(() => {
  //   // setMounted(true); // AppBar, LeftSidebar 등 개별 컴포넌트에서 처리
  // }, []);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  // remark-wiki-link 옵션: permalink를 filenameToId로 변환하여 href 생성
  const wikiLinkOptions = {
    hrefTemplate: (permalink: string) => `/?note=${filenameToSlug(permalink)}`, // 정규화된 ID 사용
    wikiLinkClassName: "internal-link", // CSS 클래스
    // permalinkResolver: (name: string) => [filenameToId(name)], // 필요시 페이지 이름 변환 로직
  };

  // ReactMarkdown 커스텀 렌더러 정의
  const customMarkdownComponents: Components = {
    code({ node, inline, className, children, ...props }: CustomCodeProps) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={materialDark as any} // 타입 문제 임시 회피
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
      // remark-wiki-link가 hrefTemplate을 통해 이미 /?note=정규화된id 형태로 href를 생성
      if (href && href.startsWith("/?note=")) {
        // props에서 className을 분리하여 Link 컴포넌트에 전달
        const { className: anchorClassName, ...restProps } = props;
        return (
          <Link
            href={href} // 정규화된 ID가 포함된 href
            {...restProps} // 나머지 props (예: title) 전달
            // internal-link 클래스와 remark-wiki-link가 추가한 클래스(있다면) 모두 적용
            className={`internal-link ${anchorClassName || ""}`}
          >
            {children}
          </Link>
        );
      }
      // 외부 링크 또는 일반 마크다운 링크
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
        <AppBar
          siteTitle="Jeseong's Notes" // 또는 title prop 사용
          onToggleSidebar={toggleMobileSidebar}
        />
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
          닫기
        </button>
      </div>

      {/* md, lg 화면: 고정된 사이드바 */}
      <div className="hidden md:flex md:flex-col md:w-64 h-full border-r border-[var(--border-color)] bg-[var(--card-background)] overflow-y-auto flex-shrink-0 transition-colors duration-150 ease-in-out">
        <LeftSidebar treeData={treeData} currentNodeId={requestedNoteId} />
      </div>

      {/* Main Content Area (MD 파일 내용 + 그래프) */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto pt-16 md:pt-0">
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
                  [remarkWikiLink, wikiLinkOptions], // 수정된 wikiLinkOptions 전달
                ]}
                rehypePlugins={[
                  rehypeRaw, // HTML 처리용
                ]}
                components={customMarkdownComponents} // 커스텀 렌더러 적용
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

        <div className="w-full lg:w-1/3 p-2 border-t border-[var(--border-color)] lg:border-t-0 lg:border-l lg:h-full lg:flex-shrink-0 bg-[var(--card-background)] transition-colors duration-150 ease-in-out">
          <div className="w-full h-64 md:h-80 lg:h-full">
            <NoteGraph
              initialNodes={initialNodes}
              initialEdges={initialEdges}
              currentNodeId={requestedNoteId}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
