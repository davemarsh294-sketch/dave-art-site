const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const sessionId = event.queryStringParameters.session_id;

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  return {
    statusCode: 200,
    body: JSON.stringify({
      metadata: session.metadata
    })
  };
};