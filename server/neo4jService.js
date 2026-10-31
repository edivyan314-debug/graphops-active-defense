import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

// Active connection state
let driver = null;
let isConnected = false;
let connectionError = null;
let currentConfig = {
  uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
  user: process.env.NEO4J_USER || 'neo4j',
  password: process.env.NEO4J_PASSWORD || 'password',
  database: process.env.NEO4J_DATABASE || 'neo4j'
};

// In-Memory Simulation State (Seamless Fallback if Neo4j is offline or Aura instance is booting)
const getInitialSimulatedState = () => ({
  nodes: [
    { id: 'Core_Router', name: 'Core_Router', type: 'Blue', is_decoy: false, label: 'Asset', ip: '10.0.1.1', status: 'Online' },
    { id: 'Prod_Database', name: 'Prod_Database', type: 'Blue', is_decoy: false, label: 'Asset', ip: '10.0.2.50', status: 'Secured' },
    { id: 'Admin_Laptop', name: 'Admin_Laptop', type: 'Blue', is_decoy: false, label: 'Identity', ip: '192.168.1.105', status: 'Monitored' },
    { id: 'Shadow_Router', name: 'Shadow_Router', type: 'Red', is_decoy: true, label: 'Asset', ip: '10.99.1.1', status: 'Honeynet Gateway' },
    { id: 'Fake_Financial_DB', name: 'Fake_Financial_DB', type: 'Red', is_decoy: true, label: 'Asset', ip: '10.99.2.20', status: 'Sinkhole DB' },
    { id: 'Exposed_AWS_Key', name: 'Exposed_AWS_Key', type: 'Trap', is_decoy: true, label: 'Credential', path: '~/.aws/credentials.bak', status: 'Canary Armed' }
  ],
  links: [
    { id: 'l1', source: 'Admin_Laptop', target: 'Core_Router', type: 'CONNECTED_TO' },
    { id: 'l2', source: 'Core_Router', target: 'Prod_Database', type: 'ROUTES_TO' },
    { id: 'l3', source: 'Shadow_Router', target: 'Fake_Financial_DB', type: 'ROUTES_TO' },
    { id: 'l4', source: 'Admin_Laptop', target: 'Exposed_AWS_Key', type: 'CONTAINS_FILE' }
  ]
});

let simGraph = getInitialSimulatedState();
let trapTriggered = false;

/**
 * Initialize Neo4j Driver and verify connectivity
 */
export async function initDriver(customConfig = null) {
  if (customConfig) {
    currentConfig = { ...currentConfig, ...customConfig };
  }

  if (driver) {
    try {
      await driver.close();
    } catch (e) {
      console.warn('Error closing previous driver:', e.message);
    }
  }

  console.log(`[Neo4j] Connecting to ${currentConfig.uri} as ${currentConfig.user}...`);

  try {
    driver = neo4j.driver(
      currentConfig.uri,
      neo4j.auth.basic(currentConfig.user, currentConfig.password),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000,
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 8000
      }
    );

    // Verify connectivity
    const serverInfo = await driver.getServerInfo();
    isConnected = true;
    connectionError = null;
    console.log(`[Neo4j] Connected successfully to Neo4j ${serverInfo.agent || 'Server'}`);

    // Auto-seed if database is empty
    await checkAndSeedIfEmpty();
    return { success: true, isConnected: true, serverInfo };
  } catch (err) {
    isConnected = false;
    connectionError = err.message;
    console.warn(`[Neo4j] Could not connect to Neo4j (${err.message}). Operating in Simulation Fallback mode.`);
    return { success: false, isConnected: false, error: err.message };
  }
}

/**
 * Seed initial topology into Neo4j
 */
export async function seedGraph() {
  trapTriggered = false;
  simGraph = getInitialSimulatedState();

  if (!isConnected || !driver) {
    console.log('[Simulation] Reset and seeded in-memory graph topology.');
    return {
      success: true,
      mode: 'simulation',
      message: 'Initial Enterprise & Honeynet topology re-seeded in simulation mode'
    };
  }

  const session = driver.session({ database: currentConfig.database });
  try {
    await session.executeWrite(async tx => {
      // 0. Clean prior demo graph
      await tx.run(`
        MATCH (n)
        WHERE (n.name IN ['Core_Router', 'Prod_Database', 'Prod_DB', 'Admin_Laptop', 'Shadow_Router', 'Fake_Financial_DB', 'Fake_DB', 'Exposed_AWS_Key', 'Fake_AWS_Key'])
           OR (n.id IN ['Core_Router', 'Prod_Database', 'Prod_DB', 'Admin_Laptop', 'Shadow_Router', 'Fake_Financial_DB', 'Fake_DB', 'Exposed_AWS_Key', 'Fake_AWS_Key'])
        DETACH DELETE n
      `);

      // 1. Build the Secure Enterprise Network (Blue Zone)
      await tx.run(`
        MERGE (router:Asset {name: 'Core_Router', id: 'Core_Router', type: 'Blue', is_decoy: false})
        MERGE (db:Asset {name: 'Prod_Database', id: 'Prod_Database', type: 'Blue', is_decoy: false})
        MERGE (user:Identity {name: 'Admin_Laptop', id: 'Admin_Laptop', type: 'Blue', is_decoy: false})
        MERGE (user)-[:CONNECTED_TO]->(router)
        MERGE (router)-[:ROUTES_TO]->(db)
      `);

      // 2. Build the Honeynet (Red Zone)
      await tx.run(`
        MERGE (honey_router:Asset {name: 'Shadow_Router', id: 'Shadow_Router', type: 'Red', is_decoy: true})
        MERGE (honey_db:Asset {name: 'Fake_Financial_DB', id: 'Fake_Financial_DB', type: 'Red', is_decoy: true})
        MERGE (honey_router)-[:ROUTES_TO]->(honey_db)
      `);

      // 3. Plant the Honeytoken (The Trap)
      await tx.run(`
        MERGE (trap:Credential {name: 'Exposed_AWS_Key', id: 'Exposed_AWS_Key', type: 'Trap', is_decoy: true})
        MERGE (user:Identity {name: 'Admin_Laptop'})
        MERGE (user)-[:CONTAINS_FILE]->(trap)
      `);
    });

    console.log('[Neo4j] Graph successfully seeded with Enterprise & Honeynet assets.');
    return {
      success: true,
      mode: 'neo4j',
      message: 'Successfully seeded Neo4j graph with Enterprise & Honeynet topology.'
    };
  } catch (err) {
    console.error('[Neo4j] Error during seed:', err);
    throw err;
  } finally {
    await session.close();
  }
}

async function checkAndSeedIfEmpty() {
  if (!isConnected || !driver) return;
  const session = driver.session({ database: currentConfig.database });
  try {
    const res = await session.run(`
      MATCH (n) WHERE (n.name IN ['Core_Router', 'Admin_Laptop'] OR n.id IN ['Core_Router', 'Admin_Laptop']) RETURN count(n) AS cnt
    `);
    const count = res.records[0]?.get('cnt')?.toNumber() || 0;
    if (count === 0) {
      console.log('[Neo4j] Graph empty or unseeded. Seeding initial network topology now...');
      await seedGraph();
    }
  } catch (e) {
    console.warn('[Neo4j] Auto-seed check notice:', e.message);
  } finally {
    await session.close();
  }
}

/**
 * Fetch Current Graph State
 * Neo4j Cypher Logic: MATCH (n)-[r]->(m) RETURN n, r, m
 */
export async function getGraph() {
  if (!isConnected || !driver) {
    return {
      mode: 'simulation',
      isConnected: false,
      trapTriggered,
      nodes: simGraph.nodes.map(n => ({ ...n })),
      links: simGraph.links.map(l => ({
        source: typeof l.source === 'object' ? l.source.id : l.source,
        target: typeof l.target === 'object' ? l.target.id : l.target,
        type: l.type
      }))
    };
  }

  const session = driver.session({ database: currentConfig.database });
  try {
    const cypher = `
      MATCH (n)
      OPTIONAL MATCH (n)-[r]->(m)
      RETURN n, r, m
    `;
    const result = await session.run(cypher);

    const nodesMap = new Map();
    const links = [];

    const processNode = (neoNode) => {
      if (!neoNode) return null;
      const props = neoNode.properties || {};
      const id = props.name || props.id || neoNode.elementId || String(neoNode.identity);
      if (!nodesMap.has(id)) {
        nodesMap.set(id, {
          id: id,
          name: props.name || props.id || id,
          type: props.type || (props.is_decoy ? 'Red' : 'Blue'),
          is_decoy: Boolean(props.is_decoy),
          label: neoNode.labels ? neoNode.labels[0] : 'Node',
          ...props
        });
      }
      return id;
    };

    result.records.forEach(record => {
      const n = record.get('n');
      const r = record.get('r');
      const m = record.get('m');

      const sourceId = processNode(n);
      const targetId = processNode(m);

      if (r && sourceId && targetId) {
        links.push({
          id: r.elementId || `${sourceId}->${targetId}:${r.type}`,
          source: sourceId,
          target: targetId,
          type: r.type,
          properties: r.properties || {}
        });
      }
    });

    const hasRerouted = links.some(l => l.type === 'REROUTED_TO');
    trapTriggered = hasRerouted;

    return {
      mode: 'neo4j',
      isConnected: true,
      trapTriggered,
      nodes: Array.from(nodesMap.values()),
      links
    };
  } catch (err) {
    console.error('[Neo4j] Error reading graph:', err);
    return {
      mode: 'simulation',
      isConnected: false,
      error: err.message,
      trapTriggered,
      nodes: simGraph.nodes,
      links: simGraph.links
    };
  } finally {
    await session.close();
  }
}

/**
 * Trigger Active Defense Trap
 * Cypher Logic:
 * Finds the compromised user node.
 * Deletes the :CONNECTED_TO edge linking them to the real 'Core_Router' (Containment).
 * Creates a new :REROUTED_TO edge linking them straight to the 'Shadow_Router' (Honeynet diversion).
 */
export async function triggerTrap() {
  trapTriggered = true;

  if (!isConnected || !driver) {
    // In-Memory Simulation
    simGraph.links = simGraph.links.filter(
      l => !(
        (l.source === 'Admin_Laptop' || (l.source && l.source.id === 'Admin_Laptop')) &&
        (l.target === 'Core_Router' || (l.target && l.target.id === 'Core_Router'))
      )
    );

    const alreadyRerouted = simGraph.links.some(
      l => (l.source === 'Admin_Laptop' || l.source?.id === 'Admin_Laptop') &&
           (l.target === 'Shadow_Router' || l.target?.id === 'Shadow_Router') &&
           l.type === 'REROUTED_TO'
    );

    if (!alreadyRerouted) {
      simGraph.links.push({
        id: `reroute-${Date.now()}`,
        source: 'Admin_Laptop',
        target: 'Shadow_Router',
        type: 'REROUTED_TO'
      });
    }

    return {
      success: true,
      mode: 'simulation',
      message: 'HONEYTOKEN TRIGGERED: Blast radius contained. Attacker rerouted to decoy network.',
      rerouted: true,
      timestamp: new Date().toISOString(),
      details: {
        isolatedNode: 'Admin_Laptop',
        disconnectedFrom: 'Core_Router',
        quarantinedTo: 'Shadow_Router'
      }
    };
  }

  const session = driver.session({ database: currentConfig.database });
  try {
    const cypher = `
      MATCH (user:Identity)
      WHERE user.name = 'Admin_Laptop' OR user.id = 'Admin_Laptop'
      MATCH (router:Asset)
      WHERE router.name = 'Core_Router' OR router.id = 'Core_Router'
      MATCH (honey:Asset)
      WHERE honey.name = 'Shadow_Router' OR honey.id = 'Shadow_Router'
      OPTIONAL MATCH (user)-[old_conn:CONNECTED_TO]->(router)
      DELETE old_conn
      MERGE (user)-[:REROUTED_TO]->(honey)
      RETURN user, honey
    `;

    const result = await session.executeWrite(tx => tx.run(cypher));

    const record = result.records[0];
    const user = record ? record.get('user').properties : null;
    const honey = record ? record.get('honey').properties : null;

    return {
      success: true,
      mode: 'neo4j',
      message: 'HONEYTOKEN TRIGGERED: Blast radius contained. Attacker rerouted to decoy network.',
      rerouted: true,
      timestamp: new Date().toISOString(),
      details: {
        isolatedUser: user,
        quarantineTarget: honey
      }
    };
  } catch (err) {
    console.error('[Neo4j] Error during trigger trap:', err);
    throw err;
  } finally {
    await session.close();
  }
}

/**
 * Get Connection and System Status
 */
export function getStatus() {
  return {
    isConnected,
    connectionError,
    config: {
      uri: currentConfig.uri,
      user: currentConfig.user,
      database: currentConfig.database
    },
    mode: isConnected ? 'neo4j' : 'simulation',
    trapTriggered
  };
}

export async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}
