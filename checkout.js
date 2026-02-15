/* --------------------------------------------------
   CHECKOUT — SAVE ORDER + REDIRECT TO PAYMENT
-------------------------------------------------- */

async function startCheckout() {
  // ⭐ Read customer details
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address1 = document.getElementById("address1").value.trim();
  const address2 = document.getElementById("address2").value.trim();
  const city = document.getElementById("city").value.trim();
  const country = document.getElementById("country").value.trim();
  const postcode = document.getElementById("postcode").value.trim();

  // ⭐ Delivery region + cost (already set by your summary script)
  const deliveryRegion = document.getElementById("deliveryRegion")?.value || "UK";
  const deliveryCost = parseFloat(document.getElementById("deliveryCost")?.value || 0);

  // ⭐ Cart from localStorage
  const cart = JSON.parse(localStorage.getItem("dm_cart")) || [];

  // ⭐ Totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const certificateFee = cart.reduce((sum, item) => sum + (item.certificate ? 30 * item.quantity : 0), 0);
  const total = subtotal + certificateFee + deliveryCost;

  // ⭐ Build order object
  const order = {
    customer: {
      name,
      email,
      phone,
      address1,
      address2,
      city,
      country,
      postcode
    },
    items: cart,
    delivery: {
      region: deliveryRegion,
      cost: deliveryCost
    },
    total
  };

  // ⭐ FIX: Use sessionStorage so Stripe redirect keeps the order
  sessionStorage.setItem("pendingOrder", JSON.stringify(order));

  // ⭐ Ensure a payment method is selected
  if (!window.checkoutMethod) {
    alert("Please select a payment method.");
    return;
  }

  // ⭐ STRIPE CHECKOUT
  if (window.checkoutMethod === "stripe") {
    const response = await fetch("/.netlify/functions/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });

    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("There was an error starting Stripe checkout.");
    }
  }

  // ⭐ PAYPAL CHECKOUT
  if (window.checkoutMethod === "paypal") {
    const response = await fetch("/.netlify/functions/create-paypal-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });

    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("There was an error starting PayPal checkout.");
    }
  }
}
