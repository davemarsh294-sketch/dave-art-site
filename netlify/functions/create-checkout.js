const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    const order = JSON.parse(event.body || "{}");
    const items = order.items || [];
    const deliveryCost = order.delivery?.cost || 0;

    let subtotal = 0;
    let certificateFee = 0;

    items.forEach(item => {
      const qty = item.quantity || 1;
      subtotal += item.price * qty;
      if (item.certificate) {
        certificateFee += 30 * qty;
      }
    });

    const total = subtotal + certificateFee + deliveryCost;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      success_url: "https://davemarshartist.uk/thank-you?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://davemarshartist.uk/cancelled.html",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: { name: "Artwork Order" },
            unit_amount: Math.round(total * 100)
          },
          quantity: 1
        }
      ],
      metadata: {
        customer_name: order.customer?.name || "",
        customer_email: order.customer?.email || "",
        order_total: total.toFixed(2)
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };

  } catch (err) {
    console.error("STRIPE FUNCTION ERROR:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};