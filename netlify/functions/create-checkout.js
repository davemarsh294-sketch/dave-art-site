import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handler(event) {
  try {
    const order = JSON.parse(event.body);

    const lineItems = order.items.map(item => ({
      price_data: {
        currency: "gbp",
        product_data: { name: item.title },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: item.quantity
    }));

    // Add certificate fees
    const certificateTotal = order.items.reduce((sum, item) => {
      return sum + (item.certificate ? 30 * item.quantity : 0);
    }, 0);

    if (certificateTotal > 0) {
      lineItems.push({
        price_data: {
          currency: "gbp",
          product_data: { name: "Certificate of Authenticity" },
          unit_amount: certificateTotal * 100
        },
        quantity: 1
      });
    }

    // ⭐ ADD DELIVERY AS A LINE ITEM
    if (order.delivery.cost > 0) {
      lineItems.push({
        price_data: {
          currency: "gbp",
          product_data: { name: `Delivery (${order.delivery.region})` },
          unit_amount: Math.round(order.delivery.cost * 100)
        },
        quantity: 1
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: "https://davemarshartist.uk/thank-you.html",
      cancel_url: "https://davemarshartist.uk/checkout.html"
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
