exports.handler = async (event, context) => {
  try {
    // Ensure we received a body
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing request body" })
      };
    }

    // Extract amount + dynamic description from frontend
    const { amount, description } = JSON.parse(event.body);

    // Load PayPal credentials from Netlify environment variables
    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_SECRET = process.env.PAYPAL_SECRET;

    // Live PayPal API base URL
    const PAYPAL_API = "https://api-m.paypal.com";

    // Encode credentials for Basic Auth
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");

    // STEP 1 — Get OAuth access token
    const tokenResponse = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to get PayPal access token",
          details: tokenData
        })
      };
    }

    // STEP 2 — Create the PayPal order
    const orderResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tokenData.access_token}`
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            description: description,   // ⭐ Artwork title(s) go here
            amount: {
              currency_code: "GBP",
              value: amount
            }
          }
        ],
        application_context: {
          shipping_preference: "GET_FROM_FILE" // ⭐ PayPal collects shipping address
        }
      })
    });

    const orderData = await orderResponse.json();

    if (!orderData.links) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to create PayPal order",
          details: orderData
        })
      };
    }

    // STEP 3 — Extract approval URL
    const approval = orderData.links.find(link => link.rel === "approve");

    return {
      statusCode: 200,
      body: JSON.stringify({ url: approval.href })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Server error",
        details: error.message
      })
    };
  }
};
