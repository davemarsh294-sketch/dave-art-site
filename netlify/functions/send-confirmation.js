// netlify/functions/send-confirmation.js

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function handler(event) {
  try {
    const order = JSON.parse(event.body);

    const customerEmail = order.customer.email;
    const yourEmail = "davemarsh294@gmail.com";

    const emailHtml = `
      <h2>Order Confirmation</h2>
      <p>Thank you for your order, ${order.customer.name}.</p>
      <p><strong>Total Paid:</strong> £${order.total.toFixed(2)}</p>
      <p><strong>Delivery Region:</strong> ${order.delivery.region}</p>
      <p><strong>Address:</strong><br>
        ${order.customer.address1}<br>
        ${order.customer.address2 || ""}<br>
        ${order.customer.city}<br>
        ${order.customer.postcode}<br>
        ${order.customer.country}
      </p>
      <h3>Items</h3>
      <ul>
        ${order.items
          .map(
            (item) =>
              `<li>${item.title} — £${item.price} × ${item.quantity}</li>`
          )
          .join("")}
      </ul>
    `;

    const response = await resend.emails.send({
      from: "Orders <orders@davemarshartist.uk>",
      to: [customerEmail, yourEmail],
      subject: "Your Order Confirmation",
      html: emailHtml
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, response })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
}
