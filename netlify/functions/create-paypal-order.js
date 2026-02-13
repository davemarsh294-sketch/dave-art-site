const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

// ⭐ Load delivery rates from shared JSON file
const deliveryRatesPath = path.join(__dirname, "delivery.json");
const DELIVERY_RATES = JSON.parse(fs.readFileSync(deliveryRatesPath, "utf8"));

exports.handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const items = body.items || [];
    const region = body.region || "uk";

    // 1. Calculate items total
    let itemsTotal = 0;
    items.forEach(item => {
      itemsTotal += item.price * item.qty;
    });

    // 2. Delivery fee (from delivery.json)
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

    // 5. Create PayPal order
    const paypalOrder = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_SECRET).toString("base64")}`
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "GBP",
              value: total.toFixed(2),
              breakdown: {
                item_total: { currency_code: "GBP", value: itemsTotal.toFixed(2) },
                shipping: { currency_code: "GBP", value: delivery.toFixed(2) },
                handling: { currency_code: "GBP", value: certificateFee.toFixed(2) }
              }
            },
            description: "Artwork Order"
          }
        ]
      })
    });

    const data = await paypalOrder.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ id: data.id })
    };

  } catch (err) {
    console.error("PayPal order error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};