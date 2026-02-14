/* --------------------------------------------------
   THANK YOU PAGE — SEND EMAIL + CLEAR CART
-------------------------------------------------- */

function generateOrderId() {
  return "ORD-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("thankyou-content");

  const sessionId = getQueryParam("session_id");
  const token = getQueryParam("token");

  const order = JSON.parse(localStorage.getItem("pendingOrder") || "null");

  if (!order) {
    container.innerHTML = "<p>Thank you. Your payment has been received.</p>";
    clearCart();
    return;
  }

  if (!order.orderId) {
    order.orderId = generateOrderId();
  }

  try {
    await fetch("/.netlify/functions/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });
  } catch (err) {
    console.error("Email error:", err);
  }

  clearCart();

  container.innerHTML = `
    <p>Thank you, ${order.customer.name}.</p>
    <p>Your order <strong>${order.orderId}</strong> has been received.</p>
    <p>A confirmation email has been sent to <strong>${order.customer.email}</strong>.</p>
  `;
});

function clearCart() {
  localStorage.removeItem("dm_cart");
  localStorage.removeItem("dm_delivery");
  localStorage.removeItem("pendingOrder");

  const cartCount = document.getElementById("cart-count");
  if (cartCount) cartCount.textContent = "0";
}