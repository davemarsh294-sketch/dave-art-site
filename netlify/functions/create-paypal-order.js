// netlify/functions/create-paypal-order.js

export async function handler(event, context) {
  try {
    // ⭐ Prevent crash when body is missing
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing request body" })
      };
    }

    // ⭐ Parse the JSON sent from startPaypalCheckout()
    const { amount, description } = JSON.parse(event.body);

    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_SECRET = process.env.PAYPAL_SECRET;

    // LIVE PayPal API endpoint
    const PAYPAL_API = "https://api-m.paypal.com";

    // 1. Get OAuth token
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");

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

    // 2. Create order
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
            amount: {
              currency_code: "GBP",
              value: amount
            },
            description: description
          }
        ]
      })
    });

    const orderData = await orderResponse.json();

    // 3. Extract approval link
    const approval = orderData.links?.find(link => link.rel === "approve");

    if (!approval) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "No approval link returned",
          details: orderData
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ url: approval.href })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Server error",
        details: err.message
      })
    };
  }
}      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tokenData.access_token}`
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "GBP",
              value: amount
            },
            description: description
          }
        ]
      })
    });

    const orderData = await orderResponse.json();

    // 3. Extract approval link
    const approval = orderData.links?.find(link => link.rel === "approve");

    if (!approval) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "No approval link returned", details: orderData })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ url: approval.href })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error", details: err.message })
    };
  }
}
