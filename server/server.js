import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  initDriver,
  getGraph,
  triggerTrap,
  seedGraph,
  getStatus
} from './neo4jService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Log incoming API requests
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.path}`);
  next();
});

/**
 * Health and Connection Status
 */
app.get('/api/status', (req, res) => {
  const status = getStatus();
  res.json({
    ok: true,
    status
  });
});

/**
 * Configure / Reconnect Neo4j
 */
app.post('/api/config', async (req, res) => {
  try {
    const { uri, user, password, database } = req.body;
    const result = await initDriver({ uri, user, password, database });
    res.json({
      ok: true,
      result,
      status: getStatus()
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * A. GET /api/graph
 * Fetches the current state of the Neo4j graph.
 * Cypher: MATCH (n)-[r]->(m) RETURN n, r, m
 */
app.get('/api/graph', async (req, res) => {
  try {
    const graphData = await getGraph();
    res.json(graphData);
  } catch (err) {
    console.error('Error fetching graph:', err);
    res.status(500).json({
      error: 'Failed to retrieve graph topology',
      details: err.message
    });
  }
});

/**
 * B. POST /api/trigger-trap
 * Simulates active defense reroute when attacker triggers the honeytoken.
 */
app.post('/api/trigger-trap', async (req, res) => {
  try {
    const result = await triggerTrap();
    res.json(result);
  } catch (err) {
    console.error('Error triggering trap:', err);
    res.status(500).json({
      error: 'Failed to execute threat reroute',
      details: err.message
    });
  }
});

/**
 * POST /api/reset
 * Resets the topology to initial state (Blue Enterprise + Red Decoys + Honeytoken)
 */
app.post('/api/reset', async (req, res) => {
  try {
    const result = await seedGraph();
    res.json(result);
  } catch (err) {
    console.error('Error resetting topology:', err);
    res.status(500).json({
      error: 'Failed to reset graph topology',
      details: err.message
    });
  }
});

// Start server and initialize Neo4j connection
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🛡️  GraphOps - Active Defense API running on port ${PORT}`);
  console.log(`📡 Graph Endpoint:  http://localhost:${PORT}/api/graph`);
  console.log(`⚡ Trap Endpoint:   http://localhost:${PORT}/api/trigger-trap`);
  console.log(`🔄 Reset Endpoint:  http://localhost:${PORT}/api/reset`);
  console.log(`=======================================================`);

  // Attempt initial Neo4j connection
  await initDriver();
});

