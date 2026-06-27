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
  "vendor-applications": [
    { id: 'v-app-1', name: 'Halal Cart Kings', email: 'kings@halalcart.com', phone: '555-9000', foodType: 'Gyros & Rice', borough: 'Manhattan', status: 'pending' }
  ]
};

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

if (!getApps().length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
      : null;

    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId: 'curbside-35431'
      });
      console.log("[Firebase Admin] Initialized securely with service account.");
    } else {
      initializeApp({ projectId: 'curbside-35431' });
      console.log("[Firebase Admin] Initialized with default credentials.");
    }
  } catch (err) {
    console.error("[Firebase Admin] Failed to initialize:", err);
  }
}

const firestore = getFirestore();

// REST Database operations mapped to Admin SDK
async function getCollection(collectionName) {
  try {
    const snapshot = await firestore.collection(collectionName).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error(`[Database] Error getting collection ${collectionName}:`, err.message);
    return db[collectionName] || [];
  }
}

async function getDocument(collectionName, docId) {
  try {
    const doc = await firestore.collection(collectionName).doc(docId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  } catch (err) {
    console.error(`[Database] Error getting document ${collectionName}/${docId}:`, err.message);
    return db[collectionName]?.find(item => item.id === docId) || null;
  }
}

async function addDocument(collectionName, docId, data) {
  try {
    await firestore.collection(collectionName).doc(docId).set(data);
    // Update local memory fallback
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
    await firestore.collection(collectionName).doc(docId).update(data);
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

async function deleteDocument(collectionName, docId) {
  try {
    await firestore.collection(collectionName).doc(docId).delete();
    if (db[collectionName]) {
      db[collectionName] = db[collectionName].filter(item => item.id !== docId);
    }
    return true;
  } catch (err) {
    console.error(`[Database] Error deleting document ${collectionName}/${docId}:`, err.message);
    if (db[collectionName]) {
      db[collectionName] = db[collectionName].filter(item => item.id !== docId);
      return true;
    }
    return false;
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
  if (!address) return { lat: 40.7128, lon: -74.0060 };
  const lower = address.toLowerCase();

  // Extract coordinates directly if in form "Live Location (40.7150, -73.9843)" or "40.7150, -73.9843"
  const coordsRegex = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/;
  const match = address.match(coordsRegex);
  if (match) {
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lon)) {
      return { lat, lon };
    }
  }

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
      const response = await axios.get(url, { timeout: 3000 });
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
  try {
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
      await updateDocument("drivers", req.params.id, { ...updateData, status: processedDriver.status });

      if (driver.status !== "approved" && processedDriver.status === "approved") {
        console.log(`[Resend] Driver approved. Sending welcome email to ${processedDriver.email}`);
        await sendDriverWelcomeEmail(
          processedDriver.email,
          processedDriver.fullName,
          processedDriver.shipdayCarrierId,
          processedDriver.shipdayPassword || ""
        ).catch(e => console.warn("Failed to send welcome email:", e.message));
      }

      const updatedDriver = await getDocument("drivers", req.params.id);
      res.json(updatedDriver || { ...driver, ...updateData, status: processedDriver.status });
    } else {
      res.status(404).json({ error: "Driver not found" });
    }
  } catch (error) {
    console.error("Error updating driver:", error);
    res.status(500).json({ error: error.message || "Internal server error during driver update" });
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
  const { customerName, customerAddress, customerEmail, customerPhoneNumber, vendorName, vendorAddress, vendorCoordinates, items, total } = req.body;

  if (!customerName || !customerAddress || !customerEmail || !customerPhoneNumber) {
    return res.status(400).json({ error: "Missing customer details (name, address, email, phone)" });
  }

  try {
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
    total: totalPrice,
    items: items || [],
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
      // Resolve vendor details from Firestore to sync coordinates
      const usersList = await getCollection("users");
      const matchedVendor = usersList.find(u => 
        u.role === 'vendor' && 
        ((vendorName && (
          (u.name && u.name.toLowerCase() === vendorName.toLowerCase()) ||
          (u.displayName && u.displayName.toLowerCase() === vendorName.toLowerCase())
         )) ||
         (vendorAddress && u.location && vendorAddress.toLowerCase().includes(u.location.toLowerCase())))
      );
      
      let finalVendorName = "Curbsides: " + (vendorName || "Katz's Delicatessen");
      let finalVendorAddress = vendorAddress || "Katz's Delicatessen, 205 E Houston St, New York, NY 10002";
      let pickupLat = null;
      let pickupLng = null;
      
      if (vendorCoordinates && Array.isArray(vendorCoordinates) && vendorCoordinates.length === 2 && vendorCoordinates[0] != null && vendorCoordinates[1] != null) {
        pickupLat = Number(vendorCoordinates[0]);
        pickupLng = Number(vendorCoordinates[1]);
        if (matchedVendor) {
          finalVendorName = "Curbsides: " + (matchedVendor.displayName || matchedVendor.name);
          if (matchedVendor.location) finalVendorAddress = matchedVendor.location;
        }
      } else if (matchedVendor) {
        finalVendorName = "Curbsides: " + (matchedVendor.displayName || matchedVendor.name);
        if (matchedVendor.location) finalVendorAddress = matchedVendor.location;
        if (matchedVendor.coordinates && matchedVendor.coordinates.length === 2) {
          pickupLat = matchedVendor.coordinates[0];
          pickupLng = matchedVendor.coordinates[1];
        }
      }

      let deliveryLat = null;
      let deliveryLng = null;
      if (customerAddress) {
        const coordMatch = customerAddress.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
        if (coordMatch) {
          deliveryLat = parseFloat(coordMatch[1]);
          deliveryLng = parseFloat(coordMatch[2]);
        }
      }

      const shipdayPayload = {
        orderNumber: orderId,
        customerName: customerName,
        customerAddress: customerAddress,
        customerEmail: customerEmail,
        customerPhoneNumber: customerPhoneNumber,
        restaurantName: finalVendorName,
        restaurantAddress: finalVendorAddress,
        paymentMethod: "credit_card"
      };

      if (pickupLat !== null && pickupLng !== null) {
        shipdayPayload.pickupLatitude = pickupLat;
        shipdayPayload.pickupLongitude = pickupLng;
      }
      if (deliveryLat !== null && deliveryLng !== null) {
        shipdayPayload.deliveryLatitude = deliveryLat;
        shipdayPayload.deliveryLongitude = deliveryLng;
      }

      const response = await axios.post("https://api.shipday.com/orders", shipdayPayload, {
        headers: {
          "Authorization": `Basic ${shipdayApiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        timeout: 3000
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
  try {
    await sendOrderReceiptEmail(
      customerEmail,
      customerName,
      orderId,
      vendorName || "Katz's Delicatessen",
      totalPrice,
      trackingLink
    );
  } catch (emailErr) {
    console.error("Failed to send receipt email:", emailErr);
  }

  res.status(201).json({
    ...orderDoc,
    shipdayOrderId,
    shipdayStatus,
    trackingLink
  });
  
  } catch (err) {
    console.error("Order creation route crashed:", err);
    res.status(500).json({ error: "Failed to place order: " + err.message });
  }
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

app.post("/api/orders/:id/shipday-autodispatch", async (req, res) => {
  const orderId = req.params.id;
  try {
    const order = await getDocument("orders", orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Calculate vendor coordinates from Users collection
    const users = await getCollection("users");
    const vendor = users.find(u => 
      u.role === 'vendor' && 
      (order.vendorAddress.toLowerCase().includes(u.name.toLowerCase()) || 
       (u.email && order.vendorEmail && u.email.toLowerCase() === order.vendorEmail.toLowerCase()))
    );

    let vLat = 40.7580;
    let vLng = -73.9855;
    if (vendor && vendor.coordinates && vendor.coordinates.length === 2) {
      vLat = vendor.coordinates[0];
      vLng = vendor.coordinates[1];
    }

    // Find online drivers
    const drivers = users.filter(u => u.role === 'driver' && (u.status === 'online' || u.online === true));
    if (drivers.length === 0) {
      return res.status(400).json({ error: "No drivers are currently online. Please check driver app status." });
    }

    // Helper Haversine distance calculator
    const calculateHaversine = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    // Calculate nearest driver
    let nearestDriver = null;
    let minDistance = Infinity;

    drivers.forEach(d => {
      if (d.coordinates && d.coordinates.length === 2) {
        const dist = calculateHaversine(vLat, vLng, d.coordinates[0], d.coordinates[1]);
        if (dist < minDistance) {
          minDistance = dist;
          nearestDriver = d;
        }
      }
    });

    if (!nearestDriver) {
      // Use first online driver as fallback if coordinates are missing
      nearestDriver = drivers[0];
      minDistance = 5.0;
    }

    const driverName = nearestDriver.name || nearestDriver.fullName || "Sarah Chen";
    const driverPhone = nearestDriver.phone || "555-0199";

    // Update order in Firestore
    const updateData = {
      driverId: nearestDriver.id,
      driverName,
      driverPhone,
      status: "Driver Assigned",
      dispatchedAt: new Date().toISOString()
    };
    const updatedOrder = await updateDocument("orders", orderId, updateData);

    // Call Shipday API to assign carrier
    const shipdayApiKey = process.env.SHIPDAY_API_KEY;
    if (shipdayApiKey && nearestDriver.shipdayCarrierId) {
      console.log(`[Autodispatch] Syncing carrier ${nearestDriver.shipdayCarrierId} for order ${orderId} in Shipday...`);
      try {
        const activeResponse = await axios.get("https://api.shipday.com/orders", {
          headers: {
            "Authorization": `Basic ${shipdayApiKey}`,
            "Accept": "application/json"
          }
        });
        const activeOrders = activeResponse.data || [];
        const matchedOrder = activeOrders.find(o => 
          String(o.orderNumber).trim().toLowerCase() === String(orderId).trim().toLowerCase() ||
          String(o.orderId).trim() === String(orderId).trim()
        );

        if (matchedOrder) {
          const shipdayOrderId = matchedOrder.orderId;
          const assignUrl = `https://api.shipday.com/orders/assign/${shipdayOrderId}/${nearestDriver.shipdayCarrierId}`;
          await axios.put(assignUrl, {}, {
            headers: {
              "Authorization": `Basic ${shipdayApiKey}`,
              "Content-Type": "application/json"
            }
          });
          console.log(`[Autodispatch] Assigned in Shipday: ${driverName}`);
        } else {
          console.warn(`[Autodispatch] Order ${orderId} not found in Shipday active list.`);
        }
      } catch (shipdayErr) {
        console.error("[Autodispatch] Shipday assign call failed:", shipdayErr.response?.data || shipdayErr.message);
      }
    }

    res.json({
      success: true,
      message: `Successfully auto-dispatched to nearest driver: ${driverName}`,
      driver: {
        id: nearestDriver.id,
        name: driverName,
        phone: driverPhone,
        shipdayCarrierId: nearestDriver.shipdayCarrierId
      },
      distanceKm: minDistance,
      order: updatedOrder
    });
  } catch (err) {
    console.error("[Autodispatch] Internal server error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/finance", async (req, res) => {
  const list = await getCollection("finance");
  res.json(list);
});

app.get("/api/vendor-applications", async (req, res) => {
  const list = await getCollection("vendor-applications");
  res.json(list);
});

app.post("/api/vendor-applications", async (req, res) => {
  const appId = "v-app-" + Date.now();
  const application = {
    ...req.body,
    createdAt: new Date().toISOString(),
    status: "pending"
  };
  const saved = await addDocument("vendor-applications", appId, application);
  res.status(201).json(saved);
});

app.patch("/api/vendor-applications/:id", async (req, res) => {
  const app = await getDocument("vendor-applications", req.params.id);
  if (app) {
    const updated = await updateDocument("vendor-applications", req.params.id, req.body);
    
    if (app.status !== "approved" && req.body.status === "approved") {
      console.log(`[Resend] Vendor application approved. Sending welcome email to ${app.email}`);
      await sendVendorWelcomeEmail(app.email, app.name);
    }
    
    res.json(updated);
  } else {
    res.status(404).json({ error: "Application not found" });
  }
});

app.post("/api/admin/approve-vendor", async (req, res) => {
  try {
    const { appId } = req.body || {};
    if (!appId) {
      return res.status(400).json({ error: "Missing appId" });
    }

    const appDoc = await getDocument("vendor-applications", appId);
    if (!appDoc) {
      return res.status(404).json({ error: "Vendor application not found" });
    }

    const approvedAt = new Date().toISOString();
    await updateDocument("vendor-applications", appId, { status: "approved", approvedAt });

    const users = await getCollection("users");
    const vendorEmail = String(appDoc.email || "").trim().toLowerCase();
    const vendorPhone = String(appDoc.phone || "").trim().replace(/[^0-9]/g, '');
    const existingVendor = users.find((u) => {
      const uEmail = String(u.email || "").toLowerCase();
      const uPhone = String(u.phone || u.phoneNumber || "").replace(/[^0-9]/g, '');
      return (vendorEmail && uEmail === vendorEmail) || 
             (vendorPhone && vendorPhone.length >= 10 && uPhone.includes(vendorPhone));
    });
    const vendorId = existingVendor?.id || `vendor-approved-${Date.now()}`;

    let coordinates = null;
    if (Array.isArray(appDoc.coordinates) && appDoc.coordinates.length === 2) {
      coordinates = [Number(appDoc.coordinates[0]), Number(appDoc.coordinates[1])];
    } else if (
      appDoc.latitude !== undefined &&
      appDoc.longitude !== undefined &&
      !Number.isNaN(Number(appDoc.latitude)) &&
      !Number.isNaN(Number(appDoc.longitude))
    ) {
      coordinates = [Number(appDoc.latitude), Number(appDoc.longitude)];
    } else {
      const guessed = getCoordsFromAddress(appDoc.location || appDoc.borough || "New York, NY");
      coordinates = [guessed.lat, guessed.lon];
    }

    const vendorRecord = {
      ...(existingVendor || {}),
      name: appDoc.name || existingVendor?.name || "Vendor",
      email: vendorEmail || existingVendor?.email || "",
      phone: appDoc.phone || existingVendor?.phone || "",
      borough: appDoc.borough || existingVendor?.borough || "Manhattan",
      location: appDoc.location || existingVendor?.location || "",
      coordinates,
      foodType: appDoc.foodType || existingVendor?.foodType || "",
      role: "vendor",
      isOpen: existingVendor?.isOpen ?? false,
      rating: existingVendor?.rating || 5.0,
      tags: Array.from(new Set([
        ...(Array.isArray(existingVendor?.tags) ? existingVendor.tags : []),
        "Approved",
        "Street Food",
        appDoc.foodType
      ].filter(Boolean))),
      items: Array.isArray(existingVendor?.items) ? existingVendor.items : [],
      createdAt: existingVendor?.createdAt || approvedAt,
      approvedAt,
      applicationId: appId,
      accountAlert: {
        type: "approval",
        message: "Your vendor profile is approved. You can now access Vendor Portal.",
        createdAt: approvedAt
      }
    };

    await addDocument("users", vendorId, vendorRecord);

    if (vendorRecord.email) {
      await sendVendorWelcomeEmail(vendorRecord.email, vendorRecord.name);
    }

    res.json({
      success: true,
      vendor: { id: vendorId, ...vendorRecord },
      application: { ...appDoc, status: "approved", approvedAt }
    });
  } catch (err) {
    console.error("[Vendor Approval] Failed:", err.message);
    res.status(500).json({ error: err.message || "Failed to approve vendor" });
  }
});

app.patch("/api/vendors/:id/location", async (req, res) => {
  try {
    const vendor = await getDocument("users", req.params.id);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const inputLocation = String(req.body?.location || "").trim();
    const inputCoordinates = req.body?.coordinates;
    let coordinates = null;
    if (
      Array.isArray(inputCoordinates) &&
      inputCoordinates.length === 2 &&
      !Number.isNaN(Number(inputCoordinates[0])) &&
      !Number.isNaN(Number(inputCoordinates[1]))
    ) {
      coordinates = [Number(inputCoordinates[0]), Number(inputCoordinates[1])];
    } else {
      const guessed = getCoordsFromAddress(inputLocation || vendor.location || vendor.borough || "New York, NY");
      coordinates = [guessed.lat, guessed.lon];
    }

    await updateDocument("users", req.params.id, {
      location: inputLocation || vendor.location || "",
      coordinates
    });
    const updatedVendor = await getDocument("users", req.params.id);
    res.json(updatedVendor || { ...vendor, location: inputLocation, coordinates });
  } catch (err) {
    console.error("[Vendor Location] Failed:", err.message);
    res.status(500).json({ error: err.message || "Failed to update vendor location" });
  }
});

// DELETE vendor endpoint
app.delete("/api/vendors/:id", async (req, res) => {
  try {
    const vendor = await getDocument("users", req.params.id);
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });
    await firestore.collection("users").doc(req.params.id).delete();
    
    try {
      await getAuth().deleteUser(req.params.id);
    } catch (authErr) {
      console.warn(`[Auth Delete] Vendor ${req.params.id} not found in Firebase Auth:`, authErr.message);
    }
    
    res.json({ success: true, message: `Vendor ${vendor.name} deleted` });
  } catch (err) {
    console.error("Delete vendor error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE driver endpoint
app.delete("/api/drivers/:id", async (req, res) => {
  try {
    const driver = await getDocument("drivers", req.params.id);
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    await firestore.collection("drivers").doc(req.params.id).delete();
    
    try {
      await getAuth().deleteUser(req.params.id);
    } catch (authErr) {
      console.warn(`[Auth Delete] Driver ${req.params.id} not found in Firebase Auth:`, authErr.message);
    }
    
    // Also delete from users collection if they exist there
    try {
      await firestore.collection("users").doc(req.params.id).delete();
    } catch (err) {}
    
    res.json({ success: true, message: `Driver ${driver.fullName} deleted` });
  } catch (err) {
    console.error("Delete driver error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE user endpoint
app.delete("/api/users/:id", async (req, res) => {
  try {
    const user = await getDocument("users", req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    // Delete from Firestore
    await firestore.collection("users").doc(req.params.id).delete();
    
    // Attempt to delete from Firebase Auth
    try {
      await getAuth().deleteUser(req.params.id);
    } catch (authErr) {
      console.warn(`[Auth Delete] User ${req.params.id} not found in Firebase Auth or could not be deleted:`, authErr.message);
    }
    
    res.json({ success: true, message: `User ${user.name || user.email} deleted` });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE vendor application endpoint
app.delete("/api/vendor-applications/:id", async (req, res) => {
  try {
    const appId = req.params.id;
    // Fetch the application to get email
    const application = await getDocument("vendor-applications", appId);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }
    // Delete the application document
    await deleteDocument("vendor-applications", appId);

    // If the application has an email, attempt to delete associated user data
    if (application.email) {
      const email = application.email.toLowerCase().trim();
      
      // 1. Delete Firestore user document(s) matching email
      try {
        const userSnap = await firestore.collection("users").where("email", "==", email).get();
        const deleteOps = [];
        userSnap.forEach(doc => {
          deleteOps.push(deleteDocument("users", doc.id));
        });
        await Promise.all(deleteOps);
      } catch (dbErr) {
        console.error(`Failed to delete Firestore users for email ${email}:`, dbErr.message);
      }

      // 2. Delete Firebase Auth user if exists
      try {
        const authUser = await getAuth().getUserByEmail(email);
        await getAuth().deleteUser(authUser.uid);
        console.log(`Successfully deleted Auth user for email ${email}`);
      } catch (authErr) {
        console.warn(`Auth user not found or could not be deleted for ${email}:`, authErr.message);
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete application:", err);
    res.status(500).json({ error: "Failed to delete application" });
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

    // Save to Firestore config
    try {
      console.log(`[Shopify OAuth] Saving tokens to Firestore config...`);
      await addDocument("config", "shopify", {
        shop,
        admin_token: accessToken,
        storefront_token: storefrontToken,
        updatedAt: new Date().toISOString()
      });
      console.log(`[Shopify OAuth] Saved successfully.`);
    } catch (saveErr) {
      console.error("[Shopify OAuth] Failed to save credentials to Firestore:", saveErr.message);
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

  let finalShop = shop;
  let finalToken = admin_token;

  if (!finalShop || !finalToken) {
    try {
      const shopifyConfig = await getDocument("config", "shopify");
      if (shopifyConfig) {
        finalShop = finalShop || shopifyConfig.shop;
        finalToken = finalToken || shopifyConfig.admin_token;
        console.log(`[Shopify API] Resolved shopify credentials from Firestore config: ${finalShop}`);
      }
    } catch (dbErr) {
      console.warn("[Shopify API] Failed to load shopify config from Firestore:", dbErr.message);
    }
  }

  if (!finalShop || !finalToken || !title || !vendorName) {
    return res.status(400).json({ error: "Missing required parameters: shop, admin_token, title, and vendorName are required." });
  }

  const sanitizedShop = finalShop.replace(/^https?:\/\//, "").trim();

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
          "X-Shopify-Access-Token": finalToken,
          "Content-Type": "application/json"
        }
      }
    );

    console.log(`[Shopify API] Product created successfully. ID: ${response.data.product.id}`);
    
    let collectionData = null;
    try {
      console.log(`[Shopify API] Checking/Creating Custom Collection for vendor "${vendorName}"...`);
      
      // 1. Check if a Custom Collection already exists for this vendor
      const searchRes = await axios.get(
        `https://${sanitizedShop}/admin/api/2024-01/custom_collections.json?title=${encodeURIComponent(vendorName)}`,
        { headers: { "X-Shopify-Access-Token": finalToken } }
      );
      
      let collectionId = null;
      if (searchRes.data.custom_collections && searchRes.data.custom_collections.length > 0) {
        collectionId = searchRes.data.custom_collections[0].id;
        collectionData = searchRes.data.custom_collections[0];
        console.log(`[Shopify API] Found existing Custom Collection ID: ${collectionId}`);
      } else {
        // 2. If not, create a new Custom Collection
        const collectionPayload = {
          custom_collection: { title: vendorName }
        };
        const createRes = await axios.post(
          `https://${sanitizedShop}/admin/api/2024-01/custom_collections.json`,
          collectionPayload,
          {
            headers: {
              "X-Shopify-Access-Token": finalToken,
              "Content-Type": "application/json"
            }
          }
        );
        collectionId = createRes.data.custom_collection.id;
        collectionData = createRes.data.custom_collection;
        console.log(`[Shopify API] Custom Collection created successfully. ID: ${collectionId}`);
      }

      // 3. Explicitly link the product to the collection using a Collect
      if (collectionId) {
        console.log(`[Shopify API] Creating Collect to link product ${response.data.product.id} to collection ${collectionId}...`);
        await axios.post(
          `https://${sanitizedShop}/admin/api/2024-01/collects.json`,
          {
            collect: {
              product_id: response.data.product.id,
              collection_id: collectionId
            }
          },
          {
            headers: {
              "X-Shopify-Access-Token": finalToken,
              "Content-Type": "application/json"
            }
          }
        );
        console.log(`[Shopify API] Product successfully linked to Custom Collection.`);
      }

    } catch (colErr) {
      console.warn("[Shopify API] Collection or Collect creation failed:", colErr.response?.data || colErr.message);
    }

    res.status(201).json({ success: true, product: response.data.product, collection: collectionData });
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

        // Resolve vendor details from Firestore to sync coordinates
        const usersList = await getCollection("users");
        const matchedVendor = usersList.find(u => 
          u.role === 'vendor' && 
          ((vendorName && (
            (u.name && u.name.toLowerCase() === vendorName.toLowerCase()) ||
            (u.displayName && u.displayName.toLowerCase() === vendorName.toLowerCase())
           )) ||
           (vendorAddress && u.location && vendorAddress.toLowerCase().includes(u.location.toLowerCase())))
        );
        
        let finalVendorName = "Curbsides: " + vendorName;
        let finalVendorAddress = vendorAddress;
        let pickupLat = null;
        let pickupLng = null;
        
        if (matchedVendor) {
          finalVendorName = "Curbsides: " + (matchedVendor.displayName || matchedVendor.name);
          if (matchedVendor.location) finalVendorAddress = matchedVendor.location;
          if (matchedVendor.coordinates && matchedVendor.coordinates.length === 2) {
            pickupLat = matchedVendor.coordinates[0];
            pickupLng = matchedVendor.coordinates[1];
          }
        }

        let deliveryLat = null;
        let deliveryLng = null;
        if (customerAddress) {
          const coordMatch = customerAddress.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
          if (coordMatch) {
            deliveryLat = parseFloat(coordMatch[1]);
            deliveryLng = parseFloat(coordMatch[2]);
          }
        }

        const shipdayPayload = {
          orderNumber: orderId,
          customerName: customerName,
          customerAddress: customerAddress,
          customerEmail: customerEmail,
          customerPhoneNumber: customerPhone,
          restaurantName: finalVendorName,
          restaurantAddress: finalVendorAddress,
          paymentMethod: "credit_card"
        };

        if (pickupLat !== null && pickupLng !== null) {
          shipdayPayload.pickupLatitude = pickupLat;
          shipdayPayload.pickupLongitude = pickupLng;
        }
        if (deliveryLat !== null && deliveryLng !== null) {
          shipdayPayload.deliveryLatitude = deliveryLat;
          shipdayPayload.deliveryLongitude = deliveryLng;
        }

        await axios.post("https://api.shipday.com/orders", shipdayPayload, {
          headers: {
            "Authorization": `Basic ${shipdayApiKey}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          timeout: 3000
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
    const fromEmail = process.env.FROM_EMAIL || "Curbsides Auth <onboarding@resend.dev>";
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
        },
        timeout: 3000
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
      <p style="font-size: 14px; color: #a0aec0;">Welcome to the fleet! Your courier account is approved and you are now part of our dispatch system.</p>
      <p style="font-size: 13px; color: #a0aec0;">You can now log into the Curbsides Driver Portal using your email and password to begin receiving dispatches and managing your routes.</p>
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

async function sendVendorWelcomeEmail(email, name) {
  const siteUrl = process.env.SITE_URL || 'https://curbsides.xyz';
  const html = `
    <div style="background-color: #000; color: #fff; padding: 30px; font-family: sans-serif; border: 2px solid #fff; border-radius: 12px; max-width: 500px; margin: 0 auto;">
      <h1 style="font-size: 24px; text-transform: uppercase; border-bottom: 2px solid #fff; padding-bottom: 15px; margin-top: 0;">CURBSIDES Vendor Approved</h1>
      <p style="font-size: 14px; color: #a0aec0;">Hello ${name},</p>
      <p style="font-size: 14px; color: #a0aec0;">Congratulations! Your vendor application has been approved by the Curbsides team.</p>
      <p style="font-size: 14px; color: #a0aec0;">You can now sign in to the Vendor Portal to set up your menu, update your GPS location (PIN STOP), and start accepting live orders.</p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${siteUrl}/vendor-portal" style="background-color: #fff; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; text-transform: uppercase; display: inline-block;">Go to Vendor Portal</a>
      </div>
      <p style="font-size: 12px; color: #a0aec0;"><strong style="color:#fff;">Sign In:</strong> Use the same Google account or email address you applied with.</p>
      <p style="font-size: 11px; color: #718096; border-top: 1px solid #222; padding-top: 15px; margin-bottom: 0;">This is an automated notification from the Curbsides platform.</p>
    </div>
  `;
  return sendEmail({ to: email, subject: "You're Approved! Access Your Curbsides Vendor Portal", html });
}

// Dedicated endpoint for sending vendor approval welcome email
app.post("/api/vendor-approved-email", async (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) return res.status(400).json({ error: "Missing email or name" });
  try {
    await sendVendorWelcomeEmail(email, name);
    console.log(`[Resend] Vendor welcome email sent to ${email}`);
    res.json({ success: true });
  } catch (err) {
    console.error("[Resend] Failed to send vendor welcome email:", err.message);
    res.status(500).json({ error: "Failed to send email" });
  }
});

async function sendAdminVendorAppAlert(appData) {
  const adminEmail = "libertydispatchers@gmail.com";
  const html = `
    <div style="background-color: #000; color: #fff; padding: 30px; font-family: sans-serif; border: 2px solid #fff; border-radius: 12px; max-width: 600px; margin: 0 auto;">
      <h1 style="font-size: 20px; text-transform: uppercase; border-bottom: 2px solid #fff; padding-bottom: 15px; margin-top: 0; color: #10b981;">New Vendor Application</h1>
      <p style="font-size: 14px; color: #a0aec0;">A new vendor has applied to join the CURBSIDES fleet.</p>
      <ul style="color: #fff; font-size: 14px; line-height: 1.6;">
        <li><strong>Truck / Business Name:</strong> ${appData.name}</li>
        <li><strong>Email:</strong> ${appData.email}</li>
        <li><strong>Phone:</strong> ${appData.phone}</li>
        <li><strong>Food Type:</strong> ${appData.foodType}</li>
        <li><strong>Borough:</strong> ${appData.borough}</li>
        <li><strong>Location:</strong> ${appData.location || 'Not provided'}</li>
      </ul>
      <div style="text-align: center; margin: 25px 0;">
        <a href="https://curbsides.xyz" style="background-color: #fff; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; text-transform: uppercase; display: inline-block;">Review in Admin Dashboard</a>
      </div>
    </div>
  `;
  return sendEmail({ to: adminEmail, subject: "ALERT: New Vendor Application Received", html });
}

async function sendAdminUserSignupAlert(userData) {
  const adminEmail = "libertydispatchers@gmail.com";
  const html = `
    <div style="background-color: #000; color: #fff; padding: 30px; font-family: sans-serif; border: 2px solid #fff; border-radius: 12px; max-width: 600px; margin: 0 auto;">
      <h1 style="font-size: 20px; text-transform: uppercase; border-bottom: 2px solid #fff; padding-bottom: 15px; margin-top: 0; color: #3b82f6;">New User Registration</h1>
      <p style="font-size: 14px; color: #a0aec0;">A new user has registered an account on CURBSIDES.</p>
      <ul style="color: #fff; font-size: 14px; line-height: 1.6;">
        <li><strong>Name:</strong> ${userData.name || 'Not provided'}</li>
        <li><strong>Email:</strong> ${userData.email}</li>
        <li><strong>Role:</strong> ${userData.role || 'customer'}</li>
      </ul>
    </div>
  `;
  return sendEmail({ to: adminEmail, subject: "ALERT: New User Signup", html });
}

app.post("/api/notify-admin/vendor-app", async (req, res) => {
  try {
    await sendAdminVendorAppAlert(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to send admin vendor alert", err);
    res.status(500).json({ error: "Failed to send alert" });
  }
});

app.post("/api/notify-admin/user-signup", async (req, res) => {
  try {
    await sendAdminUserSignupAlert(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to send admin signup alert", err);
    res.status(500).json({ error: "Failed to send alert" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { email, password, name, role, uid } = req.body;
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: "Missing required fields (email, password, name, role)" });
  }

  // Check if user already exists
  const existingUsers = await getCollection("users");
  const foundUser = existingUsers.find(u => u.email.toLowerCase() === email.toLowerCase() || (uid && u.id === uid));
  if (foundUser && foundUser.isVerified) {
    return res.status(409).json({ error: "An account with this email address already exists." });
  }

  const userId = uid || "user-" + Date.now();
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit code

  let finalRole = role;
  if (email.trim().toLowerCase() === "libertydispatchers@gmail.com") {
    finalRole = "admin";
  }

  const newUser = {
    email: email.trim(),
    password: password, // Simulated password
    name: name.trim(),
    role: finalRole,
    isVerified: false,
    verificationCode: code,
    createdAt: new Date().toISOString()
  };

  // If role is vendor, auto-link to a simulated vendor ID
  if (finalRole === "vendor") {
    newUser.associatedId = "vendor-" + Date.now();
    // Auto-create vendor application as pending (needs staff approval)
    const vendorAppId = "v-app-" + Date.now();
    await addDocument("vendor-applications", vendorAppId, {
      id: vendorAppId,
      name: name,
      email: email,
      phone: "555-0155",
      foodType: "Street Food",
      borough: "Manhattan",
      status: "pending"
    });
  }

  // If role is driver, auto-link to a driver ID
  if (finalRole === "driver") {
    const driverId = "driver-" + Date.now();
    newUser.associatedId = driverId;
    let driverDoc = {
      id: driverId,
      fullName: name,
      email: email,
      phone: "555-0166",
      vehicle: "bike",
      boroughs: ["Manhattan"],
      status: "pending"
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

  // Override admin email role to 'admin'
  if (userDoc.email.toLowerCase() === "libertydispatchers@gmail.com") {
    userDoc.role = "admin";
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

  if (userDoc.role === "vendor") {
    const apps = await getCollection("vendor-applications");
    const appDoc = apps.find(a => a.email?.toLowerCase() === email.toLowerCase());
    if (appDoc && appDoc.status !== "approved") {
      return res.status(403).json({
        error: "unapproved_vendor",
        message: "Your vendor account is pending approval by the Curbsides transit administration."
      });
    }
  }

  if (userDoc.role === "driver") {
    const driversList = await getCollection("drivers");
    const driverDoc = driversList.find(d => d.email?.toLowerCase() === email.toLowerCase());
    if (driverDoc && driverDoc.status !== "approved") {
      return res.status(403).json({
        error: "unapproved_driver",
        message: "Your driver account is pending approval by the Curbsides transit administration."
      });
    }
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

// POST /api/auth/resend-code
app.post("/api/auth/resend-code", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  const usersList = await getCollection("users");
  const userDoc = usersList.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!userDoc) {
    return res.status(404).json({ error: "User not found." });
  }
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await updateDocument("users", userDoc.id, {
    verificationCode: code
  });
  await sendVerificationEmail(userDoc.email, userDoc.name, code);
  res.json({ success: true, message: "Verification code resent." });
});

// POST /api/auth/forgot-password
app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  const usersList = await getCollection("users");
  const userDoc = usersList.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!userDoc) {
    return res.status(404).json({ error: "No account found with this email address." });
  }

  // Generate a random temporary password
  const tempPass = Math.random().toString(36).substring(2, 10).toUpperCase();
  await updateDocument("users", userDoc.id, {
    password: tempPass
  });

  const html = `
    <div style="background-color: #000; color: #fff; padding: 30px; font-family: sans-serif; border: 2px solid #fff; border-radius: 12px; max-width: 500px; margin: 0 auto;">
      <h1 style="font-size: 24px; text-transform: uppercase; border-bottom: 2px solid #fff; padding-bottom: 15px; margin-top: 0;">CURBSIDES Password Reset</h1>
      <p style="font-size: 14px; color: #a0aec0;">Hello ${userDoc.name},</p>
      <p style="font-size: 14px; color: #a0aec0;">You requested a password reset. Below is your temporary passcode to access your account:</p>
      <div style="background-color: #1a1a1a; border: 1px solid #333; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0;">
        <span style="font-family: monospace; font-size: 24px; font-weight: bold; color: #fff;">${tempPass}</span>
      </div>
      <p style="font-size: 13px; color: #a0aec0;">Please log in using this temporary passcode and update your password in your settings profile.</p>
      <p style="font-size: 11px; color: #718096; border-top: 1px solid #222; padding-top: 15px; margin-bottom: 0;">This is an automated security notification.</p>
    </div>
  `;
  await sendEmail({ to: userDoc.email, subject: "CURBSIDES Password Reset Request", html });

  res.json({ success: true, message: "A temporary passcode has been emailed to you." });
});

// POST /api/auth/google
app.post("/api/auth/google", async (req, res) => {
  const { uid, email, name, role } = req.body;
  if (!uid || !email) {
    return res.status(400).json({ error: "Missing required fields from Google." });
  }

  const usersList = await getCollection("users");
  let userDoc = usersList.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!userDoc) {
    const newUser = {
      email,
      name: name || email.split('@')[0],
      password: "google-sso-managed", // Placeholder
      role: role || "customer",
      associatedId: null,
      isVerified: true, // Google emails are implicitly verified
      createdAt: new Date().toISOString(),
      googleUid: uid
    };
    if (email.toLowerCase() === "libertydispatchers@gmail.com") {
      newUser.role = "admin";
    }
    userDoc = await addDocument("users", uid, newUser);
  } else {
    // If user exists, just log them in
    if (!userDoc.googleUid) {
      await updateDocument("users", userDoc.id, { googleUid: uid, isVerified: true });
    }
    if (userDoc.email.toLowerCase() === "libertydispatchers@gmail.com") {
      userDoc.role = "admin";
    }
  }

  // Same approval checks as login
  if (userDoc.role === "vendor") {
    const apps = await getCollection("vendor-applications");
    const appDoc = apps.find(a => a.email?.toLowerCase() === email.toLowerCase());
    if (appDoc && appDoc.status !== "approved") {
      return res.status(403).json({
        error: "unapproved_vendor",
        message: "Your vendor account is pending approval by the Curbsides transit administration."
      });
    }
  }

  if (userDoc.role === "driver") {
    const driversList = await getCollection("drivers");
    const driverDoc = driversList.find(d => d.email?.toLowerCase() === email.toLowerCase());
    if (driverDoc && driverDoc.status !== "approved") {
      return res.status(403).json({
        error: "unapproved_driver",
        message: "Your driver account is pending approval by the Curbsides transit administration."
      });
    }
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

app.get("/api/config/gmaps", (req, res) => {
  res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY || "" });
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
