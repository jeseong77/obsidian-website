// lib/notes.ts
import fs from "fs";
import path from "path";
import { remark } from "remark";
import remarkParse from "remark-parse"; // remark 파서 명시적 추가
// import html from "remark-html"; // remark-html 제거
import remarkRehype from "remark-rehype"; // remark -> rehype 변환
import rehypeRaw from "rehype-raw"; // Markdown 내 HTML 처리
import rehypeStringify from "rehype-stringify"; // 최종 HTML 변환
import rehypePrettyCode, {
  type Options as RehypePrettyCodeOptions,
} from "rehype-pretty-code";
import { glob } from "glob";
import remarkWikiLink from "remark-wiki-link"; // 위키링크 플러그인 유지

const vaultDir = path.join(process.cwd(), "vault");

// NodeData, EdgeData 인터페이스 정의 (이전과 동일)
export interface NodeData {
  id: string;
  label: string;
}
export interface EdgeData {
  id: string;
  source: string;
  target: string;
}

// getGraphData 함수 (변경 없음)
export async function getGraphData(): Promise<{
  nodes: NodeData[];
  edges: EdgeData[];
}> {
  console.log("[getGraphData] Starting to get graph data...");
  let files: string[] = [];
  try {
    files = await glob("**/*.md", {
      cwd: vaultDir,
      ignore: ["node_modules/**", "**/.*"],
      nodir: true,
      posix: true,
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
  const nodeInfoMap = new Map<string, { id: string; label: string }>();
  const simpleNameMap = new Map<string, Set<string>>();
  files.forEach((relativePath) => {
    const id = relativePath.replace(/\.md$/, "");
    const label = path.basename(id);
    const simpleNameLower = label.toLowerCase();
    nodes.push({ id, label });
    nodeInfoMap.set(id, { id, label });
    if (!simpleNameMap.has(simpleNameLower))
      simpleNameMap.set(simpleNameLower, new Set());
    simpleNameMap.get(simpleNameLower)!.add(id);
  });
  const edges: EdgeData[] = [];
  const wikilinkRegex = /\[\[([^\]#|]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
  files.forEach((relativePath) => {
    const sourceId = relativePath.replace(/\.md$/, "");
    const fullPath = path.join(vaultDir, relativePath);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    let match;
    while ((match = wikilinkRegex.exec(fileContents)) !== null) {
      const linkTarget = match[1].trim();
      let targetId: string | undefined = undefined;
      if (linkTarget.includes("/")) {
        if (nodeInfoMap.has(linkTarget)) targetId = linkTarget;
      } else {
        const simpleNameLower = linkTarget.toLowerCase();
        const possibleTargets = simpleNameMap.get(simpleNameLower);
        if (possibleTargets) {
          if (possibleTargets.size === 1)
            targetId = possibleTargets.values().next().value;
          else {
            console.warn(
              `[getGraphData] Ambiguous link [[${linkTarget}]] in "${relativePath}". Found multiple candidates: ${[
                ...possibleTargets,
              ].join(", ")}. Using the first one found.`
            );
            targetId = possibleTargets.values().next().value;
          }
        }
      }
      if (targetId && sourceId !== targetId) {
        edges.push({
          id: `${sourceId}->${targetId}`,
          source: sourceId,
          target: targetId,
        });
      } else if (!targetId && match[1]) {
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

// --- getNoteContent 함수 수정 ---
export async function getNoteContent(
  id: string
): Promise<{ title: string; contentHtml: string } | null> {
  const relativePath = `${id}.md`;
  const fullPath = path.join(vaultDir, relativePath);

  console.log(`[getNoteContent] Trying to read: ${fullPath}`);

  if (!fs.existsSync(fullPath)) {
    console.error(`[getNoteContent] File not found at: ${fullPath}`);
    return null;
  }

  try {
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const title = path.basename(id);

    // 👇 rehype-pretty-code 옵션 타입을 명시적으로 지정
    const prettyCodeOptions: RehypePrettyCodeOptions = {
      theme: "github-dark", // 사용할 Shiki 테마
      keepBackground: false, // 배경색은 CSS로 제어하기 위해 false 권장
      // 필요시 다른 옵션 추가:
      // onVisitLine(node) { node.properties.className.push('line--visited') },
    };

    const processedContent = await remark()
      .use(remarkParse)
      .use(remarkWikiLink, {
        hrefTemplate: (permalink: string) => `/?note=${permalink}`,
        wikiLinkClassName: "internal-link",
      })
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypePrettyCode, prettyCodeOptions)
      .use(rehypeStringify)
      .process(fileContents);

    const contentHtml = processedContent.toString();

    console.log("[getNoteContent] Processed markdown with rehype-pretty-code.");

    return { title, contentHtml };
  } catch (error) {
    console.error(
      `[getNoteContent] Error processing file ${relativePath}:`,
      error
    );
    return null;
  }
}
