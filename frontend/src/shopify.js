// Shopify Storefront API client utility for CURBSIDES
// Stores configuration in localStorage so the user can easily plug in their own store on the fly.

const CONFIG_KEY = 'curbsides_shopify_config';

export function getShopifyConfig() {
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    return saved ? JSON.parse(saved) : { domain: '', token: '' };
  } catch (e) {
    return { domain: '', token: '' };
  }
}

export function saveShopifyConfig(domain, token) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ domain, token }));
}

export function isShopifyConnected() {
  const config = getShopifyConfig();
  return !!(config.domain && config.token);
}

// GraphQL client fetcher
async function shopifyFetch(query, variables = {}) {
  const config = getShopifyConfig();
  const shopName = config.domain.replace('.myshopify.com', '').replace('https://', '').replace('http://', '');
  const url = `https://${shopName}.myshopify.com/api/2024-01/graphql.json`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': config.token
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`Shopify API responded with status ${response.status}`);
  }

  const result = await response.json();
  if (result.errors) {
    throw new Error(result.errors.map(e => e.message).join(', '));
  }
  return result.data;
}

// Fetch products and group them into vendors (Food Trucks)
export async function fetchVendorsAndProducts() {
  if (!isShopifyConnected()) {
    // Return high-fidelity NYC food truck mock data if no Shopify store is connected
    return getMockVendors();
  }

  const query = `
    query getProducts {
      products(first: 100) {
        edges {
          node {
            id
            title
            description
            vendor
            productType
            tags
            images(first: 1) {
              edges {
                node {
                  url
                }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const data = await shopifyFetch(query);
    const products = data.products.edges.map(edge => edge.node);
    
    // Group products by Vendor
    const vendorsMap = {};

    products.forEach(p => {
      const vendorName = p.vendor || "Street Vendor";
      if (!vendorsMap[vendorName]) {
        // Derive operating borough from tags (e.g. "Borough:Brooklyn") or default
        const boroughTag = p.tags.find(tag => tag.toLowerCase().startsWith("borough:"));
        const borough = boroughTag ? boroughTag.split(":")[1] : "NYC";

        vendorsMap[vendorName] = {
          id: `vendor-${vendorName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name: vendorName,
          borough: borough,
          isOpen: true,
          rating: 4.8,
          items: []
        };
      }

      const imageUrl = p.images.edges[0]?.node?.url || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=60";
      const variant = p.variants.edges[0]?.node;

      vendorsMap[vendorName].items.push({
        id: variant?.id || p.id,
        name: p.title,
        description: p.description || "Hot and fresh street flavor.",
        price: parseFloat(variant?.price?.amount || 10.00),
        image: imageUrl
      });
    });

    return Object.values(vendorsMap);
  } catch (error) {
    console.error("Shopify Storefront fetch failed, falling back to mock data:", error);
    return getMockVendors();
  }
}

// Create checkout link via Shopify Storefront API mutation
export async function createShopifyCheckout(cartItems) {
  if (!isShopifyConnected()) {
    // Sandbox checkout simulation
    return {
      success: true,
      webUrl: "https://checkout.shopify.com/sandbox-checkout-simulation"
    };
  }

  const mutation = `
    mutation checkoutCreate($input: CheckoutCreateInput!) {
      checkoutCreate(input: $input) {
        checkout {
          id
          webUrl
        }
        checkoutUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  // Map cart items to Shopify line items format
  const lineItems = cartItems.map(item => ({
    variantId: item.id, // Must be the Shopify Variant GID
    quantity: item.quantity
  }));

  try {
    const data = await shopifyFetch(mutation, { input: { lineItems } });
    const errors = data.checkoutCreate.checkoutUserErrors;
    if (errors && errors.length > 0) {
      throw new Error(errors.map(e => e.message).join(', '));
    }
    return {
      success: true,
      webUrl: data.checkoutCreate.checkout.webUrl
    };
  } catch (error) {
    console.error("Failed to create Shopify checkout link:", error);
    throw error;
  }
}

// High-fidelity Mock Data for NYC street food trucks
function getMockVendors() {
  return [
    {
      id: "vendor-korean-taco",
      name: "Korean BBQ Taco Truck",
      borough: "Midtown, NYC",
      isOpen: true,
      rating: 4.9,
      tags: ["Korean", "Tacos", "BBQ"],
      items: [
        {
          id: "mock-1",
          name: "Bulgogi Beef Taco",
          description: "Strips of tender ribeye marinated in sweet soy sauce, served on soft corn tortillas with kimchi salsa.",
          price: 4.50,
          image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=60"
        },
        {
          id: "mock-2",
          name: "Spicy Pork Quesadilla",
          description: "Melted Monterey Jack cheese, spicy gochujang pork, and scallions in a crispy flour tortilla.",
          price: 11.00,
          image: "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=500&auto=format&fit=crop&q=60"
        },
        {
          id: "mock-3",
          name: "Kimchi Fries",
          description: "Crispy golden fries topped with caramelized kimchi, spicy mayo, toasted sesame seeds, and cilantro.",
          price: 8.50,
          image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60"
        }
      ]
    },
    {
      id: "vendor-empanada-guy",
      name: "Empanada Guy",
      borough: "Lower East Side",
      isOpen: true,
      rating: 4.8,
      tags: ["Latin", "Empanadas", "Street Food"],
      items: [
        {
          id: "mock-4",
          name: "Beef & Cheese Empanada",
          description: "Flaky golden crust packed with seasoned ground beef, melted cheddar, and onions.",
          price: 3.75,
          image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60"
        },
        {
          id: "mock-5",
          name: "Chipotle Chicken Empanada",
          description: "Shredded chicken simmered in a chipotle tomato sauce, wrapped in a crispy fried pastry.",
          price: 3.75,
          image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500&auto=format&fit=crop&q=60"
        },
        {
          id: "mock-6",
          name: "Guava & Cheese Empanada",
          description: "Sweet tropical guava paste and rich cream cheese inside a sugary sweet pastry crust.",
          price: 4.00,
          image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&auto=format&fit=crop&q=60"
        }
      ]
    },
    {
      id: "vendor-ramen-wheels",
      name: "Ramen on Wheels",
      borough: "Williamsburg",
      isOpen: true,
      rating: 4.7,
      tags: ["Japanese", "Ramen", "Noodles"],
      items: [
        {
          id: "mock-7",
          name: "Classic Tonkotsu Ramen",
          description: "Creamy pork broth, wheat noodles, chashu pork belly, soft-boiled egg, nori, and black garlic oil.",
          price: 15.00,
          image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=60"
        },
        {
          id: "mock-8",
          name: "Spicy Miso Ramen",
          description: "Rich miso-base broth with a spicy kick, ground pork, bamboo shoots, and green onions.",
          price: 15.50,
          image: "https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=500&auto=format&fit=crop&q=60"
        }
      ]
    },
    {
      id: "vendor-jerk-chicken",
      name: "Jerk Chicken Spot",
      borough: "Harlem",
      isOpen: true,
      rating: 4.9,
      tags: ["Caribbean", "Jerk Chicken", "Spicy"],
      items: [
        {
          id: "mock-9",
          name: "Quarter Jerk Chicken Plate",
          description: "Slow wood-smoked chicken coated in fire jerk seasoning, served with rice & peas and sweet plantains.",
          price: 13.00,
          image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60"
        },
        {
          id: "mock-10",
          name: "Jerk Pork Wrap",
          description: "Smoked spicy jerk pork, shredded cabbage, and pineapple salsa rolled in a warm roti wrap.",
          price: 10.50,
          image: "https://images.unsplash.com/photo-1626700051175-6518c4793f4f?w=500&auto=format&fit=crop&q=60"
        }
      ]
    }
  ];
}
