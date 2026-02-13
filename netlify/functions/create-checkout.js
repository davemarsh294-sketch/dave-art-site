const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require("fs");
const path = require("path");

// ⭐ Diagnostic: show what Netlify actually deployed
console.log("=== NETLIFY FUNCTION DIAGNOSTIC START ===");
console.log("DIRNAME:", __dirname);

try {
  console.log("DIR CONTENTS:", fs.readdirSync(__dirname));
} catch (e) {
  console.log("ERROR READING DIR CONTENTS:", e);
}

const dataFolder = path.join(__dirname, "data");
console.log("DATA FOLDER PATH:", dataFolder);
console.log("DATA FOLDER EXISTS:", fs.existsSync(dataFolder));

if (fs.existsSync(dataFolder)) {
  try {
    console.log("DATA FOLDER CONTENTS:", fs.readdirSync(dataFolder));
  } catch (e) {
    console.log("ERROR READING DATA FOLDER:", e);
  }
}

const deliveryRatesPath = path.join(__dirname, "data", "delivery.json");
console.log("LOOKING FOR DELIVERY JSON AT:", deliveryRatesPath);
console.log("DELIVERY JSON EXISTS:", fs.existsSync(deliveryRatesPath));

console.log("=== NETLIFY FUNCTION DIAGNOSTIC END ===");

// ⭐ Load delivery.json (this is what is failing)
let DELIVERY_RATES = {};
try {
  DELIVERY_RATES = JSON.parse(fs.readFileSync(deliveryRatesPath, "utf8"));
  console.log("DELIVERY_RATES LOADED:", DELIVERY_RATES);
} catch (err) {
  console.error("ERROR LOADING DELIVERY_RATES:", err);
}

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const items = body.items || [];
    const region = body.region || "uk";

    let itemsTotal = 0;
    items.forEach(item => {
      itemsTotal += item.price * item.qty;
    });

    const delivery = DELIVERY_RATES[region] || 0;

    let certificateFee = 0;
    items.forEach(item => {
      if (item.certificate) {
        certificateFee += 30 * item.qty;
      }
    });

    const total = itemsTotal + delivery + certificateFee;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      success_url: 'https://davemarshartist.uk/thank-you',
      cancel_url: 'https://davemarshartist.uk/cancelled.html',
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: { name: 'Artwork Order' },
            unit_amount: Math.round(total * 100)
          },
          quantity: 1
        }
      ]
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
