/* ══════════════════════════════════════════════════════
   SOUL CLOTHING — Shared App State, API & Cart Logic
   ══════════════════════════════════════════════════════ */

const API_BASE = window.location.port === '5173'
  ? '/api'
  : (window.location.hostname
      ? `${window.location.protocol}//${window.location.hostname}:3000/api`
      : 'http://localhost:3000/api');

// ─── API Helper ───────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const res = await fetch(API_BASE + endpoint, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

// ─── Helpers ──────────────────────────────────────────
function categoryEmoji(cat) {
  const map = {
    'formal-shirt': '👔',
    'dress': '👗',
    'tshirt': '👕', 't-shirt': '👕', 't-shirts': '👕',
    'polo': '🏌️', 'shirt': '👔', 'shirts': '👔',
    'jeans': '👖', 'pants': '👖', 'sneakers': '👟'
  };
  return map[(cat || '').toLowerCase()] || '🧥';
}

function calcDiscount(price, original) {
  if (!original || original <= price) return null;
  return Math.round((1 - price / original) * 100);
}

function formatPrice(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

function showToast(msg, icon = '✅') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = `${icon} ${msg}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ─── Cart State ───────────────────────────────────────
const Cart = {
  items: JSON.parse(localStorage.getItem('soul_cart') || '[]'),

  save() {
    localStorage.setItem('soul_cart', JSON.stringify(this.items));
    this.updateBadge();
    this.renderSidebar();
  },

  add(product, size, qty = 1) {
    const key = `${product.id}-${size}`;
    const existing = this.items.find(i => i.key === key);
    if (existing) {
      existing.quantity += qty;
    } else {
      this.items.push({
        key,
        productId: product.id,
        name: product.name,
        category: product.category,
        color: product.color,
        price: product.price,
        image: (product.images && product.images[0]) || '',
        size,
        quantity: qty,
        emoji: categoryEmoji(product.category)
      });
    }
    this.save();
    showToast(`"${product.name}" added to cart!`, '✅');
    openCart();
  },

  remove(key) {
    this.items = this.items.filter(i => i.key !== key);
    this.save();
  },

  updateQty(key, delta) {
    const item = this.items.find(i => i.key === key);
    if (!item) return;
    item.quantity = Math.max(1, item.quantity + delta);
    this.save();
  },

  total() {
    return this.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  count() {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  },

  clear() {
    this.items = [];
    this.save();
  },

  updateBadge() {
    const count = this.count();
    document.querySelectorAll('#cart-badge, .cart-count').forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'flex' : 'none';
    });
  },

  renderSidebar() {
    const container = document.getElementById('cart-items');
    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = `
        <div class="cart-empty">
          Your cart is empty.<br><br>
          <a href="/shop.html" style="font-weight:700;text-decoration:underline;color:#111">START SHOPPING →</a>
        </div>`;
    } else {
      container.innerHTML = this.items.map(item => {
        const imgHtml = item.image
          ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">`
          : `<span style="font-size:1.8rem;display:flex;align-items:center;justify-content:center;height:100%">${item.emoji}</span>`;
        return `
          <div class="cart-item" data-key="${item.key}">
            <div class="cart-item-img">${imgHtml}</div>
            <div class="cart-item-info">
              <div class="cart-item-name">${item.name}</div>
              <div class="cart-item-meta">${item.color || ''} · Size: ${item.size}</div>
              <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
              <div class="qty-controls">
                <button class="qty-btn" onclick="Cart.updateQty('${item.key}', -1)">−</button>
                <span class="qty-val">${item.quantity}</span>
                <button class="qty-btn" onclick="Cart.updateQty('${item.key}', 1)">+</button>
              </div>
              <div class="cart-item-remove" onclick="Cart.remove('${item.key}')">Remove</div>
            </div>
          </div>`;
      }).join('');
    }

    const subtotal = this.total();
    const el = document.getElementById('cart-total');
    if (el) el.textContent = formatPrice(subtotal);
  }
};

// ─── Cart Open/Close ──────────────────────────────────
function openCart() {
  document.getElementById('cart-overlay')?.classList.add('open');
  document.getElementById('cart-sidebar')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-overlay')?.classList.remove('open');
  document.getElementById('cart-sidebar')?.classList.remove('open');
  document.body.style.overflow = '';
}

// ─── Product Card Builder ─────────────────────────────
function buildProductCard(p, showQuickAdd = true) {
  const disc = calcDiscount(p.price, p.originalPrice);
  const isOutOfStock = p.stock !== undefined && p.stock === 0;
  const isLowStock   = p.stock !== undefined && p.stock > 0 && p.stock <= 5;
  const imgUrl = p.images && p.images.length > 0 ? p.images[0] : '';

  return `
    <div class="product-card" data-id="${p.id}" onclick="openProductModal('${p.id}')">
      <div class="product-card-image">
        ${imgUrl
          ? `<img src="${imgUrl}" alt="${p.name}"
               loading="lazy"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
             <div class="product-card-placeholder" style="display:none;">
               ${categoryEmoji(p.category)}<span>${p.category}</span>
             </div>`
          : `<div class="product-card-placeholder">
               ${categoryEmoji(p.category)}<span>${p.category}</span>
             </div>`
        }
        ${p.isNew && !disc ? '<span class="badge-new">NEW</span>' : ''}
        ${disc ? `<span class="badge-discount">-${disc}%</span>` : ''}
        ${isOutOfStock ? `<span class="badge-new" style="background:#777;left:auto;right:10px">SOLD OUT</span>` : ''}
        ${isLowStock && !isOutOfStock ? `<span class="badge-new" style="background:#e67e22;color:#fff">ONLY ${p.stock} LEFT</span>` : ''}
        ${showQuickAdd ? `
        <div class="product-card-overlay">
          <button
            ${isOutOfStock ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}
            onclick="event.stopPropagation(); ${isOutOfStock ? '' : `quickAddToCart('${p.id}')`}">
            ${isOutOfStock ? 'SOLD OUT' : 'ADD TO CART'}
          </button>
        </div>` : ''}
      </div>
      <div class="product-card-body">
        <div class="product-card-category">${p.category}</div>
        <div class="product-card-name">${p.name}</div>
        <div class="product-card-price">
          <span class="price-current">${formatPrice(p.price)}</span>
          ${p.originalPrice > p.price ? `<span class="price-original">${formatPrice(p.originalPrice)}</span>` : ''}
          ${disc ? `<span class="price-discount">-${disc}%</span>` : ''}
        </div>
      </div>
    </div>`;
}

// ─── Quick Add (opens modal) ──────────────────────────
const _productCache = {};

async function quickAddToCart(productId) {
  event?.stopPropagation();
  await openProductModal(productId);
}

// ─── Product Modal ────────────────────────────────────
let _modalProduct = null;
let _modalSelectedSize = null;

async function openProductModal(productId) {
  // Fetch product
  let product = _productCache[productId];
  if (!product) {
    try {
      const res = await apiFetch(`/products/${productId}`);
      product = res.data;
      _productCache[productId] = product;
    } catch {
      showToast('Failed to load product', '❌');
      return;
    }
  }

  _modalProduct = product;
  _modalSelectedSize = null;

  const disc = calcDiscount(product.price, product.originalPrice);
  const stars = '★'.repeat(Math.round(product.rating || 4)) + '☆'.repeat(5 - Math.round(product.rating || 4));

  // Build modal HTML with white theme
  const modalHtml = `
    <div id="product-modal" onclick="event.stopPropagation()">
      <!-- Image panel -->
      <div class="modal-image-panel" id="modal-image-panel">
        ${product.images && product.images[0]
          ? `<img src="${product.images[0]}" alt="${product.name}" id="modal-img-main"
               style="width:100%;height:100%;object-fit:cover"
               onerror="this.outerHTML='<div class=modal-image-placeholder>${categoryEmoji(product.category)}</div>'">`
          : `<div class="modal-image-placeholder" style="font-size:5rem">${categoryEmoji(product.category)}</div>`
        }
        ${product.images && product.images.length > 1 ? `
        <div class="modal-thumbnails">
          ${product.images.slice(0, 4).map((img, i) => `
            <img src="${img}" class="modal-thumb ${i === 0 ? 'active' : ''}"
              onclick="document.getElementById('modal-img-main').src='${img}';
                       document.querySelectorAll('.modal-thumb').forEach(t=>t.classList.remove('active'));
                       this.classList.add('active')">
          `).join('')}
        </div>` : ''}
      </div>

      <!-- Info panel -->
      <div class="modal-info">
        <button class="modal-close" onclick="closeProductModal()">✕</button>
        <div class="modal-category">${product.category} · ${product.gender || 'Unisex'}</div>
        <h2 class="modal-title">${product.name}</h2>
        <div class="modal-price">
          <span class="current">${formatPrice(product.price)}</span>
          ${product.originalPrice > product.price
            ? `<span class="original">${formatPrice(product.originalPrice)}</span>
               <span class="discount">-${disc}%</span>` : ''}
        </div>
        <div class="modal-rating">
          <span class="stars">${stars}</span>
          <span class="count">${product.rating || 4.2} · ${product.reviews || 0} reviews</span>
        </div>
        <div class="modal-divider"></div>
        <p class="modal-desc">${product.description || 'Premium quality, crafted for comfort and style.'}</p>

        <div class="modal-label">SELECT SIZE</div>
        <div class="size-grid" id="modal-sizes">
          ${(product.sizes || []).map(s => `
            <button class="size-btn" onclick="selectModalSize('${s}', this)" data-size="${s}">${s}</button>
          `).join('')}
        </div>
        <div id="modal-size-error" style="font-size:12px;color:#e74c3c;margin-top:6px;display:none">⚠️ Please select a size</div>

        <div style="font-size:13px;color:#555;margin-top:12px">
          <strong style="color:#111">Colour:</strong> ${product.color || '—'}
          ${product.stock <= 10 && product.stock > 0
            ? `<span style="margin-left:12px;color:#e67e22;font-weight:600">Only ${product.stock} left!</span>` : ''}
          ${product.stock === 0
            ? `<span style="margin-left:12px;color:#e74c3c;font-weight:700">Out of Stock</span>` : ''}
        </div>

        <button class="btn-add-to-cart" onclick="addFromModal()"
          ${product.stock === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
          ${product.stock === 0 ? 'OUT OF STOCK' : '🛒 ADD TO CART'}
        </button>

        <div style="display:flex;gap:20px;font-size:11px;color:#999;margin-top:14px;letter-spacing:0.5px">
          <span>🚚 Free shipping above ₹999</span>
          <span>↩️ 30-day easy returns</span>
        </div>
      </div>
    </div>`;

  const overlay = document.getElementById('product-modal-overlay');
  if (!overlay) return;
  overlay.innerHTML = modalHtml;
  overlay.style.display = 'flex';
  overlay.style.cssText = `
    display:flex; position:fixed; inset:0;
    background:rgba(0,0,0,0.55); z-index:300;
    align-items:center; justify-content:center; padding:20px;
  `;
  document.body.style.overflow = 'hidden';
}

function selectModalSize(size, btn) {
  _modalSelectedSize = size;
  document.querySelectorAll('#modal-sizes .size-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  const err = document.getElementById('modal-size-error');
  if (err) err.style.display = 'none';
}

function addFromModal() {
  if (!_modalProduct) return;
  if (_modalProduct.stock === 0) { showToast('This item is out of stock!', '⚠️'); return; }
  if (!_modalSelectedSize) {
    const err = document.getElementById('modal-size-error');
    if (err) err.style.display = 'block';
    return;
  }
  Cart.add(_modalProduct, _modalSelectedSize);
  closeProductModal();
}

// alias used by inline onclick
window.addToCartFromModal = addFromModal;

function closeProductModal() {
  const overlay = document.getElementById('product-modal-overlay');
  if (overlay) { overlay.style.display = 'none'; overlay.innerHTML = ''; }
  document.body.style.overflow = '';
  _modalProduct = null;
  _modalSelectedSize = null;
}

// ─── Home: Load New Arrivals ──────────────────────────
async function loadHomeGrid(gridId, endpoint) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  try {
    const res = await apiFetch(endpoint);
    const products = res.data || [];
    if (!products.length) { grid.innerHTML = '<p style="color:#888;grid-column:1/-1;text-align:center">No products found.</p>'; return; }
    grid.innerHTML = products.slice(0, 5).map(p => buildProductCard(p)).join('');
  } catch (e) {
    grid.innerHTML = `<p style="color:#888;grid-column:1/-1;text-align:center">Could not load products — make sure backend is running.</p>`;
  }
}

// ─── Promo Code Copy ──────────────────────────────────
function copyPromoCode(code) {
  navigator.clipboard.writeText(code).catch(() => {});
  showToast(`Code "${code}" copied! 🏷️`, '📋');
}

// ─── Shop Filter Helpers (used by shop.html) ──────────
function applyFilters() {
  if (typeof filterLocal === 'function' && typeof renderGrid === 'function') {
    renderGrid(filterLocal(window.allProducts || []));
  }
}

function clearFilters() {
  if (typeof clearAllFilters === 'function') clearAllFilters();
}

function applySortFilter() {
  if (typeof loadShopProducts === 'function') {
    const sel = document.getElementById('sort-select');
    window.activeFilters = window.activeFilters || {};
    window.activeFilters.sort = sel?.value || 'default';
    loadShopProducts();
  }
}

// ─── Navbar Scroll ────────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.navbar');
  if (nav) nav.style.boxShadow = window.scrollY > 40 ? '0 2px 16px rgba(0,0,0,0.1)' : '';
});

// ─── DOM Ready ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Cart.updateBadge();
  Cart.renderSidebar();

  // Close cart on overlay click
  document.getElementById('cart-overlay')?.addEventListener('click', closeCart);

  // Close modal on overlay click
  document.getElementById('product-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeProductModal();
  });

  // Global search
  const searchEl = document.getElementById('global-search');
  if (searchEl) {
    searchEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && searchEl.value.trim()) {
        window.location.href = `/shop.html?q=${encodeURIComponent(searchEl.value.trim())}`;
      }
    });
  }
});

// ─── Expose Globals ───────────────────────────────────
window.Cart = Cart;
window.openCart = openCart;
window.closeCart = closeCart;
window.apiFetch = apiFetch;
window.showToast = showToast;
window.formatPrice = formatPrice;
window.calcDiscount = calcDiscount;
window.categoryEmoji = categoryEmoji;
window.buildProductCard = buildProductCard;
window.quickAddToCart = quickAddToCart;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.selectModalSize = selectModalSize;
window.addFromModal = addFromModal;
window.copyPromoCode = copyPromoCode;
window.loadHomeGrid = loadHomeGrid;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.applySortFilter = applySortFilter;
