const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const { items, region, certificate } = JSON.parse(event.body);

  // 1. Calculate items total
  let itemsTotal = 0;
  items.forEach(item => {
    itemsTotal += item.price * item.qty;
  });

  // 2. Delivery rates
  const DELIVERY_RATES = {
    uk: 0,
    eu: 18,
    world: 28
  };

  let delivery = DELIVERY_RATES[region] || 0;

  // 3. Certificate fee
  let certificateFee = certificate ? 15 : 0;

  // 4. Final total
  let total = itemsTotal + delivery + certificateFee;

  // 5. Create Stripe session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    shipping_address_collection: {
      allowed_countries: ['GB', 'US', 'CA', 'AU', 'IE', 'FR', 'DE', 'NL', 'ES', 'IT']
    },
    success_url: '/success.html',
    cancel_url: '/',

    // Charge the full combined amount as one line item
    line_items: [
      {
        price_data: {
          currency: 'gbp',
          product_data: { name: 'Artwork Order' },
          unit_amount: Math.round(total * 100) // convert to pence
        },
        quantity: 1
      }
    ],

    // ⭐ Order breakdown for Stripe receipts & dashboard
    metadata: {
      items_total: itemsTotal.toFixed(2),
      delivery_fee: delivery.toFixed(2),
      certificate_fee: certificateFee.toFixed(2),
      grand_total: total.toFixed(2),
      region: region,
      certificate_selected: certificate ? "yes" : "no"
    }
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ url: session.url })
  };
};