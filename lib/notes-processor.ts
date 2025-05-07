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
    return undefined;
  }

  // 1. 요청된 슬러그가 전체 경로 슬러그와 일치하는지 확인
  if (notesMapByFullPathSlug.has(requestedSlug)) {
    return notesMapByFullPathSlug.get(requestedSlug);
  }

  // 2. 요청된 슬러그가 단순 파일명 슬러그와 일치하는지 확인
  const possibleFullPathSlugs = notesMapBySimpleSlug.get(requestedSlug);
  if (possibleFullPathSlugs) {
    if (possibleFullPathSlugs.size === 1) {
      const fullPathSlug = possibleFullPathSlugs.values().next().value;
      if (fullPathSlug) {
        return notesMapByFullPathSlug.get(fullPathSlug);
      }
    } else if (possibleFullPathSlugs.size > 1) {
      const firstMatch = possibleFullPathSlugs.values().next().value;
      if (firstMatch) {
        return notesMapByFullPathSlug.get(firstMatch);
      }
    }
  }

  return undefined;
}

export async function getNoteContentBySlug(
  requestedSlug: string // 이 ID는 URL에서 넘어온 정규화된 ID (예: 'cs' 또는 'folder/sub-folder/note-name')
): Promise<{ title: string; markdownContent: string; slug: string } | null> {
  if (!notesMapByFullPathSlug || !notesMapBySimpleSlug)
    await initializeNotesData();

  const noteInfo = findNoteByRequestedSlug(requestedSlug);

  if (!noteInfo) {
    return null;
  }

  const fullPath = path.join(vaultDir, noteInfo.filePath);
  try {
    const fileContents = fs.readFileSync(fullPath, "utf8");
    return {
      title: noteInfo.title,
      markdownContent: fileContents,
      slug: noteInfo.slug,
    };
  } catch (error) {
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
      continue;
    }

    let match;
    while ((match = wikilinkRegex.exec(fileContents)) !== null) {
      const linkTargetName = match[1].trim(); // 원본 링크 텍스트
      const requestedTargetSlug = filenameToSlug(linkTargetName); // 링크 대상도 정규화

      const targetNoteInfo = findNoteByRequestedSlug(requestedTargetSlug);

      if (targetNoteInfo && sourceNote.slug !== targetNoteInfo.slug) {
        edges.push({
          id: `${sourceNote.slug}->${targetNoteInfo.slug}`,
          source: sourceNote.slug,
          target: targetNoteInfo.slug,
        });
      }
    }
  }
  return { nodes, edges };
}
