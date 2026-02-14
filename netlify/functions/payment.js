/* --------------------------------------------------
   PAYMENT PAGE — USES pendingOrder
-------------------------------------------------- */

const order = JSON.parse(localStorage.getItem("pendingOrder") || "null");

if (!order) {
  document.addEventListener("DOMContentLoaded", () => {
    document.body.innerHTML = "<p>No order found. Please return to the cart.</p>";
  });
} else {
  document.addEventListener("DOMContentLoaded", () => {
    renderSummary(order);
  });
}

/* --------------------------------------------------
   CALCULATE TOTALS
-------------------------------------------------- */

function calculateTotals(order) {
  let subtotal = 0;
  let certificateFee = 0;

  order.items.forEach(item => {
    const qty = item.quantity || 1;
    subtotal += item.price * qty;
    if (item.certificate) {
      certificateFee += 30 * qty;
    }
  });

  const deliveryCost = order.delivery?.cost || 0;
  const total = subtotal + certificateFee + deliveryCost;

  return { subtotal, certificateFee, deliveryCost, total };
}

/* --------------------------------------------------
   RENDER SUMMARY
-------------------------------------------------- */

function renderSummary(order) {
  const summaryEl = document.getElementById("payment-summary");
  if (!summaryEl) return;

  const { subtotal, certificateFee, deliveryCost, total } = calculateTotals(order);

  summaryEl.innerHTML = `
    <h2>Order Summary</h2>
    <div class="summary-line">
      <span>Subtotal</span>
      <span>£${subtotal.toFixed(2)}</span>
    </div>
    <div class="summary-line">
      <span>Certificates</span>
      <span>£${certificateFee.toFixed(2)}</span>
    </div>
    <div class="summary-line">
      <span>Delivery</span>
      <span>£${deliveryCost.toFixed(2)}</span>
    </div>
    <div class="summary-line total">
      <span>Total</span>
      <span>£${total.toFixed(2)}</span>
    </div>
  `;
}

/* --------------------------------------------------
   STRIPE CHECKOUT
-------------------------------------------------- */

async function startStripeCheckout() {
  if (!order) return;

  try {
    const response = await fetch("/.netlify/functions/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });

    const data = await response.json();

    if (data.url) {
      window.location = data.url;
    } else {
      console.error("Stripe error:", data);
      alert("There was an issue starting Stripe checkout.");
    }
  } catch (err) {
    console.error("Stripe error:", err);
    alert("There was an issue starting Stripe checkout.");
  }
}

/* --------------------------------------------------
   PAYPAL CHECKOUT
-------------------------------------------------- */

async function startPaypalCheckout() {
  if (!order) return;

  try {
    const response = await fetch("/.netlify/functions/create-paypal-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });

    const data = await response.json();

    if (data.url) {
      window.location = data.url;
    } else {
      console.error("PayPal error:", data);
      alert("There was an issue starting PayPal checkout.");
    }
  } catch (err) {
    console.error("PayPal error:", err);
    alert("There was an issue starting PayPal checkout.");
  }
}