// lib/notes-processor.ts
import fs from "fs";
import path from "path";
import { glob } from "glob";
import { filenameToSlug } from "./utils";

const vaultDir = path.join(process.cwd(), "vault");

export interface ProcessedNode {
  slug: string; // 정규화된 전체 경로 슬러그 (예: 'folder-name/note-name')
  title: string; // 원본 제목 (예: 'Note Name')
  filePath: string; // vault 기준 상대 파일 경로 (예: 'Folder Name/Note Name.md')
  simpleSlug: string; // 정규화된 단순 파일명 슬러그 (예: 'note-name')
}
export interface GraphNode {
  id: string;
  label: string;
}
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

let allProcessedNotes: ProcessedNode[] | null = null;
// Key: 정규화된 전체 경로 슬러그, Value: ProcessedNode
let notesMapByFullPathSlug: Map<string, ProcessedNode> | null = null;
// Key: 정규화된 단순 파일명 슬러그, Value: Set<정규화된 전체 경로 슬러그>
let notesMapBySimpleSlug: Map<string, Set<string>> | null = null;

export async function initializeNotesData(): Promise<void> {
  if (notesMapByFullPathSlug && process.env.NODE_ENV === "production") {
    return;
  }
  console.log("[notesProcessor] Initializing all notes data from vault...");
  const files = await glob("**/*.md", {
    cwd: vaultDir,
    ignore: ["node_modules/**", "**/.*"],
    nodir: true,
    posix: true,
  });

  const processedNotesList: ProcessedNode[] = [];
  notesMapByFullPathSlug = new Map<string, ProcessedNode>();
  notesMapBySimpleSlug = new Map<string, Set<string>>();

  files.forEach((filePath) => {
    const title = path.basename(filePath).replace(/\.md$/, "");
    const fullPathSlug = filenameToSlug(filePath.replace(/\.md$/, "")); // 예: '컴퓨터과학/cs'
    const simpleSlug = filenameToSlug(title); // 예: 'cs'

    const noteData: ProcessedNode = {
      slug: fullPathSlug,
      title,
      filePath,
      simpleSlug,
    };
    processedNotesList.push(noteData);

    notesMapByFullPathSlug!.set(fullPathSlug, noteData);

    if (!notesMapBySimpleSlug!.has(simpleSlug)) {
      notesMapBySimpleSlug!.set(simpleSlug, new Set());
    }
    notesMapBySimpleSlug!.get(simpleSlug)!.add(fullPathSlug);
  });

  allProcessedNotes = processedNotesList;
  console.log(
    `[notesProcessor] Initialized ${allProcessedNotes.length} notes.`
  );
  console.log(
    "[notesProcessor] notesMapByFullPathSlug keys:",
    Array.from(notesMapByFullPathSlug!.keys())
  );
  console.log(
    "[notesProcessor] notesMapBySimpleSlug content:",
    Object.fromEntries(
      Array.from(notesMapBySimpleSlug!).map(([k, v]) => [k, Array.from(v)])
    )
  );
}

export async function getAllNotesForTree(): Promise<
  Pick<ProcessedNode, "slug" | "title">[]
> {
  if (!allProcessedNotes) await initializeNotesData();
  return allProcessedNotes!.map((note) => ({
    slug: note.slug,
    title: note.title,
  }));
}

// 요청된 슬러그로 노트를 찾는 향상된 함수
function findNoteByRequestedSlug(
  requestedSlug: string
): ProcessedNode | undefined {
  if (!notesMapByFullPathSlug || !notesMapBySimpleSlug) {
    console.warn(
      "[notesProcessor/findNote] Data maps not initialized for findNoteByRequestedSlug. Call initializeNotesData first."
    );
    return undefined;
  }

  // 1. 요청된 슬러그가 전체 경로 슬러그와 일치하는지 확인
  if (notesMapByFullPathSlug.has(requestedSlug)) {
    console.log(
      `[notesProcessor/findNote] Found by full path slug: "${requestedSlug}"`
    );
    return notesMapByFullPathSlug.get(requestedSlug);
  }

  // 2. 요청된 슬러그가 단순 파일명 슬러그와 일치하는지 확인
  const possibleFullPathSlugs = notesMapBySimpleSlug.get(requestedSlug);
  if (possibleFullPathSlugs) {
    if (possibleFullPathSlugs.size === 1) {
      const fullPathSlug = possibleFullPathSlugs.values().next().value;
      // 👇 fullPathSlug가 undefined가 아닌지 확인 후 get 호출
      if (fullPathSlug) {
        console.log(
          `[notesProcessor/findNote] Found by simple slug: "${requestedSlug}", maps to full path: "${fullPathSlug}"`
        );
        return notesMapByFullPathSlug.get(fullPathSlug);
      }
    } else if (possibleFullPathSlugs.size > 1) {
      const firstMatch = possibleFullPathSlugs.values().next().value;
      // 👇 firstMatch가 undefined가 아닌지 확인 후 get 호출
      if (firstMatch) {
        console.warn(
          `[notesProcessor/findNote] Ambiguous simple slug "${requestedSlug}". Candidates: ${Array.from(
            possibleFullPathSlugs
          ).join(", ")}. Returning first match: ${firstMatch}`
        );
        return notesMapByFullPathSlug.get(firstMatch);
      }
    }
  }

  console.warn(
    `[notesProcessor/findNote] No note found for requested slug: "${requestedSlug}" (after checking both full path and simple slug maps)`
  );
  return undefined;
}

export async function getNoteContentBySlug(
  requestedSlug: string // 이 ID는 URL에서 넘어온 정규화된 ID (예: 'cs' 또는 'folder/sub-folder/note-name')
): Promise<{ title: string; markdownContent: string; slug: string } | null> {
  if (!notesMapByFullPathSlug || !notesMapBySimpleSlug)
    await initializeNotesData(); // 맵 초기화 보장

  console.log(
    `[notesProcessor/getNoteContentBySlug] Attempting to find note with requested slug: "${requestedSlug}"`
  );
  const noteInfo = findNoteByRequestedSlug(requestedSlug);

  if (!noteInfo) {
    console.error(
      `[notesProcessor/getNoteContentBySlug] Note with requested slug "${requestedSlug}" not found after search.`
    );
    return null;
  }

  const fullPath = path.join(vaultDir, noteInfo.filePath);
  console.log(
    `[notesProcessor/getNoteContentBySlug] Reading content for actual slug "${noteInfo.slug}" from path: ${fullPath}`
  );
  try {
    const fileContents = fs.readFileSync(fullPath, "utf8");
    return {
      title: noteInfo.title,
      markdownContent: fileContents,
      slug: noteInfo.slug,
    };
  } catch (error) {
    console.error(
      `[notesProcessor/getNoteContentBySlug] Error reading file ${noteInfo.filePath} for slug ${noteInfo.slug}:`,
      error
    );
    return null;
  }
}

export async function buildGraphDataForRender(): Promise<{
  nodes: GraphNode[];
  edges: GraphEdge[];
}> {
  if (!allProcessedNotes || !notesMapByFullPathSlug || !notesMapBySimpleSlug)
    await initializeNotesData();

  const nodes: GraphNode[] = allProcessedNotes!.map((note) => ({
    id: note.slug,
    label: note.title,
  }));
  const edges: GraphEdge[] = [];
  const wikilinkRegex = /\[\[([^\]#|]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;

  for (const sourceNote of allProcessedNotes!) {
    let fileContents = "";
    const fullPath = path.join(vaultDir, sourceNote.filePath);
    try {
      fileContents = fs.readFileSync(fullPath, "utf8");
    } catch (e) {
      console.error(
        `[notesProcessor/buildGraphData] Could not read ${sourceNote.filePath}`
      );
      continue;
    }

    let match;
    while ((match = wikilinkRegex.exec(fileContents)) !== null) {
      const linkTargetName = match[1].trim(); // 원본 링크 텍스트
      const requestedTargetSlug = filenameToSlug(linkTargetName); // 링크 대상도 정규화

      console.log(
        `[notesProcessor/buildGraphData] Parsing link "[[${linkTargetName}]]" in "${sourceNote.filePath}", normalized to "${requestedTargetSlug}"`
      );
      const targetNoteInfo = findNoteByRequestedSlug(requestedTargetSlug); // 수정된 찾기 함수 사용

      if (targetNoteInfo && sourceNote.slug !== targetNoteInfo.slug) {
        edges.push({
          id: `${sourceNote.slug}->${targetNoteInfo.slug}`,
          source: sourceNote.slug,
          target: targetNoteInfo.slug,
        });
        console.log(
          `[notesProcessor/buildGraphData] Created edge: ${sourceNote.slug} -> ${targetNoteInfo.slug}`
        );
      } else if (!targetNoteInfo) {
        console.warn(
          `[notesProcessor/buildGraphData] Could not resolve link "[[${linkTargetName}]]" in file "${sourceNote.filePath}" (tried slug "${requestedTargetSlug}")`
        );
      }
    }
  }
  console.log(
    `[notesProcessor/buildGraphData] Generated ${nodes.length} nodes and ${edges.length} edges.`
  );
  return { nodes, edges };
}
