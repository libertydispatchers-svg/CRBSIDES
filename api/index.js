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

// In-Memory Database Fallback (used when offline or if Firestore is down)
const db = {
  drivers: [],
  orders: [],
  finance: [],
  users: [],
  vendorApplications: [
    { id: 'v-app-1', name: 'Halal Cart Kings', email: 'kings@halalcart.com', phone: '555-9000', foodType: 'Gyros & Rice', borough: 'Manhattan', status: 'pending' }
  ]
};

// Firestore REST Configuration
const PROJECT_ID = 'curbside-35431';
const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_FIRESTORE_EMULATOR_HOST;
const FIRESTORE_BASE_URL = EMULATOR_HOST
  ? `http://${EMULATOR_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents`
  : `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

console.log(`[Database] Connecting to Firestore at: ${FIRESTORE_BASE_URL}`);

// Helpers to convert JSON to Firestore fields and vice versa
function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) continue;
    if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (typeof val === 'number') {
      fields[key] = { doubleValue: val };
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map(item => {
            if (typeof item === 'string') return { stringValue: item };
            if (typeof item === 'number') return { doubleValue: item };
            return { stringValue: String(item) };
          })
        }
      };
    } else if (typeof val === 'object') {
      fields[key] = { stringValue: JSON.stringify(val) };
    }
  }
  return { fields };
}

function fromFirestoreFields(fields) {
  const obj = {};
  if (!fields) return obj;
  for (const [key, wrapper] of Object.entries(fields)) {
    if ('stringValue' in wrapper) {
      const val = wrapper.stringValue;
      if (val.startsWith('{') || val.startsWith('[')) {
        try {
          obj[key] = JSON.parse(val);
        } catch (e) {
          obj[key] = val;
        }
      } else {
        obj[key] = val;
      }
    } else if ('doubleValue' in wrapper) {
      obj[key] = Number(wrapper.doubleValue);
    } else if ('integerValue' in wrapper) {
      obj[key] = Number(wrapper.integerValue);
    } else if ('booleanValue' in wrapper) {
      obj[key] = wrapper.booleanValue;
    } else if ('arrayValue' in wrapper) {
      const vals = wrapper.arrayValue.values || [];
      obj[key] = vals.map(v => {
        if ('stringValue' in v) return v.stringValue;
        if ('doubleValue' in v) return Number(v.doubleValue);
        return null;
      });
    }
  }
  return obj;
}

// REST Database operations
async function getCollection(collectionName) {
  try {
    const response = await axios.get(`${FIRESTORE_BASE_URL}/${collectionName}?pageSize=200`);
    const documents = response.data.documents || [];
    return documents.map(doc => {
      const id = doc.name.split('/').pop();
      return { id, ...fromFirestoreFields(doc.fields) };
    });
  } catch (err) {
    console.error(`[Database] Error getting collection ${collectionName}:`, err.message);
    return db[collectionName] || [];
  }
}

async function getDocument(collectionName, docId) {
  try {
    const response = await axios.get(`${FIRESTORE_BASE_URL}/${collectionName}/${docId}`);
    return { id: docId, ...fromFirestoreFields(response.data.fields) };
  } catch (err) {
    console.error(`[Database] Error getting document ${collectionName}/${docId}:`, err.message);
    return db[collectionName]?.find(item => item.id === docId) || null;
  }
}

async function addDocument(collectionName, docId, data) {
  try {
    const payload = toFirestoreFields(data);
    await axios.post(`${FIRESTORE_BASE_URL}/${collectionName}?documentId=${docId}`, payload);
    if (db[collectionName]) {
      const existingIdx = db[collectionName].findIndex(item => item.id === docId);
      if (existingIdx !== -1) {
        db[collectionName][existingIdx] = { id: docId, ...data };
      } else {
        db[collectionName].push({ id: docId, ...data });
      }
    }
    return { id: docId, ...data };
  } catch (err) {
    console.error(`[Database] Error adding document ${collectionName}/${docId}:`, err.message);
    if (db[collectionName]) {
      const doc = { id: docId, ...data };
      db[collectionName].push(doc);
      return doc;
    }
    return { id: docId, ...data };
  }
}

async function updateDocument(collectionName, docId, data) {
  try {
    const payload = toFirestoreFields(data);
    await axios.patch(`${FIRESTORE_BASE_URL}/${collectionName}/${docId}`, payload);
    if (db[collectionName]) {
      const idx = db[collectionName].findIndex(item => item.id === docId);
      if (idx !== -1) {
        db[collectionName][idx] = { ...db[collectionName][idx], ...data };
      }
    }
    return { id: docId, ...data };
  } catch (err) {
    console.error(`[Database] Error updating document ${collectionName}/${docId}:`, err.message);
    if (db[collectionName]) {
      const idx = db[collectionName].findIndex(item => item.id === docId);
      if (idx !== -1) {
        db[collectionName][idx] = { ...db[collectionName][idx], ...data };
        return db[collectionName][idx];
      }
    }
    return { id: docId, ...data };
  }
}

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
  "midtown": { lat: 40.7580, lon: -73.9855 },
  "korean bbq taco": { lat: 40.7580, lon: -73.9855 },
  "empanada guy": { lat: 40.7150, lon: -73.9843 },
  "ramen on wheels": { lat: 40.7081, lon: -73.9571 },
  "jerk chicken": { lat: 40.8116, lon: -73.9465 },
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

// Helper to register carrier in Shipday upon approval (white-labeled)
async function registerShipdayCarrierIfNeeded(driver) {
  if (driver.status !== 'approved') return driver;
  if (driver.shipdayCarrierId) return driver;

  const shipdayApiKey = process.env.SHIPDAY_API_KEY;
  if (!shipdayApiKey) {
    console.log("[Shipday] No SHIPDAY_API_KEY configured. Skipping carrier registration.");
    return driver;
  }

  console.log(`[Shipday] Registering carrier ${driver.fullName} in Shipday...`);
  try {
    const payload = {
      name: driver.fullName || driver.name || "Driver",
      email: driver.email || "driver@example.com",
      phoneNumber: driver.phone || driver.phoneNumber || "555-0199"
    };

    const response = await axios.post("https://api.shipday.com/carriers", payload, {
      headers: {
        "Authorization": `Basic ${shipdayApiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    });

    if (response.data && response.data.carrierId) {
      console.log(`[Shipday] Carrier successfully registered. ID: ${response.data.carrierId}`);
      driver.shipdayCarrierId = response.data.carrierId;
      if (response.data.message) {
        driver.shipdayMessage = response.data.message;
      }
      if (response.data.password) {
        driver.shipdayPassword = response.data.password;
      }
    }
  } catch (err) {
    console.error("[Shipday] Carrier registration error:", err.response?.data || err.message);
  }

  return driver;
}

// REST API Routes
app.get("/api/drivers", async (req, res) => {
  const list = await getCollection("drivers");
  res.json(list);
});

app.post("/api/drivers", async (req, res) => {
  const driverId = "driver-" + Date.now();
  let driver = {
    ...req.body,
    createdAt: new Date().toISOString()
  };
  driver = await registerShipdayCarrierIfNeeded(driver);
  const saved = await addDocument("drivers", driverId, driver);
  res.status(201).json(saved);
});

app.get("/api/drivers/:id", async (req, res) => {
  const driver = await getDocument("drivers", req.params.id);
  if (driver) {
    res.json(driver);
  } else {
    res.status(404).json({ error: "Driver not found" });
  }
});

app.patch("/api/drivers/:id", async (req, res) => {
  const driver = await getDocument("drivers", req.params.id);
  if (driver) {
    let updateData = { ...req.body };
    if (updateData.metrics) {
      updateData.metrics = {
        ...driver.metrics,
        ...updateData.metrics
      };
    }
    const mergedDriver = { ...driver, ...updateData };
    const processedDriver = await registerShipdayCarrierIfNeeded(mergedDriver);
    if (processedDriver.shipdayCarrierId) {
      updateData.shipdayCarrierId = processedDriver.shipdayCarrierId;
      if (processedDriver.shipdayPassword) {
        updateData.shipdayPassword = processedDriver.shipdayPassword;
      }
      if (processedDriver.shipdayMessage) {
        updateData.shipdayMessage = processedDriver.shipdayMessage;
      }
    }
    const updated = await updateDocument("drivers", req.params.id, { ...updateData, status: processedDriver.status });

    if (driver.status !== "approved" && processedDriver.status === "approved") {
      console.log(`[Resend] Driver approved. Sending welcome email to ${processedDriver.email}`);
      await sendDriverWelcomeEmail(
        processedDriver.email,
        processedDriver.fullName,
        processedDriver.shipdayCarrierId,
        processedDriver.shipdayPassword || ""
      );
    }

    res.json(updated);
  } else {
    res.status(404).json({ error: "Driver not found" });
  }
});

app.get("/api/orders", async (req, res) => {
  const localList = await getCollection("orders");
  const shipdayApiKey = process.env.SHIPDAY_API_KEY;
  
  if (!shipdayApiKey) {
    return res.json(localList);
  }

  try {
    console.log("[Shipday] Fetching active orders to merge...");
    const response = await axios.get("https://api.shipday.com/orders", {
      headers: {
        "Authorization": `Basic ${shipdayApiKey}`,
        "Accept": "application/json"
      }
    });

    const activeOrders = response.data || [];
    const mergedList = [...localList];

    activeOrders.forEach(so => {
      const matchIdx = mergedList.findIndex(lo => 
        String(lo.id).trim().toLowerCase() === String(so.orderNumber).trim().toLowerCase()
      );

      let mappedStatus = 'pending';
      const s = String(so.status || '').toUpperCase();
      if (s === 'ACCEPTED' || s === 'STARTED') {
        mappedStatus = so.assignedCarrier ? 'claimed' : 'pending';
      } else if (s === 'READY_TO_PICKUP' || s === 'READY_TO_PICK_UP') {
        mappedStatus = 'pending';
      } else if (s === 'PICKED_UP' || s === 'STARTED_DELIVERY' || s === 'DEPARTED') {
        mappedStatus = 'picked_up';
      } else if (s === 'DELIVERED') {
        mappedStatus = 'delivered';
      }

      const synthesizedOrder = {
        id: so.orderNumber || String(so.orderId),
        shipdayId: so.orderId,
        customerAddress: so.customer?.address || '',
        customerName: so.customer?.name || '',
        customerPhone: so.customer?.phoneNumber || '',
        vendorAddress: so.restaurant?.address || '',
        vendorName: so.restaurant?.name || 'Curbside Vendor',
        distance: so.distance || 1.5,
        grossPayout: Number((so.distance * 2.00 || 3.00).toFixed(2)),
        netPayout: Number((so.distance * 1.80 || 2.70).toFixed(2)),
        status: mappedStatus,
        driverId: so.assignedCarrier ? `shipday-carrier-${so.assignedCarrier.id}` : null,
        driverName: so.assignedCarrier?.name || null,
        trackingLink: so.trackingLink || null,
        createdAt: so.createdAt || new Date().toISOString()
      };

      if (matchIdx > -1) {
        mergedList[matchIdx] = {
          ...mergedList[matchIdx],
          ...synthesizedOrder,
          id: mergedList[matchIdx].id
        };
      } else {
        mergedList.push(synthesizedOrder);
      }
    });

    return res.json(mergedList);

  } catch (err) {
    console.error("[Shipday] Error listing orders, returning local list:", err.message);
    return res.json(localList);
  }
});

app.post("/api/orders", async (req, res) => {
  const { customerName, customerAddress, customerEmail, customerPhoneNumber, vendorName, vendorAddress, items, total } = req.body;

  if (!customerName || !customerAddress || !customerEmail || !customerPhoneNumber) {
    return res.status(400).json({ error: "Missing customer details (name, address, email, phone)" });
  }

  const orderId = `curbside-${Math.floor(1000 + Math.random() * 9000)}`;

  const distanceMiles = await getRouteDistance(vendorAddress || "Katz's Delicatessen, 205 E Houston St, New York, NY 10002", customerAddress);
  const grossDriverPay = Number((distanceMiles * 2.00).toFixed(2));
  const driverCommissionSplit = Number((grossDriverPay * 0.10).toFixed(2));
  const netDriverPayout = Number((grossDriverPay - driverCommissionSplit).toFixed(2));

  const totalPrice = Number(total || 35.00);
  const vendorCommissionSplit = Number((totalPrice * 0.10).toFixed(2));
  const platformRevenue = Number((driverCommissionSplit + vendorCommissionSplit).toFixed(2));

  const orderDoc = {
    id: orderId,
    customerAddress,
    customerName,
    customerEmail,
    customerPhone: customerPhoneNumber,
    vendorAddress: vendorAddress || "Katz's Delicatessen, 205 E Houston St, New York, NY 10002",
    vendorName: vendorName || "Katz's Delicatessen",
    distance: distanceMiles,
    grossPayout: grossDriverPay,
    netPayout: netDriverPayout,
    status: "pending",
    driverId: null,
    createdAt: new Date().toISOString()
  };
  await addDocument("orders", orderId, orderDoc);

  const financeDoc = {
    orderId,
    totalDistance: distanceMiles,
    grossDriverPay,
    driverCommissionSplit,
    vendorCommissionSplit,
    platformRevenue,
    timestamp: new Date().toISOString()
  };
  await addDocument("finance", `f-${orderId}`, financeDoc);

  // Dispatch to Shipday
  const shipdayApiKey = process.env.SHIPDAY_API_KEY;
  let shipdayOrderId = null;
  let shipdayStatus = null;
  let trackingLink = null;

  if (shipdayApiKey) {
    console.log(`[Shipday] Dispatching sandbox order ${orderId} to Shipday...`);
    try {
      const shipdayPayload = {
        orderNumber: orderId,
        customerName: customerName,
        customerAddress: customerAddress,
        customerEmail: customerEmail,
        customerPhoneNumber: customerPhoneNumber,
        restaurantName: "Curbsides: " + (vendorName || "Katz's Delicatessen"),
        restaurantAddress: vendorAddress || "Katz's Delicatessen, 205 E Houston St, New York, NY 10002",
        paymentMethod: "credit_card"
      };

      const response = await axios.post("https://api.shipday.com/orders", shipdayPayload, {
        headers: {
          "Authorization": `Basic ${shipdayApiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });
      if (response.data) {
        shipdayOrderId = response.data.orderId;
        shipdayStatus = response.data.status;
        trackingLink = response.data.trackingLink;
        
        if (trackingLink) {
          orderDoc.trackingLink = trackingLink;
          await updateDocument("orders", orderId, { trackingLink });
        }
      }
      console.log(`[Shipday] Order ${orderId} successfully dispatched in Shipday. ID: ${shipdayOrderId}`);
    } catch (err) {
      console.error("[Shipday] Integration error:", err.response?.data || err.message);
    }
  }

  // Send order receipt email notification
  await sendOrderReceiptEmail(
    customerEmail,
    customerName,
    orderId,
    vendorName || "Katz's Delicatessen",
    totalPrice,
    trackingLink
  );

  res.status(201).json({
    ...orderDoc,
    shipdayOrderId,
    shipdayStatus,
    trackingLink
  });
});

app.get("/api/orders/:id", async (req, res) => {
  const order = await getDocument("orders", req.params.id);
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ error: "Order not found" });
  }
});

app.patch("/api/orders/:id", async (req, res) => {
  const order = await getDocument("orders", req.params.id);
  if (order) {
    if (req.body.status === "claimed" && order.status !== "pending") {
      return res.status(409).json({ error: "This order has already been claimed by another driver." });
    }
    const updated = await updateDocument("orders", req.params.id, req.body);

    if (req.body.driverId) {
      const driver = await getDocument("drivers", req.body.driverId);
      if (driver && driver.shipdayCarrierId) {
        const shipdayApiKey = process.env.SHIPDAY_API_KEY;
        if (shipdayApiKey) {
          console.log(`[Shipday] Syncing carrier assignment: driver ${driver.shipdayCarrierId} to order ${req.params.id}`);
          try {
            const activeResponse = await axios.get("https://api.shipday.com/orders", {
              headers: {
                "Authorization": `Basic ${shipdayApiKey}`,
                "Accept": "application/json"
              }
            });
            const activeOrders = activeResponse.data || [];
            const matchedOrder = activeOrders.find(o => 
              String(o.orderNumber).trim().toLowerCase() === String(req.params.id).trim().toLowerCase() ||
              String(o.orderId).trim() === String(req.params.id).trim()
            );

            if (matchedOrder) {
              const shipdayOrderId = matchedOrder.orderId;
              const assignUrl = `https://api.shipday.com/orders/assign/${shipdayOrderId}/${driver.shipdayCarrierId}`;
              await axios.put(assignUrl, {}, {
                headers: {
                  "Authorization": `Basic ${shipdayApiKey}`,
                  "Content-Type": "application/json"
                }
              });
              console.log(`[Shipday] Successfully assigned driver ${driver.fullName} in Shipday.`);
            } else {
              console.warn(`[Shipday] Order ${req.params.id} not found in Shipday active list for assignment sync.`);
            }
          } catch (assignErr) {
            console.error("[Shipday] Driver assignment sync error:", assignErr.response?.data || assignErr.message);
          }
        }
      }
    }

    res.json(updated);
  } else {
    res.status(404).json({ error: "Order not found" });
  }
});

app.get("/api/finance", async (req, res) => {
  const list = await getCollection("finance");
  res.json(list);
});

app.get("/api/vendor-applications", async (req, res) => {
  const list = await getCollection("vendorApplications");
  res.json(list);
});

app.post("/api/vendor-applications", async (req, res) => {
  const appId = "v-app-" + Date.now();
  const application = {
    ...req.body,
    createdAt: new Date().toISOString(),
    status: "pending"
  };
  const saved = await addDocument("vendorApplications", appId, application);
  res.status(201).json(saved);
});

app.patch("/api/vendor-applications/:id", async (req, res) => {
  const app = await getDocument("vendorApplications", req.params.id);
  if (app) {
    const updated = await updateDocument("vendorApplications", req.params.id, req.body);
    res.json(updated);
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

    const existing = await getDocument("orders", orderId);
    if (existing && existing.createdAt) {
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
    await addDocument("orders", orderId, orderDoc);

    const financeDoc = {
      orderId,
      totalDistance: distanceMiles,
      grossDriverPay,
      driverCommissionSplit,
      vendorCommissionSplit,
      platformRevenue,
      timestamp: new Date().toISOString()
    };
    await addDocument("finance", `f-${orderId}`, financeDoc);

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

// ----------------- Auth & Registration with Resend Email Verification -----------------

const RESEND_API_KEY = "re_8UgEkyba_329LdTnp8qbAX16CnyKZfVwb";

async function sendEmail({ to, subject, html }) {
  try {
    const fromEmail = process.env.FROM_EMAIL || "Curbsides Auth <onboarding@curbsides.xyz>";
    let recipient = to.trim();
    let isRedirected = false;

    // If using the default Resend sandbox sender domain, force the recipient to the verified account owner email.
    if (fromEmail.includes("resend.dev") && to.toLowerCase().trim() !== "darrin88@icloud.com") {
      console.log(`[Resend] Re-routing email for ${to} to verified sandbox owner darrin88@icloud.com`);
      recipient = "darrin88@icloud.com";
      isRedirected = true;
    }

    const finalSubject = isRedirected ? `[Sandbox Redirect] ${subject} (original: ${to})` : subject;
    const finalHtml = isRedirected ? `
      <div style="background-color: #2c1a04; border: 1px solid #d97706; color: #f59e0b; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-size: 12px; font-family: sans-serif;">
        <strong>Sandbox Notice:</strong> This email was redirected from <strong>${to}</strong> because the sender domain is unverified.
      </div>
      ${html}
    ` : html;

    const response = await axios.post(
      "https://api.resend.com/emails",
      {
        from: fromEmail,
        to: recipient,
        subject: finalSubject,
        html: finalHtml
      },
      {
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    console.log(`[Resend] Email successfully sent to ${recipient} (original: ${to}). ID: ${response.data.id}`);
    return true;
  } catch (err) {
    console.error("[Resend] Error sending email:", err.response?.data || err.message);
    return false;
  }
}

async function sendVerificationEmail(email, name, code) {
  const html = `
    <div style="background-color: #000; color: #fff; padding: 30px; font-family: sans-serif; border: 2px solid #fff; border-radius: 12px; max-width: 500px; margin: 0 auto;">
      <h1 style="font-size: 24px; text-transform: uppercase; border-bottom: 2px solid #fff; padding-bottom: 15px; margin-top: 0;">CURBSIDES Verification Code</h1>
      <p style="font-size: 14px; color: #a0aec0;">Hello ${name},</p>
      <p style="font-size: 14px; color: #a0aec0;">Thank you for registering on the CURBSIDES transit platform. Please verify your email using the 6-digit access code below:</p>
      <div style="background-color: #1a1a1a; border: 1px solid #333; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0;">
        <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #fff;">${code}</span>
      </div>
      <p style="font-size: 11px; color: #718096; border-top: 1px solid #222; padding-top: 15px; margin-bottom: 0;">This is a system-generated transit notification. Secured via Resend Mailer API.</p>
    </div>
  `;
  return sendEmail({ to: email, subject: "Verify Your CURBSIDES Account", html });
}

async function sendDriverWelcomeEmail(email, name, carrierId, password) {
  const html = `
    <div style="background-color: #000; color: #fff; padding: 30px; font-family: sans-serif; border: 2px solid #fff; border-radius: 12px; max-width: 500px; margin: 0 auto;">
      <h1 style="font-size: 24px; text-transform: uppercase; border-bottom: 2px solid #fff; padding-bottom: 15px; margin-top: 0;">CURBSIDES Courier Dispatch</h1>
      <p style="font-size: 14px; color: #a0aec0;">Hello ${name},</p>
      <p style="font-size: 14px; color: #a0aec0;">Welcome to the fleet! Your courier account is approved and synced with our Shipday dispatch system.</p>
      <div style="background-color: #1a1a1a; border: 1px solid #333; padding: 20px; border-radius: 8px; margin: 25px 0; font-size: 14px;">
        <p style="margin: 5px 0; color: #a0aec0;"><strong>Carrier ID:</strong> <span style="color: #fff; font-family: monospace;">${carrierId}</span></p>
        <p style="margin: 5px 0; color: #a0aec0;"><strong>Temporary Password:</strong> <span style="color: #fff; font-family: monospace;">${password || "Refer to Shipday Invite"}</span></p>
      </div>
      <p style="font-size: 13px; color: #a0aec0;">Please download the Shipday Drive app from the Apple App Store or Google Play Store and log in with your credentials to begin receiving dispatches.</p>
      <p style="font-size: 11px; color: #718096; border-top: 1px solid #222; padding-top: 15px; margin-bottom: 0;">This is an automated fleet onboarding transmission.</p>
    </div>
  `;
  return sendEmail({ to: email, subject: "CURBSIDES Courier Fleet Approval", html });
}

async function sendOrderReceiptEmail(email, name, orderId, vendorName, total, trackingLink) {
  const html = `
    <div style="background-color: #000; color: #fff; padding: 30px; font-family: sans-serif; border: 2px solid #fff; border-radius: 12px; max-width: 500px; margin: 0 auto;">
      <h1 style="font-size: 24px; text-transform: uppercase; border-bottom: 2px solid #fff; padding-bottom: 15px; margin-top: 0;">CURBSIDES Receipt</h1>
      <p style="font-size: 14px; color: #a0aec0;">Hello ${name},</p>
      <p style="font-size: 14px; color: #a0aec0;">Your order <strong>${orderId}</strong> has been successfully placed at <strong>${vendorName}</strong>.</p>
      <div style="background-color: #1a1a1a; border: 1px solid #333; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0;">
        <span style="font-size: 14px; color: #a0aec0;">Total Paid</span><br/>
        <span style="font-size: 28px; font-weight: bold; color: #fff;">$${total.toFixed(2)}</span>
      </div>
      ${trackingLink ? `
      <div style="text-align: center; margin: 25px 0;">
        <a href="${trackingLink}" style="background-color: #fff; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; text-transform: uppercase; display: inline-block;">Track Delivery Live</a>
      </div>
      ` : ""}
      <p style="font-size: 11px; color: #718096; border-top: 1px solid #222; padding-top: 15px; margin-bottom: 0;">Secured transaction via Sandbox Checkout &amp; Shipday Dispatch.</p>
    </div>
  `;
  return sendEmail({ to: email, subject: `CURBSIDES Order Receipt (${orderId})`, html });
}

app.post("/api/auth/register", async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: "Missing required fields (email, password, name, role)" });
  }

  // Check if user already exists
  const existingUsers = await getCollection("users");
  const foundUser = existingUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (foundUser) {
    return res.status(409).json({ error: "An account with this email address already exists." });
  }

  const userId = "user-" + Date.now();
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit code

  const newUser = {
    email: email.trim(),
    password: password, // Simulated password
    name: name.trim(),
    role: role,
    isVerified: false,
    verificationCode: code,
    createdAt: new Date().toISOString()
  };

  // If role is vendor, auto-link to a simulated vendor ID
  if (role === "vendor") {
    newUser.associatedId = "vendor-" + Date.now();
    // Auto-create vendor application as approved
    const vendorAppId = "v-app-" + Date.now();
    await addDocument("vendorApplications", vendorAppId, {
      id: vendorAppId,
      name: name,
      email: email,
      phone: "555-0155",
      foodType: "Street Food",
      borough: "Manhattan",
      status: "approved"
    });
  }

  // If role is driver, auto-link to a driver ID
  if (role === "driver") {
    const driverId = "driver-" + Date.now();
    newUser.associatedId = driverId;
    let driverDoc = {
      id: driverId,
      fullName: name,
      email: email,
      phone: "555-0166",
      vehicle: "bike",
      boroughs: ["Manhattan"],
      status: "approved"
    };
    driverDoc = await registerShipdayCarrierIfNeeded(driverDoc);
    await addDocument("drivers", driverId, driverDoc);
  }

  await addDocument("users", userId, newUser);

  // Send the verification code via Resend email
  await sendVerificationEmail(email, name, code);

  res.status(201).json({
    message: "Registration successful. Verification email sent.",
    email: email,
    isVerified: false
  });
});

app.post("/api/auth/verify", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "Missing required fields (email, code)" });
  }

  const usersList = await getCollection("users");
  const userDoc = usersList.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!userDoc) {
    return res.status(404).json({ error: "User not found." });
  }

  if (userDoc.verificationCode !== code.trim()) {
    return res.status(400).json({ error: "Invalid verification code." });
  }

  // Mark verified
  const updatedUser = {
    ...userDoc,
    isVerified: true
  };
  await updateDocument("users", userDoc.id, updatedUser);

  if (userDoc.role === "driver" && userDoc.associatedId) {
    const driverDoc = await getDocument("drivers", userDoc.associatedId);
    if (driverDoc && driverDoc.shipdayCarrierId) {
      console.log(`[Resend] Verified driver logged in. Sending welcome email to ${driverDoc.email}`);
      await sendDriverWelcomeEmail(
        driverDoc.email,
        driverDoc.fullName,
        driverDoc.shipdayCarrierId,
        driverDoc.shipdayPassword || ""
      );
    }
  }

  res.json({
    success: true,
    message: "Email verified successfully.",
    user: {
      id: userDoc.id,
      email: userDoc.email,
      name: userDoc.name,
      role: userDoc.role,
      associatedId: userDoc.associatedId,
      isVerified: true
    }
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing required fields (email, password)" });
  }

  const usersList = await getCollection("users");
  const userDoc = usersList.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!userDoc || userDoc.password !== password) {
    return res.status(401).json({ error: "Invalid email address or password." });
  }

  if (!userDoc.isVerified) {
    // Generate new code and resend verification email
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const updatedUser = {
      ...userDoc,
      verificationCode: code
    };
    await updateDocument("users", userDoc.id, updatedUser);
    await sendVerificationEmail(userDoc.email, userDoc.name, code);

    return res.status(403).json({
      error: "unverified",
      message: "Email address is not verified. A new code has been sent.",
      email: userDoc.email
    });
  }

  res.json({
    success: true,
    user: {
      id: userDoc.id,
      email: userDoc.email,
      name: userDoc.name,
      role: userDoc.role,
      associatedId: userDoc.associatedId,
      isVerified: true
    }
  });
});

// GET /api/orders/shipday/:orderNumber Proxy endpoint
app.get("/api/orders/shipday/:orderNumber", async (req, res) => {
  const { orderNumber } = req.params;
  const shipdayApiKey = process.env.SHIPDAY_API_KEY;

  if (shipdayApiKey) {
    try {
      console.log(`[Shipday] Looking up order ${orderNumber} in Shipday active orders...`);
      const response = await axios.get("https://api.shipday.com/orders", {
        headers: {
          "Authorization": `Basic ${shipdayApiKey}`,
          "Accept": "application/json"
        }
      });

      const activeOrders = response.data || [];
      const matchedOrder = activeOrders.find(o => 
        String(o.orderNumber).trim().toLowerCase() === orderNumber.trim().toLowerCase() ||
        String(o.orderId).trim() === orderNumber.trim()
      );

      if (matchedOrder) {
        console.log(`[Shipday] Order ${orderNumber} found in Shipday active list.`);
        let status = 'Processing Order';
        const s = String(matchedOrder.status || '').toUpperCase();
        if (s === 'ACCEPTED' || s === 'STARTED') {
          status = matchedOrder.assignedCarrier ? 'Driver Assigned' : 'Processing Order';
        } else if (s === 'READY_TO_PICKUP' || s === 'READY_TO_PICK_UP') {
          status = 'Vendor Preparing Food';
        } else if (s === 'PICKED_UP' || s === 'STARTED_DELIVERY' || s === 'DEPARTED') {
          status = 'On the Way';
        } else if (s === 'DELIVERED') {
          status = 'Delivered';
        } else {
          status = matchedOrder.status || 'Processing Order';
        }

        return res.json({
          id: matchedOrder.orderNumber || String(matchedOrder.orderId),
          shipdayId: matchedOrder.orderId,
          status: status,
          rawStatus: matchedOrder.status,
          vendor: matchedOrder.restaurant?.name || 'Curbside Vendor',
          vendorAddress: matchedOrder.restaurant?.address || '',
          customerAddress: matchedOrder.customer?.address || '',
          eta: matchedOrder.eta || '15-30',
          driverName: matchedOrder.assignedCarrier?.name || 'Assigning Courier...',
          driverPhone: matchedOrder.assignedCarrier?.phoneNumber || '',
          trackingLink: matchedOrder.trackingLink || null,
          source: 'shipday'
        });
      }
    } catch (err) {
      console.error("[Shipday] Error fetching active orders from Shipday:", err.response?.data || err.message);
    }
  }

  // Fallback to local DB search
  console.log(`[Shipday] Order ${orderNumber} not found in Shipday active list. Checking local database...`);
  const localOrder = await getDocument("orders", orderNumber);
  if (localOrder) {
    res.json({
      id: localOrder.id,
      status: localOrder.status === 'pending' ? 'Processing Order' : 
              localOrder.status === 'claimed' ? 'Driver Assigned' : 
              localOrder.status === 'picked_up' ? 'On the Way' : 
              localOrder.status === 'delivered' ? 'Delivered' : localOrder.status,
      vendor: 'Curbside Vendor',
      vendorAddress: localOrder.vendorAddress || '',
      customerAddress: localOrder.customerAddress || '',
      eta: '30',
      driverName: localOrder.driverId ? 'Courier Assigned' : 'Assigning Courier...',
      driverPhone: '',
      trackingLink: null,
      source: 'local'
    });
  } else {
    // Try case-insensitive matching in local list
    const allLocalOrders = await getCollection("orders");
    const matchedLocal = allLocalOrders.find(o => 
      String(o.id).trim().toLowerCase() === orderNumber.trim().toLowerCase()
    );
    if (matchedLocal) {
      res.json({
        id: matchedLocal.id,
        status: matchedLocal.status === 'pending' ? 'Processing Order' : 
                matchedLocal.status === 'claimed' ? 'Driver Assigned' : 
                matchedLocal.status === 'picked_up' ? 'On the Way' : 
                matchedLocal.status === 'delivered' ? 'Delivered' : matchedLocal.status,
        vendor: 'Curbside Vendor',
        vendorAddress: matchedLocal.vendorAddress || '',
        customerAddress: matchedLocal.customerAddress || '',
        eta: '30',
        driverName: matchedLocal.driverId ? 'Courier Assigned' : 'Assigning Courier...',
        driverPhone: '',
        trackingLink: null,
        source: 'local'
      });
    } else {
      res.status(404).json({ error: "Order not found. Please verify the ID and try again." });
    }
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
