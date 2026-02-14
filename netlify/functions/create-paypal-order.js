const fetch = require("node-fetch");

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");

    const items = body.items || [];
    const deliveryCost = body.delivery?.cost || 0;

    let itemsTotal = 0;
    let certificateFee = 0;

    const paypalItems = items.map(item => {
      const qty = item.quantity || 1;
      const lineTotal = item.price * qty;
      itemsTotal += lineTotal;

      if (item.certificate) {
        certificateFee += 30 * qty;
      }

      return {
        name: item.title || "Artwork",
        unit_amount: {
          currency_code: "GBP",
          value: item.price.toFixed(2)
        },
        quantity: qty.toString()
      };
    });

    const total = itemsTotal + deliveryCost + certificateFee;

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
          return_url: "https://davemarshartist.uk/thank-you?token=",
          cancel_url: "https://davemarshartist.uk/cancelled.html"
        },
        purchase_units: [
          {
            amount: {
              currency_code: "GBP",
              value: total.toFixed(2),
              breakdown: {
                item_total: { currency_code: "GBP", value: itemsTotal.toFixed(2) },
                shipping: { currency_code: "GBP", value: deliveryCost.toFixed(2) },
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