// netlify/functions/send-confirmation.js

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function handler(event) {
  try {
    const order = JSON.parse(event.body);

    const customerEmail = order.customer.email;
    const yourEmail = "davemarsh294@gmail.com";

    // -------------------------------
    // CALCULATE TOTALS
    // -------------------------------

    const itemTotal = order.items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    const deliveryTotal = order.delivery.cost || 0;

    const certificateTotal = order.items.reduce((sum, item) => {
      return sum + (item.certificate ? 30 * item.quantity : 0);
    }, 0);

    const grandTotal = itemTotal + deliveryTotal + certificateTotal;

    // -------------------------------
    // BUILD ITEM LIST HTML
    // -------------------------------

    const itemsHtml = order.items
      .map((item) => {
        const certLine = item.certificate
          ? `<div style="margin-left:12px; font-size:13px;">Certificate: £30 × ${item.quantity}</div>`
          : "";

        return `
          <li style="margin-bottom:10px;">
            <strong>${item.title}</strong><br>
            £${item.price} × ${item.quantity}<br>
            ${certLine}
          </li>
        `;
      })
      .join("");

    // -------------------------------
    // BUILD EMAIL HTML
    // -------------------------------

    const emailHtml = `
      <h2>Order Confirmation</h2>
      <p>Thank you for your order, ${order.customer.name}.</p>

      <h3>Order Breakdown</h3>

      <ul style="padding-left:16px; margin-bottom:20px;">
        ${itemsHtml}
      </ul>

      <p><strong>Items Total:</strong> £${itemTotal.toFixed(2)}</p>
      <p><strong>Delivery:</strong> £${deliveryTotal.toFixed(2)}</p>
      <p><strong>Certificates:</strong> £${certificateTotal.toFixed(2)}</p>

      <p style="margin-top:12px; font-size:18px;">
        <strong>Grand Total Paid: £${grandTotal.toFixed(2)}</strong>
      </p>

      <h3>Delivery Details</h3>
      <p>
        ${order.customer.name}<br>
        ${order.customer.address1}<br>
        ${order.customer.address2 || ""}<br>
        ${order.customer.city}<br>
        ${order.customer.postcode}<br>
        ${order.customer.country}
      </p>

      <p><strong>Delivery Region:</strong> ${order.delivery.region}</p>
    `;

    // -------------------------------
    // SEND EMAIL
    // -------------------------------

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
