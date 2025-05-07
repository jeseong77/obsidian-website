// lib/utils.ts (새 파일 또는 기존 유틸리티 파일)
export function filenameToSlug(nameOrPath: string): string {
  if (!nameOrPath) return "";
  let slug = nameOrPath
    .replace(/\.md$/, "") // .md 확장자 제거
    .replace(/\\/g, "/"); // 윈도우 경로 구분자 '\'를 '/'로 통일

  // 경로의 각 부분을 슬러그화
  slug = slug
    .split("/")
    .map(
      (segment) =>
        segment
          .trim() // 앞뒤 공백 제거
          .toLowerCase() // 각 부분을 소문자로
          .replace(/\s+/g, "-") // 공백을 하이픈으로
          .replace(/_/g, "-") // 언더스코어도 하이픈으로 (일관성)
          // 허용 문자: 영어 알파벳, 숫자, 한글, 하이픈. 그 외 문자 제거.
          .replace(/[^a-z0-9\uAC00-\uD7A3-]+/g, "")
          .replace(/-+/g, "-") // 연속된 하이픈을 하나로
          .replace(/^-+|-+$/g, "") // 각 세그먼트의 앞뒤 하이픈 제거
    )
    .filter((segment) => segment.length > 0) // 빈 세그먼트 제거 (예: "folder//file" -> "folder/file")
    .join("/");

  return slug;
}

// TreeNode 인터페이스 (공유 타입으로 여기에 두거나 types.ts 등으로 이동)
export interface TreeNode {
  id: string; // 정규화된 슬러그
  name: string; // 표시될 원본 이름
  type: "folder" | "file";
  children?: TreeNode[];
  depth: number;
}
