/* ══════════════════════════════════════════════════════
   SOUL CLOTHING — Home Page Logic
   ══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    loadNewArrivals(),
    loadBestSellers(),
    loadUpcomingEvents()
  ]);
  initScrollAnimations();
});

// ─── New Arrivals ─────────────────────────────────────
async function loadNewArrivals() {
  const grid = document.getElementById('new-arrivals-grid');
  if (!grid) return;
  try {
    const res = await apiFetch('/products/new-arrivals');
    const products = res.data || [];
    if (!products.length) { grid.innerHTML = '<p style="color:#888;grid-column:1/-1;text-align:center;padding:40px">No new arrivals yet.</p>'; return; }
    grid.innerHTML = products.slice(0, 5).map(p => buildProductCard(p)).join('');
  } catch {
    grid.innerHTML = '<p style="color:#c0392b;grid-column:1/-1;text-align:center;padding:40px">Backend not connected. Start the server on port 3000.</p>';
  }
}

// ─── Best Sellers ─────────────────────────────────────
async function loadBestSellers() {
  const grid = document.getElementById('best-sellers-grid');
  if (!grid) return;
  try {
    const res = await apiFetch('/products/best-sellers');
    const products = res.data || [];
    if (!products.length) { grid.innerHTML = '<p style="color:#888;grid-column:1/-1;text-align:center;padding:40px">No products yet.</p>'; return; }
    grid.innerHTML = products.slice(0, 5).map(p => buildProductCard(p)).join('');
  } catch {
    grid.innerHTML = '<p style="color:#c0392b;grid-column:1/-1;text-align:center;padding:40px">Backend not connected. Start the server on port 3000.</p>';
  }
}

// ─── Upcoming Events ─────────────────────────────────
async function loadUpcomingEvents() {
  const container = document.getElementById('events-container');
  const section   = document.getElementById('events-section');
  if (!container) return;

  try {
    const res = await apiFetch('/events?active=true');
    const events = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);

    if (!events.length) {
      if (section) section.style.display = 'none';
      return;
    }

    container.innerHTML = events.map(e => {
      const d = e.date ? new Date(e.date) : null;
      const month = d ? d.toLocaleString('en-IN', { month: 'short' }).toUpperCase() : '';
      const day   = d ? d.getDate() : '';
      return `
        <div class="event-card">
          <div class="event-date-badge">
            <span class="month">${month}</span>
            <span class="day">${day}</span>
          </div>
          <div class="event-title">${e.title}</div>
          <div class="event-meta">
            ${e.time ? `⏰ ${e.time} &nbsp;·&nbsp; ` : ''}
            ${e.location ? `📍 ${e.location}` : ''}
          </div>
          ${e.description ? `<p style="font-size:13px;color:#666;margin-bottom:14px;line-height:1.6">${e.description}</p>` : ''}
          <div style="display:flex;align-items:center;justify-content:space-between">
            <button class="event-rsvp-btn" id="rsvp-btn-${e.id}" onclick="rsvpEvent('${e.id}')">
              RSVP NOW
            </button>
            ${e.rsvpCount ? `<span style="font-size:12px;color:#888">👥 ${e.rsvpCount} going</span>` : ''}
          </div>
        </div>`;
    }).join('');
  } catch (err) {
    console.warn('Events load failed:', err);
    if (section) section.style.display = 'none';
  }
}

async function rsvpEvent(eventId) {
  try {
    const res = await apiFetch(`/events/${eventId}/rsvp`, { method: 'POST' });
    showToast('🎉 You\'re registered! We\'ll notify you.', '✨');
    const btn = document.getElementById(`rsvp-btn-${eventId}`);
    if (btn) { btn.textContent = 'Registered ✓'; btn.disabled = true; btn.style.opacity = '0.6'; }
  } catch {
    showToast('Could not register RSVP', '❌');
  }
}

// ─── Scroll Reveal ────────────────────────────────────
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.product-card, .event-card, .stat-item, .feature-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}

window.rsvpEvent = rsvpEvent;
window.loadUpcomingEvents = loadUpcomingEvents;
