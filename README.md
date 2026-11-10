# 🛍️ Soul Clothing Brand — Full-Stack E-Commerce & Hologram Studio

[![Frontend: Vite](https://img.shields.io/badge/Frontend-Vite%20%2B%20TailwindCSS-646CFF.svg)](https://vitejs.dev/)
[![Backend: Express](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-000000.svg)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A production-grade, full-stack apparel platform built for **Soul Clothing Brand**. Integrates an interactive 3D/hologram outfit customizer, customer storefront, dynamic shop catalog, checkout system, and a comprehensive real-time admin management dashboard.

---

## 🌟 Application Modules & Pages

| Module | Route / Page | Description |
|---|---|---|
| ⚡ **Hologram Outfit Studio** | `http://localhost:5173/showcase.html` | Interactive holographic 3D apparel viewer & outfit styling laboratory. |
| 🏠 **Storefront Homepage** | `http://localhost:5173/` | High-aesthetic luxury streetwear storefront with curated drops & banners. |
| 🛍️ **Shop Catalog** | `http://localhost:5173/shop.html` | Filterable collections, dynamic category sorting, and real-time inventory cards. |
| 💳 **Checkout Portal** | `http://localhost:5173/checkout.html` | Multi-step customer checkout pipeline with order total calculations. |
| 📊 **Admin Dashboard** | `http://localhost:5173/admin.html` | Inventory CRUD controls, sales telemetry, order processing & metrics. |

---

## 🏗️ Architecture & Tech Stack

```text
soulclothingbrand/
├── frontend/                     # Client application (Vite dev server: port 5173)
│   ├── css/                      # Custom styles, animations, design tokens
│   ├── js/                       # Client state, cart, API fetch calls
│   ├── index.html                # Storefront homepage
│   ├── shop.html                 # Shop catalog
│   ├── showcase.html             # Hologram Outfit Studio
│   ├── checkout.html             # Checkout flow
│   ├── admin.html                # Admin management console
│   └── vite.config.js            # Vite multi-page config + API proxy (/api -> 3000)
│
├── backend/                      # REST API Server (Express: port 3000)
│   ├── data/                     # Persistent JSON database (products.json, orders.json)
│   ├── server.js                 # Express routes, order handling, inventory CRUD
│   └── package.json
│
├── package.json                  # Root monorepo automation scripts
└── .gitignore                    # Excludes node_modules and build artifacts
```

- **Frontend:** HTML5, CSS3, Modern ES6+ JavaScript, Tailwind CSS, Vite.
- **Backend:** Node.js, Express.js, Body-Parser, CORS, UUID.
- **Networking:** Vite development proxy seamlessly forwards `/api` requests to Express on `http://localhost:3000`.

---

## 🚀 Quickstart Guide

### 1. Clone the repository
```bash
git clone https://github.com/hemanathk636/soulclothingbrand.git
cd soulclothingbrand
```

### 2. Install dependencies (both frontend & backend)
```bash
# Install root script helper
npm run install:all
```
*(Or manually run `npm install` inside both `frontend/` and `backend/`)*

### 3. Run the development environment

Open two terminal tabs:

**Terminal 1 — Backend (Express API on port 3000):**
```bash
npm run dev:backend
```

**Terminal 2 — Frontend (Vite on port 5173):**
```bash
npm run dev:frontend
```

Now open:
- ⚡ **Hologram Outfit Studio:** [http://localhost:5173/showcase.html](http://localhost:5173/showcase.html)
- 🏠 **Storefront:** [http://localhost:5173/](http://localhost:5173/)
- 🛍️ **Shop:** [http://localhost:5173/shop.html](http://localhost:5173/shop.html)
- 📊 **Admin Dashboard:** [http://localhost:5173/admin.html](http://localhost:5173/admin.html)

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | Retrieve all inventory items |
| `POST` | `/api/products` | Add new apparel product (Admin) |
| `DELETE` | `/api/products/:id` | Remove apparel product from inventory |
| `GET` | `/api/orders` | Fetch customer purchase history |
| `POST` | `/api/orders` | Process customer checkout & record transaction |

---

## 👤 Author
**Hemanath K**  
- GitHub: [@hemanathk636](https://github.com/hemanathk636)  
- LinkedIn: [Hemanath K](https://www.linkedin.com/in/hemanath)  
- LeetCode: [Hemanath25](https://leetcode.com/u/Hemanath25/)  
- HackerRank: [KhemanathBtech24](https://hackerrank.com/profile/KhemanathBtech24)
