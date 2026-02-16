/* --------------------------------------------------
   CHECKOUT SUMMARY — CALCULATE DELIVERY + TOTAL
-------------------------------------------------- */

async function updateCheckoutSummary() {
  const cart = JSON.parse(localStorage.getItem("dm_cart")) || [];

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const certificateFee = cart.reduce((sum, item) => sum + (item.certificate ? 30 * item.quantity : 0), 0);

  // ⭐ Load delivery.json
  let deliveryData = {};
  try {
    const res = await fetch("/delivery.json");
    deliveryData = await res.json();
  } catch (err) {
    console.error("Failed to load delivery.json", err);
  }

  // ⭐ Determine region (default to UK)
  let deliveryRegion = "uk";

  // If the cart stored a region, use it
  const storedRegion = localStorage.getItem("dm_delivery_region");
  if (storedRegion && deliveryData[storedRegion] !== undefined) {
    deliveryRegion = storedRegion;
  }

  // ⭐ Calculate delivery cost from JSON
  const deliveryCost = deliveryData[deliveryRegion] ?? 0;

  // ⭐ Update hidden inputs for checkout.js
  document.getElementById("deliveryRegion").value = deliveryRegion;
  document.getElementById("deliveryCost").value = deliveryCost;

  // ⭐ Update summary on screen
  const summary = document.getElementById("order-summary");
  summary.innerHTML = `
    <div><span>Subtotal</span><span>£${subtotal.toFixed(2)}</span></div>
    <div><span>Certificate</span><span>£${certificateFee.toFixed(2)}</span></div>
    <div><span>Delivery (${deliveryRegion.toUpperCase()})</span><span>£${deliveryCost.toFixed(2)}</span></div>
    <div><strong>Total</strong><strong>£${(subtotal + certificateFee + deliveryCost).toFixed(2)}</strong></div>
  `;
}

// Run immediately
updateCheckoutSummary();
