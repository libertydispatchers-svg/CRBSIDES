const express = require("express");
const cors = require("cors");
const path = require("path");
const axios = require("axios");

const crypto = require("crypto");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Serve compiled React frontend (going up one directory for api/ folder structure)
app.use(express.static(path.join(__dirname, "..", "frontend", "dist")));

// In-Memory Database (since no Java for Firebase Emulators)
const db = {
  drivers: [],
  orders: [],
  finance: [],
  vendorApplications: [
    { id: 'v-app-1', name: 'Halal Cart Kings', email: 'kings@halalcart.com', phone: '555-9000', foodType: 'Gyros & Rice', borough: 'Manhattan', status: 'pending' }
  ]
};

// Seed some initial orders for high-fidelity demonstration
db.orders = [
  {
    id: "shopify-1001",
    customerAddress: "123 Williams St, New York, NY 10038 (Financial District)",
    vendorAddress: "Katz's Delicatessen, 205 E Houston St, New York, NY 10002",
    distance: 1.8,
    grossPayout: 3.60,
    netPayout: 3.24,
    status: "pending",
    driverId: null,
    createdAt: new Date().toISOString()
  },
  {
    id: "shopify-1002",
    customerAddress: "45 Cooper Sq, New York, NY 10003 (East Village)",
    vendorAddress: "Katz's Delicatessen, 205 E Houston St, New York, NY 10002",
    distance: 0.8,
    grossPayout: 1.60,
    netPayout: 1.44,
    status: "pending",
    driverId: null,
    createdAt: new Date().toISOString()
  }
];

// Helper to calculate distance (Haversine fallback)
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const nycCoordinates = {
  "lower east side": { lat: 40.7150, lon: -73.9843 },
  "east village": { lat: 40.7265, lon: -73.9815 },
  "brooklyn heights": { lat: 40.6960, lon: -73.9933 },
  "williamsburg": { lat: 40.7081, lon: -73.9571 },
  "harlem": { lat: 40.8116, lon: -73.9465 },
  "astoria": { lat: 40.7644, lon: -73.9235 },
  "flushing": { lat: 40.7673, lon: -73.8331 },
  "dumbo": { lat: 40.7033, lon: -73.9889 },
  "kat's delicatessen": { lat: 40.7222, lon: -73.9874 },
  "katz's delicatessen": { lat: 40.7222, lon: -73.9874 }
};

function getCoordsFromAddress(address) {
  const lower = address.toLowerCase();
  for (const [key, coords] of Object.entries(nycCoordinates)) {
    if (lower.includes(key)) {
      return coords;
    }
  }
  return { lat: 40.7128, lon: -74.0060 };
}

async function getRouteDistance(origin, destination) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}&units=imperial`;
      const response = await axios.get(url);
      if (response.data && response.data.rows && response.data.rows[0].elements && response.data.rows[0].elements[0].status === "OK") {
        const distanceMiles = response.data.rows[0].elements[0].distance.value * 0.000621371;
        return Number(distanceMiles.toFixed(2));
      }
    } catch (err) {
      console.error("Google Matrix API Error, falling back:", err.message);
    }
  }

  const originCoords = getCoordsFromAddress(origin);
  const destCoords = getCoordsFromAddress(destination);

  if (originCoords.lat === 40.7128 && destCoords.lat === 40.7128) {
    const stringHash = (origin.length + destination.length) % 5;
    return Number((1.5 + stringHash * 1.25).toFixed(2));
  }

  const dist = calculateHaversineDistance(originCoords.lat, originCoords.lon, destCoords.lat, destCoords.lon);
  return Number((dist * 1.25).toFixed(2));
}

// REST Mock API Routes
app.get("/api/drivers", (req, res) => {
  res.json(db.drivers);
});

app.post("/api/drivers", (req, res) => {
  const driver = {
    id: "driver-" + Date.now(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  db.drivers.push(driver);
  res.status(201).json(driver);
});

app.get("/api/drivers/:id", (req, res) => {
  const driver = db.drivers.find(d => d.id === req.params.id);
  res.json(driver);
});

app.patch("/api/drivers/:id", (req, res) => {
  const idx = db.drivers.findIndex(d => d.id === req.params.id);
  if (idx !== -1) {
    if (req.body.metrics) {
      db.drivers[idx].metrics = {
        ...db.drivers[idx].metrics,
        ...req.body.metrics
      };
      delete req.body.metrics;
    }
    db.drivers[idx] = { ...db.drivers[idx], ...req.body };
    res.json(db.drivers[idx]);
  } else {
    res.status(404).json({ error: "Driver not found" });
  }
});

app.get("/api/orders", (req, res) => {
  res.json(db.orders);
});

app.get("/api/orders/:id", (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id);
  res.json(order);
});

app.patch("/api/orders/:id", (req, res) => {
  const idx = db.orders.findIndex(o => o.id === req.params.id);
  if (idx !== -1) {
    if (req.body.status === "claimed" && db.orders[idx].status !== "pending") {
      return res.status(409).json({ error: "This order has already been claimed by another driver." });
    }
    db.orders[idx] = { ...db.orders[idx], ...req.body };
    res.json(db.orders[idx]);
  } else {
    res.status(404).json({ error: "Order not found" });
  }
});

app.get("/api/finance", (req, res) => {
  res.json(db.finance);
});

app.get("/api/vendor-applications", (req, res) => {
  res.json(db.vendorApplications);
});

app.post("/api/vendor-applications", (req, res) => {
  const application = {
    id: "v-app-" + Date.now(),
    ...req.body,
    createdAt: new Date().toISOString(),
    status: "pending"
  };
  db.vendorApplications.push(application);
  res.status(201).json(application);
});

app.patch("/api/vendor-applications/:id", (req, res) => {
  const idx = db.vendorApplications.findIndex(a => a.id === req.params.id);
  if (idx !== -1) {
    db.vendorApplications[idx] = { ...db.vendorApplications[idx], ...req.body };
    res.json(db.vendorApplications[idx]);
  } else {
    res.status(404).json({ error: "Application not found" });
  }
});

// --- SHOPIFY OAUTH HANDSHAKE ENDPOINTS ---

// 1. Authorization Redirect Endpoint
app.get("/api/auth/shopify", (req, res) => {
  let shop = req.query.shop;
  if (!shop) {
    return res.status(400).send("Missing shop query parameter");
  }

  // Sanitize shop domain
  shop = shop.replace(/^https?:\/\//, "").trim();
  if (!shop.includes(".myshopify.com")) {
    shop = `${shop}.myshopify.com`;
  }

  if (!/^[a-zA-Z0-9.-]+\.myshopify\.com$/.test(shop)) {
    return res.status(400).send("Invalid shop domain format");
  }

  const client_id = process.env.SHOPIFY_CLIENT_ID;
  const scopes = "write_products,read_products";
  
  // Build absolute callback URI.
  // req.headers.host contains the host name (e.g. curbsides.vercel.app or localhost:5001)
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host;
  const redirect_uri = `${protocol}://${host}/api/auth/shopify/callback`;

  console.log(`[Shopify OAuth] Redirecting shop "${shop}" to authorize...`);
  const authorizeUrl = `https://${shop}/admin/oauth/authorize?client_id=${client_id}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirect_uri)}`;
  
  res.redirect(authorizeUrl);
});

// 2. OAuth Callback Endpoint
app.get("/api/auth/shopify/callback", async (req, res) => {
  const { shop, hmac, code } = req.query;

  if (!shop || !hmac || !code) {
    return res.status(400).send("Missing required OAuth parameters: shop, hmac, and code are required.");
  }

  const client_id = process.env.SHOPIFY_CLIENT_ID;
  const client_secret = process.env.SHOPIFY_CLIENT_SECRET;

  // Verify HMAC signature
  const params = { ...req.query };
  delete params.hmac;

  // Sort keys alphabetically
  const sortedKeys = Object.keys(params).sort();
  const message = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join("&");

  const calculatedHmac = crypto
    .createHmac("sha256", client_secret)
    .update(message)
    .digest("hex");

  try {
    const match = crypto.timingSafeEqual(
      Buffer.from(calculatedHmac, "utf-8"),
      Buffer.from(hmac, "utf-8")
    );
    if (!match) {
      console.warn("[Shopify OAuth] HMAC validation failed!");
      return res.status(400).send("Security verification failed: HMAC mismatch");
    }
  } catch (err) {
    console.error("[Shopify OAuth] HMAC timingSafeEqual error:", err.message);
    return res.status(400).send("Security verification failed: HMAC calculation error");
  }

  console.log(`[Shopify OAuth] HMAC verified. Requesting permanent access token for "${shop}"...`);

  try {
    // Exchange temporary code for permanent access token
    const tokenResponse = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id,
      client_secret,
      code
    });

    const accessToken = tokenResponse.data.access_token;
    console.log(`[Shopify OAuth] Admin API Access token obtained successfully.`);

    // Generate/fetch Storefront Access Token
    let storefrontToken = "";
    try {
      console.log(`[Shopify OAuth] Generating Storefront Access Token...`);
      const storefrontResponse = await axios.post(
        `https://${shop}/admin/api/2024-01/storefront_access_tokens.json`,
        {
          storefront_access_token: {
            title: "Curbsides Storefront client"
          }
        },
        {
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json"
          }
        }
      );
      storefrontToken = storefrontResponse.data.storefront_access_token.access_token;
      console.log(`[Shopify OAuth] Storefront Access Token created successfully.`);
    } catch (sfErr) {
      console.warn(`[Shopify OAuth] Storefront token creation failed (expected if it exists), listing existing tokens...`, sfErr.message);
      try {
        const listResponse = await axios.get(
          `https://${shop}/admin/api/2024-01/storefront_access_tokens.json`,
          {
            headers: {
              "X-Shopify-Access-Token": accessToken
            }
          }
        );
        const tokens = listResponse.data.storefront_access_tokens || [];
        if (tokens.length > 0) {
          storefrontToken = tokens[0].access_token;
          console.log(`[Shopify OAuth] Retrieved existing Storefront Access Token.`);
        }
      } catch (listErr) {
        console.error("[Shopify OAuth] Failed to list Storefront tokens:", listErr.message);
      }
    }

    // Redirect to frontend root page with token parameters
    res.redirect(`/?shopify_installed=true&shop=${encodeURIComponent(shop)}&admin_token=${encodeURIComponent(accessToken)}&storefront_token=${encodeURIComponent(storefrontToken)}`);

  } catch (err) {
    console.error("[Shopify OAuth] OAuth code exchange failed:", err.response?.data || err.message);
    res.status(500).send("Authentication failed during token exchange.");
  }
});

// 3. Shopify Product Creation API (Gated by admin_token)
app.post("/api/shopify/create-product", async (req, res) => {
  const { shop, admin_token, title, vendorName, borough, foodType, price } = req.body;

  if (!shop || !admin_token || !title || !vendorName) {
    return res.status(400).json({ error: "Missing required parameters: shop, admin_token, title, and vendorName are required." });
  }

  const sanitizedShop = shop.replace(/^https?:\/\//, "").trim();

  try {
    console.log(`[Shopify API] Creating starter product for vendor "${vendorName}" in "${sanitizedShop}"...`);
    const productPayload = {
      product: {
        title: title,
        body_html: `<strong>${foodType || "Specialty Street Food"}</strong> - freshly prepared by ${vendorName}.`,
        vendor: vendorName,
        status: "active",
        tags: `Borough:${borough || "NYC"}, curbside-onboarded`,
        variants: [
          {
            price: price || "12.00",
            sku: `curbside-${vendorName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-01`,
            requires_shipping: true
          }
        ]
      }
    };

    const response = await axios.post(
      `https://${sanitizedShop}/admin/api/2024-01/products.json`,
      productPayload,
      {
        headers: {
          "X-Shopify-Access-Token": admin_token,
          "Content-Type": "application/json"
        }
      }
    );

    console.log(`[Shopify API] Product created successfully. ID: ${response.data.product.id}`);
    res.status(201).json({ success: true, product: response.data.product });
  } catch (err) {
    console.error("[Shopify API] Product creation failed:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to create product in Shopify", details: err.response?.data || err.message });
  }
});

// Shopify Webhook Ingestion Endpoint
app.post(["/shopify-order-created", "/webhooks/shopify-order"], async (req, res) => {
  try {
    // Shopify HMAC signature verification (Optional check if secret is configured in Vercel env)
    const hmacHeader = req.get("X-Shopify-Hmac-Sha256");
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;

    if (webhookSecret && hmacHeader) {
      const hash = crypto
        .createHmac("sha256", webhookSecret)
        .update(req.rawBody, "utf8")
        .digest("base64");

      if (hash !== hmacHeader) {
        console.warn("[Webhook] Shopify HMAC signature verification failed!");
        return res.status(401).json({ error: "Unauthorized: HMAC verification failed" });
      }
      console.log("[Webhook] Shopify HMAC signature successfully verified.");
    }

    const payload = req.body;
    const orderId = String(payload.id || payload.order_number || `shopify-${Date.now()}`);

    if (db.orders.some(o => o.id === orderId)) {
      return res.status(200).json({ success: true, message: "Order already ingested", orderId });
    }

    let customerAddress = "Unknown Address, New York, NY";
    if (payload.shipping_address) {
      const addr = payload.shipping_address;
      customerAddress = `${addr.address1 || ""}, ${addr.city || "New York"}, ${addr.province || "NY"} ${addr.zip || ""}`;
    }

    let vendorAddress = "Katz's Delicatessen, 205 E Houston St, New York, NY 10002";
    if (payload.note_attributes) {
      const vendorAttr = payload.note_attributes.find(attr => attr.name.toLowerCase() === "vendor_address");
      if (vendorAttr) vendorAddress = vendorAttr.value;
    }

    const distanceMiles = await getRouteDistance(vendorAddress, customerAddress);
    const grossDriverPay = Number((distanceMiles * 2.00).toFixed(2));
    const driverCommissionSplit = Number((grossDriverPay * 0.10).toFixed(2));
    const netDriverPayout = Number((grossDriverPay - driverCommissionSplit).toFixed(2));

    const totalPrice = Number(payload.total_price || payload.subtotal_price || 35.00);
    const vendorCommissionSplit = Number((totalPrice * 0.10).toFixed(2));
    const platformRevenue = Number((driverCommissionSplit + vendorCommissionSplit).toFixed(2));

    const orderDoc = {
      id: orderId,
      customerAddress,
      vendorAddress,
      distance: distanceMiles,
      grossPayout: grossDriverPay,
      netPayout: netDriverPayout,
      status: "pending",
      driverId: null,
      createdAt: new Date().toISOString()
    };
    db.orders.push(orderDoc);

    const financeDoc = {
      orderId,
      totalDistance: distanceMiles,
      grossDriverPay,
      driverCommissionSplit,
      vendorCommissionSplit,
      platformRevenue,
      timestamp: new Date().toISOString()
    };
    db.finance.push(financeDoc);

    // 3. Optional Shipday Integration
    const shipdayApiKey = process.env.SHIPDAY_API_KEY;
    if (shipdayApiKey) {
      console.log(`[Shipday] Dispatching order ${orderId} to Shipday...`);
      try {
        const vendorName = (payload.note_attributes?.find(attr => attr.name.toLowerCase() === "vendor_name")?.value) || "Katz's Delicatessen";
        const customerName = payload.shipping_address?.name || payload.customer?.first_name || "Valued Customer";
        const customerPhone = payload.shipping_address?.phone || payload.phone || "555-0199";
        const customerEmail = payload.email || "customer@example.com";

        const shipdayPayload = {
          orderNumber: orderId,
          customerName: customerName,
          customerAddress: customerAddress,
          customerEmail: customerEmail,
          customerPhoneNumber: customerPhone,
          restaurantName: "Curbsides: " + vendorName,
          restaurantAddress: vendorAddress,
          paymentMethod: "credit_card"
        };

        await axios.post("https://api.shipday.com/orders", shipdayPayload, {
          headers: {
            "Authorization": `Basic ${shipdayApiKey}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
          }
        });
        console.log(`[Shipday] Order ${orderId} successfully dispatched in Shipday.`);
      } catch (err) {
        console.error("[Shipday] Integration error:", err.response?.data || err.message);
      }
    } else {
      console.log("[Shipday] No SHIPDAY_API_KEY configured. Skipping automated dispatch.");
    }

    res.status(200).json({
      success: true,
      orderId,
      distanceMiles,
      netDriverPayout,
      platformRevenue
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Single Page App fallback routing
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
});

// Start local server if run directly (Vercel bypasses this block in serverless)
if (require.main === module) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Curbside Local Operations Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
