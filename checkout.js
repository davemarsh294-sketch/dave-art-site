/* --------------------------------------------------
   LOAD CART + SHOW TOTALS ON CHECKOUT PAGE
-------------------------------------------------- */

function loadCheckoutTotals() {
  const items = JSON.parse(localStorage.getItem("dm_cart")) || [];
  const deliveryCost = Number(localStorage.getItem("dm_delivery")) || 0;

  // Subtotal
  const subtotal = items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  // Certificate cost
  const certificateCost = items.reduce((sum, item) => {
    return sum + (item.certificate ? 30 : 0);
  }, 0);

  // Final total
  const total = subtotal + certificateCost + deliveryCost;

  // Update checkout page
  document.getElementById("subtotal-line").textContent = "£" + subtotal.toFixed(2);
  document.getElementById("delivery-line").textContent = "£" + deliveryCost.toFixed(2);
  document.getElementById("certificate-line").textContent = "£" + certificateCost.toFixed(2);
  document.getElementById("total-line").textContent = "£" + total.toFixed(2);
}

/* --------------------------------------------------
   BUILD ORDER DATA
-------------------------------------------------- */

function buildOrderData() {
  const items = JSON.parse(localStorage.getItem("dm_cart")) || [];
  const deliveryCost = Number(localStorage.getItem("dm_delivery")) || 0;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const certificateCost = items.reduce((sum, item) => sum + (item.certificate ? 30 : 0), 0);
  const region = document.getElementById("region")?.value || "uk";

  const orderData = {
    customer: {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      address1: document.getElementById("address1").value,
      address2: document.getElementById("address2").value,
      city: document.getElementById("city").value,
      country: document.getElementById("country").value,
      postcode: document.getElementById("postcode").value
    },

    items: items,

    delivery: {
      region: region,
      cost: deliveryCost
    },

    total: subtotal + certificateCost + deliveryCost
  };

  localStorage.setItem("pendingOrder", JSON.stringify(orderData));

  return orderData;
}

/* --------------------------------------------------
   STRIPE CHECKOUT
-------------------------------------------------- */

async function startStripeCheckout() {
  const orderData = buildOrderData();

  const response = await fetch("/.netlify/functions/create-checkout", {
    method: "POST",
    body: JSON.stringify(orderData)
  });

  const data = await response.json();

  if (data.url) {
    window.location.href = data.url;
  } else {
    alert("Stripe checkout failed.");
  }
}

/* --------------------------------------------------
   PAYPAL CHECKOUT
-------------------------------------------------- */

async function startPayPalCheckout() {
  const orderData = buildOrderData();

  const response = await fetch("/.netlify/functions/create-paypal-order", {
    method: "POST",
    body: JSON.stringify(orderData)
  });

  const data = await response.json();

  if (data.approvalUrl) {
    window.location.href = data.approvalUrl;
  } else {
    alert("PayPal checkout failed.");
  }
}

/* --------------------------------------------------
   INIT ON PAGE LOAD
-------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  loadCheckoutTotals();

  const stripeBtn = document.getElementById("stripeButton");
  const paypalBtn = document.getElementById("paypalButton");

  if (stripeBtn) stripeBtn.addEventListener("click", startStripeCheckout);
  if (paypalBtn) paypalBtn.addEventListener("click", startPayPalCheckout);
});