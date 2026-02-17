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
  // Build order summary object
  const orderSummary = {
    items: cartItems,
    total: orderTotal
  };

  // Store order summary for thankyou page
  localStorage.setItem('lastOrder', JSON.stringify(orderSummary));

  // Redirect to thankyou page
  window.location.href = "thankyou.html";
}


// ---------------------------------------------
// STRIPE PAYMENT (if used)
// ---------------------------------------------
async function payWithStripe() {
  // Your existing Stripe logic here...
  // After successful payment:
  handleSuccessfulPayment();
}


// ---------------------------------------------
// PAYPAL PAYMENT (if used)
// ---------------------------------------------
function payWithPayPal() {
  // Your existing PayPal logic here...
  // After successful payment:
  handleSuccessfulPayment();
}


// ---------------------------------------------
// FORM VALIDATION (if you use a form)
// ---------------------------------------------
function validateCheckoutForm() {
  const form = document.getElementById('checkoutForm');
  if (!form) return true;

  return form.checkValidity();
}


// ---------------------------------------------
// COMPLETE ORDER BUTTON
// ---------------------------------------------
function completeOrder() {
  if (!validateCheckoutForm()) {
    alert("Please complete all required fields.");
    return;
  }

  // If you use Stripe or PayPal, call those instead:
  // payWithStripe();
  // OR
  // payWithPayPal();

  // If you use a simple offline checkout:
  handleSuccessfulPayment();
}
