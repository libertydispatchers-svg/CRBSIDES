const express = require("express");
const cors = require("cors");
const path = require("path");
const axios = require("axios");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Serve compiled React frontend (going up one directory for api/ folder structure)
app.use(express.static(path.join(__dirname, "..", "frontend", "dist")));

// In-Memory Database (since no Java for Firebase Emulators)
const db = {
  drivers: [],
  orders: [],
  finance: []
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

// Shopify Webhook Ingestion Endpoint
app.post("/shopify-order-created", async (req, res) => {
  try {
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
          restaurantAddress: vendorAddress
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
