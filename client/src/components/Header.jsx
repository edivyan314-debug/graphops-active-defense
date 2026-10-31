import React from 'react';
import { Shield, ShieldAlert, Database, RefreshCw, Settings, Activity, Zap, ExternalLink } from 'lucide-react';

export default function Header({
  status,
  isTrapTriggered,
  onReset,
  onOpenSettings,
  isResetting
}) {
  const isNeo4jConnected = status?.isConnected;

  return (
    <header className="h-16 bg-[#080d1e]/90 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between z-20 select-none">
      {/* Brand & Project Identity */}
      <div className="flex items-center space-x-4">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          <Shield className="w-5 h-5 text-cyan-400" />
          {isTrapTriggered && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold tracking-wider text-slate-100 flex items-center gap-2">
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent font-extrabold font-mono">
                GRAPH<span className="text-red-400">OPS</span>
              </span>
              <span className="text-[11px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Active Defense
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Neo4j Knowledge Graph • Dynamic Honeynet Containment
          </p>
        </div>
      </div>

      {/* Center Telemetry Status */}
      <div className="hidden lg:flex items-center space-x-6 text-xs font-mono">
        {/* Threat State Pill */}
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-all ${
          isTrapTriggered
            ? 'bg-red-950/60 border-red-500/60 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.35)] animate-pulse'
            : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isTrapTriggered ? 'bg-red-400' : 'bg-emerald-400'
          }`} />
          <span className="font-semibold uppercase tracking-wider">
            {isTrapTriggered ? 'DEFENSE ACTIVE: ISOLATED' : 'PERIMETER: SECURED'}
          </span>
        </div>

        {/* Neo4j Database Status Pill */}
        <div
          onClick={onOpenSettings}
          title="Click to configure Neo4j Connection"
          className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-slate-700/80 bg-slate-900/60 hover:bg-slate-800/80 cursor-pointer transition-all text-slate-300 hover:border-cyan-500/40"
        >
          <Database className={`w-3.5 h-3.5 ${isNeo4jConnected ? 'text-cyan-400' : 'text-amber-400'}`} />
          <span>
            {isNeo4jConnected ? 'Neo4j Live Cluster' : 'Simulation Mode'}
          </span>
          <span className={`w-2 h-2 rounded-full ${isNeo4jConnected ? 'bg-cyan-400' : 'bg-amber-400 animate-pulse'}`} />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Re-seed / Reset Button */}
        <button
          onClick={onReset}
          disabled={isResetting}
          title="Reset graph topology to initial state"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-medium transition-all hover:border-slate-500 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
          <span className="hidden sm:inline">Reset Topology</span>
        </button>

        {/* Database Settings Modal Trigger */}
        <button
          onClick={onOpenSettings}
          title="Neo4j Connection Settings"
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-cyan-400 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

