// components/NoteGraph.tsx
"use client"; // useRouter 훅을 사용하므로 클라이언트 컴포넌트

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
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(graphData.edges)
      .join("line")
      .attr("stroke", "var(--link-color, #999)") // CSS 변수 사용 또는 기본값
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1.5);

    // nodeGroup 타입 명시 및 selectAll, join에 제네릭 타입 명시
    const nodeGroup: d3.Selection<
      SVGGElement,
      NodeDatum,
      SVGGElement,
      unknown
    > = g
      .append("g")
      .attr("class", "nodes")
      .selectAll<SVGGElement, unknown>("g.node-item") // selectAll에 제네릭 타입 <GElement, OldDatum> 명시
      .data(graphData.nodes)
      .join<SVGGElement>("g") // join에 제네릭 타입 <EnterGElement> 명시
      .attr("class", "node-item");

    nodeGroup
      .append("circle")
      .attr("r", 12)
      .attr("fill", (d: NodeDatum) =>
        d.id === currentNodeId
          ? "var(--accent-selected)" // <--- 변경된 부분
          : "var(--accent-default)"
      )
      .style("cursor", "pointer")
      .on("click", (event, d: NodeDatum) => {
        router.push(`/?note=${d.id}`);
      });

    nodeGroup
      .append("text")
      .text((d: NodeDatum) => d.label)
      .attr("x", 15)
      .attr("y", 5)
      .style("font-size", "10px")
      .style("fill", "var(--text-color, #333)") // CSS 변수 사용 또는 기본값
      .style("pointer-events", "none");

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

    nodeGroup.call(dragHandler);

    const zoomHandler = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .filter((event) => {
        const target = event.target as Element | null;
        return target && typeof target.closest === "function"
          ? !target.closest(".node-item")
          : true;
      })
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      });

    svg.call(zoomHandler);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as NodeDatum).x ?? 0)
        .attr("y1", (d) => (d.source as NodeDatum).y ?? 0)
        .attr("x2", (d) => (d.target as NodeDatum).x ?? 0)
        .attr("y2", (d) => (d.target as NodeDatum).y ?? 0);
      nodeGroup.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [graphData, dimensions, currentNodeId, router]);

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
