/* ══════════════════════════════════════════════════════
   SOUL CLOTHING — Shop Page JS
   ══════════════════════════════════════════════════════ */

let allProducts = [];
let activeFilters = {
  categories: [],
  genders: [],
  prices: [],
  inStockOnly: false,
  newOnly: false,
  saleOnly: false,
  sort: 'default',
  search: ''
};

document.addEventListener('DOMContentLoaded', async () => {
  // Read URL params
  const params = new URLSearchParams(window.location.search);
  if (params.get('cat'))    activeFilters.categories = [params.get('cat')];
  if (params.get('q'))      activeFilters.search = params.get('q');
  if (params.get('filter') === 'new') activeFilters.newOnly = true;

  // Update heading
  const heading = document.getElementById('shop-heading');
  if (heading && activeFilters.categories.length) {
    const labels = {
      'formal-shirt': 'FORMAL SHIRTS',
      dress: 'DRESSES',
      tshirt: 'T-SHIRTS',
      polo: 'POLO',
      shirt: 'SHIRTS',
      jeans: 'JEANS',
      pants: 'PANTS',
      sneakers: 'SNEAKERS'
    };
    heading.textContent = labels[activeFilters.categories[0]] || 'ALL PRODUCTS';
  }

  // Tick checkboxes for pre-filters
  activeFilters.categories.forEach(cat => {
    const cb = document.querySelector(`#cat-filters input[value="${cat}"]`);
    if (cb) cb.checked = true;
  });

  await loadShopProducts();
});

async function loadShopProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  // Skeleton
  grid.innerHTML = [1,2,3,4,6,8].map(() => `
    <div class="product-card">
      <div class="product-card-image skeleton" style="aspect-ratio:3/4"></div>
      <div class="product-card-body">
        <div class="skeleton" style="height:13px;width:70%;margin-bottom:8px;border-radius:2px"></div>
        <div class="skeleton" style="height:15px;width:40%;border-radius:2px"></div>
      </div>
    </div>`).join('');

  try {
    const res = await apiFetch('/products');
    allProducts = res.data || [];
    applyFilters();
  } catch {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#888">
        <div style="font-size:3rem;margin-bottom:16px">⚠️</div>
        <p>Could not load products.<br>Make sure the backend is running on port 3000.</p>
      </div>`;
  }
}

function applyFilters() {
  const filtered = filterLocal(allProducts);
  renderGrid(filtered);
}

function filterLocal(products) {
  return products.filter(p => {
    // Search
    if (activeFilters.search) {
      const q = activeFilters.search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !(p.description || '').toLowerCase().includes(q)) return false;
    }
    // Categories
    if (activeFilters.categories.length) {
      const match = activeFilters.categories.some(cat => {
        if (cat === 'shirt') return p.category === 'shirt' || p.category === 'shirts';
        if (cat === 'tshirt') return p.category === 'tshirt' || p.category === 't-shirts';
        return p.category === cat;
      });
      if (!match) return false;
    }
    // Gender
    if (activeFilters.genders.length) {
      if (!activeFilters.genders.includes((p.gender || '').toLowerCase())) return false;
    }
    // Price
    if (activeFilters.prices.length) {
      const inRange = activeFilters.prices.some(range => {
        const [min, max] = range.split('-').map(Number);
        return p.price >= min && p.price <= max;
      });
      if (!inRange) return false;
    }
    // Stock
    if (activeFilters.inStockOnly && p.stock === 0) return false;
    // New
    if (activeFilters.newOnly && !p.isNew) return false;
    // Sale
    if (activeFilters.saleOnly && !(p.originalPrice > p.price)) return false;
    return true;
  }).sort((a, b) => {
    if (activeFilters.sort === 'price-asc')  return a.price - b.price;
    if (activeFilters.sort === 'price-desc') return b.price - a.price;
    if (activeFilters.sort === 'new')        return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
    if (activeFilters.sort === 'popular')    return (b.soldCount || 0) - (a.soldCount || 0);
    return 0;
  });
}

function renderGrid(products) {
  const grid  = document.getElementById('products-grid');
  const none  = document.getElementById('no-products');
  const label = document.getElementById('product-count-label');

  if (label) label.textContent = `${products.length} product${products.length !== 1 ? 's' : ''} found`;

  if (!products.length) {
    if (grid)  grid.innerHTML = '';
    if (none)  none.classList.remove('hidden');
    return;
  }
  if (none) none.classList.add('hidden');
  if (grid)  grid.innerHTML = products.map((p, i) =>
    `<div style="animation:fadeInUp 0.4s ease ${Math.min(i, 8) * 0.05}s both">${buildProductCard(p)}</div>`
  ).join('');
}

// ─── Filter Handlers (called from HTML) ──────────────
window.applyFilters = function() {
  // Categories
  activeFilters.categories = [...document.querySelectorAll('#cat-filters input:checked')].map(cb => cb.value);
  // Genders
  activeFilters.genders = [...document.querySelectorAll('#gender-filters input:checked')].map(cb => cb.value);
  // Prices
  activeFilters.prices = [...document.querySelectorAll('[data-price]:checked, input[type=checkbox][value*="-"]:checked')].map(cb => cb.value);
  // Also collect from inline price checkboxes
  document.querySelectorAll('.shop-sidebar input[type=checkbox]').forEach(cb => {
    const v = cb.value;
    if (v.includes('-') && cb.checked && !activeFilters.prices.includes(v)) activeFilters.prices.push(v);
  });
  // In-stock/new/sale
  activeFilters.inStockOnly = document.getElementById('filter-in-stock')?.checked || false;
  activeFilters.newOnly     = document.getElementById('filter-new-only')?.checked || false;
  activeFilters.saleOnly    = document.getElementById('filter-sale-only')?.checked || false;
  applyFilters();
};

window.applySortFilter = function() {
  activeFilters.sort = document.getElementById('sort-select')?.value || 'default';
  applyFilters();
};

window.clearFilters = function() {
  activeFilters = { categories:[], genders:[], prices:[], inStockOnly:false, newOnly:false, saleOnly:false, sort:'default', search:'' };
  document.querySelectorAll('.shop-sidebar input[type=checkbox]').forEach(cb => cb.checked = false);
  const sel = document.getElementById('sort-select');
  if (sel) sel.value = 'default';
  const heading = document.getElementById('shop-heading');
  if (heading) heading.textContent = 'ALL PRODUCTS';
  applyFilters();
};

window.loadShopProducts = loadShopProducts;
window.allProducts = allProducts;

// Add CSS fadeInUp if not present
const s = document.createElement('style');
s.textContent = `@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`;
document.head.appendChild(s);
