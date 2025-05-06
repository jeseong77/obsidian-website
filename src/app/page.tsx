// app/page.tsx
// "TreeNode" 인터페이스는 여기서 export 하거나, 별도의 types.ts 파일로 분리하여 양쪽에서 임포트할 수 있습니다.
// 여기서는 HomePageClient에서 '../app/page'로 임포트한다고 가정합니다.
// 또는, HomePageClientProps와 함께 HomePageClient.tsx 파일로 옮길 수도 있습니다.
export interface TreeNode {
  id: string;
  name: string;
  type: "folder" | "file";
  children?: TreeNode[];
  depth: number;
}

import HomePageClient from "../../components/HomePageClient"; // 경로 주의: 실제 프로젝트 구조에 맞게 수정
import { getGraphData, getNoteContent } from "../../lib/notes";

// 파일 목록을 트리 구조로 변환하는 함수 (이전과 동일, 여기에 두거나 lib/notes 등으로 옮길 수 있음)
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

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePageWrapper({
  searchParams: searchParamsPromise,
}: PageProps) {
  const searchParams = await searchParamsPromise;
  const { nodes: initialNodes, edges: initialEdges } = await getGraphData();
  const requestedNoteId = (searchParams?.note as string) || "Jeseong";
  const currentNote = await getNoteContent(requestedNoteId);
  const treeData = buildFileTree(initialNodes);

  return (
    <HomePageClient
      initialNodes={initialNodes}
      initialEdges={initialEdges}
      currentNote={currentNote}
      requestedNoteId={requestedNoteId}
      treeData={treeData}
    />
  );
}
