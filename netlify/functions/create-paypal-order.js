const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

// Load delivery.json
const deliveryRatesPath = path.join(__dirname, "data", "delivery.json");
const DELIVERY_RATES = JSON.parse(fs.readFileSync(deliveryRatesPath, "utf8"));

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const items = body.items || [];
    const region = body.region || "uk";

    // ---------------------------------------------
    // 1. Build PayPal line items + calculate totals
    // ---------------------------------------------
    let itemsTotal = 0;

    const paypalItems = items.map(item => {
      const lineTotal = item.price * item.qty;
      itemsTotal += lineTotal;

      return {
        name: `${item.title}${item.size ? " – " + item.size : ""}`,
        unit_amount: {
          currency_code: "GBP",
          value: item.price.toFixed(2)
        },
        quantity: item.qty.toString()
      };
    });

    // Delivery (NOT added as an item)
    const delivery = DELIVERY_RATES[region] || 0;

    // Certificate fee (NOT added as an item)
    let certificateFee = 0;
    items.forEach(item => {
      if (item.certificate) {
        certificateFee += 30 * item.qty;
      }
    });

    // Final total
    const total = itemsTotal + delivery + certificateFee;

    // ---------------------------------------------
    // 2. Create PayPal order (LIVE)
    // ---------------------------------------------
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

        application_context: {
          brand_name: "Dave Marsh Artist",
          landing_page: "LOGIN",
          user_action: "PAY_NOW",
          return_url: "https://davemarshartist.uk/thank-you",
          cancel_url: "https://davemarshartist.uk/cancelled.html"
        },

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
            items: paypalItems,
            description: "Artwork Order"
          }
        ]
      })
    });

    const data = await paypalOrder.json();

    console.log("PAYPAL RAW RESPONSE:", data);

    const approvalUrl = data.links?.find(l => l.rel === "approve")?.href;

    if (!approvalUrl) {
      throw new Error("No approval URL returned from PayPal");
    }

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
