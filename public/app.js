const state = {
  user: null,
  items: [],
  myItems: [],
  stats: {
    users: 0,
    items: 0,
    claims: 0,
    pendingClaims: 0
  },
  admin: {
    overview: null,
    users: [],
    items: [],
    claims: []
  },
  filters: {
    q: '',
    status: 'all',
    category: 'all'
  }
};

const elements = {
  authContent: document.getElementById('auth-content'),
  itemForm: document.getElementById('item-form'),
  searchInput: document.getElementById('search-input'),
  statusFilter: document.getElementById('status-filter'),
  categoryFilter: document.getElementById('category-filter'),
  itemsGrid: document.getElementById('items-grid'),
  myItems: document.getElementById('my-items'),
  adminPanel: document.getElementById('admin-panel'),
  adminOverview: document.getElementById('admin-overview'),
  adminUsers: document.getElementById('admin-users'),
  adminItems: document.getElementById('admin-items'),
  adminClaims: document.getElementById('admin-claims'),
  statUsers: document.getElementById('stat-users'),
  statItems: document.getElementById('stat-items'),
  statClaims: document.getElementById('stat-claims'),
  claimModal: document.getElementById('claim-modal'),
  claimTitle: document.getElementById('claim-modal-title'),
  claimClose: document.getElementById('claim-close'),
  claimForm: document.getElementById('claim-form')
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: options.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Something went wrong.');
  }

  return payload;
}

function getStatsSource() {
  return state.stats;
}

function renderAuth() {
  if (!state.user) {
    elements.authContent.innerHTML = `
      <div class="stack-form">
        <form id="login-form" class="stack-form">
          <label>
            Email
            <input name="email" type="email" placeholder="student@campus.local" required />
          </label>
          <label>
            Password
            <input name="password" type="password" placeholder="Your password" required />
          </label>
          <button class="primary-btn" type="submit">Login</button>
        </form>
        <form id="register-form" class="stack-form">
          <div class="section-label">New account</div>
          <label>
            Full name
            <input name="name" type="text" placeholder="Your name" required />
          </label>
          <div class="two-col">
            <label>
              Email
              <input name="email" type="email" placeholder="name@campus.local" required />
            </label>
            <label>
              Contact
              <input name="contact" type="text" placeholder="Phone number" required />
            </label>
          </div>
          <label>
            Department
            <input name="department" type="text" placeholder="Computer Science" required />
          </label>
          <label>
            Password
            <input name="password" type="password" placeholder="Create a password" required />
          </label>
          <button class="secondary-btn" type="submit">Create account</button>
        </form>
      </div>
    `;

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(loginForm);
      await handleMutation(async () => {
        await request('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(Object.fromEntries(formData.entries()))
        });
        await refreshAll();
      });
    });

    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(registerForm);
      await handleMutation(async () => {
        await request('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify(Object.fromEntries(formData.entries()))
        });
        registerForm.reset();
        await refreshAll();
      });
    });

    return;
  }

  elements.authContent.innerHTML = `
    <div class="summary-card">
      <div class="entry-top">
        <div>
          <h3>${escapeHtml(state.user.name)}</h3>
          <p>${escapeHtml(state.user.department)} • ${escapeHtml(state.user.contact)}</p>
        </div>
        <span class="badge ${escapeHtml(state.user.role)}">${escapeHtml(state.user.role)}</span>
      </div>
      <div class="summary-row" style="margin-top: 0.85rem;">
        <span class="pill">${escapeHtml(state.user.email)}</span>
        <span class="pill">Logged in</span>
      </div>
      <div class="action-row" style="margin-top: 1rem;">
        <button id="logout-btn" class="secondary-btn" type="button">Logout</button>
      </div>
    </div>
  `;

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await handleMutation(async () => {
      await request('/api/auth/logout', { method: 'POST' });
      await refreshAll();
    });
  });
}

function renderItems() {
  if (!state.items.length) {
    elements.itemsGrid.innerHTML = '<p class="muted">No items match the current filters.</p>';
    return;
  }

  elements.itemsGrid.innerHTML = state.items.map((item) => {
    const canRequestClaim = state.user && item.ownerId !== state.user.id && item.status !== 'claimed';
    const isOwner = state.user && item.ownerId === state.user.id;
    const imageStyle = item.imagePath ? `style="background-image: url('${item.imagePath}')"` : '';

    return `
      <article class="item-card">
        <div class="item-image" ${imageStyle}></div>
        <div class="item-body">
          <div class="meta-row">
            <span class="badge ${escapeHtml(item.status)}">${escapeHtml(item.status)}</span>
            <span class="pill">${escapeHtml(item.category)}</span>
            <span class="pill">${escapeHtml(item.claimCount)} claims</span>
          </div>
          <h3>${escapeHtml(item.title)}</h3>
          <p class="muted">${escapeHtml(item.description)}</p>
          <div class="summary-row">
            <span class="pill">${escapeHtml(item.location)}</span>
            <span class="pill">By ${escapeHtml(item.owner?.name || 'Unknown')}</span>
          </div>
          <div class="action-row">
            ${canRequestClaim ? `<button class="secondary-btn claim-button" data-item-id="${escapeHtml(item.id)}" data-item-title="${escapeHtml(item.title)}" type="button">Request claim</button>` : ''}
            ${isOwner ? '<span class="pill">Your post</span>' : ''}
          </div>
        </div>
      </article>
    `;
  }).join('');

  document.querySelectorAll('.claim-button').forEach((button) => {
    button.addEventListener('click', () => openClaimModal(button.dataset.itemId, button.dataset.itemTitle));
  });
}

function renderMyItems() {
  if (!state.user) {
    elements.myItems.innerHTML = '<p class="muted">Log in to manage your own item posts and claim requests.</p>';
    return;
  }

  if (!state.myItems.length) {
    elements.myItems.innerHTML = '<p class="muted">You have not posted any items yet.</p>';
    return;
  }

  elements.myItems.innerHTML = state.myItems.map((item) => {
    const claimMarkup = item.claims.length
      ? `<div class="claim-list">${item.claims.map((claim) => `
          <div class="claim-entry">
            <div class="entry-top">
              <div>
                <h4>${escapeHtml(claim.requester?.name || 'Student')}</h4>
                <p>${escapeHtml(claim.message)}</p>
              </div>
              <span class="badge ${escapeHtml(claim.status)}">${escapeHtml(claim.status)}</span>
            </div>
            <div class="summary-row">
              <span class="pill">${escapeHtml(formatDate(claim.createdAt))}</span>
              ${claim.status === 'pending' ? `
                <button class="secondary-btn review-claim" data-claim-id="${escapeHtml(claim.id)}" data-status="approved" type="button">Approve</button>
                <button class="secondary-btn review-claim" data-claim-id="${escapeHtml(claim.id)}" data-status="rejected" type="button">Reject</button>
              ` : `<span class="pill">Reviewed by ${escapeHtml(claim.reviewedByUser?.name || 'system')}</span>`}
            </div>
          </div>
        `).join('')}</div>`
      : '<p class="muted">No claim requests yet.</p>';

    return `
      <article class="detail-card">
        <div class="entry-top">
          <div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.description)}</p>
          </div>
          <span class="badge ${escapeHtml(item.status)}">${escapeHtml(item.status)}</span>
        </div>
        <div class="summary-row">
          <span class="pill">${escapeHtml(item.category)}</span>
          <span class="pill">${escapeHtml(item.location)}</span>
          <span class="pill">${escapeHtml(item.claimCount)} claim(s)</span>
        </div>
        ${claimMarkup}
      </article>
    `;
  }).join('');

  document.querySelectorAll('.review-claim').forEach((button) => {
    button.addEventListener('click', async () => {
      await handleMutation(async () => {
        await request(`/api/claims/${button.dataset.claimId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: button.dataset.status })
        });
        await refreshAll();
      });
    });
  });
}

function renderAdmin() {
  elements.adminPanel.classList.toggle('hidden', !state.user || state.user.role !== 'admin');

  if (!state.user || state.user.role !== 'admin') {
    return;
  }

  const overview = state.admin.overview || {
    users: 0,
    items: 0,
    claims: 0,
    pendingClaims: 0,
    lostItems: 0,
    foundItems: 0,
    claimedItems: 0
  };

  elements.adminOverview.innerHTML = [
    ['Users', overview.users],
    ['Items', overview.items],
    ['Claims', overview.claims],
    ['Pending', overview.pendingClaims],
    ['Lost', overview.lostItems],
    ['Found', overview.foundItems],
    ['Claimed', overview.claimedItems]
  ].map(([label, value]) => `
    <div class="overview-card">
      <span>${escapeHtml(value)}</span>
      <small>${escapeHtml(label)}</small>
    </div>
  `).join('');

  elements.adminUsers.innerHTML = state.admin.users.length
    ? state.admin.users.map((user) => `
      <div class="user-entry">
        <div class="entry-top">
          <div>
            <h4>${escapeHtml(user.name)}</h4>
            <p>${escapeHtml(user.email)} • ${escapeHtml(user.department)}</p>
          </div>
          <span class="badge ${escapeHtml(user.role)}">${escapeHtml(user.role)}</span>
        </div>
        <div class="summary-row">
          <span class="pill">${escapeHtml(user.contact)}</span>
          <span class="pill">${escapeHtml(user.itemCount)} posts</span>
          <span class="pill">${escapeHtml(user.claimCount)} claims</span>
          ${user.id === state.user.id ? '<span class="pill">current admin</span>' : `<button class="secondary-btn admin-delete-user" data-user-id="${escapeHtml(user.id)}" type="button">Delete user</button>`}
        </div>
      </div>
    `).join('')
    : '<p class="muted">No users available.</p>';

  elements.adminItems.innerHTML = state.admin.items.length
    ? state.admin.items.map((item) => `
      <div class="admin-entry">
        <div class="entry-top">
          <div>
            <h4>${escapeHtml(item.title)}</h4>
            <p>${escapeHtml(item.description)}</p>
          </div>
          <span class="badge ${escapeHtml(item.status)}">${escapeHtml(item.status)}</span>
        </div>
        <div class="summary-row">
          <span class="pill">${escapeHtml(item.location)}</span>
          <span class="pill">${escapeHtml(item.category)}</span>
          <span class="pill">Owner: ${escapeHtml(item.owner?.name || 'Unknown')}</span>
          <button class="secondary-btn admin-delete-item" data-item-id="${escapeHtml(item.id)}" type="button">Delete post</button>
        </div>
      </div>
    `).join('')
    : '<p class="muted">No posts available.</p>';

  elements.adminClaims.innerHTML = state.admin.claims.length
    ? state.admin.claims.map((claim) => `
      <div class="admin-entry">
        <div class="entry-top">
          <div>
            <h4>${escapeHtml(claim.requester?.name || 'Student')} requested ${escapeHtml(claim.itemId)}</h4>
            <p>${escapeHtml(claim.message)}</p>
          </div>
          <span class="badge ${escapeHtml(claim.status)}">${escapeHtml(claim.status)}</span>
        </div>
        <div class="summary-row">
          <span class="pill">${escapeHtml(formatDate(claim.createdAt))}</span>
          <span class="pill">Reviewed by ${escapeHtml(claim.reviewedByUser?.name || 'pending')}</span>
        </div>
      </div>
    `).join('')
    : '<p class="muted">No claims available.</p>';

  document.querySelectorAll('.admin-delete-user').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!confirm('Delete this user and their posts?')) {
        return;
      }

      await handleMutation(async () => {
        await request(`/api/admin/users/${button.dataset.userId}`, { method: 'DELETE' });
        await refreshAll();
      });
    });
  });

  document.querySelectorAll('.admin-delete-item').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!confirm('Remove this post from the portal?')) {
        return;
      }

      await handleMutation(async () => {
        await request(`/api/admin/items/${button.dataset.itemId}`, { method: 'DELETE' });
        await refreshAll();
      });
    });
  });
}

function renderDashboardStats() {
  const stats = getStatsSource();
  elements.statUsers.textContent = stats.users ?? 0;
  elements.statItems.textContent = stats.items ?? 0;
  elements.statClaims.textContent = stats.claims ?? 0;
}

function openClaimModal(itemId, title) {
  elements.claimForm.itemId.value = itemId;
  elements.claimTitle.textContent = `Request ${title}`;
  elements.claimModal.classList.remove('hidden');
  elements.claimModal.setAttribute('aria-hidden', 'false');
  elements.claimForm.message.focus();
}

function closeClaimModal() {
  elements.claimModal.classList.add('hidden');
  elements.claimModal.setAttribute('aria-hidden', 'true');
  elements.claimForm.reset();
}

async function handleMutation(action) {
  try {
    await action();
  } catch (error) {
    alert(error.message);
  }
}

async function refreshItems() {
  const params = new URLSearchParams();
  if (state.filters.q) params.set('q', state.filters.q);
  if (state.filters.status) params.set('status', state.filters.status);
  if (state.filters.category) params.set('category', state.filters.category);

  const data = await request(`/api/items?${params.toString()}`);
  state.items = data.items;
}

async function refreshMyItems() {
  if (!state.user) {
    state.myItems = [];
    return;
  }

  const data = await request('/api/items/mine');
  state.myItems = data.items;
}

async function refreshAdmin() {
  if (!state.user || state.user.role !== 'admin') {
    state.admin = {
      overview: null,
      users: [],
      items: [],
      claims: []
    };
    return;
  }

  const [overview, users, items, claims] = await Promise.all([
    request('/api/admin/overview'),
    request('/api/admin/users'),
    request('/api/admin/items'),
    request('/api/admin/claims')
  ]);

  state.admin = {
    overview: overview.overview,
    users: users.users,
    items: items.items,
    claims: claims.claims
  };
}

async function refreshAll() {
  const [me, stats] = await Promise.all([
    request('/api/auth/me'),
    request('/api/stats')
  ]);
  state.user = me.user;
  state.stats = stats.stats;
  await Promise.all([refreshItems(), refreshMyItems(), refreshAdmin()]);
  renderAll();
}

function renderAll() {
  renderAuth();
  renderDashboardStats();
  renderItems();
  renderMyItems();
  renderAdmin();
}

function wireFilters() {
  elements.searchInput.addEventListener('input', async () => {
    state.filters.q = elements.searchInput.value.trim();
    await refreshItems();
    renderItems();
  });

  elements.statusFilter.addEventListener('change', async () => {
    state.filters.status = elements.statusFilter.value;
    await refreshItems();
    renderItems();
  });

  elements.categoryFilter.addEventListener('change', async () => {
    state.filters.category = elements.categoryFilter.value;
    await refreshItems();
    renderItems();
  });
}

function wireClaimForm() {
  elements.claimClose.addEventListener('click', closeClaimModal);
  elements.claimModal.addEventListener('click', (event) => {
    if (event.target === elements.claimModal) {
      closeClaimModal();
    }
  });

  elements.claimForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(elements.claimForm);

    await handleMutation(async () => {
      const itemId = formData.get('itemId');
      const message = formData.get('message');
      await request(`/api/items/${itemId}/claims`, {
        method: 'POST',
        body: JSON.stringify({ message })
      });
      closeClaimModal();
      await refreshAll();
    });
  });
}

function wireItemForm() {
  elements.itemForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!state.user) {
      alert('Please log in before posting an item.');
      return;
    }

    const formData = new FormData(elements.itemForm);

    await handleMutation(async () => {
      await request('/api/items', {
        method: 'POST',
        body: formData
      });
      elements.itemForm.reset();
      await refreshAll();
    });
  });
}

async function boot() {
  wireFilters();
  wireClaimForm();
  wireItemForm();
  await refreshAll();
}

boot();
