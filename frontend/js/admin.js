/* ══════════════════════════════════════════════════════
   SOUL STORE — Admin Dashboard Controller v2
   Light Theme | Sidebar | Charts | CRUD
   ══════════════════════════════════════════════════════ */

const API_BASE = window.location.port === '5173'
  ? '/api'
  : (window.location.hostname ? `${window.location.protocol}//${window.location.hostname}:3000/api` : 'http://localhost:3000/api');

let adminProducts = [];
let adminOffers   = [];
let adminEvents   = [];
let adminOrders   = [];

let salesChartInstance   = null;
let categoryChartInstance = null;

// ─── apiFetch ─────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json;
}

// ─── Init ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await refreshAllData();
});

async function refreshAllData() {
  const icon = document.getElementById('refresh-icon');
  if (icon) { icon.style.animation = 'spin 1s linear infinite'; }
  try {
    await Promise.all([
      loadStats(),
      loadProducts(),
      loadOffers(),
      loadEvents(),
      loadOrders()
    ]);
    initSalesChart();
    initCategoryChart();
  } catch (err) {
    console.error('Refresh error:', err);
    showToast('Failed to load some data. Is the backend running?', '⚠️');
  } finally {
    if (icon) icon.style.animation = '';
  }
}
window.refreshAllData = refreshAllData;

// ─── Section Switching ────────────────────────────────
const SECTION_LABELS = {
  'dashboard':    { title: 'Dashboard',     sub: 'Overview of your store performance' },
  'products':     { title: 'Products',      sub: 'Manage your full catalog' },
  'new-arrivals': { title: 'New Arrivals',  sub: 'Toggle featured new arrivals' },
  'offers':       { title: 'Offers',        sub: 'Manage discount codes and promos' },
  'events':       { title: 'Events',        sub: 'Upcoming store events' },
  'orders':       { title: 'Orders',        sub: 'All customer orders' }
};

function switchSection(name) {
  // Hide all sections
  document.querySelectorAll('section[id^="sec-"]').forEach(s => s.classList.add('hidden'));
  // Deactivate all nav items
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

  // Show target
  const target = document.getElementById(`sec-${name}`);
  if (target) target.classList.remove('hidden');

  // Activate nav
  const navBtn = document.getElementById(`nav-${name}`);
  if (navBtn) navBtn.classList.add('active');

  // Update header
  const label = SECTION_LABELS[name] || { title: name, sub: '' };
  const titleEl = document.getElementById('section-title');
  const subEl   = document.getElementById('section-subtitle');
  if (titleEl) titleEl.textContent = label.title;
  if (subEl)   subEl.textContent   = label.sub;

  // Re-init charts when switching to dashboard
  if (name === 'dashboard') {
    setTimeout(() => { initSalesChart(); initCategoryChart(); }, 100);
  }
}
window.switchSection = switchSection;

// ─── Stats ────────────────────────────────────────────
async function loadStats() {
  try {
    const res = await apiFetch('/admin/stats');
    const s = res.data;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('stat-total-products',  s.totalProducts    ?? 0);
    set('stat-low-stock',       s.lowStockCount    ?? 0);
    set('stat-new-arrivals',    s.newArrivalsCount ?? 0);
    set('stat-active-offers',   s.activeOffersCount  ?? 0);
    set('stat-upcoming-events', s.upcomingEventsCount ?? 0);
    set('stat-total-orders',    s.totalOrders      ?? 0);
    set('stat-total-revenue',   `₹${(s.totalRevenue || 0).toLocaleString('en-IN')}`);
  } catch (e) {
    console.error('Stats error:', e);
  }
}

// ─── Sales Chart ──────────────────────────────────────
function initSalesChart() {
  const canvas = document.getElementById('sales-chart');
  if (!canvas) return;

  // Build last-7-days labels
  const labels = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }));
  }

  // Group orders by day
  const daySales = new Array(7).fill(0);
  adminOrders.forEach(o => {
    const d = new Date(o.createdAt || o.date || Date.now());
    for (let i = 0; i < 7; i++) {
      const ref = new Date(now);
      ref.setDate(ref.getDate() - (6 - i));
      if (d.toDateString() === ref.toDateString()) {
        daySales[i] += (o.total || 0);
      }
    }
  });

  // If no real data, use sample
  const hasData = daySales.some(v => v > 0);
  const data = hasData ? daySales : [1200, 1900, 1500, 2800, 2200, 3100, 2600];

  if (salesChartInstance) salesChartInstance.destroy();
  salesChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Revenue (₹)',
          data,
          backgroundColor: '#4361EE',
          borderRadius: 6,
          barThickness: 24
        },
        {
          label: 'Trend',
          data: data.map((v, i, a) => i === 0 ? v : (v + a[i - 1]) / 2),
          type: 'line',
          borderColor: '#F97316',
          borderWidth: 2,
          pointRadius: 3,
          fill: false,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true, position: 'top', labels: { font: { size: 12, family: 'Inter' } } }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#F3F4F6' },
          ticks: { font: { size: 11, family: 'Inter' }, callback: v => `₹${v.toLocaleString('en-IN')}` }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 11, family: 'Inter' } }
        }
      }
    }
  });
}

// ─── Category Donut Chart ─────────────────────────────
function initCategoryChart() {
  const canvas = document.getElementById('category-chart');
  if (!canvas) return;

  const catMap = {};
  adminProducts.forEach(p => {
    catMap[p.category] = (catMap[p.category] || 0) + (p.soldCount || 0);
  });

  const labels = Object.keys(catMap).map(k => k.charAt(0).toUpperCase() + k.slice(1));
  const values = Object.values(catMap);

  if (!values.some(v => v > 0)) {
    labels.push('T-Shirt', 'Jeans', 'Shirt', 'Polo', 'Sneakers');
    values.push(...[40, 25, 20, 10, 5]);
  }

  if (categoryChartInstance) categoryChartInstance.destroy();
  categoryChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values.length ? values : labels.map(() => 1),
        backgroundColor: ['#4361EE', '#10B981', '#F97316', '#EC4899', '#8B5CF6', '#06B6D4'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11, family: 'Inter' }, padding: 12 } }
      },
      cutout: '65%'
    }
  });
}

// ─── Dashboard: Best Sellers Table ────────────────────
function renderDashBestSellers(products) {
  const tbody = document.getElementById('dash-bestsellers-body');
  if (!tbody) return;
  const sorted = [...products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 5);
  if (!sorted.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#9CA3AF;padding:20px">No products yet</td></tr>';
    return;
  }
  tbody.innerHTML = sorted.map((p, i) => {
    const img = (p.images && p.images[0])
      ? `<img src="${p.images[0]}" class="product-thumb" onerror="this.outerHTML='<div class=product-thumb-placeholder>👕</div>'">`
      : `<div class="product-thumb-placeholder">👕</div>`;
    const revenue = ((p.soldCount || 0) * (p.price || 0)).toLocaleString('en-IN');
    return `<tr>
      <td style="color:#9CA3AF;font-weight:600">${i + 1}</td>
      <td>${img}</td>
      <td><span class="product-link">${p.name}</span></td>
      <td><strong>${p.soldCount || 0}</strong></td>
      <td>₹${revenue}</td>
    </tr>`;
  }).join('');
}

// ─── Dashboard: Recent Orders Table ───────────────────
function renderDashOrders(orders) {
  const tbody = document.getElementById('dash-orders-body');
  if (!tbody) return;
  const recent = [...orders].reverse().slice(0, 5);
  if (!recent.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#9CA3AF;padding:20px">No orders yet</td></tr>';
    return;
  }
  tbody.innerHTML = recent.map((o, i) => {
    const status = o.status || 'new';
    const badge = `<span class="badge badge-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
    const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '—';
    const shortId = (o.id || o._id || `ORD${i + 1}`).toString().slice(-6).toUpperCase();
    return `<tr>
      <td style="color:#9CA3AF;font-weight:600">${i + 1}</td>
      <td><strong>#${shortId}</strong></td>
      <td>${badge}</td>
      <td>₹${(o.total || 0).toLocaleString('en-IN')}</td>
      <td style="color:#9CA3AF">${date}</td>
    </tr>`;
  }).join('');
}

// ─── Products ─────────────────────────────────────────
async function loadProducts() {
  const res = await apiFetch('/products');
  adminProducts = res.data || [];
  renderInventoryTable(adminProducts);
  renderNewArrivalsCurator(adminProducts);
  renderDashBestSellers(adminProducts);
}

function filterInventory() {
  const q      = (document.getElementById('inv-search')?.value || '').toLowerCase();
  const cat    = document.getElementById('inv-cat-filter')?.value || '';
  const stock  = document.getElementById('inv-stock-filter')?.value || '';

  const filtered = adminProducts.filter(p => {
    const matchQ     = !q   || p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
    const matchCat   = !cat || p.category === cat;
    const matchStock = !stock
      || (stock === 'low'  && p.stock > 0  && p.stock <= 5)
      || (stock === 'out'  && p.stock === 0);
    return matchQ && matchCat && matchStock;
  });
  renderInventoryTable(filtered);
}
window.filterInventory = filterInventory;

function renderInventoryTable(products) {
  const tbody = document.getElementById('inventory-body');
  if (!tbody) return;
  if (!products.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#9CA3AF;padding:30px">No products found</td></tr>';
    return;
  }
  tbody.innerHTML = products.map(p => {
    const img = (p.images && p.images[0])
      ? `<img src="${p.images[0]}" class="product-thumb" onerror="this.outerHTML='<div class=product-thumb-placeholder>👕</div>'">`
      : `<div class="product-thumb-placeholder">👕</div>`;
    const stockBadge = p.stock === 0
      ? `<span class="badge badge-low">Out</span>`
      : p.stock <= 5
        ? `<span class="badge badge-processing">${p.stock} Low</span>`
        : `<span class="badge badge-ok">${p.stock}</span>`;
    const newToggle = `
      <label class="toggle-switch">
        <input type="checkbox" ${p.isNew ? 'checked' : ''} onchange="toggleNewArrival('${p.id}', this.checked)">
        <span class="toggle-slider"></span>
      </label>`;
    return `<tr>
      <td>${img}</td>
      <td><strong>${p.name}</strong></td>
      <td><span style="font-size:12px;color:#6B7280;text-transform:capitalize">${p.category}</span></td>
      <td><strong>₹${(p.price || 0).toLocaleString('en-IN')}</strong></td>
      <td>
        <div class="stock-controls">
          <button class="stock-btn" onclick="adjustStock('${p.id}', -1)">−</button>
          <span class="stock-val">${p.stock ?? 0}</span>
          <button class="stock-btn" onclick="adjustStock('${p.id}', 1)">+</button>
        </div>
      </td>
      <td>${stockBadge}</td>
      <td>${newToggle}</td>
      <td>
        <div class="action-btns">
          <button class="btn-edit" onclick="openProductModal('${p.id}')">Edit</button>
          <button class="btn-delete" onclick="deleteProduct('${p.id}')">Del</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

async function adjustStock(id, delta) {
  try {
    const product = adminProducts.find(p => p.id === id);
    if (!product) return;
    const newStock = Math.max(0, (product.stock || 0) + delta);
    await apiFetch(`/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock: newStock })
    });
    product.stock = newStock;
    renderInventoryTable(adminProducts);
    showToast(`Stock updated: ${newStock}`, '✅');
  } catch (e) {
    showToast('Failed to update stock', '❌');
  }
}
window.adjustStock = adjustStock;

async function toggleNewArrival(id, isNew) {
  try {
    await apiFetch(`/products/${id}/toggle-new`, {
      method: 'PATCH',
      body: JSON.stringify({ isNew })
    });
    const p = adminProducts.find(p => p.id === id);
    if (p) p.isNew = isNew;
    renderNewArrivalsCurator(adminProducts);
    showToast(`New Arrival ${isNew ? 'enabled' : 'disabled'}`, '✅');
  } catch (e) {
    showToast('Failed to update', '❌');
  }
}
window.toggleNewArrival = toggleNewArrival;

function renderNewArrivalsCurator(products) {
  const grid = document.getElementById('new-arrivals-curator');
  if (!grid) return;
  grid.innerHTML = products.map(p => {
    const imgSrc = p.images && p.images[0];
    const imgTag = imgSrc
      ? `<img src="${imgSrc}" class="admin-card-banner" style="object-fit:cover" onerror="this.outerHTML='<div class=admin-card-banner-placeholder>👕</div>'">`
      : `<div class="admin-card-banner-placeholder">👕</div>`;
    const badgeClass = p.isNew ? 'badge-new' : 'badge-inactive';
    const badgeText  = p.isNew ? 'New Arrival' : 'Not Featured';
    return `<div class="admin-card">
      ${imgTag}
      <div class="admin-card-header">
        <span class="admin-card-title">${p.name}</span>
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="admin-card-sub" style="text-transform:capitalize">${p.category} · ₹${(p.price || 0).toLocaleString('en-IN')}</div>
      <div class="admin-card-footer">
        <span style="font-size:12px;color:#6B7280">Stock: ${p.stock ?? '—'}</span>
        <label class="toggle-switch">
          <input type="checkbox" ${p.isNew ? 'checked' : ''} onchange="toggleNewArrival('${p.id}', this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>`;
  }).join('');
}

// ─── Product Modal ─────────────────────────────────────
function openProductModal(id) {
  const overlay = document.getElementById('product-modal-overlay');
  const title   = document.getElementById('product-modal-title');
  overlay.classList.add('open');

  if (id) {
    const p = adminProducts.find(p => p.id === id);
    if (!p) return;
    title.textContent = 'Edit Product';
    document.getElementById('prod-id').value             = p.id;
    document.getElementById('prod-name').value           = p.name || '';
    document.getElementById('prod-category').value       = p.category || '';
    document.getElementById('prod-price').value          = p.price || '';
    document.getElementById('prod-original-price').value = p.originalPrice || '';
    document.getElementById('prod-stock').value          = p.stock ?? '';
    document.getElementById('prod-color').value          = p.color || '';
    document.getElementById('prod-desc').value           = p.description || '';
    document.getElementById('prod-is-new').checked       = !!p.isNew;
    document.getElementById('prod-image').value          = (p.images && p.images[0]) || '';
  } else {
    title.textContent = 'Add Product';
    document.getElementById('product-form').reset();
    document.getElementById('prod-id').value = '';
  }
}
window.openProductModal = openProductModal;

function closeProductModal() {
  document.getElementById('product-modal-overlay').classList.remove('open');
}
window.closeProductModal = closeProductModal;

async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('prod-id').value;
  const imageUrl = document.getElementById('prod-image').value.trim();
  const body = {
    name:          document.getElementById('prod-name').value.trim(),
    category:      document.getElementById('prod-category').value,
    price:         parseFloat(document.getElementById('prod-price').value),
    originalPrice: parseFloat(document.getElementById('prod-original-price').value) || null,
    stock:         parseInt(document.getElementById('prod-stock').value) || 0,
    color:         document.getElementById('prod-color').value.trim(),
    description:   document.getElementById('prod-desc').value.trim(),
    isNew:         document.getElementById('prod-is-new').checked,
    images:        imageUrl ? [imageUrl] : undefined
  };

  try {
    if (id) {
      await apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      showToast('Product updated!', '✅');
    } else {
      await apiFetch('/products', { method: 'POST', body: JSON.stringify(body) });
      showToast('Product added!', '✅');
    }
    closeProductModal();
    await loadProducts();
  } catch (err) {
    showToast('Failed: ' + err.message, '❌');
  }
}
window.saveProduct = saveProduct;

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  try {
    await apiFetch(`/products/${id}`, { method: 'DELETE' });
    showToast('Product deleted', '✅');
    await loadProducts();
  } catch (e) {
    showToast('Failed to delete', '❌');
  }
}
window.deleteProduct = deleteProduct;

// ─── Offers ───────────────────────────────────────────
async function loadOffers() {
  try {
    const res = await apiFetch('/offers');
    adminOffers = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    renderOffersGrid(adminOffers);
    renderDashStatOffers();
  } catch (e) {
    console.error('Offers error:', e);
  }
}

function renderDashStatOffers() {
  const el = document.getElementById('stat-active-offers');
  if (el) el.textContent = adminOffers.filter(o => o.active !== false).length;
}

function renderOffersGrid(offers) {
  const grid = document.getElementById('offers-grid');
  if (!grid) return;
  if (!offers.length) {
    grid.innerHTML = '<div style="text-align:center;color:#9CA3AF;padding:40px;grid-column:1/-1">No offers yet. Click "+ Add Offer" to create one.</div>';
    return;
  }
  grid.innerHTML = offers.map(o => {
    const isActive = o.active !== false;
    return `<div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">${o.title || o.code}</div>
          <div class="admin-card-sub">${o.description || ''}</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${isActive ? 'checked' : ''} onchange="toggleOffer('${o.id}', this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin:12px 0">
        <span class="promo-code-chip" onclick="copyText('${o.code}')">${o.code}</span>
        ${o.discount ? `<span style="font-size:13px;font-weight:700;color:#10B981">${o.discount}% OFF</span>` : ''}
        <span class="badge ${isActive ? 'badge-active' : 'badge-inactive'}">${isActive ? 'Active' : 'Inactive'}</span>
      </div>
      <div class="admin-card-footer">
        <span></span>
        <div class="action-btns">
          <button class="btn-edit" onclick="openOfferModal('${o.id}')">Edit</button>
          <button class="btn-delete" onclick="deleteOffer('${o.id}')">Delete</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function openOfferModal(id) {
  const overlay = document.getElementById('offer-modal-overlay');
  const title   = document.getElementById('offer-modal-title');
  overlay.classList.add('open');
  if (id) {
    const o = adminOffers.find(o => o.id === id);
    if (!o) return;
    title.textContent = 'Edit Offer';
    document.getElementById('offer-id').value       = o.id;
    document.getElementById('offer-title').value    = o.title || '';
    document.getElementById('offer-code').value     = o.code || '';
    document.getElementById('offer-discount').value = o.discount || '';
    document.getElementById('offer-desc').value     = o.description || '';
    document.getElementById('offer-active').checked = o.active !== false;
  } else {
    title.textContent = 'Add Offer';
    document.getElementById('offer-form').reset();
    document.getElementById('offer-id').value = '';
    document.getElementById('offer-active').checked = true;
  }
}
window.openOfferModal = openOfferModal;

function closeOfferModal() {
  document.getElementById('offer-modal-overlay').classList.remove('open');
}
window.closeOfferModal = closeOfferModal;

async function saveOffer(e) {
  e.preventDefault();
  const id = document.getElementById('offer-id').value;
  const body = {
    title:       document.getElementById('offer-title').value.trim(),
    code:        document.getElementById('offer-code').value.trim().toUpperCase(),
    discount:    parseFloat(document.getElementById('offer-discount').value) || 0,
    description: document.getElementById('offer-desc').value.trim(),
    active:      document.getElementById('offer-active').checked
  };
  try {
    if (id) {
      await apiFetch(`/offers/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      showToast('Offer updated!', '✅');
    } else {
      await apiFetch('/offers', { method: 'POST', body: JSON.stringify(body) });
      showToast('Offer created!', '✅');
    }
    closeOfferModal();
    await loadOffers();
  } catch (err) {
    showToast('Failed: ' + err.message, '❌');
  }
}
window.saveOffer = saveOffer;

async function toggleOffer(id, active) {
  try {
    await apiFetch(`/offers/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ active }) });
    const o = adminOffers.find(o => o.id === id);
    if (o) o.active = active;
    renderOffersGrid(adminOffers);
    showToast(`Offer ${active ? 'activated' : 'deactivated'}`, '✅');
  } catch (e) {
    showToast('Failed to toggle offer', '❌');
  }
}
window.toggleOffer = toggleOffer;

async function deleteOffer(id) {
  if (!confirm('Delete this offer?')) return;
  try {
    await apiFetch(`/offers/${id}`, { method: 'DELETE' });
    showToast('Offer deleted', '✅');
    await loadOffers();
  } catch (e) {
    showToast('Failed to delete', '❌');
  }
}
window.deleteOffer = deleteOffer;

// ─── Events ───────────────────────────────────────────
async function loadEvents() {
  try {
    const res = await apiFetch('/events');
    adminEvents = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    renderEventsGrid(adminEvents);
  } catch (e) {
    console.error('Events error:', e);
  }
}

function renderEventsGrid(events) {
  const grid = document.getElementById('events-grid');
  if (!grid) return;
  if (!events.length) {
    grid.innerHTML = '<div style="text-align:center;color:#9CA3AF;padding:40px;grid-column:1/-1">No events yet. Click "+ Add Event" to create one.</div>';
    return;
  }
  grid.innerHTML = events.map(ev => {
    const isActive = ev.active !== false;
    const d = ev.date ? new Date(ev.date) : null;
    const dateStr = d ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    return `<div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">${ev.title}</div>
          <div class="admin-card-sub">${dateStr}${ev.location ? ' · ' + ev.location : ''}</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${isActive ? 'checked' : ''} onchange="toggleEvent('${ev.id}', this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
      ${ev.description ? `<p style="font-size:13px;color:#6B7280;margin-bottom:12px;line-height:1.5">${ev.description}</p>` : ''}
      <div class="admin-card-footer">
        <div style="display:flex;align-items:center;gap:8px">
          <span class="badge ${isActive ? 'badge-active' : 'badge-inactive'}">${isActive ? 'Active' : 'Inactive'}</span>
          ${ev.rsvpCount ? `<span style="font-size:12px;color:#6B7280">👤 ${ev.rsvpCount} RSVPs</span>` : ''}
        </div>
        <div class="action-btns">
          <button class="btn-edit" onclick="openEventModal('${ev.id}')">Edit</button>
          <button class="btn-delete" onclick="deleteEvent('${ev.id}')">Delete</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function openEventModal(id) {
  const overlay = document.getElementById('event-modal-overlay');
  const title   = document.getElementById('event-modal-title');
  overlay.classList.add('open');
  if (id) {
    const ev = adminEvents.find(e => e.id === id);
    if (!ev) return;
    title.textContent = 'Edit Event';
    document.getElementById('event-id').value       = ev.id;
    document.getElementById('event-title').value    = ev.title || '';
    document.getElementById('event-date').value     = ev.date ? ev.date.substring(0, 10) : '';
    document.getElementById('event-time').value     = ev.time || '';
    document.getElementById('event-location').value = ev.location || '';
    document.getElementById('event-desc').value     = ev.description || '';
    document.getElementById('event-active').checked = ev.active !== false;
  } else {
    title.textContent = 'Add Event';
    document.getElementById('event-form').reset();
    document.getElementById('event-id').value = '';
    document.getElementById('event-active').checked = true;
  }
}
window.openEventModal = openEventModal;

function closeEventModal() {
  document.getElementById('event-modal-overlay').classList.remove('open');
}
window.closeEventModal = closeEventModal;

async function saveEvent(e) {
  e.preventDefault();
  const id = document.getElementById('event-id').value;
  const body = {
    title:       document.getElementById('event-title').value.trim(),
    date:        document.getElementById('event-date').value,
    time:        document.getElementById('event-time').value,
    location:    document.getElementById('event-location').value.trim(),
    description: document.getElementById('event-desc').value.trim(),
    active:      document.getElementById('event-active').checked
  };
  try {
    if (id) {
      await apiFetch(`/events/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      showToast('Event updated!', '✅');
    } else {
      await apiFetch('/events', { method: 'POST', body: JSON.stringify(body) });
      showToast('Event created!', '✅');
    }
    closeEventModal();
    await loadEvents();
  } catch (err) {
    showToast('Failed: ' + err.message, '❌');
  }
}
window.saveEvent = saveEvent;

async function toggleEvent(id, active) {
  try {
    await apiFetch(`/events/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ active }) });
    const ev = adminEvents.find(e => e.id === id);
    if (ev) ev.active = active;
    renderEventsGrid(adminEvents);
    showToast(`Event ${active ? 'activated' : 'deactivated'}`, '✅');
  } catch (e) {
    showToast('Failed to toggle event', '❌');
  }
}
window.toggleEvent = toggleEvent;

async function deleteEvent(id) {
  if (!confirm('Delete this event?')) return;
  try {
    await apiFetch(`/events/${id}`, { method: 'DELETE' });
    showToast('Event deleted', '✅');
    await loadEvents();
  } catch (e) {
    showToast('Failed to delete', '❌');
  }
}
window.deleteEvent = deleteEvent;

// ─── Orders ───────────────────────────────────────────
async function loadOrders() {
  try {
    const res = await apiFetch('/orders');
    adminOrders = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    renderOrdersTable(adminOrders);
    renderDashOrders(adminOrders);
  } catch (e) {
    console.error('Orders error:', e);
  }
}

function renderOrdersTable(orders) {
  const tbody = document.getElementById('orders-body');
  if (!tbody) return;
  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#9CA3AF;padding:30px">No orders yet</td></tr>';
    return;
  }
  tbody.innerHTML = [...orders].reverse().map((o, i) => {
    const status  = o.status || 'new';
    const badge   = `<span class="badge badge-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
    const date    = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '—';
    const shortId = (o.id || o._id || `ORD${i + 1}`).toString().slice(-6).toUpperCase();
    const items   = Array.isArray(o.items) ? o.items.length : '—';
    const cust    = o.customer?.name || o.customerName || 'Guest';
    return `<tr>
      <td style="color:#9CA3AF;font-weight:600">${i + 1}</td>
      <td><strong>#${shortId}</strong></td>
      <td>${cust}</td>
      <td style="color:#6B7280">${items} item${items !== 1 ? 's' : ''}</td>
      <td><strong>₹${(o.total || 0).toLocaleString('en-IN')}</strong></td>
      <td>${badge}</td>
      <td style="color:#9CA3AF">${date}</td>
    </tr>`;
  }).join('');
}

// ─── Utilities ────────────────────────────────────────
function showToast(msg, icon = '✅') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = `${icon} ${msg}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
window.showToast = showToast;

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => showToast(`Copied: ${text}`, '📋'));
}
window.copyText = copyText;

function copyPromoCode(code) { copyText(code); }
window.copyPromoCode = copyPromoCode;
