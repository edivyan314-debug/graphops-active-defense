# GraphOps — Active Defense & Failsafe Topology
## Neo4j Hackathon Prototype

A full-stack **Active Defense** cybersecurity dashboard. It uses a **Neo4j Knowledge Graph** to model a live enterprise network, deploy a honeynet of decoy assets, and execute atomic threat-containment via Cypher when an attacker triggers a canary credential.

---

### Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Graph Viz | react-force-graph-2d |
| Backend | Node.js + Express |
| Database | Neo4j (AuraDB or local) |

---

### Quick Start

#### 1. Clone & Install
```bash
# Install server deps
cd server && npm install

# Install client deps  
cd ../client && npm install
```

#### 2. Configure Neo4j
Copy `server/.env.example` to `server/.env` and fill in your Neo4j AuraDB credentials:
```env
NEO4J_URI=neo4j+s://<your-id>.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=<your-password>
NEO4J_DATABASE=neo4j
```

Or for local Docker:
```bash
docker run -d -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/password neo4j:latest
```

#### 3. Seed the Database (AuraDB Console or Neo4j Browser)
```cypher
// 1. Create Enterprise Network (Real)
CREATE (router:Asset {id: 'Core_Router', name: 'Core Router', type: 'Blue', is_decoy: false})
CREATE (db:Asset {id: 'Prod_DB', name: 'Production Database', type: 'Blue', is_decoy: false})
CREATE (user:Identity {id: 'Admin_Laptop', name: 'Admin Laptop', type: 'Blue', is_decoy: false})
CREATE (user)-[:CONNECTED_TO]->(router)-[:ROUTES_TO]->(db)

// 2. Create Honeynet (Decoy)
CREATE (honey_router:Asset {id: 'Shadow_Router', name: 'Decoy Router', type: 'Red', is_decoy: true})
CREATE (honey_db:Asset {id: 'Fake_DB', name: 'Fake Financial DB', type: 'Red', is_decoy: true})
CREATE (honey_router)-[:ROUTES_TO]->(honey_db)

// 3. Create Honeytoken (The Trap)
CREATE (trap:Credential {id: 'Fake_AWS_Key', name: 'Exposed AWS Key', type: 'Trap', is_decoy: true})
CREATE (user)-[:CONTAINS_FILE]->(trap)
```
> The server auto-seeds this topology if the DB is empty on first connect.

#### 4. Run
```bash
# Terminal 1 — Backend
cd server && npm start

# Terminal 2 — Frontend
cd client && npm run dev
```

Open **http://localhost:5173**

---

### How the Active Defense Works

```
[Attacker uses Fake_AWS_Key]
          ↓
POST /api/trigger-trap
          ↓
Neo4j Cypher:
  DELETE :CONNECTED_TO (Admin_Laptop → Core_Router)
  CREATE :REROUTED_TO  (Admin_Laptop → Shadow_Router)
          ↓
Graph re-renders: Red dashed link replaces Blue link
Attacker is isolated in honeynet sinkhole
```

### API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/graph` | Fetch current graph topology |
| `POST` | `/api/trigger-trap` | Execute active defense Cypher reroute |
| `POST` | `/api/reset` | Re-seed initial topology |
| `GET` | `/api/status` | Database connection status |
| `POST` | `/api/config` | Reconfigure Neo4j connection |

