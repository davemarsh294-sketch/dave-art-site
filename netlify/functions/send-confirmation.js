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

    const baseItemsTotal = order.items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    const certificateTotal = order.items.reduce((sum, item) => {
      return sum + (item.certificate ? 30 * item.quantity : 0);
    }, 0);

    const deliveryTotal = order.delivery.cost || 0;

    const grandTotal = baseItemsTotal + certificateTotal + deliveryTotal;

    // -------------------------------
    // BUILD CLEAN ITEM LIST
    // -------------------------------

    const itemsHtml = order.items
      .map((item) => {
        return `
          <div style="margin-bottom:12px;">
            <div><strong>${item.title}</strong></div>
            <div>£${item.price} × ${item.quantity}</div>
          </div>
        `;
      })
      .join("");

    const certificateHtml = certificateTotal > 0
      ? `<div style="margin-bottom:12px;"><strong>Certificate</strong><br>£30 × ${order.items.find(i => i.certificate).quantity}</div>`
      : "";

    // -------------------------------
    // EMAIL HTML (clean + logical)
    // -------------------------------

    const emailHtml = `
      <div style="font-family: sans-serif; line-height: 1.6; max-width: 480px;">

        <h2 style="margin-bottom: 8px;">Order Confirmation</h2>
        <p>Thank you for your order, ${order.customer.name}.</p>

        <h3 style="margin-top: 24px;">Order Breakdown</h3>

        <div style="margin-bottom: 16px;">
          ${itemsHtml}
          ${certificateHtml}
          <div><strong>Delivery</strong><br>£${deliveryTotal.toFixed(2)}</div>
        </div>

        <h3 style="margin-top: 16px;">Total Paid: £${grandTotal.toFixed(2)}</h3>

        <h3 style="margin-top: 24px;">Delivery Details</h3>
        <p>
          ${order.customer.name}<br>
          ${order.customer.address1}<br>
          ${order.customer.address2 || ""}<br>
          ${order.customer.city}<br>
          ${order.customer.postcode}<br>
          ${order.customer.country}
        </p>

        <p><strong>Delivery Region:</strong> ${order.delivery.region}</p>
      </div>
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
