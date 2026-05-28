import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const rootDir = process.cwd();
const dataDir = path.join(rootDir, 'server', 'data');
const stateFile = path.join(dataDir, 'state.json');
const uploadsDir = path.join(rootDir, 'public', 'uploads');

const seedPasswords = {
  admin: bcrypt.hashSync('Admin@123', 10),
  student: bcrypt.hashSync('Student@123', 10)
};

function ensureDirectories() {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function createSeedState() {
  const now = new Date().toISOString();

  return {
    users: [
      {
        id: 'user_1',
        name: 'Campus Admin',
        email: 'admin@campus.local',
        passwordHash: seedPasswords.admin,
        contact: 'N/A',
        department: 'Administration',
        role: 'admin',
        createdAt: now
      },
      {
        id: 'user_2',
        name: 'Aarav Mehta',
        email: 'aarav@campus.local',
        passwordHash: seedPasswords.student,
        contact: '+91 98765 43210',
        department: 'Computer Science',
        role: 'student',
        createdAt: now
      },
      {
        id: 'user_3',
        name: 'Maya Singh',
        email: 'maya@campus.local',
        passwordHash: seedPasswords.student,
        contact: '+91 99887 77665',
        department: 'Information Systems',
        role: 'student',
        createdAt: now
      }
    ],
    items: [
      {
        id: 'item_1',
        title: 'Silver Dell Laptop Charger',
        description: '65W charger left near the library computers after an evening study session.',
        location: 'Central Library, 2nd Floor',
        category: 'Electronics',
        status: 'lost',
        imagePath: null,
        ownerId: 'user_2',
        createdAt: now,
        updatedAt: now,
        claimedBy: null,
        claimedAt: null
      },
      {
        id: 'item_2',
        title: 'Black Insulated Water Bottle',
        description: 'Found near the sports court benches after practice.',
        location: 'Campus Sports Complex',
        category: 'Accessories',
        status: 'found',
        imagePath: null,
        ownerId: 'user_3',
        createdAt: now,
        updatedAt: now,
        claimedBy: null,
        claimedAt: null
      }
    ],
    claims: [
      {
        id: 'claim_1',
        itemId: 'item_2',
        requestedBy: 'user_2',
        message: 'I believe this is my bottle. It has a scratched lid and the same sticker on the side.',
        status: 'pending',
        createdAt: now,
        reviewedAt: null,
        reviewedBy: null
      }
    ],
    sessions: {},
    counters: {
      user: 4,
      item: 3,
      claim: 2,
      session: 1
    }
  };
}

function readStateFile() {
  ensureDirectories();

  if (!fs.existsSync(stateFile)) {
    const initialState = createSeedState();
    fs.writeFileSync(stateFile, JSON.stringify(initialState, null, 2));
    return initialState;
  }

  try {
    const raw = fs.readFileSync(stateFile, 'utf8');
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch {
    const fallbackState = createSeedState();
    fs.writeFileSync(stateFile, JSON.stringify(fallbackState, null, 2));
    return fallbackState;
  }
}

function normalizeState(state) {
  const normalized = {
    users: Array.isArray(state.users) ? state.users : [],
    items: Array.isArray(state.items) ? state.items : [],
    claims: Array.isArray(state.claims) ? state.claims : [],
    sessions: state.sessions && typeof state.sessions === 'object' ? state.sessions : {},
    counters: state.counters && typeof state.counters === 'object' ? state.counters : {}
  };

  const prefixes = ['user', 'item', 'claim', 'session'];
  for (const prefix of prefixes) {
    const current = Number(normalized.counters[prefix] || 1);
    const maxSeen = findMaxNumericSuffix(normalized, prefix);
    normalized.counters[prefix] = Math.max(current, maxSeen + 1);
  }

  if (!normalized.users.some((user) => user.role === 'admin')) {
    normalized.users.unshift({
      id: 'user_admin',
      name: 'Campus Admin',
      email: 'admin@campus.local',
      passwordHash: seedPasswords.admin,
      contact: 'N/A',
      department: 'Administration',
      role: 'admin',
      createdAt: new Date().toISOString()
    });
  }

  return normalized;
}

function findMaxNumericSuffix(state, prefix) {
  const collections = [state.users, state.items, state.claims, Object.keys(state.sessions).map((sessionId) => ({ id: sessionId }))];
  let maxValue = 0;

  for (const collection of collections) {
    for (const entry of collection) {
      const match = String(entry.id || '').match(new RegExp(`^${prefix}_(\\d+)$`));
      if (match) {
        maxValue = Math.max(maxValue, Number(match[1]));
      }
    }
  }

  return maxValue;
}

export const state = readStateFile();

export function saveState() {
  ensureDirectories();
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

export function nextId(prefix) {
  const id = `${prefix}_${state.counters[prefix]}`;
  state.counters[prefix] += 1;
  saveState();
  return id;
}

export function getUserById(userId) {
  return state.users.find((user) => user.id === userId) || null;
}

export function getUserByEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  return state.users.find((user) => user.email.toLowerCase() === normalizedEmail) || null;
}

export function getItemById(itemId) {
  return state.items.find((item) => item.id === itemId) || null;
}

export function getClaimById(claimId) {
  return state.claims.find((claim) => claim.id === claimId) || null;
}

export function getSession(sessionId) {
  return state.sessions[sessionId] || null;
}

export function createSession(userId) {
  const sessionId = crypto.randomUUID();
  state.sessions[sessionId] = {
    id: sessionId,
    userId,
    createdAt: new Date().toISOString()
  };
  saveState();
  return sessionId;
}

export function destroySession(sessionId) {
  if (state.sessions[sessionId]) {
    delete state.sessions[sessionId];
    saveState();
  }
}

export function getPublicUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    contact: user.contact,
    department: user.department,
    role: user.role,
    createdAt: user.createdAt
  };
}
