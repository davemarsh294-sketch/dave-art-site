// ---------------------------------------------
// CART STATE
// ---------------------------------------------
let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
let cartCount = parseInt(localStorage.getItem('cartCount')) || 0;

// Update cart badge on load
const badge = document.getElementById('cartCountBadge');
if (badge) badge.textContent = cartCount;


// ---------------------------------------------
// ADD TO CART
// ---------------------------------------------
function addToCart(item) {
  cartItems.push(item);
  cartCount++;

  localStorage.setItem('cartItems', JSON.stringify(cartItems));
  localStorage.setItem('cartCount', cartCount.toString());

  if (badge) badge.textContent = cartCount;
}


// ---------------------------------------------
// CALCULATE ORDER TOTAL
// ---------------------------------------------
function calculateOrderTotal() {
  return cartItems.reduce((sum, item) => sum + Number(item.price), 0).toFixed(2);
}

let orderTotal = calculateOrderTotal();


// ---------------------------------------------
// PAYMENT SUCCESS HANDLER
// ---------------------------------------------
function handleSuccessfulPayment() {
  const orderSummary = {
    items: cartItems,
    total: orderTotal
  };

  localStorage.setItem('lastOrder', JSON.stringify(orderSummary));

  window.location.href = "thankyou.html";
}


// ---------------------------------------------
// STRIPE PAYMENT
// ---------------------------------------------
function payWithStripe() {
  // Your Stripe logic here...
  // After successful payment:
  handleSuccessfulPayment();
}


// ---------------------------------------------
// PAYPAL PAYMENT
// ---------------------------------------------
function payWithPayPal() {
  // Your PayPal logic here...
  // After successful payment:
  handleSuccessfulPayment();
}


// ---------------------------------------------
// FORM VALIDATION
// ---------------------------------------------
function validateCheckoutForm() {
  const form = document.getElementById('checkoutForm');
  if (!form) return true;
  return form.checkValidity();
}


// ---------------------------------------------
// COMPLETE ORDER (offline checkout)
// ---------------------------------------------
function completeOrder() {
  if (!validateCheckoutForm()) {
    alert("Please complete all required fields.");
    return;
  }

  handleSuccessfulPayment();
}


// ---------------------------------------------
// BUTTON EVENT LISTENERS (IMPORTANT)
// ---------------------------------------------
document.addEventListener("DOMContentLoaded", () => {

  const cardBtn = document.getElementById("payWithCard");
  const paypalBtn = document.getElementById("payWithPayPal");

  if (cardBtn) {
    cardBtn.addEventListener("click", payWithStripe);
  }

  if (paypalBtn) {
    paypalBtn.addEventListener("click", payWithPayPal);
  }

});
