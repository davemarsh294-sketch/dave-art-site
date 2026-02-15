/* --------------------------------------------------
   CHECKOUT SUCCESS — SEND CONFIRMATION EMAIL
-------------------------------------------------- */

async function sendConfirmation() {
  const statusEl = document.getElementById("status");

  // Get order from sessionStorage
  const orderJSON = sessionStorage.getItem("pendingOrder");

  if (!orderJSON) {
    statusEl.textContent = "Order details not found.";
    return;
  }

  const order = JSON.parse(orderJSON);

  // Send to Netlify function
  try {
    const response = await fetch("/.netlify/functions/send-confirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });

    const data = await response.json();

    if (data.success) {
      statusEl.textContent = "A confirmation email has been sent.";
    } else {
      statusEl.textContent = "Order complete, but email could not be sent.";
    }
  } catch (err) {
    statusEl.textContent = "Order complete, but email could not be sent.";
  }

  // Clear cart + pending order
  localStorage.removeItem("dm_cart");
  sessionStorage.removeItem("pendingOrder");
}

sendConfirmation();
