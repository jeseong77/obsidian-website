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
  const map = new Map<string, TreeNode>();

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
          depth: i,
        };
        if (nodeType === "folder") {
          newNode.children = [];
        }
        map.set(currentPath, newNode);

        if (i > 0) {
          const parentPath = parts.slice(0, i).join("/");
          const parentNode = map.get(parentPath);
          if (parentNode && parentNode.type === "folder") {
            parentNode.children!.push(newNode);
          }
        } else {
          tree.push(newNode);
        }
      }
    }
  });

  const sortTree = (nodesToSort: TreeNode[]) => {
    nodesToSort.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    nodesToSort.forEach((node) => {
      if (node.type === "folder" && node.children) {
        sortTree(node.children);
      }
    });
  };

  sortTree(tree);
  return tree;
}

// 페이지 컴포넌트의 props 타입을 명시적으로 정의합니다.
// 오류 메시지에서 언급된 'PageProps' 이름을 사용하고, searchParams 타입을 정확하게 지정합니다.
interface PageProps {
  // app/page.tsx (루트 페이지)는 동적 라우트 매개변수(params)를 기본적으로 받지 않습니다.
  // 만약 필요하다면 params: { [key: string]: string | string[] | undefined }; 등을 추가할 수 있습니다.
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function HomePage({ searchParams }: PageProps) {
  // 정의된 PageProps 타입 사용
  const { nodes: initialNodes, edges: initialEdges } = await getGraphData();
  const requestedNoteId = (searchParams?.note as string) || "Jeseong";
  const currentNote = await getNoteContent(requestedNoteId);
  const treeData = buildFileTree(initialNodes);

  return (
    <main className="flex h-screen w-full">
      <div className="w-64 h-full border-r border-gray-300 overflow-y-auto flex-shrink-0 bg-gray-50 dark:bg-gray-800">
        <LeftSidebar treeData={treeData} currentNodeId={requestedNoteId} />
      </div>

      <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
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
          <p>Note {requestedNoteId} not found.</p>
        )}
      </div>

      <div className="w-1/3 border-l border-gray-300 h-full flex-shrink-0">
        <NoteGraph
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          currentNodeId={requestedNoteId}
        />
      </div>
    </main>
  );
}
