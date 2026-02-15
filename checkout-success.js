/* --------------------------------------------------
   SEND ORDER CONFIRMATION AFTER PAYMENT SUCCESS
-------------------------------------------------- */

function sendOrderConfirmation() {
  const orderData = JSON.parse(localStorage.getItem("pendingOrder"));

  if (!orderData) {
    console.warn("No pendingOrder found in localStorage.");
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