// lib/notes.ts
import fs from "fs";
import path from "path";
import { remark } from "remark";
import html from "remark-html";
import { glob } from "glob";
import remarkWikiLink from "remark-wiki-link";

const vaultDir = path.join(process.cwd(), "vault");
console.log("[notes.ts] Vault directory path:", vaultDir);

export interface NodeData {
  id: string; // 이제 '폴더/파일명' 형태가 될 수 있음
  label: string;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
}

export interface NodeData {
  id: string;
  label: string;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
}

// --- getGraphData 수정 ---
export async function getGraphData(): Promise<{
  nodes: NodeData[];
  edges: EdgeData[];
}> {
  console.log("[getGraphData] Starting to get graph data...");
  let files: string[] = [];
  try {
    // glob을 사용하여 vaultDir 내 모든 .md 파일을 재귀적으로 찾음 (node_modules 등 제외)
    files = await glob("**/*.md", {
      cwd: vaultDir,
      ignore: ["node_modules/**", "**/.*"], // 무시할 패턴
      nodir: true, // 디렉토리는 결과에서 제외
      posix: true, // 경로 구분자를 '/'로 통일
    });
    console.log("[getGraphData] Found files (recursive):", files);
  } catch (error) {
    console.error("[getGraphData] Error finding markdown files:", error);
    return { nodes: [], edges: [] };
  }

  if (files.length === 0) {
    console.warn("[getGraphData] No markdown files found in vault directory.");
    return { nodes: [], edges: [] };
  }

  const nodes: NodeData[] = [];
  // 파일 경로(ID)를 키로, 노트 정보를 값으로 갖는 맵 (링크 처리 시 사용)
  const nodeInfoMap = new Map<string, { id: string; label: string }>();
  // 단순 파일 이름(소문자)을 키로, 가능한 전체 ID 경로들의 Set을 값으로 갖는 맵 (링크 처리 시 사용)
  const simpleNameMap = new Map<string, Set<string>>();

  // 첫 번째 순회: 노드 생성 및 정보 맵핑
  files.forEach((relativePath) => {
    const id = relativePath.replace(/\.md$/, ""); // ID = vault 기준 상대 경로 (확장자 제외)
    const label = path.basename(id); // 레이블 = 파일명 (확장자 제외)
    const simpleNameLower = label.toLowerCase(); // 소문자 파일명

    nodes.push({ id, label });
    nodeInfoMap.set(id, { id, label });

    if (!simpleNameMap.has(simpleNameLower)) {
      simpleNameMap.set(simpleNameLower, new Set());
    }
    simpleNameMap.get(simpleNameLower)!.add(id);
  });

  const edges: EdgeData[] = [];
  const wikilinkRegex = /\[\[([^\]#|]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g; // [[Link]], [[Link|Alias]], [[Link#Header]] 등 처리 (단순화 버전)

  // 두 번째 순회: 링크 분석 및 엣지 생성
  files.forEach((relativePath) => {
    const sourceId = relativePath.replace(/\.md$/, "");
    const sourceDir = path.dirname(relativePath); // 현재 파일의 디렉토리 경로

    const fullPath = path.join(vaultDir, relativePath);
    const fileContents = fs.readFileSync(fullPath, "utf8");

    let match;
    while ((match = wikilinkRegex.exec(fileContents)) !== null) {
      const linkTarget = match[1].trim(); // 링크 텍스트 (예: 'My Note', 'folder/My Note')
      let targetId: string | undefined = undefined;

      // --- 링크 대상 찾기 로직 (개선 필요!) ---
      // 1. 절대 경로 링크? (예: [[folder/My Note]])
      if (linkTarget.includes("/")) {
        const potentialId = linkTarget;
        if (nodeInfoMap.has(potentialId)) {
          targetId = potentialId;
        }
      }
      // 2. 상대 경로 링크? (예: [[../sibling/My Note]]) - 여기서는 미구현
      // 3. 단순 이름 링크? (예: [[My Note]])
      else {
        const simpleNameLower = linkTarget.toLowerCase();
        const possibleTargets = simpleNameMap.get(simpleNameLower);
        if (possibleTargets) {
          if (possibleTargets.size === 1) {
            // 이름이 고유하면 바로 사용
            targetId = possibleTargets.values().next().value;
          } else {
            // 이름이 중복되면? -> 현재는 첫번째 찾은 것 사용 (개선 필요!)
            // TODO: 같은 폴더 우선, Obsidian 링크 해석 규칙 적용 등
            console.warn(
              `[getGraphData] Ambiguous link [[${linkTarget}]] in "${relativePath}". Found multiple candidates: ${[
                ...possibleTargets,
              ].join(", ")}. Using the first one found.`
            );
            targetId = possibleTargets.values().next().value;
          }
        }
      }
      // --- 링크 대상 찾기 로직 끝 ---

      if (targetId && sourceId !== targetId) {
        // 자기 자신 링크 제외
        edges.push({
          id: `${sourceId}->${targetId}`,
          source: sourceId,
          target: targetId,
        });
      } else if (!targetId && match[1]) {
        // targetId를 못찾은 경우 경고
        console.warn(
          `[getGraphData] Could not resolve link [[${match[1]}]] in file "${relativePath}"`
        );
      }
    }
  });

  console.log("[getGraphData] Returning data:", {
    nodeCount: nodes.length,
    edgeCount: edges.length,
  });
  return { nodes, edges };
}

export async function getNoteContent(
  id: string
): Promise<{ title: string; contentHtml: string } | null> {
  const relativePath = `${id}.md`;
  const fullPath = path.join(vaultDir, relativePath);

  console.log(`[getNoteContent] Trying to read: ${fullPath}`);

  if (!fs.existsSync(fullPath)) {
    console.error(`[getNoteContent] File not found at: ${fullPath}`);
    // TODO: Add case-insensitive fallback search if needed
    return null;
  }

  try {
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const title = path.basename(id); // 또는 frontmatter 사용

    // remark로 Markdown을 HTML로 변환하면서 wikilink 처리 추가
    const processedContent = await remark()
      .use(remarkWikiLink, {
        // --- 👇 permalink에 : string 타입 추가 👇 ---
        hrefTemplate: (permalink: string) => `/?note=${permalink}`,
        // --- 👆 타입 추가 👆 ---
        wikiLinkClassName: "internal-wikilink", // 클래스 이름 수정 (선택 사항)
      })
      .use(html, { sanitize: false })
      .process(fileContents);

    const contentHtml = processedContent.toString();
    return { title, contentHtml };
  } catch (error) {
    console.error(
      `[getNoteContent] Error processing file ${relativePath}:`,
      error
    );
    return null;
  }
}
