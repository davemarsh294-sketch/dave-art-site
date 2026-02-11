// netlify/functions/create-paypal-order.js

const fetch = require("node-fetch");

exports.handler = async (event, context) => {

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    // Parse incoming data from your site
    const body = JSON.parse(event.body);
    const items = body.items || [];
    const region = body.region || "UK";

    // Calculate total price from cart items
    const total = items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    // Load PayPal credentials from Netlify environment variables
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET;

    // Encode credentials for OAuth
    const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

    // STEP 1 — Get OAuth access token
    const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // STEP 2 — Create PayPal order
    const orderRes = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "GBP",
              value: total.toFixed(2)
            }
          }
        ],
        application_context: {
          return_url: "https://davemarshartist.uk/success",
          cancel_url: "https://davemarshartist.uk/cancel"
        }
      })
    });

    const orderData = await orderRes.json();

    // Find the approval link PayPal returns
    const approval = orderData.links.find(link => link.rel === "approve");

    return {
      statusCode: 200,
      body: JSON.stringify({ url: approval.href })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
