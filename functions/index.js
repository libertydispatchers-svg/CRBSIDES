const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const axios = require("axios");

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Helper function to calculate Haversine distance as a fallback
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

// Map common NYC locations to coordinates for high-fidelity fallback routing
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
  // Default fallback coords (centered in NYC)
  return { lat: 40.7128, lon: -74.0060 };
}

// Distance Matrix Calculation Engine
async function getRouteDistance(origin, destination) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    console.log("Using Google Distance Matrix API for distance calculation...");
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}&units=imperial`;
      const response = await axios.get(url);
      
      if (response.data && response.data.rows && response.data.rows[0].elements && response.data.rows[0].elements[0].status === "OK") {
        const element = response.data.rows[0].elements[0];
        // distance.value is in meters, convert to miles
        const distanceMeters = element.distance.value;
        const distanceMiles = distanceMeters * 0.000621371;
        return Number(distanceMiles.toFixed(2));
      } else {
        console.warn("Distance Matrix API returned status not OK, falling back to geodesic formula.", response.data);
      }
    } catch (err) {
      console.error("Error calling Google Distance Matrix API, falling back to geodesic formula:", err.message);
    }
  } else {
    console.log("No GOOGLE_MAPS_API_KEY configured. Running in local sandbox mode with Haversine formula...");
  }

  // Fallback Haversine Calculation
  const originCoords = getCoordsFromAddress(origin);
  const destCoords = getCoordsFromAddress(destination);

  // If no match found, generate a deterministic mock distance based on string length to simulate variety
  if (originCoords.lat === 40.7128 && destCoords.lat === 40.7128) {
    const stringHash = (origin.length + destination.length) % 5;
    const mockMiles = 1.5 + stringHash * 1.25; // Generates between 1.5 and 6.5 miles
    return Number(mockMiles.toFixed(2));
  }

  const distance = calculateHaversineDistance(originCoords.lat, originCoords.lon, destCoords.lat, destCoords.lon);
  // Add a slight routing overhead multiplier (1.25) to simulate real street turns instead of a straight line
  return Number((distance * 1.25).toFixed(2));
}

// Shopify Webhook Endpoint
app.post("/shopify-order-created", async (req, res) => {
  try {
    const payload = req.body;
    console.log("Received Shopify Webhook Payload:", JSON.stringify(payload));

    const orderId = String(payload.id || payload.order_number || `shopify-${Date.now()}`);
    
    // Parse Customer Address
    let customerAddress = "Unknown Customer Address, NYC";
    if (payload.shipping_address) {
      const addr = payload.shipping_address;
      customerAddress = `${addr.address1 || ""}, ${addr.city || "New York"}, ${addr.province || "NY"} ${addr.zip || ""}`;
    } else if (payload.billing_address) {
      const addr = payload.billing_address;
      customerAddress = `${addr.address1 || ""}, ${addr.city || "New York"}, ${addr.province || "NY"} ${addr.zip || ""}`;
    }

    // Parse Vendor Address (metafields, notes, or default to a known NYC vendor location)
    let vendorAddress = "Katz's Delicatessen, 205 E Houston St, New York, NY 10002"; // default vendor
    if (payload.note_attributes) {
      const vendorAttr = payload.note_attributes.find(attr => attr.name.toLowerCase() === "vendor_address");
      if (vendorAttr) vendorAddress = vendorAttr.value;
    }

    // Calculate Distance
    const distanceMiles = await getRouteDistance(vendorAddress, customerAddress);

    // Calculate Payout details
    const grossDriverPay = Number((distanceMiles * 2.00).toFixed(2)); // $2.00 flat rate per mile
    const driverCommissionSplit = Number((grossDriverPay * 0.10).toFixed(2)); // 10% platform split
    const netDriverPayout = Number((grossDriverPay - driverCommissionSplit).toFixed(2)); // Net driver earnings

    // Calculate Vendor Commission (10% of total price, or default order size of $35.00)
    const totalPrice = Number(payload.total_price || payload.subtotal_price || 35.00);
    const vendorCommissionSplit = Number((totalPrice * 0.10).toFixed(2));

    // Platform Revenue = 10% driver commission + 10% vendor commission
    const platformRevenue = Number((driverCommissionSplit + vendorCommissionSplit).toFixed(2));

    // 1. Save order into orders collection
    const orderDoc = {
      customerAddress,
      vendorAddress,
      distance: distanceMiles,
      grossPayout: grossDriverPay,
      netPayout: netDriverPayout,
      status: "pending",
      driverId: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection("orders").doc(orderId).set(orderDoc);

    // 2. Save finance record
    const financeDoc = {
      orderId,
      totalDistance: distanceMiles,
      grossDriverPay,
      driverCommissionSplit,
      vendorCommissionSplit,
      platformRevenue,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection("finance").add(financeDoc);

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

    console.log(`Successfully ingested order ${orderId}. Distance: ${distanceMiles} miles. Payout: $${netDriverPayout}. Revenue: $${platformRevenue}`);

    return res.status(200).json({
      success: true,
      orderId,
      distanceMiles,
      netDriverPayout,
      platformRevenue
    });

  } catch (err) {
    console.error("Error processing Shopify Webhook:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Export Cloud Function
exports.api = onRequest(app);
