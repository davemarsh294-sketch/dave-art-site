// netlify/functions/create-paypal-order.js

import fetch from "node-fetch";

export async function handler(event) {
  try {
    const order = JSON.parse(event.body);

    const auth = Buffer.from(
      process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_SECRET
    ).toString("base64");

    const paypalOrder = await fetch(
      "https://api-m.paypal.com/v2/checkout/orders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: "GBP",
                value: order.total.toFixed(2)
              }
            }
          ],
          application_context: {
            brand_name: "Dave Marsh Artist",
            landing_page: "NO_PREFERENCE",

            // ⭐ Your domain
            return_url: "https://davemarshartist.uk/thank-you.html",
            cancel_url: "https://davemarshartist.uk/checkout.html"
          }
        })
      }
    );

    const data = await paypalOrder.json();

    const approvalUrl = data.links.find(
      (link) => link.rel === "approve"
    ).href;

    return {
      statusCode: 200,
      body: JSON.stringify({ url: approvalUrl })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
