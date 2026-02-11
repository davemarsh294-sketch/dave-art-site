const body = event.body ? JSON.parse(event.body) : {};
const items = body.items || [];
const region = body.region || "UK";
