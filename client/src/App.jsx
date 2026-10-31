import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header.jsx';
import GraphCanvas from './components/GraphCanvas.jsx';
import ThreatOperationsCenter from './components/ThreatOperationsCenter.jsx';
import ConnectionModal from './components/ConnectionModal.jsx';
import NodeDetailModal from './components/NodeDetailModal.jsx';

// ─── API Layer ─────────────────────────────────────────────────────────────────
const API_BASE = '/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Log Helpers ───────────────────────────────────────────────────────────────
let logIdCounter = 0;
function makeLog(type, message) {
  const now = new Date();
  return {
    id: ++logIdCounter,
    timestamp: now.toTimeString().split(' ')[0],
    type,
    message
  };
}

// ─── Initial System Boot Logs ─────────────────────────────────────────────────
const BOOT_LOGS = [
  makeLog('SYSTEM', 'GraphOps Active Defense Platform initializing...'),
  makeLog('SYSTEM', 'Loading network topology from database...'),
  makeLog('INFO',   'Neo4j driver initialized. Attempting connection...'),
  makeLog('INFO',   'Honeynet canary credentials: ARMED'),
  makeLog('INFO',   'Trap sensors: ONLINE — awaiting adversarial activity'),
  makeLog('SYSTEM', 'Threat Operations Center READY.')
];

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState(BOOT_LOGS);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [isTrapTriggered, setIsTrapTriggered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const pollRef = useRef(null);

  const addLog = useCallback((type, message) => {
    setLogs(prev => [...prev.slice(-199), makeLog(type, message)]);
  }, []);

  // ── Fetch graph and system status from backend ──────────────────────────────
  const fetchGraph = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [graphRes, statusRes] = await Promise.all([
        apiFetch('/graph'),
        apiFetch('/status')
      ]);

      // Normalize nodes — react-force-graph-2d needs stable string IDs
      const normalizedNodes = (graphRes.nodes || []).map(n => ({
        ...n,
        id: String(n.id)
      }));

      // Normalize links — source/target must match node IDs
      const normalizedLinks = (graphRes.links || []).map(l => ({
        ...l,
        source: String(typeof l.source === 'object' ? l.source.id : l.source),
        target: String(typeof l.target === 'object' ? l.target.id : l.target)
      }));

      setGraphData({ nodes: normalizedNodes, links: normalizedLinks });
      setStatus(statusRes.status || statusRes);

      const hasTrap = graphRes.trapTriggered ||
        normalizedLinks.some(l => l.type === 'REROUTED_TO');
      setIsTrapTriggered(hasTrap);

      if (!silent) {
        const mode = graphRes.mode === 'neo4j' ? 'Neo4j Live Database' : 'In-Memory Simulation';
        addLog('INFO', `Topology synced [${mode}] — ${normalizedNodes.length} nodes, ${normalizedLinks.length} edges loaded.`);
        if (graphRes.mode !== 'neo4j') {
          addLog('WARN', 'Neo4j not detected. Running in high-fidelity simulation mode. Connect via ⚙ Settings.');
        }
      }
    } catch (err) {
      addLog('ERROR', `Graph sync failed: ${err.message}`);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [addLog]);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchGraph(false);

    // Poll for live updates every 8 seconds
    pollRef.current = setInterval(() => {
      fetchGraph(true);
    }, 8000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchGraph]);

  // ── CORE ACTION: Simulate Attack Trigger ────────────────────────────────────
  //
  // POST /api/trigger-trap
  // Cypher executed on backend:
  //   MATCH (user:Identity {id: 'Admin_Laptop'})-[old_conn:CONNECTED_TO]->(router:Asset {id: 'Core_Router'})
  //   MATCH (honey:Asset {id: 'Shadow_Router'})
  //   DELETE old_conn
  //   CREATE (user)-[:REROUTED_TO]->(honey)
  //   RETURN user, honey
  //
  const handleTriggerTrap = useCallback(async () => {
    if (isTriggering || isTrapTriggered) return;

    setIsTriggering(true);

    addLog('ALERT', '⚠ HONEYTOKEN ACCESSED — Adversarial activity detected on credential: Exposed_AWS_Key');
    addLog('CYPHER', 'Executing containment: DELETE :CONNECTED_TO → CREATE :REROUTED_TO → Shadow_Router');

    try {
      const result = await apiFetch('/trigger-trap', { method: 'POST' });

      addLog('CONTAINMENT', '🔴 HONEYTOKEN TRIGGERED: Isolating threat and rerouting to decoy network...');
      addLog('CONTAINMENT', `Blast radius contained. Admin_Laptop ──✗──> Core_Router`);
      addLog('CONTAINMENT', `Attacker rerouted: Admin_Laptop ──[REROUTED_TO]──> Shadow_Router (Honeynet)`);
      addLog('CONTAINMENT', 'Production database Prod_DB: PROTECTED. No lateral movement possible.');
      addLog('SUCCESS', `Active defense response complete. Timestamp: ${result.timestamp || new Date().toISOString()}`);
      addLog('INFO', 'Attacker is now isolated in sinkhole. All traffic mirrored to Fake_DB for forensics.');

      // Re-fetch graph to animate the topology change
      await fetchGraph(false);
      setIsTrapTriggered(true);
    } catch (err) {
      addLog('ERROR', `Trap trigger failed: ${err.message}`);
    } finally {
      setIsTriggering(false);
    }
  }, [isTriggering, isTrapTriggered, addLog, fetchGraph]);

  // ── Reset Topology ──────────────────────────────────────────────────────────
  const handleReset = useCallback(async () => {
    if (isResetting) return;
    setIsResetting(true);
    setSelectedNode(null);
    addLog('SYSTEM', 'Resetting graph topology to initial state...');

    try {
      const result = await apiFetch('/reset', { method: 'POST' });
      addLog('SUCCESS', `Topology reset: ${result.message || 'Graph re-seeded.'}`);
      addLog('INFO', 'Honeytoken canary re-armed. Awaiting next adversary.');
      await fetchGraph(false);
      setIsTrapTriggered(false);
    } catch (err) {
      addLog('ERROR', `Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  }, [isResetting, addLog, fetchGraph]);

  // ── Connect to Neo4j AuraDB / Custom Host ───────────────────────────────────
  const handleConnect = useCallback(async (config) => {
    addLog('INFO', `Attempting Neo4j connection to ${config.uri} as ${config.user}...`);
    try {
      const res = await apiFetch('/config', {
        method: 'POST',
        body: JSON.stringify(config)
      });
      if (res?.status?.isConnected) {
        addLog('SUCCESS', `Connected to Neo4j database at ${config.uri}`);
        addLog('INFO', 'Synchronizing live graph topology from Neo4j...');
        await fetchGraph(false);
        setShowConnectionModal(false);
      } else {
        addLog('ERROR', `Neo4j connection failed: ${res?.result?.error || 'Unknown error'}`);
      }
      return res;
    } catch (err) {
      addLog('ERROR', `Connection error: ${err.message}`);
      return { ok: false, error: err.message };
    }
  }, [addLog, fetchGraph]);

  // ── Node Click → Show detail panel ─────────────────────────────────────────
  const handleNodeClick = useCallback((node) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
    addLog('INFO', `Node selected: [${node.type}] ${node.name || node.id} — is_decoy: ${node.is_decoy}`);
  }, [addLog]);

  // ── Clear Terminal ──────────────────────────────────────────────────────────
  const handleClearLogs = useCallback(() => {
    setLogs([makeLog('SYSTEM', 'Terminal cleared. GraphOps Active Defense monitoring resumed.')]);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#050811]">
      {/* ── Top Navigation Bar ─────────────────────────────────────────────── */}
      <Header
        status={status}
        isTrapTriggered={isTrapTriggered}
        onReset={handleReset}
        onOpenSettings={() => setShowConnectionModal(true)}
        isResetting={isResetting}
      />

      {/* ── Main Content: 70/30 Split ──────────────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden min-h-0">
        {/* ── Left: 70% — Force Graph Canvas ──────────────────────────────── */}
        <div className="flex-[7] relative min-w-0 overflow-hidden">
          <GraphCanvas
            graphData={graphData}
            onNodeClick={handleNodeClick}
            selectedNode={selectedNode}
            isTrapTriggered={isTrapTriggered}
            isLoading={isLoading}
          />

          {/* Node Detail Flyout (overlays graph) */}
          {selectedNode && (
            <NodeDetailModal
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
            />
          )}
        </div>

        {/* ── Right: 30% — Threat Operations Center Sidebar ───────────────── */}
        <div className="flex-[3] min-w-[320px] max-w-[440px] flex flex-col overflow-hidden border-l border-slate-800">
          <ThreatOperationsCenter
            logs={logs}
            onTriggerTrap={handleTriggerTrap}
            onClearLogs={handleClearLogs}
            isTriggering={isTriggering}
            isTrapTriggered={isTrapTriggered}
            graphData={graphData}
            status={status}
          />
        </div>
      </main>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <ConnectionModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
        status={status}
        onConnect={handleConnect}
      />
    </div>
  );
}

