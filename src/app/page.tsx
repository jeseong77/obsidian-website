// app/page.tsx
import HomePageClient from "../../components/HomePageClient";
import {
  buildGraphDataForRender,
  getAllNotesForTree,
  getNoteContentBySlug,
  getNoteSlugMaps,
} from "../../lib/notes-processor";
import { filenameToSlug, type TreeNode } from "../../lib/utils";
import path from "path";

// buildFileTree 함수 (수정된 버전)
function buildFileTree(notes: { slug: string; title: string }[]): TreeNode[] {
  const tree: TreeNode[] = [];
  const map = new Map<string, TreeNode>();

  notes.forEach((noteInfo) => {
    // noteInfo pertains to a specific FILE
    const parts = noteInfo.slug.split("/"); // slug segments of the FILE path

    // 1. Corrected calculation for display names of path segments for the current note.
    let pathPrefixForSegmentNameLookup = "";
    const originalPathSegmentsNames = parts.map((slugSegment) => {
      const cumulativeSlugForThisSegment = pathPrefixForSegmentNameLookup
        ? `${pathPrefixForSegmentNameLookup}/${slugSegment}`
        : slugSegment;
      const definingNote = notes.find(
        (n) => n.slug === cumulativeSlugForThisSegment
      );
      const name = definingNote
        ? definingNote.title
        : slugSegment.replace(/-/g, " ");
      pathPrefixForSegmentNameLookup = cumulativeSlugForThisSegment; // Update for next iteration of .map
      return name;
    });

    let currentProcessingPathSlug = ""; // The slug of the directory/file being processed in the inner loop

    for (let i = 0; i < parts.length; i++) {
      const partSlugSegment = parts[i]; // The current slug segment, e.g., "arts", then "문학"
      const partOriginalName = originalPathSegmentsNames[i]; // The display name for this segment

      const parentPathForLinking = currentProcessingPathSlug; // Save parent path before updating currentProcessingPathSlug
      currentProcessingPathSlug = currentProcessingPathSlug
        ? `${currentProcessingPathSlug}/${partSlugSegment}`
        : partSlugSegment;

      let node = map.get(currentProcessingPathSlug);

      if (!node) {
        // This path segment has not been seen before. Create a new node for it.
        const isFileNode = i === parts.length - 1; // It's a file if it's the last segment of noteInfo.slug
        const nodeType = isFileNode ? "file" : "folder";

        node = {
          id: currentProcessingPathSlug,
          name: partOriginalName,
          type: nodeType,
          depth: i,
        };
        if (nodeType === "folder") {
          node.children = [];
        }
        map.set(currentProcessingPathSlug, node);

        if (i === 0) {
          if (!tree.some((rootNode) => rootNode.id === node!.id)) {
            tree.push(node);
          }
        } else {
          const parentNode = map.get(parentPathForLinking);
          if (
            parentNode &&
            parentNode.type === "folder" &&
            parentNode.children
          ) {
            if (!parentNode.children.some((child) => child.id === node!.id)) {
              parentNode.children.push(node);
            }
          } else if (parentNode && parentNode.type === "file") {
            parentNode.type = "folder";
            parentNode.children = parentNode.children || [];
            if (!parentNode.children.some((child) => child.id === node!.id)) {
              parentNode.children.push(node);
            }
          }
        }
      } else {
        if (node.type === "file" && i < parts.length - 1) {
          node.type = "folder";
          node.children = node.children || [];
        }
        if (
          node.name !== partOriginalName &&
          notes.find(
            (n) =>
              n.slug === currentProcessingPathSlug &&
              n.title === partOriginalName
          )
        ) {
        }
      }
    }
  });

  const sortTree = (nodesToSort: TreeNode[]): void => {
    nodesToSort.sort((a, b) => {
      if (a.type === "folder" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "folder") return 1;
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
  // await initializeNotesData(); // 개발 중 매번 또는 서버 시작 시 한 번 호출

  const searchParams = await searchParamsPromise;
  let noteQueryParam = searchParams?.note as string;
  if (Array.isArray(searchParams?.note)) noteQueryParam = searchParams.note[0];

  const requestedSlug = filenameToSlug(noteQueryParam || "Jeseong");

  const noteContentData = await getNoteContentBySlug(requestedSlug);
  const { nodes: graphNodes, edges: graphEdges } =
    await buildGraphDataForRender();
  const allNotesForTree = await getAllNotesForTree();
  const treeData = buildFileTree(allNotesForTree);
  const { notesMapByFullPathSlug, notesMapBySimpleSlug } = await getNoteSlugMaps();

  return (
    <HomePageClient
      initialNodes={graphNodes}
      initialEdges={graphEdges}
      title={
        noteContentData?.title ||
        path.basename(requestedSlug.replace(/-/g, " "))
      }
      markdownContent={
        noteContentData?.markdownContent ||
        `Note '${requestedSlug}' not found or content is empty.`
      }
      requestedNoteId={requestedSlug}
      treeData={treeData}
      notesMapByFullPathSlug={notesMapByFullPathSlug} // Props로 전달
      notesMapBySimpleSlug={notesMapBySimpleSlug} 
    />
  );
}
