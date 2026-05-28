import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import {
  state,
  saveState,
  nextId,
  getUserById,
  getUserByEmail,
  getItemById,
  getClaimById,
  getSession,
  createSession,
  destroySession,
  getPublicUser
} from './store.js';

const app = express();
const port = process.env.PORT || 3000;
const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');
const uploadsDir = path.join(publicDir, 'uploads');

fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadsDir),
  filename: (_req, file, callback) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicDir));
app.use('/uploads', express.static(uploadsDir));

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((accumulator, entry) => {
    const separatorIndex = entry.indexOf('=');
    if (separatorIndex === -1) {
      return accumulator;
    }

    const key = entry.slice(0, separatorIndex).trim();
    const value = decodeURIComponent(entry.slice(separatorIndex + 1).trim());
    accumulator[key] = value;
    return accumulator;
  }, {});
}

function sendSessionCookie(res, sessionId) {
  res.setHeader('Set-Cookie', `lf_session=${encodeURIComponent(sessionId)}; HttpOnly; Path=/; SameSite=Lax`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', 'lf_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
}

function getCurrentUser(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const session = cookies.lf_session ? getSession(cookies.lf_session) : null;
  if (!session) {
    return null;
  }

  const user = getUserById(session.userId);
  return user || null;
}

function requireAuth(req, res, next) {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Login required.' });
  }

  req.currentUser = user;
  next();
}

function requireAdmin(req, res, next) {
  if (req.currentUser?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }

  next();
}

function toPublicClaim(claim) {
  return {
    id: claim.id,
    itemId: claim.itemId,
    requestedBy: claim.requestedBy,
    requester: getPublicUser(getUserById(claim.requestedBy)),
    message: claim.message,
    status: claim.status,
    createdAt: claim.createdAt,
    reviewedAt: claim.reviewedAt,
    reviewedBy: claim.reviewedBy,
    reviewedByUser: getPublicUser(getUserById(claim.reviewedBy))
  };
}

function toPublicItem(item) {
  const owner = getUserById(item.ownerId);
  const itemClaims = state.claims.filter((claim) => claim.itemId === item.id);

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    location: item.location,
    category: item.category,
    status: item.status,
    imagePath: item.imagePath,
    ownerId: item.ownerId,
    owner: getPublicUser(owner),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    claimedBy: item.claimedBy,
    claimedAt: item.claimedAt,
    claimCount: itemClaims.length,
    pendingClaimCount: itemClaims.filter((claim) => claim.status === 'pending').length,
    claims: itemClaims.map(toPublicClaim)
  };
}

function isValidItemStatus(status) {
  return ['lost', 'found'].includes(status);
}

function normalizeText(value) {
  return String(value || '').trim();
}

function buildItemQuery(items, searchTerm, status, category) {
  const term = searchTerm.toLowerCase();
  const normalizedStatus = status.toLowerCase();
  const normalizedCategory = category.toLowerCase();

  return items.filter((item) => {
    const matchesSearch = !term || [item.title, item.description, item.location, item.category].some((field) => field.toLowerCase().includes(term));
    const matchesStatus = normalizedStatus === 'all' || item.status.toLowerCase() === normalizedStatus;
    const matchesCategory = normalizedCategory === 'all' || item.category.toLowerCase() === normalizedCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });
}

app.get('/api/stats', (_req, res) => {
  return res.json({
    stats: {
      users: state.users.length,
      items: state.items.length,
      claims: state.claims.length,
      pendingClaims: state.claims.filter((claim) => claim.status === 'pending').length
    }
  });
});

app.get('/api/auth/me', (req, res) => {
  return res.json({ user: getPublicUser(getCurrentUser(req)) });
});

app.post('/api/auth/register', async (req, res) => {
  const name = normalizeText(req.body.name);
  const email = normalizeText(req.body.email).toLowerCase();
  const password = normalizeText(req.body.password);
  const contact = normalizeText(req.body.contact);
  const department = normalizeText(req.body.department);

  if (!name || !email || !password || !contact || !department) {
    return res.status(400).json({ error: 'All profile and login fields are required.' });
  }

  if (getUserByEmail(email)) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: nextId('user'),
    name,
    email,
    passwordHash,
    contact,
    department,
    role: 'student',
    createdAt: new Date().toISOString()
  };

  state.users.push(user);
  saveState();

  const sessionId = createSession(user.id);
  sendSessionCookie(res, sessionId);

  return res.status(201).json({ user: getPublicUser(user) });
});

app.post('/api/auth/login', async (req, res) => {
  const email = normalizeText(req.body.email).toLowerCase();
  const password = normalizeText(req.body.password);
  const user = getUserByEmail(email);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const sessionId = createSession(user.id);
  sendSessionCookie(res, sessionId);

  return res.json({ user: getPublicUser(user) });
});

app.post('/api/auth/logout', (req, res) => {
  const cookies = parseCookies(req.headers.cookie || '');
  if (cookies.lf_session) {
    destroySession(cookies.lf_session);
  }

  clearSessionCookie(res);
  return res.json({ ok: true });
});

app.get('/api/items', (req, res) => {
  const searchTerm = normalizeText(req.query.q);
  const status = normalizeText(req.query.status || 'all');
  const category = normalizeText(req.query.category || 'all');
  const items = buildItemQuery(state.items, searchTerm, status, category).map(toPublicItem).sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

  return res.json({ items });
});

app.get('/api/items/mine', requireAuth, (req, res) => {
  const mine = state.items.filter((item) => item.ownerId === req.currentUser.id).map(toPublicItem).sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  return res.json({ items: mine });
});

app.post('/api/items', requireAuth, upload.single('image'), (req, res) => {
  const title = normalizeText(req.body.title);
  const description = normalizeText(req.body.description);
  const location = normalizeText(req.body.location);
  const category = normalizeText(req.body.category) || 'General';
  const status = normalizeText(req.body.status).toLowerCase();

  if (!title || !description || !location) {
    return res.status(400).json({ error: 'Title, description, and location are required.' });
  }

  if (!isValidItemStatus(status)) {
    return res.status(400).json({ error: 'Item status must be lost or found.' });
  }

  const item = {
    id: nextId('item'),
    title,
    description,
    location,
    category,
    status,
    imagePath: req.file ? `/uploads/${req.file.filename}` : null,
    ownerId: req.currentUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    claimedBy: null,
    claimedAt: null
  };

  state.items.push(item);
  saveState();

  return res.status(201).json({ item: toPublicItem(item) });
});

app.post('/api/items/:itemId/claims', requireAuth, (req, res) => {
  const item = getItemById(req.params.itemId);
  if (!item) {
    return res.status(404).json({ error: 'Item not found.' });
  }

  if (item.ownerId === req.currentUser.id) {
    return res.status(400).json({ error: 'You cannot claim your own post.' });
  }

  if (item.status === 'claimed') {
    return res.status(400).json({ error: 'This item has already been claimed.' });
  }

  const message = normalizeText(req.body.message);
  if (!message) {
    return res.status(400).json({ error: 'Please include a short claim message.' });
  }

  const existingPending = state.claims.find((claim) => claim.itemId === item.id && claim.requestedBy === req.currentUser.id && claim.status === 'pending');
  if (existingPending) {
    return res.status(409).json({ error: 'You already have a pending claim on this item.' });
  }

  const claim = {
    id: nextId('claim'),
    itemId: item.id,
    requestedBy: req.currentUser.id,
    message,
    status: 'pending',
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null
  };

  state.claims.push(claim);
  saveState();

  return res.status(201).json({ claim: toPublicClaim(claim) });
});

app.patch('/api/claims/:claimId', requireAuth, (req, res) => {
  const claim = getClaimById(req.params.claimId);
  if (!claim) {
    return res.status(404).json({ error: 'Claim not found.' });
  }

  const item = getItemById(claim.itemId);
  if (!item) {
    return res.status(404).json({ error: 'Item not found.' });
  }

  const isOwner = item.ownerId === req.currentUser.id;
  const isAdmin = req.currentUser.role === 'admin';
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Only the item owner or an admin can review claims.' });
  }

  const nextStatus = normalizeText(req.body.status).toLowerCase();
  if (!['approved', 'rejected'].includes(nextStatus)) {
    return res.status(400).json({ error: 'Claim status must be approved or rejected.' });
  }

  if (claim.status !== 'pending') {
    return res.status(400).json({ error: 'This claim has already been reviewed.' });
  }

  claim.status = nextStatus;
  claim.reviewedAt = new Date().toISOString();
  claim.reviewedBy = req.currentUser.id;

  if (nextStatus === 'approved') {
    item.status = 'claimed';
    item.claimedBy = claim.requestedBy;
    item.claimedAt = new Date().toISOString();
    item.updatedAt = new Date().toISOString();

    for (const otherClaim of state.claims) {
      if (otherClaim.itemId === item.id && otherClaim.id !== claim.id && otherClaim.status === 'pending') {
        otherClaim.status = 'rejected';
        otherClaim.reviewedAt = new Date().toISOString();
        otherClaim.reviewedBy = req.currentUser.id;
      }
    }
  }

  saveState();
  return res.json({ claim: toPublicClaim(claim), item: toPublicItem(item) });
});

app.get('/api/admin/overview', requireAuth, requireAdmin, (_req, res) => {
  const overview = {
    users: state.users.length,
    items: state.items.length,
    claims: state.claims.length,
    pendingClaims: state.claims.filter((claim) => claim.status === 'pending').length,
    lostItems: state.items.filter((item) => item.status === 'lost').length,
    foundItems: state.items.filter((item) => item.status === 'found').length,
    claimedItems: state.items.filter((item) => item.status === 'claimed').length
  };

  return res.json({ overview });
});

app.get('/api/admin/users', requireAuth, requireAdmin, (_req, res) => {
  const users = state.users.map((user) => ({
    ...getPublicUser(user),
    itemCount: state.items.filter((item) => item.ownerId === user.id).length,
    claimCount: state.claims.filter((claim) => claim.requestedBy === user.id).length
  }));

  return res.json({ users });
});

app.get('/api/admin/items', requireAuth, requireAdmin, (_req, res) => {
  return res.json({ items: state.items.map(toPublicItem).sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)) });
});

app.get('/api/admin/claims', requireAuth, requireAdmin, (_req, res) => {
  const claims = state.claims.map(toPublicClaim).sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  return res.json({ claims });
});

app.delete('/api/admin/items/:itemId', requireAuth, requireAdmin, (req, res) => {
  const itemIndex = state.items.findIndex((item) => item.id === req.params.itemId);
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item not found.' });
  }

  const [removedItem] = state.items.splice(itemIndex, 1);
  state.claims = state.claims.filter((claim) => claim.itemId !== removedItem.id);
  saveState();
  return res.json({ ok: true });
});

app.delete('/api/admin/users/:userId', requireAuth, requireAdmin, (req, res) => {
  if (req.params.userId === req.currentUser.id) {
    return res.status(400).json({ error: 'You cannot delete your own admin account.' });
  }

  const userIndex = state.users.findIndex((user) => user.id === req.params.userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const [removedUser] = state.users.splice(userIndex, 1);
  state.items = state.items.filter((item) => item.ownerId !== removedUser.id);
  state.claims = state.claims.filter((claim) => claim.requestedBy !== removedUser.id);

  for (const [sessionId, session] of Object.entries(state.sessions)) {
    if (session.userId === removedUser.id) {
      delete state.sessions[sessionId];
    }
  }

  saveState();
  return res.json({ ok: true });
});

app.get('*', (_req, res) => {
  return res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Campus Lost & Found Portal running at http://localhost:${port}`);
});
