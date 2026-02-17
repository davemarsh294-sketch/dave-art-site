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

    const itemsTotal = baseItemsTotal + certificateTotal;
    const deliveryTotal = order.delivery.cost || 0;

    const grandTotal = itemsTotal + deliveryTotal;

    // -------------------------------
    // BUILD ITEM LIST HTML
    // -------------------------------

    const itemsHtml = order.items
      .map((item) => {
        const certLine = item.certificate
          ? `<div style="margin-left:12px; font-size:13px; color:#555;">Certificate: £30 × ${item.quantity}</div>`
          : "";

        return `
          <div style="margin-bottom:12px;">
            <div><strong>${item.title}</strong></div>
            <div>£${item.price} × ${item.quantity}</div>
            ${certLine}
          </div>
        `;
      })
      .join("");

    // -------------------------------
    // EMAIL HTML (clean + tidy)
    // -------------------------------

    const emailHtml = `
      <div style="font-family: sans-serif; line-height: 1.6; max-width: 480px;">
        
        <h2 style="margin-bottom: 8px;">Order Confirmation</h2>
        <p>Thank you for your order, ${order.customer.name}.</p>

        <h3 style="margin-top: 24px;">Order Breakdown</h3>

        ${itemsHtml}

        <div style="margin-top: 16px;">
          <div><strong>Items Total:</strong> £${itemsTotal.toFixed(2)}</div>
          <div><strong>Delivery:</strong> £${deliveryTotal.toFixed(2)}</div>
          <div><strong>Certificates:</strong> £${certificateTotal.toFixed(2)}</div>
        </div>

        <h3 style="margin-top: 16px;">Grand Total Paid: £${grandTotal.toFixed(2)}</h3>

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
