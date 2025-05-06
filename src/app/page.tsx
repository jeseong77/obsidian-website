// app/page.tsx
import NoteGraph from "../../components/NoteGraph"; // 경로 수정 (@/ 사용)
import LeftSidebar from "../../components/LeftSidebar"; // 경로 수정 (@/ 사용)
import { getGraphData, getNoteContent } from "../../lib/notes"; // 경로 수정 (@/ 사용)
// import path from "path";

// 트리 노드 타입을 정의합니다 (LeftSidebar에서도 사용 가능하도록 export 하거나 공유 타입 파일로 분리)
export interface TreeNode {
  id: string; // 전체 경로 ID (예: 'folder/file')
  name: string; // 폴더 또는 파일 이름
  type: "folder" | "file";
  children?: TreeNode[]; // 폴더인 경우 하위 노드들
  depth: number; // 계층 깊이 (들여쓰기용)
}

// 파일 목록을 트리 구조로 변환하는 함수
function buildFileTree(nodes: { id: string; label: string }[]): TreeNode[] {
  const tree: TreeNode[] = [];
  // Map<경로, TreeNode> 형식으로 노드를 빠르게 찾기 위함
  const map = new Map<string, TreeNode>();

  // 먼저 모든 노드를 경로 기반으로 Map에 등록 (폴더 포함)
  nodes.forEach((node) => {
    const parts = node.id.split("/");
    let currentPath = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLastPart = i === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!map.has(currentPath)) {
        const nodeType = isLastPart ? "file" : "folder";
        const newNode: TreeNode = {
          id: currentPath,
          name: part,
          type: nodeType,
          depth: i, // 깊이 추가
        };
        if (nodeType === "folder") {
          newNode.children = []; // 폴더면 children 배열 초기화
        }
        map.set(currentPath, newNode);

        // 부모 노드 찾아서 children에 추가
        if (i > 0) {
          const parentPath = parts.slice(0, i).join("/");
          const parentNode = map.get(parentPath);
          if (parentNode && parentNode.type === "folder") {
            parentNode.children!.push(newNode); // ! 사용 (폴더는 항상 children 있음)
          }
        } else {
          // 최상위 노드는 tree 배열에 직접 추가
          tree.push(newNode);
        }
      }
    }
  });

  // 트리 정렬 함수 (폴더 우선, 이름순)
  const sortTree = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((node) => {
      if (node.type === "folder" && node.children) {
        sortTree(node.children);
      }
    });
  };

  sortTree(tree); // 최종 트리 정렬
  return tree;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { nodes: initialNodes, edges: initialEdges } = await getGraphData();
  const requestedNoteId = (searchParams?.note as string) || "Jeseong"; // Jeseong이 루트 파일이라고 가정
  const currentNote = await getNoteContent(requestedNoteId);

  // initialNodes를 트리 구조 데이터로 변환
  const treeData = buildFileTree(initialNodes);

  return (
    <main className="flex h-screen w-full">
      {/* 왼쪽 사이드바 */}
      <div className="w-64 h-full border-r border-gray-300 overflow-y-auto flex-shrink-0 bg-gray-50 dark:bg-gray-800">
        {/* LeftSidebar에 treeData와 현재 ID 전달 */}
        <LeftSidebar treeData={treeData} currentNodeId={requestedNoteId} />
      </div>

      {/* 중간 콘텐츠 영역 */}
      <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* ... 콘텐츠 렌더링 (변경 없음) ... */}
        {currentNote ? (
          <>
            <h1 className="text-3xl font-bold mb-4">
              {currentNote.title || requestedNoteId}
            </h1>
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: currentNote.contentHtml }}
            />
          </>
        ) : (
          <p>Note '{requestedNoteId}' not found.</p>
        )}
      </div>

      {/* 오른쪽 그래프 영역 */}
      <div className="w-1/3 border-l border-gray-300 h-full flex-shrink-0">
        <NoteGraph /* ... props 전달 (변경 없음) ... */
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          currentNodeId={requestedNoteId}
        />
      </div>
    </main>
  );
}
