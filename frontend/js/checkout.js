/* ══════════════════════════════════════════════════════
   SOUL STORE — Checkout & Payment JS
   ══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  renderCheckoutSummary();
  initPaymentTabs();
  initCardFormatting();
  setupForm();
});

// ─── Render Order Summary ─────────────────────────────
function renderCheckoutSummary() {
  const items = Cart.items;
  const container = document.getElementById('checkout-items');

  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--text-muted)">
        <div style="font-size:2rem;margin-bottom:12px">🛒</div>
        <p>Your cart is empty. <a href="shop.html" style="color:var(--gold)">Shop now</a></p>
      </div>`;
    return;
  }

  const subtotal = Cart.total();
  const shipping = subtotal >= 2999 ? 0 : 99;
  const tax = Math.round(subtotal * 0.18);
  const grand = subtotal + shipping + tax;

  container.innerHTML = items.map(item => `
    <div style="display:flex;gap:14px;padding:16px 0;border-bottom:1px solid var(--border)">
      <div style="width:60px;height:75px;border-radius:var(--radius-sm);background:linear-gradient(135deg,#1a1a1a,#222);
           display:flex;align-items:center;justify-content:center;font-size:1.8rem;flex-shrink:0">
        ${item.emoji}
      </div>
      <div style="flex:1">
        <div style="font-weight:600;font-size:0.95rem;margin-bottom:4px">${item.name}</div>
        <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:6px">
          ${item.color} · Size: <strong style="color:var(--gold)">${item.size}</strong> · Qty: ${item.quantity}
        </div>
        <div style="font-weight:700;color:var(--text-primary)">${formatPrice(item.price * item.quantity)}</div>
      </div>
      <div style="font-size:0.8rem;color:var(--text-muted);text-align:right">
        ${formatPrice(item.price)}<br>each
      </div>
    </div>`).join('');

  // Update totals
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('co-subtotal', formatPrice(subtotal));
  setEl('co-shipping', shipping === 0 ? 'FREE' : `₹${shipping}`);
  setEl('co-tax', formatPrice(tax));
  setEl('co-total', formatPrice(grand));

  // Store grand total for form
  document.getElementById('checkout-form')?.setAttribute('data-total', grand);
}

// ─── Payment Tabs ─────────────────────────────────────
function initPaymentTabs() {
  document.querySelectorAll('.payment-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.payment-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.payment-panel').forEach(p => p.style.display = 'none');
      tab.classList.add('active');
      const panel = document.getElementById(`pay-${tab.dataset.method}`);
      if (panel) panel.style.display = 'block';
    });
  });
}

// ─── Card Formatting ──────────────────────────────────
function initCardFormatting() {
  const cardNum = document.getElementById('card-number');
  const cardExp = document.getElementById('card-expiry');
  const cardCvv = document.getElementById('card-cvv');

  if (cardNum) {
    cardNum.addEventListener('input', e => {
      let val = e.target.value.replace(/\D/g, '').slice(0, 16);
      e.target.value = val.replace(/(.{4})/g, '$1 ').trim();
      detectCardType(val);
    });
  }

  if (cardExp) {
    cardExp.addEventListener('input', e => {
      let val = e.target.value.replace(/\D/g, '').slice(0, 4);
      if (val.length >= 2) val = val.slice(0,2) + '/' + val.slice(2);
      e.target.value = val;
    });
  }

  if (cardCvv) {
    cardCvv.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
    });
  }
}

function detectCardType(num) {
  const icon = document.getElementById('card-type-icon');
  if (!icon) return;
  if (num.startsWith('4')) icon.textContent = '💳 Visa';
  else if (num.startsWith('5')) icon.textContent = '💳 Mastercard';
  else if (num.startsWith('6')) icon.textContent = '💳 Rupay';
  else if (num.startsWith('37') || num.startsWith('34')) icon.textContent = '💳 Amex';
  else icon.textContent = '💳';
}

// ─── Form Validation & Submit ─────────────────────────
function setupForm() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (Cart.items.length === 0) {
      showToast('Your cart is empty!', '❌');
      return;
    }

    // Collect customer info
    const customer = {
      name: document.getElementById('cust-name')?.value.trim(),
      email: document.getElementById('cust-email')?.value.trim(),
      phone: document.getElementById('cust-phone')?.value.trim(),
      address: document.getElementById('cust-address')?.value.trim(),
      city: document.getElementById('cust-city')?.value.trim(),
      pincode: document.getElementById('cust-pincode')?.value.trim(),
    };

    // Basic validation
    for (const [key, val] of Object.entries(customer)) {
      if (!val) {
        showToast(`Please enter your ${key}`, '⚠️');
        document.getElementById(`cust-${key}`)?.focus();
        return;
      }
    }

    // Payment method
    const activeTab = document.querySelector('.payment-tab.active');
    const paymentMethod = activeTab?.dataset.method || 'card';

    // For card payment, validate card fields
    if (paymentMethod === 'card') {
      const num = document.getElementById('card-number')?.value.replace(/\s/g,'');
      const exp = document.getElementById('card-expiry')?.value;
      const cvv = document.getElementById('card-cvv')?.value;
      const name = document.getElementById('card-name')?.value.trim();
      if (!num || num.length < 16) { showToast('Please enter a valid card number', '⚠️'); return; }
      if (!exp || exp.length < 5) { showToast('Please enter a valid expiry date', '⚠️'); return; }
      if (!cvv || cvv.length < 3) { showToast('Please enter a valid CVV', '⚠️'); return; }
      if (!name) { showToast('Please enter the name on card', '⚠️'); return; }
    }

    if (paymentMethod === 'upi') {
      const upiId = document.getElementById('upi-id')?.value.trim();
      if (!upiId || !upiId.includes('@')) { showToast('Please enter a valid UPI ID', '⚠️'); return; }
    }

    // Build order payload
    const orderPayload = {
      customer,
      items: Cart.items.map(i => ({
        productId: i.productId,
        size: i.size,
        quantity: i.quantity
      })),
      paymentMethod
    };

    // Submit button loading state
    const submitBtn = document.getElementById('place-order-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner"></span> Processing...`;
    }

    try {
      // Simulate payment processing delay for UX
      await new Promise(r => setTimeout(r, 1500));

      const result = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload)
      });

      // Success — clear cart and show confirmation
      Cart.clear();
      showOrderConfirmation(result.data);

    } catch (err) {
      showToast(err.message || 'Failed to place order. Please try again.', '❌');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '🔒 Place Order';
      }
    }
  });
}

// ─── Order Confirmation Screen ────────────────────────
function showOrderConfirmation(order) {
  const main = document.getElementById('checkout-main');
  if (!main) return;

  const deliveryDate = new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  main.style.animation = 'fadeOut 0.3s ease forwards';
  setTimeout(() => {
    main.innerHTML = `
      <div style="max-width:640px;margin:0 auto;text-align:center;padding:40px 20px">
        <!-- Success Animation -->
        <div style="width:100px;height:100px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gold-dark));
             display:flex;align-items:center;justify-content:center;font-size:2.5rem;margin:0 auto 24px;
             animation:scaleIn 0.5s var(--transition-spring)">✅</div>
        
        <h2 style="font-family:'Playfair Display',serif;font-size:2rem;margin-bottom:8px">Order Confirmed!</h2>
        <p style="color:var(--text-secondary);margin-bottom:4px">Thank you, <strong style="color:var(--text-primary)">${order.customer.name}</strong></p>
        <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:32px">A confirmation has been sent to ${order.customer.email}</p>
        
        <!-- Order ID -->
        <div style="background:var(--bg-card);border:1px solid var(--border-gold);border-radius:var(--radius-md);
             padding:20px;margin-bottom:24px">
          <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:2px;color:var(--gold);margin-bottom:8px">Order ID</div>
          <div style="font-size:1.4rem;font-weight:700;font-family:'Playfair Display',serif">${order.id}</div>
        </div>

        <!-- Items Ordered -->
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;margin-bottom:24px;text-align:left">
          <h4 style="font-family:'Playfair Display',serif;margin-bottom:16px;font-size:1rem">Your Items</h4>
          ${order.items.map(item => `
            <div style="display:flex;justify-content:space-between;align-items:center;
                 padding:12px 0;border-bottom:1px solid var(--border)">
              <div>
                <div style="font-weight:600;font-size:0.95rem;margin-bottom:4px">${item.name}</div>
                <div style="font-size:0.8rem;color:var(--text-secondary)">
                  ${item.color} · Size: <strong style="color:var(--gold)">${item.size}</strong> · Qty: ${item.quantity}
                </div>
              </div>
              <div style="font-weight:700;color:var(--text-primary)">${formatPrice(item.total)}</div>
            </div>`).join('')}
          
          <!-- Totals -->
          <div style="margin-top:16px">
            <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:var(--text-secondary);margin-bottom:6px">
              <span>Subtotal</span><span>${formatPrice(order.subtotal)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:var(--text-secondary);margin-bottom:6px">
              <span>Shipping</span><span style="color:${order.shipping === 0 ? 'var(--success)' : 'inherit'}">${order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px">
              <span>Tax (18% GST)</span><span>${formatPrice(order.tax)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:1.1rem;font-weight:700;color:var(--text-primary);
                 border-top:1px solid var(--border);padding-top:12px">
              <span>Grand Total</span><span style="color:var(--gold)">${formatPrice(order.grandTotal)}</span>
            </div>
          </div>
        </div>

        <!-- Delivery Info -->
        <div style="background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);border-radius:var(--radius-md);
             padding:16px;margin-bottom:24px">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:1.5rem">🚚</span>
            <div style="text-align:left">
              <div style="font-weight:600;font-size:0.9rem;margin-bottom:2px">Estimated Delivery</div>
              <div style="font-size:0.85rem;color:var(--success)">${deliveryDate}</div>
            </div>
          </div>
        </div>

        <!-- Payment -->
        <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:32px">
          💳 Payment: <strong style="color:var(--text-secondary)">${order.paymentMethod.toUpperCase()}</strong>
          · Status: <strong style="color:${order.paymentStatus === 'paid' ? 'var(--success)' : 'var(--warning)'}">${order.paymentStatus.toUpperCase()}</strong>
        </div>

        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <a href="index.html" class="btn btn-primary btn-lg">Continue Shopping</a>
          <a href="shop.html" class="btn btn-outline">Explore More</a>
        </div>
      </div>`;
    main.style.animation = 'fadeInUp 0.5s ease';
  }, 300);
}

window.renderCheckoutSummary = renderCheckoutSummary;
window.showOrderConfirmation = showOrderConfirmation;
