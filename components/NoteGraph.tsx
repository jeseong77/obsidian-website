// components/NoteGraph.tsx
"use client"; // useRouter 훅을 사용하므로 클라이언트 컴포넌트

import React, { useEffect, useRef, useMemo, useState } from "react";
import * as d3 from "d3";
import { useRouter } from "next/navigation"; // <--- next/navigation에서 useRouter 임포트

// ... (인터페이스 정의: NodeDatum, EdgeDatum, NoteGraphProps는 이전과 동일)
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

// 컬럼비아 블루 색상 정의 (이전과 동일)
const colorLightBlue = "#69B3E7";
const colorDarkBlue = "#0072CE";

const NoteGraph: React.FC<NoteGraphProps> = ({
  initialNodes = [], // 기본값 추가
  initialEdges = [], // 기본값 추가
  currentNodeId = null,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const router = useRouter(); // <--- useRouter 훅 사용

  const graphData = useMemo(() => {
    /* ... 이전과 동일 ... */
    const nodes: NodeDatum[] = Array.isArray(initialNodes)
      ? initialNodes.map((n) => ({ ...n }))
      : [];
    const edges: EdgeDatum[] = Array.isArray(initialEdges)
      ? initialEdges.map((e) => ({ ...e }))
      : [];
    return { nodes, edges };
  }, [initialNodes, initialEdges]);

  // 컨테이너 크기 변경 감지 useEffect (이전과 동일)
  useEffect(() => {
    /* ... 이전과 동일 ... */
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

  // D3 그래프 렌더링 useEffect (이전과 동일, 의존성 배열 확인)
  useEffect(() => {
    const { width, height } = dimensions;
    if (
      /* ... size/data checks ... */
      !svgRef.current ||
      graphData.nodes.length === 0 ||
      width === 0 ||
      height === 0
    ) {
      if (svgRef.current) d3.select(svgRef.current).selectAll("*").remove();
      return;
    }
    // --- SVG 및 시뮬레이션 설정 (이전과 동일) ---
    const svgElement = svgRef.current;
    const svg = d3
      .select(svgElement)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height].join(" "))
      .style("background-color", "white");
    svg.selectAll("*").remove();
    const simulation = d3
      .forceSimulation<NodeDatum, EdgeDatum>(graphData.nodes)
      .force(
        "link",
        d3
          .forceLink<NodeDatum, EdgeDatum>(graphData.edges)
          .id((d) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(0, 0))
      .force("collide", d3.forceCollide<NodeDatum>().radius(25));
    const g = svg.append("g").attr("class", "everything");
    const link = g
      .append("g") /* ... 링크 ... */
      .attr("class", "links")
      .selectAll("line")
      .data(graphData.edges)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1.5);
    const nodeGroup = g
      .append("g") /* ... 노드 ... */
      .attr("class", "nodes")
      .selectAll("g.node-item")
      .data(graphData.nodes)
      .join("g")
      .attr("class", "node-item");

    // --- 노드 생성 및 클릭 핸들러 수정 ---
    nodeGroup
      .append("circle")
      .attr("r", 12)
      .attr("fill", (d: NodeDatum) =>
        d.id === currentNodeId ? colorDarkBlue : colorLightBlue
      ) // 색상 적용
      .style("cursor", "pointer") // 클릭 가능 표시
      .on("click", (event, d: NodeDatum) => {
        console.log("Node clicked:", d.id);
        // URL 쿼리 파라미터를 사용하여 페이지 이동 (새로고침 없이)
        router.push(`/?note=${d.id}`); // <--- 클릭 시 URL 변경
      });

    nodeGroup
      .append("text") /* ... 텍스트 ... */
      .text((d: NodeDatum) => d.label)
      .attr("x", 15)
      .attr("y", 5)
      .style("font-size", "10px")
      .style("fill", "#333")
      .style("pointer-events", "none");

    // --- 드래그 핸들러 (이전과 동일) ---
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
    nodeGroup.call(dragHandler as any);

    // --- 줌 핸들러 (이전과 동일) ---
    const zoomHandler = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .filter((event) => !event.target.closest(".node-item")) // 노드 위에서는 줌 방지
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    svg.call(zoomHandler as any);

    // --- Tick 함수 (이전과 동일) ---
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as NodeDatum).x ?? 0)
        .attr("y1", (d) => (d.source as NodeDatum).y ?? 0)
        .attr("x2", (d) => (d.target as NodeDatum).x ?? 0)
        .attr("y2", (d) => (d.target as NodeDatum).y ?? 0);
      nodeGroup.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    // --- Cleanup (이전과 동일) ---
    return () => {
      simulation.stop();
    };
  }, [graphData, dimensions, currentNodeId, router]); // <--- 의존성 배열에 router 추가

  return (
    <div
      ref={containerRef}
      className="w-full h-full border border-gray-700 overflow-hidden"
    >
      <svg ref={svgRef} />
    </div>
  );
};

export default NoteGraph;
