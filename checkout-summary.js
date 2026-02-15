/* --------------------------------------------------
   CHECKOUT SUMMARY — CALCULATE DELIVERY + TOTAL
-------------------------------------------------- */

function updateCheckoutSummary() {
  const cart = JSON.parse(localStorage.getItem("dm_cart")) || [];

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const certificateFee = cart.reduce((sum, item) => sum + (item.certificate ? 30 * item.quantity : 0), 0);

  // ⭐ DELIVERY RULES (adjust if needed)
  let deliveryRegion = "UK";
  let deliveryCost = 1; // ← your UK delivery price

  // ⭐ UPDATE HIDDEN INPUTS FOR CHECKOUT.JS
  document.getElementById("deliveryRegion").value = deliveryRegion;
  document.getElementById("deliveryCost").value = deliveryCost;

  // ⭐ UPDATE SUMMARY ON SCREEN
  const summary = document.getElementById("order-summary");
  summary.innerHTML = `
    <div><span>Subtotal</span><span>£${subtotal.toFixed(2)}</span></div>
    <div><span>Certificate</span><span>£${certificateFee.toFixed(2)}</span></div>
    <div><span>Delivery (${deliveryRegion})</span><span>£${deliveryCost.toFixed(2)}</span></div>
    <div><strong>Total</strong><strong>£${(subtotal + certificateFee + deliveryCost).toFixed(2)}</strong></div>
  `;
}

// Run immediately
updateCheckoutSummary();
