import React, { useState } from 'react';
import { X, Database, CheckCircle2, AlertCircle, RefreshCw, Shield, HelpCircle } from 'lucide-react';

export default function ConnectionModal({ isOpen, onClose, status, onConnect }) {
  const [uri, setUri] = useState(status?.config?.uri || 'bolt://localhost:7687');
  const [user, setUser] = useState(status?.config?.user || 'neo4j');
  const [password, setPassword] = useState('password');
  const [database, setDatabase] = useState(status?.config?.database || 'neo4j');
  const [isTesting, setIsTesting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsTesting(true);
    setFeedback(null);
    try {
      const res = await onConnect({ uri, user, password, database });
      if (res?.ok && res?.status?.isConnected) {
        setFeedback({ success: true, message: 'Connected to Neo4j database successfully!' });
      } else {
        setFeedback({
          success: false,
          message: res?.result?.error || res?.status?.connectionError || 'Failed to connect. Ensure Neo4j is running.'
        });
      }
    } catch (err) {
      setFeedback({ success: false, message: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-[#0b1329] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden font-mono">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-[#0d1833] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Neo4j Database Connection</h3>
              <p className="text-xs text-slate-400 font-sans">
                Connect to a local Neo4j instance, Docker container, or Neo4j Aura cloud
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Connection Status banner */}
          <div className={`p-3 rounded-xl border text-xs flex items-center space-x-3 ${
            status?.isConnected
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
          }`}>
            {status?.isConnected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <div>
              <div className="font-bold">
                {status?.isConnected ? 'Neo4j Active & Connected' : 'Simulation Mode Active'}
              </div>
              <div className="text-[11px] opacity-80 font-sans mt-0.5">
                {status?.isConnected
                  ? 'All graph operations are running genuine Cypher queries against Neo4j.'
                  : 'Operating in high-fidelity in-memory mode. Connect Neo4j below to run against a real database.'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Neo4j URI / Host
            </label>
            <input
              type="text"
              value={uri}
              onChange={(e) => setUri(e.target.value)}
              placeholder="bolt://localhost:7687 or neo4j+s://..."
              className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              required
            />
            <span className="text-[10px] text-slate-500 font-sans">
              Default local: bolt://localhost:7687 | AuraDB: neo4j+s://&lt;id&gt;.databases.neo4j.io
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Username
              </label>
              <input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="neo4j"
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Database Name
            </label>
            <input
              type="text"
              value={database}
              onChange={(e) => setDatabase(e.target.value)}
              placeholder="neo4j"
              className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          {feedback && (
            <div className={`p-3 rounded-lg border text-xs font-sans ${
              feedback.success
                ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200'
                : 'bg-red-950/50 border-red-500/60 text-red-200'
            }`}>
              {feedback.message}
            </div>
          )}

          {/* Docker Tip */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="text-slate-300 font-semibold flex items-center space-x-1">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Running Neo4j with Docker:</span>
            </div>
            <code className="block p-1.5 rounded bg-black/60 text-cyan-300 text-[10px] break-all">
              docker run -d -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/password neo4j:latest
            </code>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isTesting}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold flex items-center space-x-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5" />
                  <span>Test & Connect</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

