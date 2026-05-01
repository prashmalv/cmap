"use client";
import { useCallback, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  NodeProps,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import type { CareerMatch } from "@/lib/career-engine";
import matrixData from "@/data/career-matrix.json";

// --- Custom node components ---

function RootNode({ data }: NodeProps) {
  return (
    <div className="bg-gradient-to-br from-brand to-brand-dark text-white rounded-2xl px-5 py-3 shadow-lg text-center min-w-[160px]">
      <div className="text-2xl mb-1">👤</div>
      <div className="font-bold text-sm">{data.name ?? "Your Profile"}</div>
      <div className="text-xs opacity-80">{data.subtitle}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: "white" }} />
    </div>
  );
}

function CategoryNode({ data }: NodeProps) {
  return (
    <div
      className="rounded-xl px-4 py-2 shadow-md text-white text-center min-w-[140px] border-2 border-white/20"
      style={{ background: data.color ?? "#1D4ED8" }}
    >
      <Handle type="target" position={Position.Top} style={{ background: "white" }} />
      <div className="text-xl mb-0.5">{data.icon}</div>
      <div className="font-semibold text-xs leading-tight">{data.label}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: "white" }} />
    </div>
  );
}

function CareerNode({ data, selected }: NodeProps) {
  const eligibilityColor =
    data.eligibility === "eligible" ? "#16A34A" : "#D97706";

  return (
    <div
      onClick={() => data.onSelect?.(data.careerId)}
      className="rounded-xl px-3 py-2 shadow-sm cursor-pointer transition-all hover:shadow-md min-w-[150px] max-w-[180px]"
      style={{
        background: "white",
        border: `2px solid ${eligibilityColor}`,
        outline: selected ? `3px solid ${eligibilityColor}` : "none",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: eligibilityColor }} />
      <div className="flex items-center gap-1.5 mb-1">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: eligibilityColor }}
        />
        <span
          className="text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: eligibilityColor }}
        >
          {data.eligibility === "eligible" ? "Eligible" : "Partial"}
        </span>
      </div>
      <div className="text-xs font-semibold text-slate-800 leading-tight mb-1">
        {data.label}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400">{data.salary}</span>
        <span className="text-[10px] bg-slate-100 text-slate-600 rounded px-1 font-mono">
          {data.score}%
        </span>
      </div>
      <div className="mt-1.5 flex gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); data.onSelect?.(data.careerId); }}
          className="flex-1 text-[9px] bg-brand text-white rounded px-1.5 py-0.5 hover:bg-brand-dark transition-colors"
        >
          Roadmap
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); data.onChat?.(data.careerId); }}
          className="flex-1 text-[9px] border border-brand text-brand rounded px-1.5 py-0.5 hover:bg-brand/5 transition-colors"
        >
          Ask AI
        </button>
      </div>
    </div>
  );
}

const NODE_TYPES = { root: RootNode, category: CategoryNode, career: CareerNode };

interface CareerFlowMapProps {
  matches: CareerMatch[];
  profileName?: string;
  profileSubtitle?: string;
  onSelectCareer: (id: string) => void;
  onChatCareer: (id: string) => void;
}

export function CareerFlowMap({
  matches,
  profileName,
  profileSubtitle,
  onSelectCareer,
  onChatCareer,
}: CareerFlowMapProps) {
  const { nodes: initNodes, edges: initEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Group by category
    const catGroups: Record<string, CareerMatch[]> = {};
    matches.forEach((m) => {
      if (!catGroups[m.career.category]) catGroups[m.career.category] = [];
      catGroups[m.career.category].push(m);
    });

    const categories = Object.keys(catGroups);
    const CAT_SPACING = 280;
    const CAREER_SPACING_X = 200;
    const CAREER_SPACING_Y = 160;

    nodes.push({
      id: "root",
      type: "root",
      position: { x: (categories.length * CAT_SPACING) / 2 - 80, y: 0 },
      data: { name: profileName, subtitle: profileSubtitle },
      draggable: true,
    });

    categories.forEach((cat, ci) => {
      const catX = ci * CAT_SPACING;
      const catInfo = (matrixData.categories as Record<string, { label: string; icon: string; color: string }>)[cat];
      const catNodeId = `cat-${cat}`;

      nodes.push({
        id: catNodeId,
        type: "category",
        position: { x: catX, y: 180 },
        data: { label: catInfo?.label ?? cat, icon: catInfo?.icon, color: catInfo?.color },
        draggable: true,
      });

      edges.push({
        id: `e-root-${cat}`,
        source: "root",
        target: catNodeId,
        animated: true,
        style: { stroke: catInfo?.color, strokeWidth: 2 },
      });

      const careers = catGroups[cat].slice(0, 4);
      const totalW = (careers.length - 1) * CAREER_SPACING_X;
      const startX = catX - totalW / 2;

      careers.forEach((match, ji) => {
        const careerNodeId = `career-${match.career.id}`;
        nodes.push({
          id: careerNodeId,
          type: "career",
          position: { x: startX + ji * CAREER_SPACING_X, y: 380 + Math.floor(ji / 2) * CAREER_SPACING_Y },
          data: {
            label: match.career.title.length > 35 ? match.career.title.slice(0, 35) + "…" : match.career.title,
            eligibility: match.eligibility,
            score: match.match_score,
            salary: match.career.salary_range.entry.slice(0, 12),
            careerId: match.career.id,
            onSelect: onSelectCareer,
            onChat: onChatCareer,
          },
          draggable: true,
        });

        edges.push({
          id: `e-${cat}-${match.career.id}`,
          source: catNodeId,
          target: careerNodeId,
          style: { stroke: catInfo?.color ?? "#94A3B8", strokeWidth: 1.5 },
        });
      });
    });

    return { nodes, edges };
  }, [matches, profileName, profileSubtitle, onSelectCareer, onChatCareer]);

  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, , onEdgesChange] = useEdgesState(initEdges);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === "career" && node.data.careerId) {
        onSelectCareer(node.data.careerId);
      }
    },
    [onSelectCareer]
  );

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-slate-200">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        maxZoom={1.5}
        attributionPosition="bottom-left"
      >
        <Background color="#e2e8f0" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === "root") return "#1D4ED8";
            if (node.type === "category") return "#64748b";
            return node.data.eligibility === "eligible" ? "#16A34A" : "#D97706";
          }}
          maskColor="rgba(255,255,255,0.7)"
        />
      </ReactFlow>
    </div>
  );
}
