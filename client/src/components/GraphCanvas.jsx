import React, { useRef, useEffect, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { ZoomIn, ZoomOut, Maximize2, Shield, Eye, Lock, Server, Cpu, Database, AlertTriangle } from 'lucide-react';

export default function GraphCanvas({
  graphData,
  onNodeClick,
  selectedNode,
  isTrapTriggered,
  isLoading
}) {
  const fgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState(null);

  // Resize canvas dynamically to fit 70% container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Auto-center graph when data updates
  useEffect(() => {
    if (fgRef.current && graphData.nodes?.length > 0) {
      setTimeout(() => {
        fgRef.current.zoomToFit(400, 70);
      }, 300);
    }
  }, [graphData]);

  // Zoom controls
  const handleZoomIn = () => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() * 1.3, 300);
  };
  const handleZoomOut = () => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() * 0.7, 300);
  };
  const handleZoomReset = () => {
    if (fgRef.current) fgRef.current.zoomToFit(400, 70);
  };

  /**
   * Custom Node Canvas Painting:
   * Blue: cyan/blue
   * Red: crimson/red
   * Trap: glowing orange
   */
  const paintNode = useCallback((node, ctx, globalScale) => {
    const isSelected = selectedNode?.id === node.id;
    const isHovered = hoveredNode?.id === node.id;
    const nodeType = node.type || (node.is_decoy ? 'Red' : 'Blue');
    const radius = nodeType === 'Trap' ? 14 : 18;

    // Determine color schemes
    let mainColor, glowColor, ringColor, badgeLabel;
    if (nodeType === 'Blue') {
      mainColor = '#06b6d4'; // Cyan
      glowColor = 'rgba(6, 182, 212, 0.4)';
      ringColor = '#38bdf8';
      badgeLabel = node.label || 'REAL ASSET';
    } else if (nodeType === 'Red') {
      mainColor = '#ef4444'; // Crimson
      glowColor = 'rgba(239, 68, 68, 0.45)';
      ringColor = '#f87171';
      badgeLabel = 'HONEYNET DECOY';
    } else {
      // Trap
      mainColor = '#f59e0b'; // Glowing Orange
      glowColor = 'rgba(245, 158, 11, 0.6)';
      ringColor = '#fbbf24';
      badgeLabel = 'CANARY TRAP';
    }

    ctx.save();

    // 1. Outer Glow Aura (Radial gradient)
    const glowRadius = radius * (isSelected || isHovered ? 2.6 : 1.9);
    const grad = ctx.createRadialGradient(node.x, node.y, radius * 0.5, node.x, node.y, glowRadius);
    grad.addColorStop(0, glowColor);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(node.x, node.y, glowRadius, 0, 2 * Math.PI, false);
    ctx.fill();

    // 2. Outer Ring
    ctx.strokeStyle = isSelected ? '#ffffff' : ringColor;
    ctx.lineWidth = isSelected ? 3 : 1.8;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius + (isSelected ? 4 : 2), 0, 2 * Math.PI, false);
    ctx.stroke();

    // 3. Inner Solid Circle
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fill();

    // 4. Subtle inner dark circle for high-tech cyber contrast
    ctx.fillStyle = '#090e1f';
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius * 0.68, 0, 2 * Math.PI, false);
    ctx.fill();

    // 5. Node Glyph / Icon letter
    ctx.fillStyle = mainColor;
    ctx.font = `bold ${radius * 0.75}px 'Fira Code', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const glyph = node.id === 'Admin_Laptop' ? '💻' :
                  node.id === 'Core_Router' || node.id === 'Shadow_Router' ? '🌐' :
                  node.id === 'Prod_DB' || node.id === 'Fake_DB' ? '🗄️' :
                  '🔑';
    ctx.fillText(glyph, node.x, node.y);

    // 6. Label & Type Text Below Node
    const fontSize = Math.max(10, 13 / globalScale);
    ctx.font = `600 ${fontSize}px 'Inter', sans-serif`;
    ctx.fillStyle = isSelected ? '#ffffff' : '#e2e8f0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const label = node.name || node.id;
    ctx.fillText(label, node.x, node.y + radius + 7);

    // 7. Small Cyber Category Badge
    const badgeFontSize = Math.max(8, 10 / globalScale);
    ctx.font = `500 ${badgeFontSize}px 'Fira Code', monospace`;
    ctx.fillStyle = mainColor;
    ctx.fillText(`[${badgeLabel}]`, node.x, node.y + radius + 7 + fontSize + 2);

    ctx.restore();
  }, [selectedNode, hoveredNode]);

  /**
   * Pointer hit-test area
   */
  const paintNodePointerArea = useCallback((node, color, ctx) => {
    const radius = (node.type === 'Trap' ? 14 : 18) + 6;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fill();
  }, []);

  /**
   * Custom Link Canvas Painting:
   * The :REROUTED_TO link should be dashed and colored red to indicate malicious traffic isolation.
   */
  const paintLink = useCallback((link, ctx, globalScale) => {
    const isRerouted = link.type === 'REROUTED_TO';
    const isTrapLink = link.type === 'CONTAINS_FILE';

    const source = link.source;
    const target = link.target;
    if (!source || !target || typeof source.x === 'undefined' || typeof target.x === 'undefined') {
      return;
    }

    ctx.save();

    if (isRerouted) {
      // Malicious Rerouted Link: Dashed, Crimson Red, Glowing!
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 5]); // Dashed line per spec

      // Glow effect for rerouted link
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;
    } else if (isTrapLink) {
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
    } else {
      // Normal enterprise link: Blue/Teal
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
    }

    // Draw line
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();

    // Link Label in the center
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;

    const labelFontSize = Math.max(9, 11 / globalScale);
    ctx.font = `600 ${labelFontSize}px 'Fira Code', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const text = `:${link.type}`;
    const textWidth = ctx.measureText(text).width;

    // Background pill behind label
    ctx.fillStyle = isRerouted ? 'rgba(69, 10, 10, 0.85)' : 'rgba(11, 19, 41, 0.85)';
    ctx.strokeStyle = isRerouted ? '#ef4444' : 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.roundRect(midX - textWidth / 2 - 6, midY - labelFontSize / 2 - 3, textWidth + 12, labelFontSize + 6, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isRerouted ? '#fca5a5' : '#7dd3fc';
    ctx.fillText(text, midX, midY);

    ctx.restore();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#050811] overflow-hidden cyber-grid">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#050811]/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-cyan-400 font-mono text-sm tracking-widest animate-pulse">
            SYNCHRONIZING GRAPH TOPOLOGY...
          </p>
        </div>
      )}

      {/* ForceGraph Canvas */}
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeId="id"
        nodeCanvasObject={paintNode}
        nodePointerAreaPaint={paintNodePointerArea}
        linkCanvasObject={paintLink}
        linkDirectionalParticles={link => (link.type === 'REROUTED_TO' ? 5 : 2)}
        linkDirectionalParticleSpeed={link => (link.type === 'REROUTED_TO' ? 0.015 : 0.006)}
        linkDirectionalParticleWidth={link => (link.type === 'REROUTED_TO' ? 3.5 : 2)}
        linkDirectionalParticleColor={link => (link.type === 'REROUTED_TO' ? '#ef4444' : '#38bdf8')}
        onNodeClick={onNodeClick}
        onNodeHover={setHoveredNode}
        cooldownTicks={120}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        warmupTicks={50}
        backgroundColor="#050811"
      />

      {/* Active Defense Overlay Banner when Rerouted */}
      {isTrapTriggered && (
        <div className="absolute top-4 left-6 pointer-events-none z-10 animate-fade-in">
          <div className="flex items-center space-x-3 px-4 py-2 rounded-lg bg-red-950/80 border border-red-500/60 shadow-[0_0_25px_rgba(239,68,68,0.4)] backdrop-blur-md">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <div>
              <div className="text-xs font-bold text-red-200 tracking-wider font-mono">
                ACTIVE DEFENSE ENGAGED: THREAT CONTAINED
              </div>
              <div className="text-[11px] text-red-300/80 font-mono">
                Admin_Laptop isolated ➔ Rerouted to Honeynet Decoy Router
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Canvas Top-Right Zoom & Pan Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-1.5 z-10 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-lg border border-slate-800 shadow-lg">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomReset}
          title="Fit to Screen"
          className="p-2 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas Bottom-Left Legend */}
      <div className="absolute bottom-4 left-6 z-10 bg-slate-950/80 backdrop-blur-md p-3.5 rounded-xl border border-slate-800/80 shadow-xl max-w-sm pointer-events-auto">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2 flex items-center justify-between">
          <span>Topology Legend</span>
          <span className="text-[10px] text-slate-500 font-mono">Cypher Spec</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <span className="text-slate-300">Blue: Enterprise Real</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <span className="text-slate-300">Red: Honeynet Decoy</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            <span className="text-slate-300">Trap: Honeytoken Key</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 border-b-2 border-dashed border-red-500" />
            <span className="text-red-400">:REROUTED_TO Link</span>
          </div>
        </div>
      </div>
    </div>
  );
}

