import React from 'react';
import { X, Server, Shield, AlertTriangle, Key, Terminal, ExternalLink } from 'lucide-react';

export default function NodeDetailModal({ node, onClose }) {
  if (!node) return null;

  const isDecoy = node.is_decoy;
  const isTrap = node.type === 'Trap';
  const isBlue = node.type === 'Blue';

  return (
    <div className="absolute top-4 left-6 z-20 w-80 bg-[#091124]/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden font-mono select-none animate-fade-in">
      {/* Header */}
      <div className={`p-3 border-b flex items-center justify-between ${
        isTrap
          ? 'bg-amber-950/40 border-amber-500/30'
          : isDecoy
          ? 'bg-red-950/40 border-red-500/30'
          : 'bg-cyan-950/40 border-cyan-500/30'
      }`}>
        <div className="flex items-center space-x-2">
          {isTrap ? (
            <Key className="w-4 h-4 text-amber-400" />
          ) : isDecoy ? (
            <AlertTriangle className="w-4 h-4 text-red-400" />
          ) : (
            <Server className="w-4 h-4 text-cyan-400" />
          )}
          <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            {node.name || node.id}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Properties */}
      <div className="p-4 space-y-3 text-xs">
        <div className="flex justify-between items-center py-1 border-b border-slate-800">
          <span className="text-slate-400">Node ID:</span>
          <span className="text-slate-200 font-bold">{node.id}</span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-slate-800">
          <span className="text-slate-400">Neo4j Label:</span>
          <span className="text-cyan-400">:{node.label || 'Asset'}</span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-slate-800">
          <span className="text-slate-400">Classification:</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            isTrap
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : isDecoy
              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
          }`}>
            {isTrap ? 'HONEYTOKEN CANARY' : isDecoy ? 'DECOY HONEYNET' : 'REAL ENTERPRISE'}
          </span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-slate-800">
          <span className="text-slate-400">Is Decoy:</span>
          <span className={node.is_decoy ? 'text-red-400 font-bold' : 'text-emerald-400'}>
            {String(node.is_decoy)}
          </span>
        </div>
        {node.ip && (
          <div className="flex justify-between items-center py-1 border-b border-slate-800">
            <span className="text-slate-400">IP Address:</span>
            <span className="text-slate-300">{node.ip}</span>
          </div>
        )}
        {node.path && (
          <div className="flex justify-between items-center py-1 border-b border-slate-800">
            <span className="text-slate-400">Canary Path:</span>
            <span className="text-amber-300 text-[10px] truncate max-w-[150px]" title={node.path}>{node.path}</span>
          </div>
        )}
        {node.status && (
          <div className="flex justify-between items-center py-1 border-b border-slate-800">
            <span className="text-slate-400">Status:</span>
            <span className="text-slate-300">{node.status}</span>
          </div>
        )}
      </div>

      <div className="px-4 py-2.5 bg-slate-900/60 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between items-center">
        <span>Active Defense Node</span>
        <span className="text-cyan-400">GraphOps TOC</span>
      </div>
    </div>
  );
}

