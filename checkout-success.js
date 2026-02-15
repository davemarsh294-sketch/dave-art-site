/* --------------------------------------------------
   SEND ORDER CONFIRMATION AFTER PAYMENT SUCCESS
-------------------------------------------------- */

function sendOrderConfirmation() {
  // ⭐ FIX: Use sessionStorage so Stripe redirect keeps the data
  const orderData = JSON.parse(sessionStorage.getItem("pendingOrder"));

  if (!orderData) {
    console.warn("No pendingOrder found in sessionStorage.");
    return;
  }

  fetch("/.netlify/functions/send-confirmation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData)
  })
  .then(res => res.json())
  .then(data => {
    console.log("Confirmation email sent:", data);
  })
  .catch(err => {
    console.error("Error sending confirmation email:", err);
  });
}
