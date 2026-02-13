const fs = require("fs");
const path = require("path");

// ⭐ Load delivery.json from the bundled data folder
const deliveryRatesPath = path.join(__dirname, "data", "delivery.json");
const DELIVERY_RATES = JSON.parse(fs.readFileSync(deliveryRatesPath, "utf8"));

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    // ⭐ Front-end now sends full cart + region
    const items = body.items || [];
    const region = body.region || "uk";

    // --------------------------------------------------
    // 1. Calculate item total
    // --------------------------------------------------
    let itemsTotal = 0;
    items.forEach(item => {
      itemsTotal += item.price * item.qty;
    });

    // --------------------------------------------------
    // 2. Delivery fee
    // --------------------------------------------------
    const delivery = DELIVERY_RATES[region] || 0;

    // --------------------------------------------------
    // 3. Certificate fee
    // --------------------------------------------------
    let certificateFee = 0;
    items.forEach(item => {
      if (item.certificate) {
        certificateFee += 30 * item.qty;
      }
    });

    // --------------------------------------------------
    // 4. Final total
    // --------------------------------------------------
    const total = itemsTotal + delivery + certificateFee;

    // --------------------------------------------------
    // 5. Create PayPal order
    // --------------------------------------------------
    const paypalOrder = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(
          process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_SECRET
        ).toString("base64")}`
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

    // --------------------------------------------------
    // ⭐ 6. Extract approval URL
    // --------------------------------------------------
    const approvalUrl = data.links?.find(l => l.rel === "approve")?.href;

    if (!approvalUrl) {
      throw new Error("No approval URL returned from PayPal");
    }

    // --------------------------------------------------
    // 7. Return redirect URL to front-end
    // --------------------------------------------------
    return {
      statusCode: 200,
      body: JSON.stringify({ url: approvalUrl })
    };

  } catch (err) {
    console.error("PayPal error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
