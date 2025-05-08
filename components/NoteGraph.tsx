"use client";

import React, { useEffect, useRef, useMemo, useState } from "react";
import * as d3 from "d3";
import { useRouter } from "next/navigation";

// 인터페이스 정의
interface NodeDatum extends d3.SimulationNodeDatum {
  id: string; // 정규화된 슬러그
  label: string; // 원본 제목
}
interface EdgeDatum extends d3.SimulationLinkDatum<NodeDatum> {
  id: string;
  source: string | NodeDatum; // 정규화된 슬러그 참조
  target: string | NodeDatum; // 정규화된 슬러그 참조
}
interface NoteGraphProps {
  initialNodes: { id: string; label: string }[]; // id: slug, label: title
  initialEdges: { id: string; source: string; target: string }[]; // source/target: slug
  currentNodeId?: string | null; // 정규화된 슬러그
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

  const currentTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

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
      const updateDimensions = () => {
        const newWidth = currentContainer.clientWidth;
        const newHeight = currentContainer.clientHeight;
        if (newWidth > 0 && newHeight > 0) {
          setDimensions({ width: newWidth, height: newHeight });
        }
      };
      updateDimensions();
      const resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(currentContainer);
      return () => resizeObserver.unobserve(currentContainer);
    }
  }, []);

  // D3 렌더링 및 업데이트 useEffect
  useEffect(() => {
    const { width, height } = dimensions;
    const svgElement = svgRef.current;

    if (
      !svgElement ||
      graphData.nodes.length === 0 ||
      width === 0 ||
      height === 0
    ) {
      if (svgElement) d3.select(svgElement).selectAll("*").remove();
      return;
    }

    const svg = d3
      .select(svgElement)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height].join(" "))
      .style("background-color", "var(--card-background)");

    svg.selectAll("*").remove();

    const simulation = d3
      .forceSimulation<NodeDatum, EdgeDatum>(graphData.nodes)
      .force(
        "link",
        d3
          .forceLink<NodeDatum, EdgeDatum>(graphData.edges)
          .id((d: NodeDatum) => d.id)
          .distance(70)
      )
      .force("charge", d3.forceManyBody().strength(-120))
      .force("center", d3.forceCenter(0, 0))
      .force("collide", d3.forceCollide<NodeDatum>().radius(15));

    const g = svg.append("g").attr("class", "everything");

    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(graphData.edges)
      .join("line")
      .attr("stroke", "var(--foreground-muted)")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1.5);

    const nodeGroup: d3.Selection<
      SVGGElement,
      NodeDatum,
      SVGGElement,
      unknown
    > = g
      .append("g")
      .attr("class", "nodes")
      .selectAll<SVGGElement, unknown>("g.node-item")
      .data(graphData.nodes, (d: any) => d.id)
      .join<SVGGElement>("g")
      .attr("class", "node-item");

    nodeGroup
      .append("circle")
      .attr("r", 6)
      .attr("fill", (d: NodeDatum) =>
        d.id === currentNodeId
          ? "var(--accent-selected-node)"
          : "var(--accent-default)"
      )
      .style("cursor", "pointer")
      .on("click", (event, d: NodeDatum) => {
        router.push(`/?note=${d.id}`);
      });

    nodeGroup
      .append("text")
      .text((d: NodeDatum) => d.label)
      .attr("x", 0)
      .attr("y", -10)
      .style("font-size", "9px")
      .style("text-anchor", "middle")
      .style("fill", (d: NodeDatum) =>
        d.id === currentNodeId ? "var(--accent-selected-text)" : "var(--foreground)"
      )
      .style("pointer-events", "none");

    const dragHandler = d3
      .drag<SVGGElement, NodeDatum>()
      .on("start", (event, d: NodeDatum) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x ?? 0;
        d.fy = d.y ?? 0;
      })
      .on("drag", (event, d: NodeDatum) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d: NodeDatum) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
    nodeGroup.call(dragHandler);

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .filter((event) => !event.target.closest(".node-item"))
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
        currentTransformRef.current = event.transform;
      });
    svg.call(zoomBehavior);
    zoomRef.current = zoomBehavior;

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as NodeDatum).x ?? 0)
        .attr("y1", (d) => (d.source as NodeDatum).y ?? 0)
        .attr("x2", (d) => (d.target as NodeDatum).x ?? 0)
        .attr("y2", (d) => (d.target as NodeDatum).y ?? 0);
      nodeGroup.attr(
        "transform",
        (d: NodeDatum) => `translate(${d.x ?? 0},${d.y ?? 0})`
      );
    });

    return () => {
      simulation.stop();
    };
  }, [graphData, dimensions, currentNodeId, router]);

  // currentNodeId 변경 시 중앙으로 이동시키는 useEffect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (
        !svgRef.current ||
        !zoomRef.current ||
        !currentNodeId ||
        graphData.nodes.length === 0 ||
        dimensions.width === 0 ||
        dimensions.height === 0
      ) {
        return;
      }

      const svg = d3.select(svgRef.current);
      const zoomBehavior = zoomRef.current;
      const currentTransform = currentTransformRef.current;
      const targetNode = graphData.nodes.find(
        (node) => node.id === currentNodeId
      );

      if (
        targetNode &&
        typeof targetNode.x === "number" &&
        typeof targetNode.y === "number"
      ) {
        const targetX = targetNode.x;
        const targetY = targetNode.y;
        const currentScale = currentTransform.k;

        const newX = 0 - targetX * currentScale;
        const newY = 0 - targetY * currentScale;
        const newTransform = d3.zoomIdentity
          .translate(newX, newY)
          .scale(currentScale);

        svg
          .transition()
          .duration(750)
          .call(zoomBehavior.transform, newTransform);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [currentNodeId, graphData.nodes, dimensions]);

  return (
    <div
      ref={containerRef}
      className="note-graph-container w-full h-full border border-[var(--border-color)] bg-[var(--card-background)] overflow-hidden transition-colors duration-150 ease-in-out"
    >
      <svg ref={svgRef} />
    </div>
  );
};

export default NoteGraph;
