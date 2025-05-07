// components/NoteGraph.tsx
"use client";

import React, { useEffect, useRef, useMemo, useState } from "react";
import * as d3 from "d3";
import { useRouter } from "next/navigation";

// 인터페이스 정의
interface NodeDatum extends d3.SimulationNodeDatum {
  id: string;
  label: string;
}
interface EdgeDatum extends d3.SimulationLinkDatum<NodeDatum> {
  id: string;
  source: string | NodeDatum;
  target: string | NodeDatum;
}
interface NoteGraphProps {
  initialNodes: { id: string; label: string }[];
  initialEdges: { id: string; source: string; target: string }[];
  currentNodeId?: string | null;
}

const NoteGraph: React.FC<NoteGraphProps> = ({
  initialNodes = [],
  initialEdges = [],
  currentNodeId = null,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const router = useRouter();

  const graphData = useMemo(() => {
    const nodes: NodeDatum[] = Array.isArray(initialNodes)
      ? initialNodes.map((n) => ({ ...n }))
      : [];
    const edges: EdgeDatum[] = Array.isArray(initialEdges)
      ? initialEdges.map((e) => ({ ...e }))
      : [];
    return { nodes, edges };
  }, [initialNodes, initialEdges]);

  useEffect(() => {
    // 컨테이너 크기 감지 로직 (변경 없음)
    const currentContainer = containerRef.current;
    if (currentContainer) {
      const updateDimensions = () =>
        setDimensions({
          width: currentContainer.clientWidth,
          height: currentContainer.clientHeight,
        });
      updateDimensions();
      const resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(currentContainer);
      return () => resizeObserver.unobserve(currentContainer);
    }
  }, []);

  useEffect(() => {
    // D3 렌더링 로직
    const { width, height } = dimensions;
    if (
      !svgRef.current ||
      graphData.nodes.length === 0 ||
      width === 0 ||
      height === 0
    ) {
      if (svgRef.current) d3.select(svgRef.current).selectAll("*").remove();
      return;
    }

    const svgElement = svgRef.current;
    const svg = d3
      .select(svgElement)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height].join(" "))
      // 👇 SVG 배경색 CSS 변수 사용
      .style("background-color", "var(--card-background)");

    svg.selectAll("*").remove(); // 이전 요소 제거

    const simulation = d3
      .forceSimulation<NodeDatum, EdgeDatum>(graphData.nodes)
      .force(
        "link",
        d3
          .forceLink<NodeDatum, EdgeDatum>(graphData.edges)
          .id((d) => d.id)
          .distance(70)
      )
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(0, 0))
      .force("collide", d3.forceCollide<NodeDatum>().radius(15));

    const g = svg.append("g").attr("class", "everything");

    // 링크 스타일 수정
    const link = g
      .append("g")
      .attr("class", "links") // CSS 선택용 클래스
      .selectAll("line")
      .data(graphData.edges)
      .join("line")
      .attr("stroke", "var(--foreground-muted)") // 👇 링크 색상 변경 (muted 사용)
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1.5);

    // 노드 그룹 (변경 없음)
    const nodeGroup: d3.Selection<
      SVGGElement,
      NodeDatum,
      SVGGElement,
      unknown
    > = g
      .append("g")
      .attr("class", "nodes") // CSS 선택용 클래스
      .selectAll<SVGGElement, unknown>("g.node-item")
      .data(graphData.nodes)
      .join<SVGGElement>("g")
      .attr("class", "node-item");

    // 노드 원 스타일 (CSS 변수 적용됨)
    nodeGroup
      .append("circle")
      .attr("r", 6)
      .attr(
        "fill",
        (d: NodeDatum) =>
          d.id === currentNodeId
            ? "var(--accent-selected)"
            : "var(--accent-default)" // globals.css의 새로운 정의 사용
      )
      .style("cursor", "pointer")
      .on("click", (event, d: NodeDatum) => {
        router.push(`/?note=${d.id}`);
      });

    // 노드 텍스트 스타일 수정
    nodeGroup
      .append("text")
      .text((d: NodeDatum) => d.label)
      .attr("x", 0)
      .attr("y", -14)
      .style("font-size", "10px")
      .style("text-anchor", "middle")
      .style("fill", "var(--foreground)") // 👇 텍스트 색상 변경
      .style("pointer-events", "none");

    // --- 드래그 핸들러 (누락 없이 복원) ---
    const dragHandler = d3
      .drag<SVGGElement, NodeDatum>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x ?? 0;
        d.fy = d.y ?? 0;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
    nodeGroup.call(dragHandler); // 누락 없이 복원

    // --- 줌 핸들러 (누락 없이 복원) ---
    const zoomHandler = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .filter((event) => {
        // filter 로직 복원
        const target = event.target as Element | null;
        return target && typeof target.closest === "function"
          ? !target.closest(".node-item")
          : true;
      })
      .on("zoom", (event) => {
        // on zoom 로직 복원
        g.attr("transform", event.transform.toString());
      });
    svg.call(zoomHandler); // 누락 없이 복원

    // --- 시뮬레이션 tick 함수 (누락 없이 복원) ---
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as NodeDatum).x ?? 0)
        .attr("y1", (d) => (d.source as NodeDatum).y ?? 0)
        .attr("x2", (d) => (d.target as NodeDatum).x ?? 0)
        .attr("y2", (d) => (d.target as NodeDatum).y ?? 0);
      nodeGroup.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    // 클린업 함수 (변경 없음)
    return () => {
      simulation.stop();
    };
  }, [graphData, dimensions, currentNodeId, router]);

  return (
    // 👇 컨테이너 div 스타일 수정: 배경색, 테두리색, 트랜지션 추가 및 CSS 선택자용 클래스 추가
    <div
      ref={containerRef}
      className="note-graph-container w-full h-full border border-[var(--border-color)] bg-[var(--card-background)] overflow-hidden transition-colors duration-150 ease-in-out"
    >
      <svg ref={svgRef} />
    </div>
  );
};

export default NoteGraph;
