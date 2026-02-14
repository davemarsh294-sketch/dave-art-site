import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function handler(event) {
  try {
    const order = JSON.parse(event.body || "{}");

    const itemsList = order.items
      .map(i => {
        const qty = i.quantity || 1;
        const cert = i.certificate ? " + Certificate" : "";
        return `${i.title} × ${qty}${cert} — £${(i.price * qty).toFixed(2)}`;
      })
      .join("<br>");

    const subtotal = order.items.reduce((s, i) => {
      const qty = i.quantity || 1;
      return s + i.price * qty;
    }, 0);

    const certificateFee = order.items.reduce((s, i) => {
      const qty = i.quantity || 1;
      return s + (i.certificate ? 30 * qty : 0);
    }, 0);

    const delivery = order.delivery?.cost || 0;
    const total = subtotal + certificateFee + delivery;

    const html = `
      <h2>Order Confirmation</h2>
      <p><strong>Order ID:</strong> ${order.orderId}</p>

      <h3>Customer</h3>
      <p>
        ${order.customer.name}<br>
        ${order.customer.address1}<br>
        ${order.customer.address2 || ""}<br>
        ${order.customer.city}<br>
        ${order.customer.country}<br>
        ${order.customer.postcode}<br>
        Email: ${order.customer.email}<br>
        Phone: ${order.customer.phone || "N/A"}
      </p>

      <h3>Items</h3>
      <p>${itemsList}</p>

      <h3>Delivery</h3>
      <p>£${delivery.toFixed(2)}</p>

      <h3>Certificates</h3>
      <p>£${certificateFee.toFixed(2)}</p>

      <h3>Total</h3>
      <p><strong>£${total.toFixed(2)}</strong></p>
    `;

    await resend.emails.send({
      from: "Orders <orders@yourdomain.com>",
      to: "your-email@example.com",
      subject: `New Order — ${order.orderId}`,
      html
    });

    await resend.emails.send({
      from: "Your Shop <orders@yourdomain.com>",
      to: order.customer.email,
      subject: `Your Order Confirmation — ${order.orderId}`,
      html
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    console.error("Email error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}