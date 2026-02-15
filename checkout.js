/* --------------------------------------------------
   CHECKOUT — FINAL VERSION WITH DELIVERY + COUNTRY
-------------------------------------------------- */

// Load cart from localStorage
const cart = JSON.parse(localStorage.getItem("dm_cart")) || [];

// Load delivery cost saved by cart drawer
const deliveryCost = Number(localStorage.getItem("dm_delivery")) || 0;

/* --------------------------------------------------
   RENDER ORDER SUMMARY
-------------------------------------------------- */

function renderOrderSummary() {
  const container = document.querySelector("#order-summary");

  if (cart.length === 0) {
    container.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  let subtotal = 0;
  let certificateCost = 0;

  let html = "<h2>Order Summary</h2>";

  /* ------------------------------
     ITEM LINES
  ------------------------------ */
  cart.forEach(item => {
    const lineTotal = item.price * item.quantity;
    subtotal += lineTotal;

    if (item.certificate) certificateCost += 30;

    html += `
      <div class="checkout-line">
        <span>${item.title} × ${item.quantity}</span>
        <span>£${lineTotal.toFixed(2)}</span>
      </div>
    `;
  });

  /* ------------------------------
     SUMMARY LINES
  ------------------------------ */
  html += `
    <div class="checkout-line">
      <strong>Subtotal</strong>
      <strong>£${subtotal.toFixed(2)}</strong>
    </div>

    <div class="checkout-line">
      <strong>Certificates</strong>
      <strong>£${certificateCost.toFixed(2)}</strong>
    </div>

    <div class="checkout-line">
      <strong>Delivery</strong>
      <strong>£${deliveryCost.toFixed(2)}</strong>
    </div>

    <div class="checkout-line total-strong" id="total-line"></div>
  `;

  container.innerHTML = html;

  updateTotal(subtotal, certificateCost, deliveryCost);
}

/* --------------------------------------------------
   CALCULATE TOTAL
-------------------------------------------------- */

function updateTotal(subtotal, certificateCost, deliveryCost) {
  const total = subtotal + certificateCost + deliveryCost;

  document.querySelector("#total-line").innerHTML =
    `<strong>Total</strong><strong>£${total.toFixed(2)}</strong>`;
}

/* --------------------------------------------------
   CONFIRM DETAILS → SAVE ORDER → GO TO PAYMENT
-------------------------------------------------- */

document.querySelector("#confirm-details").onclick = () => {

  const orderData = {
    items: cart,
    delivery: {
      region: "Auto",
      cost: deliveryCost
    },
    customer: {
      name: document.querySelector("#name").value,
      email: document.querySelector("#email").value,
      phone: document.querySelector("#phone").value,
      address1: document.querySelector("#address1").value,
      address2: document.querySelector("#address2").value,
      city: document.querySelector("#city").value,
      country: document.querySelector("#country").value,
      postcode: document.querySelector("#postcode").value
    }
  };

  // Save for payment.js
  localStorage.setItem("pendingOrder", JSON.stringify(orderData));

  // Move to payment page
  window.location.href = "/payment.html";
};

/* --------------------------------------------------
   INIT
-------------------------------------------------- */

renderOrderSummary();