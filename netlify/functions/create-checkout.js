const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require("fs");
const path = require("path");

// ⭐ Load delivery rates from project root
const deliveryRatesPath = path.join(process.cwd(), "delivery.json");
const DELIVERY_RATES = JSON.parse(fs.readFileSync(deliveryRatesPath, "utf8"));

exports.handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const items = body.items || [];
    const region = body.region || "uk";

    // 1. Items total
    let itemsTotal = 0;
    items.forEach(item => {
      itemsTotal += item.price * item.qty;
    });

    // 2. Delivery fee
    const delivery = DELIVERY_RATES[region] || 0;

    // 3. Certificate fee (per item)
    let certificateFee = 0;
    items.forEach(item => {
      if (item.certificate) {
        certificateFee += 30 * item.qty;
      }
    });

    // 4. Final total
    const total = itemsTotal + delivery + certificateFee;

    // 5. Create Stripe session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],

      shipping_address_collection: {
        allowed_countries: [
          'GB','US','CA','AU','IE','FR','DE','NL','ES','IT'
        ]
      },

      success_url: 'https://davemarshartist.uk/thank-you',
      cancel_url: 'https://davemarshartist.uk/cancelled.html',

      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: { name: 'Artwork Order' },
            unit_amount: Math.round(total * 100)
          },
          quantity: 1
        }
      ],

      metadata: {
        items_total: itemsTotal.toFixed(2),
        delivery_fee: delivery.toFixed(2),
        certificate_fee: certificateFee.toFixed(2),
        grand_total: total.toFixed(2),
        region: region
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };

  } catch (err) {
    console.error("Checkout error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};