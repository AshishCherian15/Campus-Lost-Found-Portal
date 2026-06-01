import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3000;

app.use(express.json());

// IN-MEMORY DATABASE

type User = { id: string; username: string; email: string; name: string; contact: string; department: string; role: 'student' | 'admin' };
type Item = { id: string; type: 'lost' | 'found'; name: string; description: string; location: string; category: string; imageUrl: string; status: 'open' | 'claimed' | 'resolved'; reportedBy: string; reports: number; createdAt: string };
type Claim = { id: string; itemId: string; requesterId: string; status: 'pending' | 'approved' | 'rejected'; message: string; createdAt: string };

const db = {
  users: [] as User[],
  items: [] as Item[],
  claims: [] as Claim[]
};

// Seed users
db.users.push(
  { id: 'admin-id', username: 'admin', email: 'admin@campus.edu', name: 'Admin User', contact: '555-0000', department: 'Administration', role: 'admin' },
  { id: 'alice-id', username: 'alice', email: 'alice@campus.edu', name: 'Alice Smith', contact: '555-0101', department: 'Computer Science', role: 'student' },
  { id: 'bob-id', username: 'bob', email: 'bob@campus.edu', name: 'Bob Johnson', contact: '555-0202', department: 'Mechanical Engineering', role: 'student' },
  { id: 'charlie-id', username: 'charlie', email: 'charlie@campus.edu', name: 'Charlie Williams', contact: '555-0303', department: 'Business', role: 'student' }
);

const pastDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

// Seed Items
db.items.push(
  {
    id: 'item-1', type: 'lost', name: 'MacBook Pro Charger', description: 'White Apple 96W USB-C Power Adapter. Left it plugged into the wall near the back of Room 104.', location: 'Library Main Floor, near printers', category: 'Electronics', imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&q=80&w=400', status: 'open', reportedBy: 'alice-id', reports: 0, createdAt: pastDate(2)
  },
  {
    id: 'item-2', type: 'found', name: 'Hydro Flask Water Bottle', description: 'Blue 32oz Hydro Flask with a couple of stickers (one says "Save the Turtles").', location: 'Cafeteria, table near entrance', category: 'Accessories', imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=400', status: 'open', reportedBy: 'bob-id', reports: 0, createdAt: pastDate(1)
  },
  {
    id: 'item-3', type: 'found', name: 'Car Keys (Toyota)', description: 'Set of car keys with a red lanyard and a small gym membership tag attached.', location: 'Basketball Court bleachers', category: 'Accessories', imageUrl: 'https://images.unsplash.com/photo-1555529733-0e670560f7e1?auto=format&fit=crop&q=80&w=400', status: 'open', reportedBy: 'charlie-id', reports: 0, createdAt: pastDate(3)
  },
  {
    id: 'item-4', type: 'lost', name: 'Calculus Textbook', description: 'Stewart Calculus Early Transcendentals 8th Edition. Has my name written on the inside cover in blue ink.', location: 'Math Building Room 302', category: 'Books', imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400', status: 'claimed', reportedBy: 'bob-id', reports: 0, createdAt: pastDate(5)
  },
  {
    id: 'item-5', type: 'lost', name: 'Winter Beanie', description: 'Gray knit beanie from North Face. Dropped it somewhere along the path from the dorms to the science center.', location: 'Campus Main Path', category: 'Clothing', imageUrl: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&q=80&w=400', status: 'open', reportedBy: 'charlie-id', reports: 0, createdAt: pastDate(0)
  }
);

// Seed Claims
db.claims.push(
  {
    id: 'claim-1', itemId: 'item-2', requesterId: 'alice-id', status: 'pending', message: 'Hi! I think this is my water bottle. The "Save the Turtles" sticker is slightly torn on the corner, and the bottom has a small dent.', createdAt: pastDate(0)
  },
  {
    id: 'claim-2', itemId: 'item-4', requesterId: 'alice-id', status: 'approved', message: 'I found your book! It was left under the desk. Let me know when you can meet.', createdAt: pastDate(4)
  }
);

// Middleware for auth checking
const getUser = (req: express.Request) => {
  const userId = req.headers['authorization']?.split('Bearer ')[1];
  return db.users.find(u => u.id === userId);
};

// API ROUTES

app.post("/api/auth/register", (req, res) => {
  const { username, email, password, name, contact, department } = req.body;
  if (db.users.find(u => u.username === username || u.email === email)) {
    return res.status(400).json({ error: "User already exists" });
  }
  const user: User = { id: uuidv4(), username, email, name, contact, department, role: 'student' };
  db.users.push(user);
  res.json({ token: user.id, user });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  // Ignoring password for demo simplicity, just match username
  const user = db.users.find(u => u.username === username || u.email === username);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  res.json({ token: user.id, user });
});

app.get("/api/auth/me", (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  res.json({ user });
});

// Items Routes
app.get("/api/items", (req, res) => {
  res.json(db.items);
});

app.post("/api/items", (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  
  const { type, name, description, location, category, imageUrl } = req.body;
  const item: Item = {
    id: uuidv4(),
    type, name, description, location, category, imageUrl,
    status: 'open',
    reportedBy: user.id,
    reports: 0,
    createdAt: new Date().toISOString()
  };
  db.items.push(item);
  res.json(item);
});

app.get("/api/items/:id", (req, res) => {
  const item = db.items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  
  const reporter = db.users.find(u => u.id === item.reportedBy);
  const enrichedItem = { ...item, reporterName: reporter?.name };
  res.json(enrichedItem);
});

// Claims Routes
app.post("/api/claims", (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  
  const { itemId, message } = req.body;
  const item = db.items.find(i => i.id === itemId);
  if (!item) return res.status(404).json({ error: "Item not found" });
  
  const claim: Claim = {
    id: uuidv4(),
    itemId,
    requesterId: user.id,
    status: 'pending',
    message,
    createdAt: new Date().toISOString()
  };
  db.claims.push(claim);
  res.json(claim);
});

app.get("/api/claims", (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  
  // Return claims made by the user, and claims for items the user reported
  const userReportedItemIds = db.items.filter(i => i.reportedBy === user.id).map(i => i.id);
  
  let claims = db.claims.filter(c => c.requesterId === user.id || userReportedItemIds.includes(c.itemId));
  
  // Enrich claims
  const enrichedClaims = claims.map(c => {
    const item = db.items.find(i => i.id === c.itemId);
    const requester = db.users.find(u => u.id === c.requesterId);
    return { ...c, item, requester };
  });
  
  res.json(enrichedClaims);
});

app.put("/api/claims/:id", (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  
  const { status } = req.body;
  const claim = db.claims.find(c => c.id === req.params.id);
  if (!claim) return res.status(404).json({ error: "Claim not found" });
  
  const item = db.items.find(i => i.id === claim.itemId);
  if (!item) return res.status(404).json({ error: "Item not found" });
  
  if (item.reportedBy !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  claim.status = status;
  if (status === 'approved') {
    item.status = 'claimed';
  }
  res.json(claim);
});

// Admin Routes
app.get("/api/admin/stats", (req, res) => {
  const user = getUser(req);
  if (!user || user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  
  res.json({
    usersCount: db.users.length,
    itemsCount: db.items.length,
    claimsCount: db.claims.length
  });
});

app.delete("/api/admin/items/:id", (req, res) => {
  const user = getUser(req);
  if (!user || user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  
  db.items = db.items.filter(i => i.id !== req.params.id);
  res.json({ success: true });
});

// VITE MIDDLEWARE

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
