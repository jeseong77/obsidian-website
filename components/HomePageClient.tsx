// components/HomePageClient.tsx
"use client";

import React, { useState, useEffect } from "react"; // useEffect import 추가 (mounted 확인용)
import AppBar from "./AppBar";
import LeftSidebar from "./LeftSidebar";
import NoteGraph from "./NoteGraph";
import type { TreeNode } from "@/app/page"; // 경로 별칭 사용 확인

interface HomePageClientProps {
  initialNodes: { id: string; label: string }[];
  initialEdges: { id: string; source: string; target: string }[];
  currentNote: { title?: string; contentHtml: string } | null;
  requestedNoteId: string;
  treeData: TreeNode[];
}

export default function HomePageClient({
  initialNodes,
  initialEdges,
  currentNote,
  requestedNoteId,
  treeData,
}: HomePageClientProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // const [mounted, setMounted] = useState(false); // AppBar/LeftSidebar에서 관리하므로 여기선 불필요

  // useEffect(() => { // AppBar/LeftSidebar에서 관리하므로 여기선 불필요
  //   setMounted(true);
  // }, []);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    // 최상위 div: 최대 너비 제한, 중앙 정렬, 전역 배경색 및 트랜지션 적용
    <div className="flex flex-col md:flex-row h-screen w-full max-w-screen-xl mx-auto bg-[var(--background)] transition-colors duration-150 ease-in-out">
      {/* AppBar (sm 화면 전용) */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50">
        {/* AppBar는 자체적으로 테마 스타일 및 트랜지션을 가집니다 */}
        <AppBar
          siteTitle="Jeseong's Notes"
          onToggleSidebar={toggleMobileSidebar}
        />
      </div>

      {/* 모바일용 Left Sidebar */}
      {/* 오버레이 */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={toggleMobileSidebar}
          aria-hidden="true"
        ></div>
      )}
      {/* 사이드바 패널 */}
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
        {/* LeftSidebar 컴포넌트는 자체적으로 테마 스타일 및 트랜지션을 가집니다 */}
        <LeftSidebar treeData={treeData} currentNodeId={requestedNoteId} />
        {/* 닫기 버튼 스타일: CSS 변수 및 트랜지션 적용 */}
        <button
          onClick={toggleMobileSidebar}
          className="mt-auto p-2 w-full text-left bg-[var(--accent-default)] hover:bg-[var(--accent-selected)] text-[var(--foreground)] dark:text-[var(--foreground)] rounded transition-colors duration-150 ease-in-out"
        >
          닫기
        </button>
      </div>

      {/* md, lg 화면: 고정된 사이드바 */}
      {/* 배경색, 테두리색 변수 사용 및 트랜지션 적용 */}
      <div className="hidden md:flex md:flex-col md:w-64 h-full border-r border-[var(--border-color)] bg-[var(--card-background)] overflow-y-auto flex-shrink-0 transition-colors duration-150 ease-in-out">
        {/* LeftSidebar 컴포넌트는 자체적으로 테마 스타일 및 트랜지션을 가집니다 */}
        <LeftSidebar treeData={treeData} currentNodeId={requestedNoteId} />
      </div>

      {/* Main Content Area (MD 파일 내용 + 그래프) */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto pt-16 md:pt-0">
        {/* 중간 콘텐츠 영역 (MD 파일) */}
        {/* 배경색, 텍스트 색상 변수 사용 및 트랜지션 적용 */}
        <div className="p-6 bg-[var(--card-background)] text-[var(--foreground)] lg:flex-1 lg:overflow-y-auto transition-colors duration-150 ease-in-out">
          {currentNote ? (
            <>
              {/* 제목 색상 변수 사용 및 트랜지션 적용 */}
              <h1 className="text-3xl font-bold mb-4 text-[var(--foreground)] transition-colors duration-150 ease-in-out">
                {currentNote.title || requestedNoteId}
              </h1>
              {/* prose 스타일은 globals.css 오버라이드 및 Tailwind 플러그인이 처리 */}
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: currentNote.contentHtml }}
              />
            </>
          ) : (
            // 'Not found' 텍스트 색상 변수 사용 및 트랜지션 적용
            <p className="text-[var(--foreground-muted)] transition-colors duration-150 ease-in-out">
              Note {requestedNoteId} not found.
            </p>
          )}
        </div>

        {/* 그래프 영역 */}
        {/* 배경색, 테두리색 변수 사용 및 트랜지션 적용 */}
        <div className="w-full lg:w-1/3 p-2 border-t border-[var(--border-color)] lg:border-t-0 lg:border-l lg:h-full lg:flex-shrink-0 bg-[var(--card-background)] transition-colors duration-150 ease-in-out">
          <div className="w-full h-64 md:h-80 lg:h-full">
            {/* NoteGraph 컴포넌트는 자체적으로 테마 스타일 및 트랜지션을 가집니다 */}
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
