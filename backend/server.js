const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// ─── Paths ───────────────────────────────────────────────────────────────────
const candidate1 = path.resolve(__dirname, '../../Soul-Clothing-frontend-main/Soul-Clothing-frontend-main');
const candidate2 = path.resolve(__dirname, '../Soul-Clothing-frontend-main/Soul-Clothing-frontend-main');
const FRONTEND_DIR = fs.existsSync(candidate1) ? candidate1 : (fs.existsSync(candidate2) ? candidate2 : path.resolve(__dirname, '../frontend'));

const DATA_DIR = path.join(__dirname, 'data');

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json());

// Serve frontend static files
const DIST_DIR = path.join(FRONTEND_DIR, 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
}
app.use(express.static(FRONTEND_DIR));

// ─── Data Helpers ────────────────────────────────────────────────────────────
function readProducts() {
return JSON.parse(
fs.readFileSync(path.join(DATA_DIR, 'products.json'), 'utf-8')
);
}

function writeProducts(products) {
  fs.writeFileSync(
    path.join(DATA_DIR, 'products.json'),
    JSON.stringify(products, null, 2)
  );
}

function readOrders() {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, 'orders.json'), 'utf-8')
    );
  } catch {
    return [];
  }
}

function writeOrders(orders) {
  fs.writeFileSync(
    path.join(DATA_DIR, 'orders.json'),
    JSON.stringify(orders, null, 2)
  );
}

function readOffers() {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, 'offers.json'), 'utf-8')
    );
  } catch {
    return [];
  }
}

function writeOffers(offers) {
  fs.writeFileSync(
    path.join(DATA_DIR, 'offers.json'),
    JSON.stringify(offers, null, 2)
  );
}

function readEvents() {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, 'events.json'), 'utf-8')
    );
  } catch {
    return [];
  }
}

function writeEvents(events) {
  fs.writeFileSync(
    path.join(DATA_DIR, 'events.json'),
    JSON.stringify(events, null, 2)
  );
}

// ─── API Routes ──────────────────────────────────────────────────────────────

// GET /api/products
app.get('/api/products', (req, res) => {
let products = readProducts();
const { category, gender, minPrice, maxPrice, sort, search } = req.query;

if (category) {
products = products.filter(p => p.category === category);
}

if (gender && gender !== 'all') {
products = products.filter(
p => p.gender === gender || p.gender === 'unisex'
);
}

if (minPrice) {
products = products.filter(p => p.price >= Number(minPrice));
}

if (maxPrice) {
products = products.filter(p => p.price <= Number(maxPrice));
}

if (search) {
const q = search.toLowerCase();

products = products.filter(
  p =>
    p.name.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q)
);

}

if (sort === 'price-asc') {
products.sort((a, b) => a.price - b.price);
} else if (sort === 'price-desc') {
products.sort((a, b) => b.price - a.price);
} else if (sort === 'rating') {
products.sort((a, b) => b.rating - a.rating);
} else if (sort === 'newest') {
products.sort(
(a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)
);
} else if (sort === 'popular') {
products.sort((a, b) => b.soldCount - a.soldCount);
}

res.json({
success: true,
count: products.length,
data: products
});
});

// GET /api/products/new-arrivals
app.get('/api/products/new-arrivals', (req, res) => {
const products = readProducts()
.filter(p => p.isNew)
.sort((a, b) => b.id.localeCompare(a.id))
.slice(0, 8);

res.json({
success: true,
data: products
});
});

// GET /api/products/best-sellers
app.get('/api/products/best-sellers', (req, res) => {
const products = readProducts()
.sort((a, b) => b.soldCount - a.soldCount)
.slice(0, 8);

res.json({
success: true,
data: products
});
});

// GET /api/products/categories
app.get('/api/products/categories', (req, res) => {
const products = readProducts();

const categories = [
{ id: 't-shirts', label: 'T-Shirts', icon: '👕' },
{ id: 'polo', label: 'Polo', icon: '🏌️' },
{ id: 'shirts', label: 'Shirts', icon: '👔' },
{ id: 'jeans', label: 'Jeans', icon: '👖' },
{ id: 'pants', label: 'Pants', icon: '🩲' },
{ id: 'sneakers', label: 'Sneakers', icon: '👟' }
];

const result = categories.map(cat => ({
...cat,
count: products.filter(p => p.category === cat.id).length
}));

res.json({
success: true,
data: result
});
});

// GET /api/products/:id
app.get('/api/products/:id', (req, res) => {
const products = readProducts();

const product = products.find(p => p.id === req.params.id);

if (!product) {
return res.status(404).json({
success: false,
message: 'Product not found'
});
}

const similar = products
.filter(
p =>
p.category === product.category &&
p.id !== product.id
)
.slice(0, 4);

res.json({
success: true,
data: product,
similar
});
});

// POST /api/products — Create new product
app.post('/api/products', (req, res) => {
  const products = readProducts();
  const { name, category, gender, price, originalPrice, sizes, color, description, isNew, stock } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ success: false, message: 'Name, price and category are required' });
  }

  const prefix = (category.slice(0, 3).toUpperCase());
  const newId = prefix + String(products.length + 1).padStart(3, '0');
  const product = {
    id: req.body.id || newId,
    name,
    category,
    gender: gender || 'unisex',
    price: Number(price),
    originalPrice: originalPrice ? Number(originalPrice) : Math.round(Number(price) * 1.3),
    sizes: Array.isArray(sizes) && sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL'],
    color: color || 'Black',
    description: description || 'Premium Soul collection piece designed for modern style.',
    isNew: Boolean(isNew !== undefined ? isNew : true),
    soldCount: 0,
    stock: stock !== undefined ? Number(stock) : 50,
    rating: 4.8,
    reviews: 1,
    images: req.body.images && req.body.images.length > 0 ? req.body.images : [`${newId.toLowerCase()}_1.jpg`]
  };

  products.unshift(product);
  writeProducts(products);

  res.status(201).json({ success: true, message: 'Product created successfully', data: product });
});

// PUT /api/products/:id — Full update
app.put('/api/products/:id', (req, res) => {
  const products = readProducts();
  const index = products.findIndex(p => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const existing = products[index];
  const updated = {
    ...existing,
    ...req.body,
    price: req.body.price !== undefined ? Number(req.body.price) : existing.price,
    originalPrice: req.body.originalPrice !== undefined ? Number(req.body.originalPrice) : existing.originalPrice,
    stock: req.body.stock !== undefined ? Number(req.body.stock) : existing.stock,
    isNew: req.body.isNew !== undefined ? Boolean(req.body.isNew) : existing.isNew
  };

  products[index] = updated;
  writeProducts(products);

  res.json({ success: true, message: 'Product updated successfully', data: updated });
});

// PATCH /api/products/:id/stock — Quick stock update
app.patch('/api/products/:id/stock', (req, res) => {
  const products = readProducts();
  const product = products.find(p => p.id === req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  if (req.body.stock !== undefined) {
    product.stock = Math.max(0, Number(req.body.stock));
  } else if (req.body.delta !== undefined) {
    product.stock = Math.max(0, (product.stock || 0) + Number(req.body.delta));
  }

  writeProducts(products);
  res.json({ success: true, message: 'Stock updated', data: product });
});

// PATCH /api/products/:id/toggle-new — Toggle New Arrival status
app.patch('/api/products/:id/toggle-new', (req, res) => {
  const products = readProducts();
  const product = products.find(p => p.id === req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  product.isNew = req.body.isNew !== undefined ? Boolean(req.body.isNew) : !product.isNew;
  writeProducts(products);

  res.json({ success: true, message: `New Arrival set to ${product.isNew}`, data: product });
});

// DELETE /api/products/:id — Delete product
app.delete('/api/products/:id', (req, res) => {
  let products = readProducts();
  const exists = products.some(p => p.id === req.params.id);

  if (!exists) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  products = products.filter(p => p.id !== req.params.id);
  writeProducts(products);

  res.json({ success: true, message: 'Product deleted successfully' });
});

// POST /api/orders
app.post('/api/orders', (req, res) => {
const { customer, items, paymentMethod } = req.body;

if (
!customer ||
!items ||
!Array.isArray(items) ||
items.length === 0
) {
return res.status(400).json({
success: false,
message: 'Invalid order data'
});
}

const requiredCustomer = [
'name',
'email',
'phone',
'address',
'city',
'pincode'
];

for (const field of requiredCustomer) {
if (!customer[field]) {
return res.status(400).json({
success: false,
message: `Customer ${field} is required`
});
}
}

const products = readProducts();

const orderItems = [];
let subtotal = 0;

for (const item of items) {
const product = products.find(
p => p.id === item.productId
);

if (!product) {
  return res.status(400).json({
    success: false,
    message: `Product ${item.productId} not found`
  });
}

if (!item.size) {
  return res.status(400).json({
    success: false,
    message: `Size required for ${product.name}`
  });
}

const qty = item.quantity || 1;
const itemTotal = product.price * qty;

subtotal += itemTotal;

orderItems.push({
  productId: product.id,
  name: product.name,
  category: product.category,
  size: item.size,
  quantity: qty,
  price: product.price,
  total: itemTotal,
  color: product.color
});

// Real-time stock decrement and sold count increment
product.stock = Math.max(0, (product.stock || 0) - qty);
product.soldCount = (product.soldCount || 0) + qty;

}

// Persist updated product inventory
writeProducts(products);

const shipping = subtotal >= 2999 ? 0 : 99;
const tax = Math.round(subtotal * 0.18);
const grandTotal = subtotal + shipping + tax;

const order = {
id: 'ORD-' + uuidv4().split('-')[0].toUpperCase(),
customer,
items: orderItems,
paymentMethod: paymentMethod || 'card',
paymentStatus:
paymentMethod === 'cod' ? 'pending' : 'paid',
orderStatus: 'confirmed',
subtotal,
shipping,
tax,
grandTotal,
placedAt: new Date().toISOString(),
estimatedDelivery: new Date(
Date.now() + 5 * 24 * 60 * 60 * 1000
).toISOString()
};

const orders = readOrders();

orders.push(order);

writeOrders(orders);

res.status(201).json({
success: true,
message: 'Order placed successfully!',
data: order
});
});

// GET /api/orders/:id
app.get('/api/orders/:id', (req, res) => {
const orders = readOrders();

const order = orders.find(
o => o.id === req.params.id
);

if (!order) {
return res.status(404).json({
success: false,
message: 'Order not found'
});
}

res.json({
success: true,
data: order
});
});

// GET /api/orders
app.get('/api/orders', (req, res) => {
const orders = readOrders();

res.json({
success: true,
count: orders.length,
data: orders
});
});

// ─── Offers & Promotions APIs ────────────────────────────────────────────────
app.get('/api/offers', (req, res) => {
  let offers = readOffers();
  if (req.query.active === 'true') {
    offers = offers.filter(o => o.active);
  }
  res.json({ success: true, count: offers.length, data: offers });
});

app.post('/api/offers', (req, res) => {
  const { code, title, discountPercent, bannerText, description, active, expiresAt } = req.body;
  if (!code || !title) {
    return res.status(400).json({ success: false, message: 'Code and title are required' });
  }

  const offers = readOffers();
  const newOffer = {
    id: 'OFF-' + (100 + offers.length + 1),
    code: code.trim().toUpperCase(),
    title,
    discountPercent: Number(discountPercent) || 0,
    bannerText: bannerText || `✨ Special Offer: Use code ${code.trim().toUpperCase()} for savings!`,
    description: description || '',
    active: active !== undefined ? Boolean(active) : true,
    expiresAt: expiresAt || '2026-12-31'
  };

  offers.unshift(newOffer);
  writeOffers(offers);
  res.status(201).json({ success: true, message: 'Offer created successfully', data: newOffer });
});

app.put('/api/offers/:id', (req, res) => {
  const offers = readOffers();
  const idx = offers.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Offer not found' });

  offers[idx] = {
    ...offers[idx],
    ...req.body,
    code: req.body.code ? req.body.code.trim().toUpperCase() : offers[idx].code,
    discountPercent: req.body.discountPercent !== undefined ? Number(req.body.discountPercent) : offers[idx].discountPercent,
    active: req.body.active !== undefined ? Boolean(req.body.active) : offers[idx].active
  };

  writeOffers(offers);
  res.json({ success: true, message: 'Offer updated successfully', data: offers[idx] });
});

app.patch('/api/offers/:id/toggle', (req, res) => {
  const offers = readOffers();
  const offer = offers.find(o => o.id === req.params.id);
  if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });

  offer.active = req.body.active !== undefined ? Boolean(req.body.active) : !offer.active;
  writeOffers(offers);
  res.json({ success: true, message: `Offer ${offer.active ? 'activated' : 'deactivated'}`, data: offer });
});

app.delete('/api/offers/:id', (req, res) => {
  let offers = readOffers();
  if (!offers.some(o => o.id === req.params.id)) return res.status(404).json({ success: false, message: 'Offer not found' });

  offers = offers.filter(o => o.id !== req.params.id);
  writeOffers(offers);
  res.json({ success: true, message: 'Offer deleted successfully' });
});

// ─── Upcoming Events APIs ────────────────────────────────────────────────────
app.get('/api/events', (req, res) => {
  let events = readEvents();
  if (req.query.active === 'true') {
    events = events.filter(e => e.active);
  }
  res.json({ success: true, count: events.length, data: events });
});

app.post('/api/events', (req, res) => {
  const { title, date, time, location, description, tag, emoji, active } = req.body;
  if (!title || !date) {
    return res.status(400).json({ success: false, message: 'Title and date are required' });
  }

  const events = readEvents();
  const newEvent = {
    id: 'EVT-' + (200 + events.length + 1),
    title,
    date,
    time: time || '6:00 PM IST',
    location: location || 'Soul Flagship Store',
    description: description || '',
    tag: tag || 'Exclusive Drop',
    emoji: emoji || '✨',
    active: active !== undefined ? Boolean(active) : true,
    rsvps: 0
  };

  events.unshift(newEvent);
  writeEvents(events);
  res.status(201).json({ success: true, message: 'Event created successfully', data: newEvent });
});

app.put('/api/events/:id', (req, res) => {
  const events = readEvents();
  const idx = events.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Event not found' });

  events[idx] = {
    ...events[idx],
    ...req.body,
    active: req.body.active !== undefined ? Boolean(req.body.active) : events[idx].active
  };

  writeEvents(events);
  res.json({ success: true, message: 'Event updated successfully', data: events[idx] });
});

app.patch('/api/events/:id/toggle', (req, res) => {
  const events = readEvents();
  const event = events.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  event.active = req.body.active !== undefined ? Boolean(req.body.active) : !event.active;
  writeEvents(events);
  res.json({ success: true, message: `Event ${event.active ? 'published' : 'hidden'}`, data: event });
});

app.post('/api/events/:id/rsvp', (req, res) => {
  const events = readEvents();
  const event = events.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  event.rsvps = (event.rsvps || 0) + 1;
  writeEvents(events);
  res.json({ success: true, message: 'RSVP confirmed! See you at Soul.', data: event });
});

app.delete('/api/events/:id', (req, res) => {
  let events = readEvents();
  if (!events.some(e => e.id === req.params.id)) return res.status(404).json({ success: false, message: 'Event not found' });

  events = events.filter(e => e.id !== req.params.id);
  writeEvents(events);
  res.json({ success: true, message: 'Event deleted successfully' });
});

// ─── Admin Overview & Analytics API ──────────────────────────────────────────
app.get('/api/admin/stats', (req, res) => {
  const products = readProducts();
  const orders = readOrders();
  const offers = readOffers();
  const events = readEvents();

  const totalRevenue = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const lowStockProducts = products.filter(p => (p.stock || 0) <= 15);
  const outOfStockProducts = products.filter(p => (p.stock || 0) === 0);
  const newArrivals = products.filter(p => p.isNew);

  res.json({
    success: true,
    data: {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      newArrivalsCount: newArrivals.length,
      activeOffersCount: offers.filter(o => o.active).length,
      totalOffersCount: offers.length,
      upcomingEventsCount: events.filter(e => e.active).length,
      totalEventsCount: events.length
    }
  });
});

// ─── Frontend ────────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  const distIndex = path.join(FRONTEND_DIR, 'dist', 'index.html');
  if (fs.existsSync(distIndex)) {
    return res.sendFile(distIndex);
  }
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// ─── Start Server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
console.log(`
╔══════════════════════════════════════╗
║   🧥  SOUL STORE API  — Port ${PORT}  ║
╚══════════════════════════════════════╝

→ Products API : [http://localhost:${PORT}/api/products](http://localhost:${PORT}/api/products)
→ New Arrivals : [http://localhost:${PORT}/api/products/new-arrivals](http://localhost:${PORT}/api/products/new-arrivals)
→ Best Sellers : [http://localhost:${PORT}/api/products/best-sellers](http://localhost:${PORT}/api/products/best-sellers)
→ Orders API   : [http://localhost:${PORT}/api/orders](http://localhost:${PORT}/api/orders)
→ Frontend     : [http://localhost:${PORT}](http://localhost:${PORT})
`);
});
