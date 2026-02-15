import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async (req) => {
  try {
    const order = await req.json();

    const { customer, items, delivery, total } = order;

    const itemLines = items
      .map(i => `${i.title} × ${i.quantity}${i.certificate ? " + Certificate" : ""}`)
      .join("\n");

    const emailBody = `
New Order Received

Customer:
${customer.name}
${customer.email}
${customer.phone}

Address:
${customer.address1}
${customer.address2 || ""}
${customer.city}
${customer.country}
${customer.postcode}

Items:
${itemLines}

Delivery:
Region: ${delivery.region}
Cost: £${delivery.cost}

Total:
£${total}
    `;

    await resend.emails.send({
      from: "orders@YOURDOMAIN.com",
      to: "davemarsh294.gmail.com",
      subject: "New Order Received",
      text: emailBody
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};