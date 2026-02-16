// checkout.js

function startCheckout() {
  const form = document.getElementById("checkout-form");

  // ⭐ Enforce required fields using browser validation
  if (!form.checkValidity()) {
    form.reportValidity();
    return; // stop checkout until fields are filled
  }

  // Build order object
  const cart = JSON.parse(localStorage.getItem("dm_cart")) || [];

  // ⭐ These values are set by checkout-summary.js
  const region = document.getElementById("deliveryRegion").value;
  const deliveryCost = Number(document.getElementById("deliveryCost").value);

  const order = {
    items: cart,
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
    delivery: {
      region: region,
      cost: deliveryCost
    }
  };

  // Save pending order for thank-you page
  sessionStorage.setItem("pendingOrder", JSON.stringify(order));

  // Decide payment method
  if (window.checkoutMethod === "stripe") {
    startStripe(order);
  } else if (window.checkoutMethod === "paypal") {
    startPayPal(order);
  }
}

// ⭐ Stripe Checkout
async function startStripe(order) {
  const res = await fetch("/.netlify/functions/create-checkout", {
    method: "POST",
    body: JSON.stringify(order)
  });

  const data = await res.json();

  if (data.url) {
    window.location.href = data.url;
  } else {
    alert("There was an error starting Stripe checkout");
  }
}

// ⭐ PayPal Checkout
async function startPayPal(order) {
  const res = await fetch("/.netlify/functions/create-paypal-order", {
    method: "POST",
    body: JSON.stringify(order)
  });

  const data = await res.json();

  if (data.url) {
    window.location.href = data.url;
  } else {
    alert("There was an error starting PayPal checkout");
  }
}
