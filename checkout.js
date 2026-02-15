/* --------------------------------------------------
   CHECKOUT — SAVE ORDER + REDIRECT TO PAYMENT
-------------------------------------------------- */

async function startCheckout() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address1 = document.getElementById("address1").value.trim();
  const address2 = document.getElementById("address2").value.trim();
  const city = document.getElementById("city").value.trim();
  const country = document.getElementById("country").value.trim();
  const postcode = document.getElementById("postcode").value.trim();

  const deliveryRegion = document.getElementById("deliveryRegion").value;
  const deliveryCost = parseFloat(document.getElementById("deliveryCost").value);

  const cart = JSON.parse(localStorage.getItem("dm_cart")) || [];

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const certificateFee = cart.reduce((sum, item) => sum + (item.certificate ? 30 * item.quantity : 0), 0);
  const total = subtotal + certificateFee + deliveryCost;

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

  // ⭐ FIX: Use sessionStorage so Stripe redirect keeps the data
  sessionStorage.setItem("pendingOrder", JSON.stringify(order));

  // ⭐ Send to Stripe or PayPal depending on button clicked
  if (window.checkoutMethod === "stripe") {
    const response = await fetch("/.netlify/functions/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });

    const data = await response.json();
    window.location.href = data.url;
  }

  if (window.checkoutMethod === "paypal") {
    const response = await fetch("/.netlify/functions/create-paypal-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });

    const data = await response.json();
    window.location.href = data.url;
  }
}
