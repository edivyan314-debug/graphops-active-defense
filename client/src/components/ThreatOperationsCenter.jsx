import React, { useEffect, useRef, useState } from 'react';
import {
  Terminal,
  AlertOctagon,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Code2,
  Trash2,
  Copy,
  Check,
  Flame,
  Radio,
  Lock,
  ArrowRight
} from 'lucide-react';

export default function ThreatOperationsCenter({
  logs,
  onTriggerTrap,
  onClearLogs,
  isTriggering,
  isTrapTriggered,
  graphData,
  status
}) {
  const terminalEndRef = useRef(null);
  const [copiedCypher, setCopiedCypher] = useState(false);
  const [activeTab, setActiveTab] = useState('terminal'); // 'terminal' | 'telemetry' | 'cypher'

  // Auto-scroll terminal on new log lines
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Cypher query snippet from spec
  const cypherQuery = `MATCH (user:Identity {id: 'Admin_Laptop'})-[old_conn:CONNECTED_TO]->(router:Asset {id: 'Core_Router'})
MATCH (honey:Asset {id: 'Shadow_Router'})
DELETE old_conn
CREATE (user)-[:REROUTED_TO]->(honey)
RETURN user, honey`;

  const handleCopyCypher = () => {
    navigator.clipboard.writeText(cypherQuery);
    setCopiedCypher(true);
    setTimeout(() => setCopiedCypher(false), 2000);
  };

  // Compute node stats
  const blueCount = graphData.nodes?.filter(n => n.type === 'Blue').length || 0;
  const redCount = graphData.nodes?.filter(n => n.type === 'Red').length || 0;
  const trapCount = graphData.nodes?.filter(n => n.type === 'Trap').length || 0;

  return (
    <aside className="w-full h-full bg-[#070d1e] border-l border-slate-800/80 flex flex-col justify-between overflow-hidden select-none">
      {/* Header / Threat Banner */}
      <div className="p-4 border-b border-slate-800 bg-[#091124]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Radio className={`w-4 h-4 ${isTrapTriggered ? 'text-red-400 animate-ping-slow' : 'text-cyan-400 animate-pulse'}`} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Threat Operations Center
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            TOC-LIVE
          </span>
        </div>

        {/* Threat Status Box */}
        <div className={`p-3 rounded-lg border transition-all ${
          isTrapTriggered
            ? 'bg-red-950/50 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
            : 'bg-slate-900/80 border-slate-700/60'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-md ${
              isTrapTriggered ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-cyan-500/10 text-cyan-400'
            }`}>
              {isTrapTriggered ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold font-mono tracking-wider ${
                  isTrapTriggered ? 'text-red-400' : 'text-cyan-400'
                }`}>
                  {isTrapTriggered ? 'ALERT: HONEYTOKEN ENGAGED' : 'SYSTEM STATUS: NOMINAL'}
                </span>
                <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded ${
                  isTrapTriggered ? 'bg-red-500 text-white' : 'bg-cyan-900/60 text-cyan-300'
                }`}>
                  {isTrapTriggered ? 'CRITICAL' : 'ARMED'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate font-mono mt-0.5">
                {isTrapTriggered
                  ? 'Compromised identity isolated in honeynet sinkhole.'
                  : 'Canary credentials listening for unauthorized access.'}
              </p>
            </div>
          </div>
        </div>

        {/* Cyber Topology Stats Bar */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-center font-mono text-xs">
          <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Enterprise</div>
            <div className="text-sm font-bold text-cyan-400">{blueCount} Assets</div>
          </div>
          <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Honeynet</div>
            <div className="text-sm font-bold text-red-400">{redCount} Decoys</div>
          </div>
          <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Canaries</div>
            <div className="text-sm font-bold text-amber-400">{trapCount} Armed</div>
          </div>
        </div>
      </div>

      {/* Main Interactive Action: Prominent Attack Trigger Button */}
      <div className="p-4 bg-[#0a1228] border-b border-slate-800">
        <button
          onClick={onTriggerTrap}
          disabled={isTriggering || isTrapTriggered}
          className={`w-full py-4 px-4 rounded-xl flex items-center justify-center space-x-3 font-mono font-bold tracking-wider uppercase text-sm transition-all relative overflow-hidden select-none group ${
            isTrapTriggered
              ? 'bg-slate-800 border border-slate-700 text-slate-400 cursor-not-allowed opacity-75'
              : 'cyber-button-red text-white'
          }`}
        >
          {/* Animated Hazard Stripes in background when idle */}
          {!isTrapTriggered && (
            <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,#000,#000_10px,transparent_10px,transparent_20px)] group-hover:opacity-20 transition-opacity" />
          )}

          {isTriggering ? (
            <>
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>TRIGGERING ACTIVE DEFENSE...</span>
            </>
          ) : isTrapTriggered ? (
            <>
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <span>THREAT ISOLATED & REROUTED</span>
            </>
          ) : (
            <>
              <Flame className="w-5 h-5 text-amber-300 animate-bounce" />
              <span className="drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]">
                SIMULATE ATTACK TRIGGER
              </span>
            </>
          )}
        </button>

        {isTrapTriggered && (
          <p className="text-[11px] text-slate-400 text-center font-mono mt-2">
            Topology rerouted! Click <span className="text-cyan-400 font-semibold">"Reset Topology"</span> in header to test again.
          </p>
        )}
      </div>

      {/* Navigation Tabs (Terminal vs Cypher Query vs Live Telemetry) */}
      <div className="flex border-b border-slate-800 bg-[#060a17] text-xs font-mono">
        <button
          onClick={() => setActiveTab('terminal')}
          className={`flex-1 py-2 px-3 flex items-center justify-center space-x-1.5 border-b-2 transition-colors ${
            activeTab === 'terminal'
              ? 'border-cyan-400 text-cyan-300 bg-slate-900/60 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Terminal Logs</span>
        </button>
        <button
          onClick={() => setActiveTab('cypher')}
          className={`flex-1 py-2 px-3 flex items-center justify-center space-x-1.5 border-b-2 transition-colors ${
            activeTab === 'cypher'
              ? 'border-cyan-400 text-cyan-300 bg-slate-900/60 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Cypher Logic</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 min-h-0 bg-[#040711] overflow-hidden flex flex-col">
        {activeTab === 'terminal' ? (
          /* Live Scrolling Terminal */
          <div className="flex-1 flex flex-col h-full min-h-0">
            {/* Terminal Actions Bar */}
            <div className="px-3 py-1.5 bg-[#060b1b] border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>active_defense_stream.log</span>
              </span>
              <button
                onClick={onClearLogs}
                title="Clear Terminal"
                className="hover:text-red-400 transition-colors p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable Log Output */}
            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-1.5 leading-relaxed selection:bg-cyan-500/30">
              {logs.map((log, index) => {
                let badgeClass = 'text-cyan-400';
                let textClass = 'text-slate-300';

                if (log.type === 'ALERT' || log.type === 'CONTAINMENT') {
                  badgeClass = 'text-red-400 font-bold';
                  textClass = 'text-red-300 font-semibold';
                } else if (log.type === 'CYPHER') {
                  badgeClass = 'text-amber-400 font-bold';
                  textClass = 'text-amber-200';
                } else if (log.type === 'SUCCESS') {
                  badgeClass = 'text-emerald-400 font-bold';
                  textClass = 'text-emerald-300';
                }

                return (
                  <div key={index} className="flex items-start space-x-2 text-[11px]">
                    <span className="text-slate-500 shrink-0 select-none">
                      {log.timestamp}
                    </span>
                    <span className={`shrink-0 ${badgeClass}`}>
                      [{log.type}]
                    </span>
                    <span className={`break-words ${textClass}`}>
                      {log.message}
                    </span>
                  </div>
                );
              })}
              <div ref={terminalEndRef} />
            </div>
          </div>
        ) : (
          /* Cypher Query Inspector Tab */
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                Active Defense Reroute Cypher
              </div>
              <button
                onClick={handleCopyCypher}
                className="flex items-center space-x-1 text-[11px] text-cyan-400 hover:text-cyan-300 bg-slate-900 border border-slate-700 px-2 py-1 rounded"
              >
                {copiedCypher ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCypher ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-amber-300 font-mono text-[11px] overflow-x-auto leading-relaxed shadow-inner">
              <div className="text-slate-500 mb-1">// Reroutes attacker from Core_Router to Shadow_Router</div>
              <div><span className="text-cyan-400 font-bold">MATCH</span> (user:Identity &#123;name: <span className="text-emerald-300">'Admin_Laptop'</span>&#125;)-[old_conn:CONNECTED_TO]-&gt;(router:Asset &#123;name: <span className="text-emerald-300">'Core_Router'</span>&#125;)</div>
              <div><span className="text-cyan-400 font-bold">MATCH</span> (honey:Asset &#123;name: <span className="text-emerald-300">'Shadow_Router'</span>&#125;)</div>
              <div><span className="text-red-400 font-bold">DELETE</span> old_conn</div>
              <div><span className="text-cyan-400 font-bold">CREATE</span> (user)-[:<span className="text-red-400 font-bold">REROUTED_TO</span>]-&gt;(honey)</div>
              <div><span className="text-cyan-400 font-bold">RETURN</span> user, honey</div>
            </div>

            <div className="space-y-2 text-[11px] text-slate-400">
              <div className="font-semibold text-slate-300">How Active Defense Works:</div>
              <ul className="space-y-1.5 list-disc pl-4 text-slate-400">
                <li>
                  <strong className="text-slate-200">Deception Canary:</strong> The attacker attempts to use the canary credential (<code className="text-amber-300">Fake_AWS_Key</code>).
                </li>
                <li>
                  <strong className="text-slate-200">Atomic Containment:</strong> Neo4j severs the connection to production router <code className="text-cyan-300">Core_Router</code>.
                </li>
                <li>
                  <strong className="text-slate-200">Transparent Sinkhole:</strong> Neo4j redirects all traffic through <code className="text-red-400">Shadow_Router</code> to decoy asset <code className="text-red-400">Fake_DB</code>.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-[#060a17] border-t border-slate-800/80 text-[11px] font-mono flex items-center justify-between text-slate-500">
        <span>Engine: {status?.mode === 'neo4j' ? 'Neo4j Bolt Driver' : 'In-Memory Fallback'}</span>
        <span className="text-emerald-400 flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>ACTIVE DEFENSE READY</span>
        </span>
      </div>
    </aside>
  );
}

