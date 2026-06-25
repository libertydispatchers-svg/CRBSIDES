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

function parseAddressString(addressStr) {
  if (!addressStr) return null;
  const parts = addressStr.split(',').map(p => p.trim());
  
  let address1 = parts[0] || '';
  let city = parts[1] || 'New York';
  let province = parts[2] || 'NY';
  let zip = '';
  
  const provParts = province.split(/\s+/);
  if (provParts.length > 1) {
    province = provParts[0];
    zip = provParts[1];
  }
  
  return {
    address1,
    city,
    province,
    zip: zip || '10001',
    country: 'United States'
  };
}

// Create checkout link via Shopify Storefront API mutation
export async function createShopifyCheckout(cartItems, customerProfile = null) {
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

  const input = {
    lineItems
  };

  if (customerProfile) {
    if (customerProfile.email) {
      input.email = customerProfile.email;
    }
    if (customerProfile.savedAddress) {
      const parsedAddr = parseAddressString(customerProfile.savedAddress);
      if (parsedAddr) {
        const names = (customerProfile.name || '').split(/\s+/);
        input.shippingAddress = {
          ...parsedAddr,
          firstName: names[0] || 'Customer',
          lastName: names.slice(1).join(' ') || 'User',
          phone: customerProfile.phone || ''
        };
      }
    }
  }

  try {
    const data = await shopifyFetch(mutation, { input });
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
      rating: 4.8,
      logo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=150&auto=format&fit=crop&q=60",
      tags: ["Korean", "Tacos", "BBQ"],
      reviews: [
        { id: "rev-k-1", name: "David K.", rating: 5, comment: "Amazing Bulgogi BBQ! Best taco truck in midtown. The kimchi salsa is out of this world.", date: "2026-06-18" },
        { id: "rev-k-2", name: "Elena R.", rating: 4, comment: "Delicious tacos, but the line gets quite long at lunch time. Get there early!", date: "2026-06-17" },
        { id: "rev-k-3", name: "Marcus L.", rating: 5, comment: "Kimchi fries are absolute perfection. Very fast checkout using OMNY tap.", date: "2026-06-15" }
      ],
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
      rating: 4.7,
      logo: "https://images.unsplash.com/photo-1544025162-d76694265947?w=150&auto=format&fit=crop&q=60",
      tags: ["Latin", "Empanadas", "Street Food"],
      reviews: [
        { id: "rev-e-1", name: "Sofía M.", rating: 5, comment: "The chipotle chicken empanada is phenomenal. Crust is super flaky and hot.", date: "2026-06-19" },
        { id: "rev-e-2", name: "Jordan P.", rating: 4, comment: "Great budget street food. Grab a beef empanada and guava for dessert.", date: "2026-06-16" }
      ],
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
      rating: 4.5,
      logo: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=150&auto=format&fit=crop&q=60",
      tags: ["Japanese", "Ramen", "Noodles"],
      reviews: [
        { id: "rev-r-1", name: "Kenji T.", rating: 4, comment: "Surprisingly good broth for a food truck. Tonkotsu is super rich and savory.", date: "2026-06-14" },
        { id: "rev-r-2", name: "Yuki S.", rating: 5, comment: "Spicy miso ramen has the perfect heat! Perfect for cool nights in Brooklyn.", date: "2026-06-12" }
      ],
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
      logo: "https://images.unsplash.com/photo-1626700051175-6518c4793f4f?w=150&auto=format&fit=crop&q=60",
      tags: ["Caribbean", "Jerk Chicken", "Spicy"],
      reviews: [
        { id: "rev-j-1", name: "Tyrone W.", rating: 5, comment: "Best wood-smoked jerk chicken in uptown. Generous portions and very spicy!", date: "2026-06-18" },
        { id: "rev-j-2", name: "Candice B.", rating: 5, comment: "Outstanding jerk pork and plantains. It hits the spot every single time.", date: "2026-06-17" },
        { id: "rev-j-3", name: "Liam O.", rating: 4, comment: "Extremely tasty, but prepare to wait in line. Totally worth it though.", date: "2026-06-15" }
      ],
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
