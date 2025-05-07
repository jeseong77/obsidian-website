// app/page.tsx
import HomePageClient from "../../components/HomePageClient";
import { 
  buildGraphDataForRender, 
  getAllNotesForTree,      
  getNoteContentBySlug,
} from "../../lib/notes-processor";
import { filenameToSlug, type TreeNode } from "../../lib/utils";
import path from "path";

// buildFileTree 함수 (이전 답변의 수정된 버전 사용 - slug와 title 사용)
function buildFileTree(notes: { slug: string; title: string }[]): TreeNode[] {
  // ... (이전 답변의 buildFileTree 로직 참조)
  const tree: TreeNode[] = [];
  const map = new Map<string, TreeNode>(); 

  notes.forEach((noteInfo) => {
    const parts = noteInfo.slug.split("/"); 
    let currentPathSlug = ""; 
    
    const originalPathSegments = noteInfo.slug.split('/').map(slugSegment => {
        const correspondingNote = notes.find(n => n.slug.endsWith(slugSegment) && n.slug.startsWith(currentPathSlug) && (currentPathSlug ? n.slug.length > currentPathSlug.length : true) );
        return correspondingNote ? correspondingNote.title : slugSegment.replace(/-/g, ' '); 
    });

    for (let i = 0; i < parts.length; i++) {
      const partSlug = parts[i];
      const partOriginalName = originalPathSegments[i]; 
      currentPathSlug = currentPathSlug ? `${currentPathSlug}/${partSlug}` : partSlug;

      if (!map.has(currentPathSlug)) {
        const nodeType = (i === parts.length - 1 && noteInfo.slug === currentPathSlug) ? "file" : "folder";
        const newNode: TreeNode = {
          id: currentPathSlug, 
          name: partOriginalName, 
          type: nodeType,
          depth: i,
        };
        if (nodeType === "folder") newNode.children = [];
        map.set(currentPathSlug, newNode);

        if (i > 0) {
          const parentPathSlug = parts.slice(0, i).join("/");
          const parentNode = map.get(parentPathSlug);
          if (parentNode && parentNode.type === "folder") parentNode.children!.push(newNode);
        } else {
          tree.push(newNode);
        }
      }
    }
  });
  const sortTree = (nodesToSort: TreeNode[]) => { /* ... */ }; // 이전과 동일
  sortTree(tree);
  return tree;
}


interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePageWrapper({ searchParams: searchParamsPromise }: PageProps) {
  // await initializeNotesData(); // 개발 중 매번 또는 서버 시작 시 한 번 호출

  const searchParams = await searchParamsPromise;
  let noteQueryParam = searchParams?.note as string;
  if (Array.isArray(searchParams?.note)) noteQueryParam = searchParams.note[0];
  
  const requestedSlug = filenameToSlug(noteQueryParam || "Jeseong");

  const noteContentData = await getNoteContentBySlug(requestedSlug);
  const { nodes: graphNodes, edges: graphEdges } = await buildGraphDataForRender();
  const allNotesForTree = await getAllNotesForTree(); 
  const treeData = buildFileTree(allNotesForTree);

  return (
    <HomePageClient
      initialNodes={graphNodes}
      initialEdges={graphEdges}
      title={noteContentData?.title || path.basename(requestedSlug.replace(/-/g, " "))}
      markdownContent={noteContentData?.markdownContent || `Note '${requestedSlug}' not found or content is empty.`}
      requestedNoteId={requestedSlug} 
      treeData={treeData}
    />
  );
}