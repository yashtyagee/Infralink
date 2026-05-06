import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Database, Shield, Plus, Minus, Network, Focus, Building2, AlertCircle, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

const API = 'http://localhost:8000';

// --- Custom Node Component ---
const CustomNode = ({ data }) => {
  let Icon = Database;
  if (data.type === 'ubid') Icon = Shield;
  if (data.type === 'dept') Icon = Building2;
  if (data.type === 'hub') Icon = Network;

  const isHub = data.type === 'hub';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05, boxShadow: `0 0 30px ${data.color}44` }}
      style={{
        padding: isHub ? '18px 24px' : '14px 18px',
        borderRadius: '16px',
        background: isHub ? 'rgba(25, 18, 10, 0.95)' : 'rgba(15, 15, 25, 0.92)',
        backdropFilter: 'blur(12px)',
        border: `${isHub ? '2px' : '1px'} solid ${data.color}${isHub ? '99' : '44'}`,
        boxShadow: isHub ? `0 0 40px ${data.color}33, 0 8px 32px rgba(0,0,0,0.6)` : `0 8px 32px rgba(0,0,0,0.4)`,
        color: '#fff',
        minWidth: isHub ? '240px' : '200px',
        position: 'relative',
        cursor: isHub ? 'default' : 'grab'
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: data.color, border: 'none', width: '8px', height: '8px' }} />

      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          padding: '8px', 
          borderRadius: '12px', 
          background: `${data.color}15`,
          border: `1px solid ${data.color}33`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={20} color={data.color} />
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '800', fontFamily: 'Space Grotesk', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>{data.label}</div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{data.sub}</div>
        </div>
        
        {data.hasChildren && (
          <button 
            onClick={(e) => { e.stopPropagation(); if (data.onToggle) data.onToggle(data.id, data.type); }}
            style={{ 
              background: 'rgba(255,255,255,0.06)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              color: '#fff', 
              borderRadius: '8px', 
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {data.isExpanded ? <Minus size={14} /> : <Plus size={14} />}
          </button>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: data.color, border: 'none', width: '8px', height: '8px' }} />
    </motion.div>
  );
};

const nodeTypes = { custom: CustomNode };

function FlowContent() {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use a ref so onToggle always has the latest fitView without stale closures
  const fitViewRef = useRef(fitView);
  useEffect(() => { fitViewRef.current = fitView; }, [fitView]);

  // ── Helper: collect all descendants of a node ──────────────────────────────
  const getDescendants = useCallback((nodeId, allEdges) => {
    const children = allEdges.filter(e => e.source === nodeId).map(e => e.target);
    let descendants = [...children];
    for (const child of children) {
      descendants = descendants.concat(getDescendants(child, allEdges));
    }
    return descendants;
  }, []);

  // ── onToggle: defined BEFORE useEffect so it is stable at node-creation time ─
  const onToggle = useCallback(async (id, type) => {
    // ── COLLAPSE ────────────────────────────────────────────────────────────
    let isExpanded = false;
    setNodes(nds => {
      const node = nds.find(n => n.id === id);
      isExpanded = node?.data?.isExpanded ?? false;
      return nds;
    });

    if (isExpanded) {
      setEdges(eds => {
        const descendants = getDescendants(id, eds);
        setNodes(nds =>
          nds
            .filter(n => !descendants.includes(n.id))
            .map(n => n.id === id ? { ...n, data: { ...n.data, isExpanded: false } } : n)
        );
        return eds.filter(e => e.source !== id && !descendants.includes(e.source));
      });
      return;
    }

    // ── EXPAND ──────────────────────────────────────────────────────────────
    let parentNode = null;
    setNodes(nds => { parentNode = nds.find(n => n.id === id); return nds; });
    if (!parentNode) return;

    try {
      let newNodes = [];
      let newEdges = [];

      if (type === 'ubid') {
        const res = await fetch(`${API}/api/ubid/${id}/sources`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json();
        const records = payload.records || [];

        const depts = [...new Set(records.map(r => r.source_department).filter(Boolean))];
        if (depts.length === 0) return; // nothing to expand

        const spacing = 260;
        const startX = -((depts.length - 1) * spacing) / 2;

        depts.forEach((dept, i) => {
          const deptId = `dept-${id}-${dept.replace(/\s+/g, '_')}`;
          newNodes.push({
            id: deptId,
            type: 'custom',
            position: { x: startX + i * spacing, y: 220 },
            data: {
              id: deptId,
              label: dept,
              sub: 'Department Registry',
              type: 'dept',
              color: '#B497CF',
              hasChildren: true,
              isExpanded: false,
              onToggle,
              parentUbid: id
            }
          });
          newEdges.push({
            id: `e-${id}-${deptId}`,
            source: id,
            target: deptId,
            animated: true,
            style: { stroke: '#B497CF', strokeWidth: 2 },
            type: 'smoothstep'
          });
        });

      } else if (type === 'dept') {
        const ubid = parentNode.data.parentUbid;
        const deptName = parentNode.data.label;

        const res = await fetch(`${API}/api/ubid/${ubid}/sources`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json();
        const records = (payload.records || []).filter(r => r.source_department === deptName);

        if (records.length === 0) return;

        const spacing = 210;
        const startX = -((records.length - 1) * spacing) / 2;

        records.forEach((rec, i) => {
          const recId = `rec-${rec.id}`;
          newNodes.push({
            id: recId,
            type: 'custom',
            position: { x: startX + i * spacing, y: 220 },
            data: {
              id: recId,
              label: rec.name || `Record ${rec.id.substring(0, 8)}`,
              sub: `ID: ${String(rec.id).substring(0, 8)}`,
              type: 'source',
              color: '#5227FF',
              hasChildren: false,
              onToggle
            }
          });
          newEdges.push({
            id: `e-${id}-${recId}`,
            source: id,
            target: recId,
            animated: true,
            style: { stroke: '#5227FF', strokeWidth: 2, strokeDasharray: '5,5' },
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#5227FF' }
          });
        });
      }

      // Offset child positions relative to parent
      const absNodes = newNodes.map(n => ({
        ...n,
        position: {
          x: parentNode.position.x + n.position.x,
          y: parentNode.position.y + n.position.y
        }
      }));

      setNodes(nds =>
        nds
          .map(n => n.id === id ? { ...n, data: { ...n.data, isExpanded: true } } : n)
          .concat(absNodes)
      );
      setEdges(eds => [...eds, ...newEdges]);

      setTimeout(() => fitViewRef.current({ padding: 0.2, duration: 800 }), 150);

    } catch (err) {
      console.error('Failed to expand node:', err);
    }
  }, [getDescendants]);

  // ── Initial data load ──────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`${API}/api/ubid`)
      .then(res => {
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        return res.json();
      })
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        if (list.length === 0) {
          setLoading(false);
          return;
        }

        // ── Central "UBID Registry" hub node ──────────────────────────────
        const hubNode = {
          id: '__HUB__',
          type: 'custom',
          position: { x: 0, y: 0 },
          data: {
            id: '__HUB__',
            label: 'UBID Registry',
            sub: `${list.length} Entities Registered`,
            type: 'hub',
            color: '#ff9f43',
            hasChildren: false,
            isExpanded: false,
          }
        };

        // ── Radial layout: all UBID nodes around the hub ─────────────────
        const topUbids = list.slice(0, 12);
        const radius = 380;
        const angleStep = (2 * Math.PI) / topUbids.length;

        const ubidNodes = topUbids.map((ubid, index) => ({
          id: ubid.ubid,
          type: 'custom',
          position: {
            x: Math.cos(index * angleStep - Math.PI / 2) * radius,
            y: Math.sin(index * angleStep - Math.PI / 2) * radius
          },
          data: {
            id: ubid.ubid,
            label: ubid.canonical_name || ubid.ubid,
            sub: `UBID • ${ubid.record_count || 0} records • ${(ubid.source_departments || []).length} depts`,
            type: 'ubid',
            color: '#7cff67',
            hasChildren: true,
            isExpanded: false,
            onToggle
          }
        }));

        // ── Edges from hub → each UBID ────────────────────────────────────
        const hubEdges = topUbids.map((ubid) => ({
          id: `hub-${ubid.ubid}`,
          source: '__HUB__',
          target: ubid.ubid,
          style: { stroke: '#ff9f4355', strokeWidth: 1.5, strokeDasharray: '6 3' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#ff9f43' },
          animated: true
        }));

        setNodes([hubNode, ...ubidNodes]);
        setEdges(hubEdges);
        setTimeout(() => fitViewRef.current({ duration: 800, padding: 0.15 }), 150);
        setLoading(false);
      })
      .catch(err => {
        console.error('Knowledge graph load error:', err);
        setError(err.message);
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onToggle]);


  const onNodeDoubleClick = useCallback((event, node) => {
    fitViewRef.current({ nodes: [node], duration: 800, padding: 0.5 });
  }, []);

  // ── Overlay: loading / error / empty ──────────────────────────────────────
  const Overlay = ({ children }) => (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 20,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '16px',
      background: 'rgba(7, 8, 12, 0.85)', backdropFilter: 'blur(6px)'
    }}>
      {children}
    </div>
  );

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeDoubleClick={onNodeDoubleClick}
        fitView
        colorMode="dark"
        minZoom={0.2}
        maxZoom={2}
      >
        <Background variant="dots" gap={24} size={1} color="rgba(255,255,255,0.07)" />
        <Controls style={{
          background: 'rgba(15, 15, 25, 0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }} />
        <MiniMap
          nodeColor={n => n.data?.color || '#333'}
          maskColor="rgba(0,0,0,0.6)"
          style={{
            background: 'rgba(15, 15, 25, 0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px'
          }}
        />
      </ReactFlow>

      {/* Loading state */}
      {loading && (
        <Overlay>
          <Loader size={32} color="#7cff67" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Space Grotesk', margin: 0 }}>
            Loading Knowledge Graph…
          </p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </Overlay>
      )}

      {/* Error state */}
      {!loading && error && (
        <Overlay>
          <AlertCircle size={36} color="#ff6b6b" />
          <p style={{ color: '#ff6b6b', fontFamily: 'Space Grotesk', margin: 0, fontWeight: 700 }}>
            Could not connect to backend
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Space Grotesk', margin: 0, fontSize: '0.8rem', textAlign: 'center', maxWidth: 320 }}>
            Make sure the Python backend is running on <code style={{ color: '#7cff67' }}>localhost:8000</code><br />
            <em>{error}</em>
          </p>
        </Overlay>
      )}

      {/* Empty state — backend is up but no data ingested yet */}
      {!loading && !error && nodes.length === 0 && (
        <Overlay>
          <Network size={48} color="rgba(124,255,103,0.4)" />
          <p style={{ color: '#fff', fontFamily: 'Space Grotesk', margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>
            No UBID Profiles Found
          </p>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Space Grotesk', margin: 0, fontSize: '0.8rem', textAlign: 'center', maxWidth: 340, lineHeight: 1.6 }}>
            Upload a CSV and run the AI Pipeline to generate UBID profiles.<br />
            The graph will populate automatically once profiles exist.
          </p>
        </Overlay>
      )}

      {/* Helper Legend */}
      {!loading && !error && nodes.length > 0 && (
        <div style={{ position: 'absolute', bottom: 24, left: 24, zIndex: 10, display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Focus size={12} /> Double-click to Focus
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Plus size={12} /> Click + to Expand Node
          </div>
        </div>
      )}
    </div>
  );
}

export default function GraphVisualization() {
  return (
    <div
      className="dashboard-section"
      style={{
        height: '600px',
        background: '#07080c',
        borderRadius: '20px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        position: 'relative'
      }}
    >
      <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 10, pointerEvents: 'none' }}>
        <h2
          className="dash-card-title"
          style={{
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#fff',
            fontSize: '1.2rem',
            fontWeight: '800',
            fontFamily: 'Space Grotesk'
          }}
        >
          <Network size={22} style={{ color: 'var(--green)' }} />
          Knowledge Mind-Map
        </h2>
      </div>

      <ReactFlowProvider>
        <FlowContent />
      </ReactFlowProvider>
    </div>
  );
}
