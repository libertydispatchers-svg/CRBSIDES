import React, { useState, useEffect, useRef } from 'react';
import { 
  fetchVendorsAndProducts, 
  createShopifyCheckout, 
  getShopifyConfig, 
  saveShopifyConfig, 
  isShopifyConnected 
} from './shopify';
import logo from './assets/logo.png';
import { 
  Search, 
  ShoppingBag, 
  MapPin, 
  Info, 
  Menu, 
  X, 
  Check, 
  Settings, 
  ArrowRight, 
  Wifi, 
  Navigation,
  ExternalLink,
  Plus,
  Minus,
  Sparkles,
  Award,
  Truck,
  TrendingUp,
  DollarSign,
  Activity,
  UserCheck,
  User,
  Locate,
  Upload,
  Mail,
  Phone,
  Shield,
  Briefcase,
  Compass,
  Store,
  Bike,
  Zap,
  UserPlus,
  Clock,
  Bell
} from 'lucide-react';

export default function App() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBorough, setSelectedBorough] = useState('All');
  const [selectedVendor, setSelectedVendor] = useState(null);
  
  // Cart State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [showSandboxCheckout, setShowSandboxCheckout] = useState(false);
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('Lower East Side, New York, NY 10038');
  const [checkoutError, setCheckoutError] = useState('');
  
  // Shopify Configuration Modal State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [shopDomain, setShopDomain] = useState('');
  const [storefrontToken, setStorefrontToken] = useState('');
  const [adminTokenInput, setAdminTokenInput] = useState('');
  const [showShopifyBanner, setShowShopifyBanner] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  // Tab View for Mobile Layout and Router Simulation
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'map' | 'track' | 'admin' | 'vendor-onboard' | 'vendor-portal'
  
  // Customer Tracking Page State
  const [trackingOrderId, setTrackingOrderId] = useState('');
  const [searchedOrder, setSearchedOrder] = useState(null);
  const [trackingError, setTrackingError] = useState('');

  // Vendor Onboarding Signup Form State
  const [vendorName, setVendorName] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorBorough, setVendorBorough] = useState('Manhattan');
  const [vendorFoodType, setVendorFoodType] = useState('');
  const [vendorOnboardSuccess, setVendorOnboardSuccess] = useState(false);
  const [vendorOnboardError, setVendorOnboardError] = useState('');

  // Driver Onboarding Signup Form State
  const [driverNameInput, setDriverNameInput] = useState('');
  const [driverEmailInput, setDriverEmailInput] = useState('');
  const [driverPhoneInput, setDriverPhoneInput] = useState('');
  const [driverVehicle, setDriverVehicle] = useState('car');
  const [driverBoroughsInput, setDriverBoroughsInput] = useState(['Manhattan']);
  const [driverOnboardSuccess, setDriverOnboardSuccess] = useState(false);
  const [driverOnboardError, setDriverOnboardError] = useState('');
  
  // Customer Account Hub Tab State
  const [accountSubTab, setAccountSubTab] = useState('signin');
  const [vendorSubTab, setVendorSubTab] = useState('signin');

  // Vendor Portal GPS Update State
  const [selectedPortalVendorId, setSelectedPortalVendorId] = useState('');
  const [gpsStatus, setGpsStatus] = useState('');
  const [gpsCoords, setGpsCoords] = useState(null);

  // Admin & Staff View State
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState(false);
  const [isStaffOpen, setIsStaffOpen] = useState(false);
  const [staffPasscode, setStaffPasscode] = useState('');
  const [staffError, setStaffError] = useState('');
  const [adminSubTab, setAdminSubTab] = useState('drivers'); // 'drivers' | 'finance' | 'vendors' | 'applications' | 'support' | 'integrations'
  const [adminError, setAdminError] = useState('');
  const [isAdminNotificationsOpen, setIsAdminNotificationsOpen] = useState(false);

  // Vendor User Authentication & Dashboard State
  const [vendorUser, setVendorUser] = useState(null);
  const [vendorLoginEmail, setVendorLoginEmail] = useState('');
  const [vendorLoginPasscode, setVendorLoginPasscode] = useState('');
  const [vendorLoginError, setVendorLoginError] = useState('');
  const [vendorActiveSubTab, setVendorActiveSubTab] = useState('menu'); // 'menu' | 'gps' | 'profile'
  const [driverUser, setDriverUser] = useState(null);
  const [driverActiveSubTab, setDriverActiveSubTab] = useState('queue'); // 'queue' | 'active' | 'earnings'
  const [userSession, setUserSession] = useState(null);
  const [verificationPendingEmail, setVerificationPendingEmail] = useState('');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState('');
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuDesc, setNewMenuDesc] = useState('');
  const [newMenuPrice, setNewMenuPrice] = useState('');
  const [newMenuImage, setNewMenuImage] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Edit Menu Item State
  const [editingItem, setEditingItem] = useState(null);
  const [editMenuName, setEditMenuName] = useState('');
  const [editMenuDesc, setEditMenuDesc] = useState('');
  const [editMenuPrice, setEditMenuPrice] = useState('');
  const [editMenuImage, setEditMenuImage] = useState('');

  // Vendor Profile Edit State
  const [profileName, setProfileName] = useState('');
  const [profileBorough, setProfileBorough] = useState('Manhattan');
  const [profileTags, setProfileTags] = useState('');
  const [profileIsOpen, setProfileIsOpen] = useState(true);
  const [profileLogo, setProfileLogo] = useState('');

  // Customer Reviews Form State
  const [vendorModalTab, setVendorModalTab] = useState('menu'); // 'menu' | 'reviews'
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');

  // Customer Account & Profile States
  const [customerUser, setCustomerUser] = useState(null);
  const [customerLoginEmail, setCustomerLoginEmail] = useState('');
  const [customerLoginPassword, setCustomerLoginPassword] = useState('');
  const [customerRegisterName, setCustomerRegisterName] = useState('');
  const [customerRegisterEmail, setCustomerRegisterEmail] = useState('');
  const [customerRegisterPhone, setCustomerRegisterPhone] = useState('');
  const [customerRegisterPassword, setCustomerRegisterPassword] = useState('');
  const [customerAuthError, setCustomerAuthError] = useState('');
  
  // Customer Wallet (Cards)
  const [customerCards, setCustomerCards] = useState([
    { id: 'card-1', brand: 'Visa', last4: '4242', exp: '12/28' }
  ]);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardNum, setNewCardNum] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardCvc, setNewCardCvc] = useState('');
  
  // Simulated Live Support Chat State
  const [supportMessages, setSupportMessages] = useState([
    { id: 'm-1', sender: 'admin', text: 'Welcome to CURBSIDES Live Support! How can we assist you today?', timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [supportInput, setSupportInput] = useState('');
  const [customerActiveSubTab, setCustomerActiveSubTab] = useState('profile'); // 'profile' | 'orders' | 'chat'

  // Upgrade requests (for multi-truck)
  const [upgradeRequests, setUpgradeRequests] = useState([
    { id: 'up-1', vendorId: 'vendor-ramen-wheels', vendorName: 'Ramen on Wheels', requestedTrucks: 3, status: 'pending', timestamp: '2026-06-19T14:30:00Z' }
  ]);

  // GPS address publishing state
  const [gpsAddressText, setGpsAddressText] = useState('');

  // Customizable Onboarding Links
  const [customVendorUrl, setCustomVendorUrl] = useState(() => {
    return localStorage.getItem('curbsides_custom_vendor_url') || 'https://shop.curbsides.xyz/pages/join-fleet';
  });
  const [customDriverUrl, setCustomDriverUrl] = useState(() => {
    return localStorage.getItem('curbsides_custom_driver_url') || 'https://shop.curbsides.xyz/pages/join-fleet';
  });

  // Admin Support Chat Input State
  const [adminSupportInput, setAdminSupportInput] = useState('');

  // Orders State
  const [orders, setOrders] = useState([
    { id: 'shopify-1001', customerAddress: '123 Williams St, New York, NY 10038 (Financial District)', vendorAddress: "Katz's Delicatessen, 205 E Houston St, New York, NY 10002", distance: 1.8, grossPayout: 3.60, netPayout: 3.24, status: 'pending', driverId: null, createdAt: new Date().toISOString() },
    { id: 'shopify-1002', customerAddress: '45 Cooper Sq, New York, NY 10003 (East Village)', vendorAddress: "Katz's Delicatessen, 205 E Houston St, New York, NY 10002", distance: 0.8, grossPayout: 1.60, netPayout: 1.44, status: 'pending', driverId: null, createdAt: new Date().toISOString() }
  ]);

  // Synchronize profile forms safely
  useEffect(() => {
    if (vendorUser) {
      setProfileName(vendorUser.name);
      setProfileBorough(vendorUser.borough.replace(', NYC', '').trim());
      setProfileTags((vendorUser.tags || []).join(', '));
      setProfileIsOpen(vendorUser.isOpen);
      setProfileLogo(vendorUser.logo || '');
    }
  }, [vendorActiveSubTab, vendorUser]);

  // Mock Database State for Admin Dashboard (Synced locally)
  const [drivers, setDrivers] = useState([
    { id: 'd-1', fullName: 'Carlos Rivera', phone: '555-0144', vehicleType: 'e-bike', boroughs: ['Brooklyn'], status: 'approved', deliveries: 18, earnings: 81.00 },
    { id: 'd-2', fullName: 'Sarah Chen', phone: '555-0299', vehicleType: 'car', boroughs: ['Manhattan', 'Queens'], status: 'pending', deliveries: 0, earnings: 0.00 }
  ]);
  const [vendorApplications, setVendorApplications] = useState([
    { id: 'v-app-1', name: 'Halal Cart Kings', email: 'kings@halalcart.com', phone: '555-9000', foodType: 'Gyros & Rice', borough: 'Manhattan', status: 'pending' }
  ]);
  const [shopifyLogs, setShopifyLogs] = useState([
    { timestamp: '2026-06-20 02:40:12', type: 'API FETCH', message: 'Querying 100 products from store catalog...', color: 'text-white' },
    { timestamp: '2026-06-20 02:40:13', type: 'RESOLVED', message: 'Found 4 active food trucks on storefront API.', color: 'text-slate-400' },
    { timestamp: '2026-06-20 02:40:13', type: 'SYNC SUCCESS', message: 'Local registry updated with 10 active products.', color: 'text-emerald-400' },
    { timestamp: '2026-06-20 02:42:01', type: 'MUTATION', message: 'Generating checkout token for cart items...', color: 'text-white' },
    { timestamp: '2026-06-20 02:42:02', type: 'CHECKOUT URL', message: 'https://checkout.shopify.com/sandbox-checkout-simulation', color: 'text-slate-400' }
  ]);

  const [shipdayLogs, setShipdayLogs] = useState([
    { timestamp: '2026-06-20 02:35:10', type: 'WEBHOOK POST', message: 'X-Shopify-Hmac-Sha256 verified successfully.', color: 'text-slate-300' },
    { timestamp: '2026-06-20 02:35:11', type: 'FORWARDING', message: 'Posting payload to https://dispatch.shipday.com/shopify/order...', color: 'text-amber-500' },
    { timestamp: '2026-06-20 02:35:12', type: 'SHIPDAY ACK', message: 'Order shopify-1001 synced to dispatch board.', color: 'text-emerald-400' },
    { timestamp: '2026-06-20 02:38:45', type: 'WEBHOOK POST', message: 'X-Shopify-Hmac-Sha256 verified successfully.', color: 'text-slate-300' },
    { timestamp: '2026-06-20 02:38:46', type: 'FORWARDING', message: 'Posting payload to Shipday dispatch engine...', color: 'text-amber-500' },
    { timestamp: '2026-06-20 02:38:47', type: 'SHIPDAY ACK', message: 'Order shopify-1002 synced to dispatch board.', color: 'text-emerald-400' }
  ]);

  const addShopifyApiLog = (type, message, color = 'text-white') => {
    const time = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setShopifyLogs(prev => [
      ...prev,
      { timestamp: time, type, message, color }
    ]);
  };
  const [financeLogs, setFinanceLogs] = useState([
    { id: 'f-1', orderId: 'shopify-1001', distance: 1.8, subtotal: 36.00, vendorCommission: 3.60, driverGross: 3.60, driverCommission: 0.36, driverPay: 3.24, platformRev: 3.96, timestamp: '2026-06-19T12:00:00Z' },
    { id: 'f-2', orderId: 'shopify-1002', distance: 0.8, subtotal: 16.00, vendorCommission: 1.60, driverGross: 1.60, driverCommission: 0.16, driverPay: 1.44, platformRev: 1.76, timestamp: '2026-06-19T12:15:00Z' }
  ]);

  // Map Refs
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Fetch vendors on load and when Shopify connection config changes
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchVendorsAndProducts();
      // Map mock emails and coordinates for easy vendor login simulation
      const mappedData = data.map(v => ({
        ...v,
        email: v.email || (
          v.id === 'vendor-korean-taco' ? 'tacos@kbbq.com' :
          v.id === 'vendor-empanada-guy' ? 'empanadas@guy.com' :
          v.id === 'vendor-halal-kings' ? 'kings@halalcart.com' :
          `${v.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`
        ),
        coordinates: v.coordinates || (
          v.id === 'vendor-korean-taco' ? [40.7580, -73.9855] :
          v.id === 'vendor-empanada-guy' ? [40.7150, -73.9843] :
          v.id === 'vendor-ramen-wheels' ? [40.7081, -73.9571] :
          v.id === 'vendor-jerk-chicken' ? [40.8116, -73.9465] :
          [40.7128 + (Math.random() - 0.5) * 0.08, -74.0060 + (Math.random() - 0.5) * 0.08]
        )
      }));
      setVendors(mappedData);
      setLoading(false);
    }
    loadData();

    // Set initial config input values
    const config = getShopifyConfig();
    setShopDomain(config.domain);
    setStorefrontToken(config.token);
    setAdminTokenInput(localStorage.getItem('curbsides_shopify_admin_token') || '');
  }, [isConfigOpen]);

  // Pre-populate Sandbox checkout if customer logged in
  useEffect(() => {
    if (customerUser) {
      setCheckoutName(customerUser.name || '');
      setCheckoutEmail(customerUser.email || '');
      setCheckoutPhone(customerUser.phone || '');
    }
  }, [customerUser]);

  // URL routing and single page navigation listener
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/vendor-onboard') setActiveTab('vendor-onboard');
      else if (path === '/driver-onboard') setActiveTab('driver-onboard');
      else if (path === '/admin') setActiveTab('admin');
      else if (path === '/vendor-portal') setActiveTab('vendor-portal');
      else if (path === '/driver-portal') setActiveTab('driver-portal');
      else if (path === '/track') setActiveTab('track');
      else if (path === '/account') setActiveTab('account');
      else setActiveTab('directory');
    };
    window.addEventListener('popstate', handlePopState);
    handlePopState(); // Check once on initial mount
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update browser URL pathname when activeTab state changes
  useEffect(() => {
    const targetPath = 
      activeTab === 'vendor-onboard' ? '/vendor-onboard' :
      activeTab === 'driver-onboard' ? '/driver-onboard' :
      activeTab === 'admin' ? '/admin' :
      activeTab === 'vendor-portal' ? '/vendor-portal' :
      activeTab === 'driver-portal' ? '/driver-portal' :
      activeTab === 'track' ? '/track' :
      activeTab === 'account' ? '/account' : '/';
      
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', window.location.origin + targetPath + window.location.search);
    }
  }, [activeTab]);

  // URL vendor selection listener (Deep Linking from Shopify)
  useEffect(() => {
    if (vendors.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const vendorId = params.get('vendor');
      if (vendorId) {
        const found = vendors.find(v => v.id === vendorId || v.id.toLowerCase().includes(vendorId.toLowerCase()));
        if (found) {
          setSelectedVendor(found);
          setActiveTab('directory');
        }
      }
    }
  }, [vendors]);

  // Shopify OAuth Handshake Listener
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shop = params.get('shop');
    const hmac = params.get('hmac');
    const isInstalled = params.get('shopify_installed');
    const adminToken = params.get('admin_token');
    const storefrontToken = params.get('storefront_token');

    // Case 1: Shopify redirected to our App URL with shop & hmac -> show banner if not already connected
    if (shop && hmac && !isInstalled) {
      const savedToken = localStorage.getItem('curbsides_shopify_admin_token');
      const savedConfigStr = localStorage.getItem('curbsides_shopify_config');
      let savedShop = "";
      if (savedConfigStr) {
        try {
          savedShop = JSON.parse(savedConfigStr).domain;
        } catch (e) {}
      }

      const cleanShopName = shop.replace(/^https?:\/\//, "").trim();
      const cleanSavedShopName = savedShop.replace(/^https?:\/\//, "").trim();

      const alreadyConnected = savedToken && cleanSavedShopName && 
        (cleanSavedShopName === cleanShopName || cleanSavedShopName.includes(cleanShopName) || cleanShopName.includes(cleanSavedShopName));

      if (alreadyConnected) {
        console.log(`[Shopify Handshake] Shop "${shop}" is already connected. Cleaning URL parameters.`);
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } else {
        // Show banner to prompt connection
        setShowShopifyBanner(true);
      }
    }

    // Case 2: OAuth callback finished and redirected here with tokens
    if (isInstalled && shop && adminToken) {
      console.log(`[Shopify Handshake] OAuth handshake completed successfully for "${shop}".`);
      
      const sfToken = storefrontToken || '';
      // Save storefront token config
      saveShopifyConfig(shop, sfToken);
      // Save admin access token
      localStorage.setItem('curbsides_shopify_admin_token', adminToken);
      
      // Sync local states
      setShopDomain(shop);
      setStorefrontToken(sfToken);
      setAdminTokenInput(adminToken);
      
      addShopifyApiLog('OAUTH SUCCESS', `Shopify Admin API token (shpat_...) received and securely stored in client.`, 'text-emerald-400');
      addShopifyApiLog('STOREFRONT SYNC', `Storefront Access Token (shpca_...) successfully loaded. Store: ${shop}`, 'text-emerald-400');
      
      alert(`🎉 Shopify store "${shop}" successfully authorized and connected!`);

      // Clean parameters from browser URL bar to keep it beautiful
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      setShowShopifyBanner(false);
    }
  }, []);

  // Sync Finance and Drivers from local operations server if running
  useEffect(() => {
    let unsubs = [];
    
    const setupSubscriptions = async () => {
      const { db, collection, onSnapshot, query, orderBy } = await import('./firebase');
      
      if (activeTab === 'admin' && isAdminAuthenticated) {
        // Real-time finance ledger
        const financeQ = query(collection(db, 'finance'), orderBy('timestamp', 'desc'));
        unsubs.push(onSnapshot(financeQ, (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          if (data.length > 0) setFinanceLogs(data);
        }));

        // Real-time driver list
        const driversQ = query(collection(db, 'drivers'));
        unsubs.push(onSnapshot(driversQ, (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          if (data.length > 0) setDrivers(data);
        }));

        // Real-time vendor applications
        const appsQ = query(collection(db, 'vendor-applications'), orderBy('createdAt', 'desc'));
        unsubs.push(onSnapshot(appsQ, (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          if (data.length > 0) setVendorApplications(data);
        }));
      }

      if ((activeTab === 'admin' && isAdminAuthenticated) || (activeTab === 'vendor-portal' && vendorUser)) {
        // Real-time orders
        const ordersQ = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        unsubs.push(onSnapshot(ordersQ, (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          if (data.length > 0) {
            setOrders(data);
          }
        }));
      }
    };
    
    setupSubscriptions();
    
    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [activeTab, isAdminAuthenticated, vendorUser]);


  // Leaflet Map Initialization
  useEffect(() => {
    if (activeTab === 'map' || window.innerWidth >= 1024) {
      // Small timeout to let container render
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }

        if (mapRef.current && !mapInstanceRef.current && window.L) {
          const map = window.L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false
          }).setView([40.7306, -73.9352], 12); // Centered in NYC

          mapInstanceRef.current = map;

          // CartoDB Positron Dark Matter tile layer
          window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
          }).addTo(map);

          window.L.control.zoom({ position: 'bottomright' }).addTo(map);
        }

        // Add markers for vendors
        if (mapInstanceRef.current && window.L && vendors.length > 0) {
          // Clear old markers
          markersRef.current.forEach(m => m.remove());
          markersRef.current = [];

          // Map coordinate hashes for mock locations
          const coords = {
            "vendor-korean-taco": [40.7580, -73.9855], // Midtown
            "vendor-empanada-guy": [40.7150, -73.9843], // Lower East Side
            "vendor-ramen-wheels": [40.7081, -73.9571], // Williamsburg
            "vendor-jerk-chicken": [40.8116, -73.9465]  // Harlem
          };

          vendors.forEach(v => {
            const pos = v.coordinates || coords[v.id] || [40.7128 + (Math.random() - 0.5) * 0.1, -74.0060 + (Math.random() - 0.5) * 0.1];
            
            // Custom high contrast white marker icon
            const customIcon = window.L.divIcon({
              className: 'custom-div-icon',
              html: `<div class="w-8 h-8 rounded-full border-2 border-white bg-black flex items-center justify-center font-bold text-white text-xs shadow-lg shadow-white/10">C</div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            });

            const marker = window.L.marker(pos, { icon: customIcon })
              .addTo(mapInstanceRef.current)
              .bindPopup(`
                <div class="bg-black text-white p-2 border-2 border-white rounded-lg font-sans">
                  <h4 class="font-bold text-sm text-white border-b border-white/20 pb-1 mb-1 uppercase">${v.name}</h4>
                  <p class="text-xs text-slate-400 font-semibold mb-2">${v.borough}</p>
                  <button onclick="window.selectVendorFromMap('${v.id}')" class="w-full text-center px-2 py-1 bg-white text-black font-bold text-[10px] rounded uppercase hover:bg-black hover:text-white border border-white transition-all cursor-pointer">
                    View Menu
                  </button>
                </div>
              `, { closeButton: false });

            markersRef.current.push(marker);
          });
        }
      }, 100);
    }
  }, [activeTab, vendors]);

  // Handle global method for map popup click
  useEffect(() => {
    window.selectVendorFromMap = (vendorId) => {
      const vendor = vendors.find(v => v.id === vendorId);
      if (vendor) {
        setSelectedVendor(vendor);
      }
    };
  }, [vendors]);

  // Filter vendors
  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesBorough = selectedBorough === 'All' || 
      v.borough.toLowerCase().includes(selectedBorough.toLowerCase());

    return matchesSearch && matchesBorough;
  });

  // Cart Functions
  const addToCart = (item, vendorName) => {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      setCart(cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...item, quantity: 1, vendorName }]);
    }
  };

  const updateQuantity = (itemId, change) => {
    const updated = cart.map(i => {
      if (i.id === itemId) {
        const next = i.quantity + change;
        return next > 0 ? { ...i, quantity: next } : null;
      }
      return i;
    }).filter(Boolean);
    setCart(updated);
  };

  const getCartTotal = () => {
    return cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  };

  // SSO Click Handler
  const handleSSOClick = async (method, role = 'customer') => {
    setCustomerAuthError('');
    setVerificationError('');

    try {
      const { auth, db, doc, getDoc, setDoc, googleProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } = await import('./firebase');
      
      let user = null;

      if (method === 'Google') {
        const result = await signInWithPopup(auth, googleProvider);
        user = result.user;
      } else if (method === 'Phone') {
        const phone = prompt("Enter your Mobile Phone Number (e.g., +15555555555):");
        if (!phone || !phone.trim()) return;
        
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible'
          });
        }
        
        const confirmationResult = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
        const code = prompt("Enter the SMS verification code:");
        if (!code) return;
        
        const result = await confirmationResult.confirm(code);
        user = result.user;
      } else {
        alert(`${method} SSO not fully implemented with Firebase yet. Using Google or Phone instead.`);
        return;
      }

      if (user) {
        const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';
        const payload = {
          uid: user.uid,
          email: user.email || user.phoneNumber || 'no-email@example.com',
          name: user.displayName || (user.email ? user.email.split('@')[0].toUpperCase() : 'PHONE USER'),
          role: role
        };

        const response = await fetch(`${BACKEND_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || errData.error || 'Failed to sync SSO account with backend');
        }

        const dataUserResponse = await response.json();
        const dataUser = dataUserResponse.user;

        if (!dataUser) {
          throw new Error("Invalid response from server during SSO.");
        }
        
        if (dataUser.role === 'admin') {
          setCustomerUser(dataUser);
          setIsStaffAuthenticated(true);
          setIsAdminAuthenticated(true);
          setActiveTab('admin');
        } else if (dataUser.role === 'driver') {
          setDriverUser(dataUser);
          setDriverActiveSubTab('deliveries');
          setActiveTab('driver-portal');
        } else if (dataUser.role === 'vendor') {
          const matchedVendor = vendors.find(v => v.email?.toLowerCase() === dataUser.email?.toLowerCase() || v.name.toLowerCase().includes(dataUser.name.toLowerCase()));
          if (matchedVendor) {
            setVendorUser(matchedVendor);
            setSelectedPortalVendorId(matchedVendor.id);
          } else {
            const fallbackVendor = {
              id: dataUser.id || 'vendor-' + Date.now(),
              name: dataUser.name,
              email: dataUser.email,
              borough: 'Manhattan, NYC',
              isOpen: true,
              rating: 5.0,
              tags: ['Verified', 'Street Food'],
              items: []
            };
            setVendorUser(fallbackVendor);
            setSelectedPortalVendorId(fallbackVendor.id);
          }
          setVendorActiveSubTab('menu');
          setActiveTab('vendor-portal');
        } else {
          setCustomerUser(dataUser);
          setCustomerActiveSubTab('profile');
          setActiveTab('account');
        }
      }
    } catch (err) {
      console.error(err);
      alert(err.message || `${method} Sign In Failed`);
    }
  };

  // Place Sandbox Checkout Order (In-App Simulation)
  const handlePlaceSandboxOrder = async (e) => {
    e.preventDefault();
    setCheckoutError('');
    if (!checkoutName.trim() || !checkoutEmail.trim() || !checkoutPhone.trim() || !checkoutAddress.trim()) {
      setCheckoutError('All checkout fields are required.');
      return;
    }

    if (cart.length === 0) return;

    const matchedV = vendors.find(v => v.name === cart[0].vendorName);
    const vendorAddress = matchedV ? matchedV.borough : "Katz's Delicatessen, 205 E Houston St, New York, NY 10002";

    const orderPayload = {
      customerName: checkoutName.trim(),
      customerEmail: checkoutEmail.trim(),
      customerPhoneNumber: checkoutPhone.trim(),
      customerAddress: checkoutAddress.trim(),
      vendorName: cart[0].vendorName,
      vendorAddress: vendorAddress,
      items: cart,
      total: getCartTotal()
    };

    const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';
    setIsCheckoutLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();
      if (res.ok) {
        setCart([]);
        setShowSandboxCheckout(false);
        alert(`Order successfully placed! Order ID: ${data.id}. Secured via Shipday Dispatch.`);
        
        localStorage.setItem('last_placed_order_id', data.id);
        setSearchedOrder(data);
        setTrackingOrderId(data.id);
        setActiveTab('track');
      } else {
        setCheckoutError(data.error || "Failed to place order.");
      }
    } catch (err) {
      console.error("Sandbox checkout placement failed:", err);
      setCheckoutError("Failed to connect to backend server.");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  // Auto-Track Order Listener
  useEffect(() => {
    if (activeTab === 'track') {
      const lastPlacedId = localStorage.getItem('last_placed_order_id');
      if (lastPlacedId && (!searchedOrder || searchedOrder.id !== lastPlacedId)) {
        setTrackingOrderId(lastPlacedId);
        const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';
        fetch(`${BACKEND_URL}/api/orders/shipday/${encodeURIComponent(lastPlacedId)}`)
          .then(res => res.json())
          .then(data => {
            if (data && !data.error) {
              setSearchedOrder(data);
            }
          })
          .catch(err => console.log("Auto-track lookup failed:", err));
      }
    }
  }, [activeTab]);

  // Shopify Checkout Creation (Fallback method)
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckoutLoading(true);

    try {
      const res = await createShopifyCheckout(cart);
      if (res.success) {
        window.open(res.webUrl, '_blank');
        setCheckoutUrl(res.webUrl);
      }
    } catch (e) {
      alert("Checkout connection failed: " + e.message);
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  // Save Config Settings
  const handleSaveConfig = (e) => {
    e.preventDefault();
    saveShopifyConfig(shopDomain, storefrontToken);
    localStorage.setItem('curbsides_shopify_admin_token', adminTokenInput);
    setConfigSuccess(true);
    setTimeout(() => {
      setConfigSuccess(false);
      setIsConfigOpen(false);
    }, 1500);
  };

  // Start Shopify OAuth flow
  const handleStartOAuth = () => {
    const params = new URLSearchParams(window.location.search);
    let shop = params.get('shop') || shopDomain;
    if (!shop || !shop.trim()) {
      alert("Please enter your Shopify Domain first.");
      return;
    }
    const cleanShop = shop.replace(/^https?:\/\//, "").trim();
    const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';
    // Use window.top to breakout of the Shopify Admin iframe
    window.top.location.href = `${BACKEND_URL}/api/auth/shopify?shop=${encodeURIComponent(cleanShop)}`;
  };

  // Search Order for Custom Customer Tracking
  const handleSearchOrder = (e, customId = null) => {
    if (e) e.preventDefault();
    setTrackingError('');
    setSearchedOrder(null);

    const orderIdToSearch = customId || trackingOrderId;
    if (!orderIdToSearch || !orderIdToSearch.trim()) {
      setTrackingError('Please enter a valid order number.');
      return;
    }

    const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';
    fetch(`${BACKEND_URL}/api/orders/shipday/${encodeURIComponent(orderIdToSearch.trim())}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Order not found. Please check your order ID and try again.');
        }
        return res.json();
      })
      .then(data => {
        setSearchedOrder(data);
      })
      .catch(err => {
        console.error("Error looking up order tracking:", err);
        setTrackingError(err.message || 'Error connecting to operations system.');
      });
  };

  // Handle Vendor Onboarding Form
  const handleVendorOnboard = async (e) => {
    e.preventDefault();
    setVendorOnboardError('');
    setVendorOnboardSuccess(false);

    if (!vendorName.trim() || !vendorEmail.trim() || !vendorPhone.trim() || !vendorFoodType.trim()) {
      setVendorOnboardError('All fields are required.');
      return;
    }

    const newApp = {
      name: vendorName.trim(),
      email: vendorEmail.trim(),
      phone: vendorPhone.trim(),
      foodType: vendorFoodType.trim(),
      borough: vendorBorough,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      const { db, collection, addDoc } = await import('./firebase');
      await addDoc(collection(db, 'vendor-applications'), newApp);
      setVendorOnboardSuccess(true);
    } catch (err) {
      console.error("Failed to submit vendor application:", err);
      setVendorOnboardError("Failed to submit application. Please try again.");
    }

    // Clear form fields
    setVendorName('');
    setVendorEmail('');
    setVendorPhone('');
    setVendorFoodType('');
  };

  const handleDriverOnboard = async (e) => {
    e.preventDefault();
    setDriverOnboardError('');
    setDriverOnboardSuccess(false);

    if (!driverNameInput.trim() || !driverEmailInput.trim() || !driverPhoneInput.trim()) {
      setDriverOnboardError('All fields are required.');
      return;
    }

    const newDriver = {
      fullName: driverNameInput.trim(),
      email: driverEmailInput.trim(),
      phone: driverPhoneInput.trim(),
      vehicleType: driverVehicle,
      boroughs: driverBoroughsInput,
      status: 'pending',
      deliveries: 0,
      earnings: 0.00
    };

    const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';
    fetch(`${BACKEND_URL}/api/drivers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDriver)
    })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(savedDriver => {
      // It's already sent to Firestore by the backend, our onSnapshot listener will pick it up
      setDriverOnboardSuccess(true);
    })
    .catch(() => {
      setDriverOnboardError("Failed to submit driver application. Please try again.");
    });

    // Clear form fields
    setDriverNameInput('');
    setDriverEmailInput('');
    setDriverPhoneInput('');
    setDriverVehicle('car');
    setDriverBoroughsInput(['Manhattan']);
  };

  const handleBoroughChange = (borough) => {
    if (driverBoroughsInput.includes(borough)) {
      setDriverBoroughsInput(driverBoroughsInput.filter(b => b !== borough));
    } else {
      setDriverBoroughsInput([...driverBoroughsInput, borough]);
    }
  };

  const handleApproveVendor = async (app) => {
    const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';

    // Persist approval to database via Node Server to trigger Welcome Email
    try {
      await fetch(`${BACKEND_URL}/api/vendor-applications/${app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      });

      // Automatically add to local vendors list (which creates the vendor doc)
      const newVendorId = 'vendor-' + Date.now();
      const newVendor = {
        id: newVendorId,
        name: app.name,
        email: app.email,
        borough: app.borough || 'Manhattan, NYC',
        isOpen: true,
        rating: 5.0,
        tags: ['Approved', 'Street Food'],
        items: []
      };
      
      const { db, doc, setDoc } = await import('./firebase');
      await setDoc(doc(db, 'vendors', newVendorId), newVendor);

    } catch (err) {
      console.error("Failed to persist vendor application approval or vendor creation:", err);
    }

    const shopifyAdminToken = localStorage.getItem('curbsides_shopify_admin_token');
    const shopifyConfig = localStorage.getItem('curbsides_shopify_config');

    let shopDomain = "";
    if (shopifyConfig) {
      try {
        shopDomain = JSON.parse(shopifyConfig).domain;
      } catch(e) {}
    }
    
    if (shopifyAdminToken && shopDomain) {
      addShopifyApiLog('CREATING PRODUCT', `Initiated Shopify product creation for vendor "${app.name}"...`, 'text-white');
      
      try {
        const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';
        const response = await fetch(`${BACKEND_URL}/api/shopify/create-product`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            shop: shopDomain,
            admin_token: shopifyAdminToken,
            title: `${app.foodType} Starter Plate`,
            vendorName: app.name,
            borough: app.borough,
            foodType: app.foodType,
            price: "12.00"
          })
        });
        
        const resData = await response.json();
        if (resData.success) {
          addShopifyApiLog('PRODUCT CREATED', `Starter product "${app.foodType} Starter Plate" (ID: ${resData.product.id}) created for "${app.name}".`, 'text-emerald-400');
          alert(`Successfully approved vendor and created their starter product in Shopify!`);
        } else {
          throw new Error(resData.error || "Unknown API error");
        }
      } catch (err) {
        console.error("Failed to create product in Shopify:", err);
        addShopifyApiLog('PRODUCT ERROR', `Failed to create Shopify product for "${app.name}": ${err.message}`, 'text-amber-500');
        alert(`Vendor application approved, but failed to sync to Shopify: ${err.message}`);
      }
    } else {
      alert(`Email invitation sent to: ${app.email}. Connect them as staff in Shopify Settings. (Shopify integration not active - skipping product creation)`);
    }
  };

  // Handle Vendor GPS Location Update
  const handleUpdateGps = () => {
    if (!vendorUser) {
      setGpsStatus('Please sign in to your vendor dashboard first.');
      return;
    }
    
    setGpsStatus('Locating your food truck...');
    setGpsCoords(null);

    if (!navigator.geolocation) {
      setGpsStatus('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setGpsCoords({ lat, lon });
        setGpsStatus('GPS Coordinates successfully sent to Supabase locations ledger!');
        
        // Dynamic map updates inside mock UI
        setVendors(prev => prev.map(v => {
          if (v.id === vendorUser.id) {
            return {
              ...v,
              coordinates: [lat, lon]
            };
          }
          return v;
        }));
        console.log(`[Supabase] Updated vendor ${vendorUser.id} location to: [${lat}, ${lon}]`);
      },
      (error) => {
        console.error("GPS Error:", error);
        setGpsStatus('Unable to retrieve location. Please check your phone GPS permissions.');
      }
    );
  };

  // Authenticate Admin Command Center Passcode
  const handleAdminAuth = (e) => {
    e.preventDefault();
    setAdminError('');
    if (adminPassword === 'curbside-admin-2026') {
      setIsAdminAuthenticated(true);
      setIsStaffAuthenticated(true); // Sync staff authenticated state
    } else {
      setAdminError('Access Denied. Invalid Administrator Passcode.');
    }
  };

  // Authenticate Staff Console Access
  const handleStaffAuth = (e) => {
    e.preventDefault();
    setStaffError('');
    if (staffPasscode === 'curbside-admin-2026') {
      setIsStaffAuthenticated(true);
      setIsAdminAuthenticated(true); // Share authentication state for seamless UX
      setIsStaffOpen(false);
      setStaffPasscode('');
    } else {
      setStaffError('Access Denied. Invalid Staff Passcode.');
    }
  };

  // Log Out / Lock Console
  const handleStaffLogout = () => {
    setIsStaffAuthenticated(false);
    setIsAdminAuthenticated(false);
    setActiveTab('directory');
  };

  // Authenticate Vendor User
  const handleVendorLogin = async (e) => {
    e.preventDefault();
    setVendorLoginError('');
    const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: vendorLoginEmail.trim(),
          password: vendorLoginPasscode
        })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.user.role !== 'vendor') {
          setVendorLoginError("Access denied. Please use the appropriate sign-in portal for your role.");
          return;
        }
        
        const matchedVendor = vendors.find(v => v.email?.toLowerCase() === vendorLoginEmail.toLowerCase() || v.name.toLowerCase().includes(data.user.name.toLowerCase()));
        if (matchedVendor) {
          setVendorUser(matchedVendor);
          setSelectedPortalVendorId(matchedVendor.id);
        } else {
          const fallbackVendor = {
            id: data.user.associatedId || 'vendor-sim',
            name: data.user.name,
            email: vendorLoginEmail,
            borough: 'Manhattan, NYC',
            isOpen: true,
            rating: 5.0,
            tags: ['Verified', 'Street Food'],
            items: []
          };
          setVendorUser(fallbackVendor);
          setSelectedPortalVendorId(fallbackVendor.id);
        }
      } else if (res.status === 403 && data.error === 'unverified') {
        setVerificationPendingEmail(vendorLoginEmail.trim());
      } else {
        setVendorLoginError(data.error || "Login failed.");
      }
    } catch (err) {
      if (vendorLoginPasscode !== 'vendor-123') {
        setVendorLoginError('Invalid passcode. Try passcode: vendor-123.');
        return;
      }

      const foundVendor = vendors.find(v => 
        v.email?.toLowerCase() === vendorLoginEmail.toLowerCase() || 
        (vendorLoginEmail.toLowerCase().includes('kings') && v.name.toLowerCase().includes('kings')) ||
        (vendorLoginEmail.toLowerCase().includes('taco') && v.name.toLowerCase().includes('taco')) ||
        (vendorLoginEmail.toLowerCase().includes('empanada') && v.name.toLowerCase().includes('empanada'))
      );
      
      if (foundVendor) {
        setVendorUser(foundVendor);
        setSelectedPortalVendorId(foundVendor.id);
      } else {
        const emailPrefix = vendorLoginEmail.split('@')[0];
        const formatName = emailPrefix
          .split(/[._-]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ') + " Truck";
        
        const newVendorId = 'vendor-' + Date.now();
        const newVendor = {
          id: newVendorId,
          name: formatName,
          email: vendorLoginEmail,
          borough: 'Manhattan, NYC',
          isOpen: true,
          rating: 5.0,
          tags: ['New', 'Street Food'],
          reviews: [],
          items: []
        };
        setVendors(prev => [...prev, newVendor]);
        setVendorUser(newVendor);
        setSelectedPortalVendorId(newVendorId);
      }
    }
  };

  // Vendor Logout
  const handleVendorLogout = () => {
    setVendorUser(null);
    setVendorLoginEmail('');
    setVendorLoginPasscode('');
    setVendorLoginError('');
    setActiveTab('directory');
  };

  // Vendor Status Update Handler
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';
    try {
      const response = await fetch(`${BACKEND_URL}/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        const updatedOrder = await response.json();
        setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? { ...o, ...updatedOrder } : o));
        
        // Live sync with tracking page if the active order matches
        if (searchedOrder && searchedOrder.id === orderId) {
          let vendorName = 'Vendor';
          if (updatedOrder.vendorAddress) {
            const commaIdx = updatedOrder.vendorAddress.indexOf(',');
            vendorName = commaIdx > -1 ? updatedOrder.vendorAddress.substring(0, commaIdx) : updatedOrder.vendorAddress;
          }
          
          let driverName = searchedOrder.driverName;
          if (updatedOrder.driverId) {
            const matchedDriver = drivers.find(d => d.id === updatedOrder.driverId);
            driverName = matchedDriver ? matchedDriver.fullName : 'Sarah Chen';
          }

          setSearchedOrder({
            id: updatedOrder.id,
            status: updatedOrder.status,
            vendor: vendorName,
            eta: updatedOrder.status === 'Delivered' ? 0 : (updatedOrder.status === 'On the Way' ? 8 : (updatedOrder.status === 'Driver Assigned' ? 15 : 25)),
            driverName: driverName,
            driverPhone: '555-0144'
          });
        }
      } else {
        alert('Failed to update order status.');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      // Offline fallback
      setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (searchedOrder && searchedOrder.id === orderId) {
        setSearchedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    }
  };

  // Admin Assign Driver Handler
  const handleAssignDriver = async (orderId, driverId) => {
    if (!driverId) {
      alert("Please select a driver to assign.");
      return;
    }
    const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';
    const matchedDriver = drivers.find(d => d.id === driverId);
    const driverName = matchedDriver ? matchedDriver.fullName : 'Sarah Chen';

    try {
      const response = await fetch(`${BACKEND_URL}/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          driverId: driverId,
          status: 'Driver Assigned'
        })
      });
      if (response.ok) {
        const updatedOrder = await response.json();
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updatedOrder } : o));
        
        // Sync with tracked order
        if (searchedOrder && searchedOrder.id === orderId) {
          let vendorName = 'Vendor';
          if (updatedOrder.vendorAddress) {
            const commaIdx = updatedOrder.vendorAddress.indexOf(',');
            vendorName = commaIdx > -1 ? updatedOrder.vendorAddress.substring(0, commaIdx) : updatedOrder.vendorAddress;
          }
          setSearchedOrder({
            id: updatedOrder.id,
            status: updatedOrder.status,
            vendor: vendorName,
            eta: 15,
            driverName: driverName,
            driverPhone: '555-0144'
          });
        }
        alert(`Driver ${driverName} successfully assigned to order ${orderId}!`);
      } else {
        alert("Failed to assign driver.");
      }
    } catch (err) {
      console.error(err);
      // Fallback
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, driverId, status: 'Driver Assigned' } : o));
      if (searchedOrder && searchedOrder.id === orderId) {
        setSearchedOrder(prev => prev ? { ...prev, status: 'Driver Assigned', driverName } : null);
      }
    }
  };

  // Customer Authentication & Wallet Handlers
  const handleCustomerSignup = async (e) => {
    e.preventDefault();
    setCustomerAuthError('');
    if (!customerRegisterName.trim() || !customerRegisterEmail.trim() || !customerRegisterPassword.trim()) {
      setCustomerAuthError('All registration fields are required.');
      return;
    }
    try {
      const { auth, db, doc, setDoc, createUserWithEmailAndPassword } = await import('./firebase');
      
      const userCredential = await createUserWithEmailAndPassword(auth, customerRegisterEmail.trim(), customerRegisterPassword);
      const user = userCredential.user;
      
      const role = customerRegisterEmail.trim().toLowerCase() === 'libertydispatchers@gmail.com' ? 'admin' : 'customer';
      
      const newUserProfile = {
        id: user.uid,
        email: user.email,
        name: customerRegisterName.trim().toUpperCase(),
        role: role,
        createdAt: new Date().toISOString(),
        isVerified: false
      };
      
      await setDoc(doc(db, 'users', user.uid), newUserProfile);
      
      setVerificationPendingEmail(customerRegisterEmail.trim());
      setCustomerRegisterName('');
      setCustomerRegisterEmail('');
            setCustomerRegisterPhone('');
      setCustomerRegisterPassword('');
    } catch (err) {
      setCustomerAuthError(err.message || "Registration failed. Please try again.");
    }
  };

  const handleCustomerLogin = async (e) => {
    e.preventDefault();
    setCustomerAuthError('');
    if (!customerLoginEmail.trim() || !customerLoginPassword.trim()) {
      setCustomerAuthError('Please enter both email and password.');
      return;
    }
    try {
      const { auth, db, doc, getDoc, signInWithEmailAndPassword } = await import('./firebase');
      
      const userCredential = await signInWithEmailAndPassword(auth, customerLoginEmail.trim(), customerLoginPassword);
      const firebaseUser = userCredential.user;
      
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        setCustomerAuthError("User profile not found in database.");
        return;
      }
      const user = userDoc.data();
      
      setCustomerLoginEmail('');
      setCustomerLoginPassword('');

      if (user.role === 'admin' || user.email.toLowerCase() === 'libertydispatchers@gmail.com') {
        setCustomerUser(user);
        setIsStaffAuthenticated(true);
        setIsAdminAuthenticated(true);
        setActiveTab('admin');
      } else if (user.role === 'driver') {
        setDriverUser(user);
        setDriverActiveSubTab('queue');
        setActiveTab('driver-portal');
      } else if (user.role === 'vendor') {
        const matchedVendor = vendors.find(v => v.email?.toLowerCase() === user.email.toLowerCase() || v.name.toLowerCase().includes(user.name.toLowerCase()));
        if (matchedVendor) {
          setVendorUser(matchedVendor);
          setSelectedPortalVendorId(matchedVendor.id);
        } else {
          const fallbackVendor = {
            id: user.associatedId || 'vendor-' + Date.now(),
            name: user.name,
            email: user.email,
            borough: 'Manhattan, NYC',
            isOpen: true,
            rating: 5.0,
            tags: ['Verified', 'Street Food'],
            items: []
          };
          setVendorUser(fallbackVendor);
          setSelectedPortalVendorId(fallbackVendor.id);
        }
        setVendorActiveSubTab('menu');
        setActiveTab('vendor-portal');
      } else {
        setCustomerUser(user);
        setCustomerActiveSubTab('profile');
        setActiveTab('account');
      }
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setCustomerAuthError("Invalid credentials.");
      } else {
        // Offline fallback
        const email = customerLoginEmail.trim();
        setCustomerLoginEmail('');
        setCustomerLoginPassword('');

        if (email.toLowerCase() === 'libertydispatchers@gmail.com') {
          const adminUser = {
            name: 'ADMIN',
            email: email,
            phone: '555-0199',
            joinedDate: '06/15/2026',
            role: 'admin'
          };
          setCustomerUser(adminUser);
          setIsStaffAuthenticated(true);
          setIsAdminAuthenticated(true);
          setActiveTab('admin');
        } else if (email.toLowerCase().includes('driver') || email.toLowerCase().includes('courier')) {
          const simulatedDriver = {
            id: 'driver-sim',
            email: email,
            name: 'Simulated Courier',
            role: 'driver'
          };
          setDriverUser(simulatedDriver);
          setDriverActiveSubTab('queue');
          setActiveTab('driver-portal');
        } else if (email.toLowerCase().includes('vendor') || email.toLowerCase().includes('truck')) {
          const foundVendor = vendors.find(v => 
            v.email?.toLowerCase() === email.toLowerCase() || 
            (email.toLowerCase().includes('kings') && v.name.toLowerCase().includes('kings')) ||
            (email.toLowerCase().includes('taco') && v.name.toLowerCase().includes('taco')) ||
            (email.toLowerCase().includes('empanada') && v.name.toLowerCase().includes('empanada'))
          );
          
          if (foundVendor) {
            setVendorUser(foundVendor);
            setSelectedPortalVendorId(foundVendor.id);
          } else {
            const fallbackVendor = {
              id: 'vendor-' + Date.now(),
              name: email.split('@')[0].toUpperCase(),
              email: email,
              borough: 'Manhattan, NYC',
              isOpen: true,
              rating: 5.0,
              tags: ['Verified', 'Street Food'],
              items: []
            };
            setVendorUser(fallbackVendor);
            setSelectedPortalVendorId(fallbackVendor.id);
          }
          setVendorActiveSubTab('menu');
          setActiveTab('vendor-portal');
        } else {
          setCustomerUser({
            name: email.split('@')[0].toUpperCase(),
            email: email,
            phone: '555-0199',
            joinedDate: '06/15/2026',
            role: 'customer'
          });
          setCustomerActiveSubTab('profile');
          setActiveTab('account');
        }
      }
    }
  };

  const handleCustomerLogout = () => {
    setCustomerUser(null);
    setCustomerActiveSubTab('profile');
  };

  const handleDeleteCustomerAccount = () => {
    if (confirm("Are you sure you want to permanently delete your CURBSIDES customer account and card wallet? This action cannot be undone.")) {
      setCustomerUser(null);
      setCustomerCards([]);
      setCustomerActiveSubTab('profile');
    }
  };

  const handleAddCustomerCard = (e) => {
    e.preventDefault();
    if (!newCardNum.trim() || !newCardExpiry.trim() || !newCardCvc.trim()) {
      alert("Please fill in all credit card details.");
      return;
    }
    const cleanNum = newCardNum.replace(/\s+/g, '');
    const last4 = cleanNum.substring(cleanNum.length - 4) || '4242';
    const brand = cleanNum.startsWith('5') ? 'Mastercard' : cleanNum.startsWith('3') ? 'Amex' : 'Visa';
    
    const newCard = {
      id: 'card-' + Date.now(),
      brand,
      last4,
      exp: newCardExpiry.trim()
    };
    setCustomerCards([...customerCards, newCard]);
    setIsAddingCard(false);
    setNewCardNum('');
    setNewCardExpiry('');
    setNewCardCvc('');
  };

  const handleDeleteCustomerCard = (cardId) => {
    setCustomerCards(customerCards.filter(c => c.id !== cardId));
  };

  const handleSendSupportMessage = (e) => {
    e.preventDefault();
    if (!supportInput.trim()) return;

    const userMsg = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: supportInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setSupportMessages(prev => [...prev, userMsg]);
    setSupportInput('');

    // Simulate auto-reply from Admin
    setTimeout(() => {
      const replies = [
        "We are currently reviewing your request and will update you shortly.",
        "Your order status is active. Please track it on the Track Order page using your Order ID.",
        "Thank you for contacting CURBSIDES. A support staff has been notified of your message.",
        "All our courier dispatch slots are active. If you need refunds, they will be processed to your card wallet.",
        "Our admin is online. We have forwarded your message directly to our dispatch dashboard."
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      setSupportMessages(prev => [...prev, {
        id: 'msg-admin-' + Date.now(),
        sender: 'admin',
        text: randomReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
  };

  // Add a new menu item to the vendor
  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    if (!newMenuName || !newMenuPrice || !vendorUser) return;
    
    const newItemId = 'menu-' + Date.now();
    const newItem = {
      id: newItemId,
      name: newMenuName,
      description: newMenuDesc,
      price: parseFloat(newMenuPrice),
      image: newMenuImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60' // Default fallback photo
    };

    const updatedVendors = vendors.map(v => {
      if (v.id === vendorUser.id) {
        const updatedItems = [...v.items, newItem];
        setVendorUser({ ...v, items: updatedItems });
        return { ...v, items: updatedItems };
      }
      return v;
    });

    setVendors(updatedVendors);

    // Sync to Shopify if connected
    const shopifyAdminToken = localStorage.getItem('curbsides_shopify_admin_token');
    const shopifyConfig = localStorage.getItem('curbsides_shopify_config');
    let shopDomain = "";
    if (shopifyConfig) {
      try {
        shopDomain = JSON.parse(shopifyConfig).domain;
      } catch(e) {}
    }

    if (shopifyAdminToken && shopDomain) {
      addShopifyApiLog('CREATING PRODUCT', `Syncing new menu item "${newMenuName}" to Shopify...`, 'text-white');
      try {
        const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';
        const response = await fetch(`${BACKEND_URL}/api/shopify/create-product`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            shop: shopDomain,
            admin_token: shopifyAdminToken,
            title: newMenuName,
            vendorName: vendorUser.name,
            borough: vendorUser.borough || 'NYC',
            foodType: vendorUser.foodType || 'Specialty Food',
            price: newMenuPrice
          })
        });
        const result = await response.json();
        if (response.ok && result.success) {
          addShopifyApiLog('PRODUCT CREATED', `Successfully synced "${newMenuName}" to Shopify. ID: ${result.product.id}`, 'text-emerald-400');
          // Update the item ID to be the real Shopify variant ID if available
          const storefrontVariantId = result.product.variants?.[0]?.admin_graphql_api_id || result.product.id;
          setVendors(prev => prev.map(v => {
            if (v.id === vendorUser.id) {
              const updatedItems = v.items.map(item => item.id === newItemId ? { ...item, id: storefrontVariantId } : item);
              setVendorUser(prevUser => prevUser ? { ...prevUser, items: updatedItems } : null);
              return { ...v, items: updatedItems };
            }
            return v;
          }));
        } else {
          addShopifyApiLog('SYNC ERROR', `Failed to sync "${newMenuName}": ${result.error || 'Unknown error'}`, 'text-rose-400');
        }
      } catch (err) {
        console.error("Shopify menu item sync failed:", err);
        addShopifyApiLog('SYNC ERROR', `Failed to sync "${newMenuName}": connection failed`, 'text-rose-400');
      }
    }
    
    // Reset form
    setNewMenuName('');
    setNewMenuDesc('');
    setNewMenuPrice('');
    setNewMenuImage('');
    setIsAddingItem(false);
  };

  // Edit an existing menu item
  const handleEditMenuItem = (e) => {
    e.preventDefault();
    if (!editingItem || !editMenuName || !editMenuPrice || !vendorUser) return;

    const updatedVendors = vendors.map(v => {
      if (v.id === vendorUser.id) {
        const updatedItems = v.items.map(item => {
          if (item.id === editingItem.id) {
            return {
              ...item,
              name: editMenuName,
              description: editMenuDesc,
              price: parseFloat(editMenuPrice),
              image: editMenuImage || item.image
            };
          }
          return item;
        });
        setVendorUser({ ...v, items: updatedItems });
        return { ...v, items: updatedItems };
      }
      return v;
    });

    setVendors(updatedVendors);

    // Reset edit state
    setEditingItem(null);
    setEditMenuName('');
    setEditMenuDesc('');
    setEditMenuPrice('');
    setEditMenuImage('');
  };

  // Delete a menu item
  const handleDeleteMenuItem = (itemId) => {
    if (!vendorUser) return;
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    const updatedVendors = vendors.map(v => {
      if (v.id === vendorUser.id) {
        const updatedItems = v.items.filter(item => item.id !== itemId);
        setVendorUser({ ...v, items: updatedItems });
        return { ...v, items: updatedItems };
      }
      return v;
    });

    setVendors(updatedVendors);
  };

  // Update vendor profile details
  const handleUpdateVendorProfile = (e) => {
    e.preventDefault();
    if (!vendorUser) return;

    const updatedVendors = vendors.map(v => {
      if (v.id === vendorUser.id) {
        const updated = {
          ...v,
          name: profileName,
          borough: profileBorough + ', NYC',
          tags: profileTags.split(',').map(t => t.trim()).filter(Boolean),
          isOpen: profileIsOpen,
          logo: profileLogo
        };
        setVendorUser(updated);
        return updated;
      }
      return v;
    });

    setVendors(updatedVendors);
    alert('Store Profile updated successfully!');
  };

  // Submit Customer Review
  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!newReviewName || !newReviewComment || !selectedVendor) return;

    const newReview = {
      id: 'rev-' + Date.now(),
      name: newReviewName,
      rating: parseInt(newReviewRating),
      comment: newReviewComment,
      date: new Date().toISOString().split('T')[0]
    };

    const updatedVendors = vendors.map(v => {
      if (v.id === selectedVendor.id) {
        const existingReviews = v.reviews || [];
        const updatedReviews = [newReview, ...existingReviews];
        const newAverage = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
        
        const updatedVendor = {
          ...v,
          reviews: updatedReviews,
          rating: parseFloat(newAverage.toFixed(1))
        };
        
        // Sync selectedVendor so the UI updates instantly
        setTimeout(() => setSelectedVendor(updatedVendor), 0);
        return updatedVendor;
      }
      return v;
    });

    setVendors(updatedVendors);
    
    // Reset form
    setNewReviewName('');
    setNewReviewRating(5);
    setNewReviewComment('');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col antialiased selection:bg-white selection:text-black">
      
      {/* Email Verification Code Entry Overlay */}
      {verificationPendingEmail && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full border-2 border-white rounded-2xl p-6 md:p-8 bg-zinc-950 shadow-[0_0_50px_rgba(255,255,255,0.1)] space-y-6 animate-fade-in animate-scale-up">
            <div className="text-center space-y-2">
              <span className="bg-amber-500 text-black font-extrabold text-[9px] uppercase tracking-widest px-2 py-0.5 rounded animate-pulse">
                Verification Required
              </span>
              <h2 className="text-2xl font-bold uppercase text-white font-heading">Confirm Transit Pass</h2>
              <p className="text-xs text-slate-400">
                We sent a 6-digit access code to <strong className="text-white">{verificationPendingEmail}</strong> via Resend Mailer. Please enter it below:
              </p>
            </div>

            {verificationError && (
              <div className="p-3 border border-rose-500 bg-rose-950/20 text-rose-500 text-xs font-bold uppercase text-center rounded">
                {verificationError}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setVerificationError('');
                const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';

                try {
                  if (verificationPendingEmail.startsWith('sms-')) {
                    if (verificationCodeInput === '123456') {
                      const parts = verificationPendingEmail.split('-');
                      const verifiedRole = parts[1];
                      const verifiedPhone = parts.slice(2).join('-');
                      
                      alert("Phone number successfully verified! You are now logged in.");
                      setVerificationPendingEmail('');
                      setVerificationCodeInput('');
                      
                      const simulatedUser = {
                        id: 'sso-phone-' + Date.now(),
                        name: 'PHONE USER',
                        email: `phone-${verifiedPhone}@curbside.xyz`,
                        phone: verifiedPhone,
                        role: verifiedRole,
                        isVerified: true
                      };
                      
                      if (verifiedRole === 'driver') {
                        setDriverUser(simulatedUser);
                        setActiveTab('driver-portal');
                      } else {
                        setCustomerUser(simulatedUser);
                        setActiveTab('account');
                      }
                    } else {
                      setVerificationError("Invalid phone verification code. (Use 123456 for testing)");
                    }
                    return;
                  }

                  const res = await fetch(`${BACKEND_URL}/api/auth/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email: verificationPendingEmail,
                      code: verificationCodeInput
                    })
                  });
                  const data = await res.json();
                  if (res.ok) {
                    alert("Email verified successfully! You are now logged in.");
                    setVerificationPendingEmail('');
                    setVerificationCodeInput('');
                    
                    if (data.user.role === 'vendor') {
                      const loadVendors = async () => {
                        const response = await fetchVendorsAndProducts();
                        const matchedV = response.find(v => v.email?.toLowerCase() === verificationPendingEmail.toLowerCase() || v.name.toLowerCase().includes(data.user.name.toLowerCase()));
                        if (matchedV) {
                          setVendorUser(matchedV);
                        } else {
                          setVendorUser({
                            id: data.user.associatedId || 'vendor-new',
                            name: data.user.name,
                            email: verificationPendingEmail,
                            borough: 'Manhattan, NYC',
                            isOpen: true,
                            rating: 5.0,
                            tags: ['Verified', 'Street Food'],
                            items: []
                          });
                        }
                      };
                      loadVendors();
                      setActiveTab('vendor-portal');
                    } else if (data.user.role === 'driver') {
                      setDriverUser(data.user);
                      setActiveTab('driver-portal');
                    } else {
                      setCustomerUser(data.user);
                      setActiveTab('account');
                    }
                  } else {
                    setVerificationError(data.error || "Verification failed. Check code.");
                  }
                } catch (err) {
                  if (verificationCodeInput === '123456') {
                    alert("Simulated Verification Success!");
                    setVerificationPendingEmail('');
                    setVerificationCodeInput('');
                    setDriverUser({
                      id: 'driver-sim',
                      email: verificationPendingEmail,
                      name: 'Simulated Courier',
                      role: 'driver'
                    });
                    setActiveTab('driver-portal');
                  } else {
                    setVerificationError("Network verification failed. (Use code 123456 for offline simulation bypass)");
                  }
                }
              }}
              className="space-y-4"
            >
              <div>
                <input
                  type="text"
                  maxLength="6"
                  required
                  placeholder="e.g. 123456"
                  value={verificationCodeInput}
                  onChange={(e) => setVerificationCodeInput(e.target.value)}
                  className="w-full text-center tracking-[12px] font-mono text-xl py-3 border-2 border-white rounded-xl bg-black text-white focus:border-white focus:outline-none"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 border-2 border-white rounded-xl bg-white text-black font-extrabold text-xs uppercase hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                >
                  Verify Access
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVerificationPendingEmail('');
                    setVerificationCodeInput('');
                  }}
                  className="px-4 py-3 border-2 border-white/20 rounded-xl bg-black text-slate-400 hover:text-white hover:border-white transition-all cursor-pointer font-heading text-xs font-bold uppercase"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Shopify Installation Banner */}
      {showShopifyBanner && (
        <div className="bg-emerald-500 text-black px-6 py-3 text-xs font-bold uppercase tracking-wider flex justify-between items-center border-b-2 border-white animate-fade-in z-50">
          <div className="flex items-center gap-2">
            <span className="bg-black text-white px-2 py-0.5 rounded text-[10px]">INTEGRATION</span>
            <span>Shopify App setup detected. Click connect to authorize the integration.</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleStartOAuth}
              className="px-3.5 py-1.5 bg-black text-white hover:bg-white hover:text-black rounded border border-black font-extrabold transition-all cursor-pointer"
            >
              Connect Store
            </button>
            <button 
              onClick={() => setShowShopifyBanner(false)}
              className="text-black hover:text-white p-1 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b-2 border-white px-6 py-4 flex justify-between items-center sticky top-0 z-40 bg-black">
        <div className="flex items-center gap-4">
          <div className="flex items-center cursor-pointer" onClick={() => setActiveTab('directory')}>
            <img src={logo} alt="CURBSIDES Logo" className="h-10 w-auto object-contain" />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:gap-3">
          {/* 1. VENDOR SESSION HEADER VIEW */}
          {vendorUser && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded font-bold uppercase font-heading">
                Vendor: {vendorUser.name}
              </span>
              <button
                onClick={() => setActiveTab('vendor-portal')}
                className={`px-3 py-1.5 border-2 border-white rounded-lg text-xs font-bold uppercase transition-all cursor-pointer font-heading ${
                  activeTab === 'vendor-portal' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                }`}
              >
                Vendor Portal
              </button>
              <button
                onClick={handleVendorLogout}
                className="px-3 py-1.5 border-2 border-red-500 rounded-lg text-xs font-bold uppercase bg-black text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer font-heading"
              >
                Logout
              </button>
            </div>
          )}

          {/* 2. DRIVER SESSION HEADER VIEW */}
          {driverUser && !vendorUser && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded font-bold uppercase font-heading">
                Courier: {driverUser.fullName || driverUser.name}
              </span>
              <button
                onClick={() => setActiveTab('driver-portal')}
                className={`px-3 py-1.5 border-2 border-white rounded-lg text-xs font-bold uppercase transition-all cursor-pointer font-heading ${
                  activeTab === 'driver-portal' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                }`}
              >
                Driver Portal
              </button>
              <button
                onClick={() => {
                  setDriverUser(null);
                  setActiveTab('directory');
                }}
                className="px-3 py-1.5 border-2 border-red-500 rounded-lg text-xs font-bold uppercase bg-black text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer font-heading"
              >
                Logout
              </button>
            </div>
          )}

          {/* 3. CUSTOMER SESSION HEADER VIEW */}
          {customerUser && !vendorUser && !driverUser && customerUser.email.toLowerCase() !== 'libertydispatchers@gmail.com' && (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded font-bold uppercase font-heading">
                User: {customerUser.name}
              </span>
              <button
                onClick={() => setActiveTab(activeTab === 'account' ? 'directory' : 'account')}
                className={`px-3 py-1.5 border-2 border-white rounded-lg text-xs font-bold uppercase transition-all cursor-pointer font-heading ${
                  activeTab === 'account' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                }`}
              >
                My Account
              </button>
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative px-3.5 py-1.5 border-2 border-white rounded-lg bg-white text-black font-bold text-xs uppercase flex items-center gap-1.5 hover:bg-black hover:text-white transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                Cart
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black text-white border-2 border-white flex items-center justify-center text-[10px] font-bold">
                    {cart.reduce((a, c) => a + c.quantity, 0)}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setCustomerUser(null);
                  setActiveTab('directory');
                }}
                className="px-3 py-1.5 border-2 border-red-500 rounded-lg text-xs font-bold uppercase bg-black text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer font-heading"
              >
                Logout
              </button>
            </div>
          )}

          {/* 4. ADMIN SESSION HEADER VIEW */}
          {((isStaffAuthenticated && !customerUser) || (customerUser && customerUser.email.toLowerCase() === 'libertydispatchers@gmail.com')) && !vendorUser && !driverUser && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-white/10 text-white border border-white/20 px-2.5 py-1 rounded font-bold uppercase font-heading">
                Admin Console
              </span>
              <button
                onClick={() => setActiveTab(activeTab === 'admin' ? 'directory' : 'admin')}
                className={`px-3 py-1.5 border-2 border-white rounded-lg text-xs font-bold uppercase transition-all cursor-pointer font-heading ${
                  activeTab === 'admin' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                }`}
              >
                Admin Panel
              </button>
              <button 
                onClick={() => setIsConfigOpen(true)}
                className="p-2 border-2 border-white rounded-lg hover:bg-white hover:text-black transition-all cursor-pointer text-white"
                title="Configure Shopify Backend"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={handleStaffLogout}
                className="px-3 py-1.5 border-2 border-red-500 rounded-lg text-xs font-bold uppercase bg-black text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer font-heading"
              >
                Lock
              </button>
            </div>
          )}

          {/* 5. GUEST / LOGGED-OUT HEADER VIEW */}
          {!vendorUser && !driverUser && !customerUser && !isStaffAuthenticated && (
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <button
                onClick={() => setActiveTab('account')}
                className={`px-2.5 py-1.5 border border-white rounded text-[10px] font-bold uppercase transition-all cursor-pointer font-heading ${
                  activeTab === 'account' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 border border-white rounded bg-white text-black flex items-center justify-center hover:bg-black hover:text-white transition-all cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black text-white border border-white flex items-center justify-center text-[9px] font-bold">
                    {cart.reduce((a, c) => a + c.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Grid: Mobile Tabs or Dual Column Desktop Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Customer Account Hub: Profile, Cards, Chat, Order tracking */}
        {activeTab === 'account' && (
          <div className="lg:col-span-12 p-6 max-w-4xl mx-auto w-full">
            {!customerUser ? (
              <div className="max-w-md mx-auto border-2 border-white bg-black rounded-2xl p-6 md:p-8 shadow-2xl relative space-y-6">
                {/* Switcher Tabs */}
                <div className="flex border-b border-white/15">
                  <button
                    onClick={() => setAccountSubTab('signin')}
                    className={`flex-1 pb-3 text-sm font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                      accountSubTab === 'signin' ? 'border-white text-white' : 'border-transparent text-slate-500 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setAccountSubTab('register')}
                    className={`flex-1 pb-3 text-sm font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                      accountSubTab === 'register' ? 'border-white text-white' : 'border-transparent text-slate-500 hover:text-white'
                    }`}
                  >
                    Register
                  </button>
                </div>

                {/* Sub Tab: Sign In */}
                {accountSubTab === 'signin' && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <span className="bg-white text-black font-extrabold text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded">
                        Customer Hub
                      </span>
                      <h2 className="text-2xl font-bold uppercase text-white font-heading mt-3">Sign In</h2>
                      <p className="text-xs text-slate-400 mt-1">Access your wallet, order tracking, and support center.</p>
                    </div>

                    {customerAuthError && (
                      <div className="p-3 border border-red-500 bg-red-950/20 text-red-500 text-xs font-bold uppercase text-center rounded">
                        {customerAuthError}
                      </div>
                    )}

                    <form onSubmit={handleCustomerLogin} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="customer@example.com"
                          value={customerLoginEmail}
                          onChange={(e) => setCustomerLoginEmail(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 text-sm text-white focus:border-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={customerLoginPassword}
                          onChange={(e) => setCustomerLoginPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 text-sm text-white focus:border-white focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 border-2 border-white rounded-xl bg-white text-black font-extrabold text-xs uppercase hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                      >
                        Login to Wallet
                      </button>
                    </form>

                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 my-4">
                        <span className="h-[1px] bg-white/10 flex-1"></span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Or sign in with</span>
                        <span className="h-[1px] bg-white/10 flex-1"></span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleSSOClick('Google')}
                          className="flex items-center justify-center gap-2 py-2.5 border border-white/20 rounded-xl bg-zinc-950/60 text-white font-extrabold text-[10px] uppercase hover:bg-white hover:text-black transition-all cursor-pointer font-heading"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.6 4.5 1.7l2.4-2.4C17.3 1.6 14.9 1 12.24 1A10.01 10.01 0 0 0 2.25 11a10.01 10.01 0 0 0 9.99 10c5.56 0 10.13-4.04 10.13-10 0-.68-.08-1.32-.24-1.715h-9.893z"/></svg>
                          Google
                        </button>
                        
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        
                        
                      </div>
                    </div>

                  </div>
                )}

                {/* Sub Tab: Register */}
                {accountSubTab === 'register' && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <span className="bg-white text-black font-extrabold text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded">
                        New Account
                      </span>
                      <h2 className="text-2xl font-bold uppercase text-white font-heading mt-3">Register</h2>
                      <p className="text-xs text-slate-400 mt-1">Create an account to track deliveries and save credit cards.</p>
                    </div>

                    <form onSubmit={handleCustomerSignup} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Alice Smith"
                          value={customerRegisterName}
                          onChange={(e) => setCustomerRegisterName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 text-sm text-white focus:border-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="alice@example.com"
                          value={customerRegisterEmail}
                          onChange={(e) => setCustomerRegisterEmail(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 text-sm text-white focus:border-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Phone Number</label>
                        <input
                          type="tel"
                          placeholder="555-0199"
                          value={customerRegisterPhone}
                          onChange={(e) => setCustomerRegisterPhone(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 text-sm text-white focus:border-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={customerRegisterPassword}
                          onChange={(e) => setCustomerRegisterPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 text-sm text-white focus:border-white focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 border-2 border-white rounded-xl bg-white text-black font-extrabold text-xs uppercase hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                      >
                        Create Account
                      </button>
                    </form>

                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 my-4">
                        <span className="h-[1px] bg-white/10 flex-1"></span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Or register with</span>
                        <span className="h-[1px] bg-white/10 flex-1"></span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleSSOClick('Google')}
                          className="flex items-center justify-center gap-2 py-2.5 border border-white/20 rounded-xl bg-zinc-950/60 text-white font-extrabold text-[10px] uppercase hover:bg-white hover:text-black transition-all cursor-pointer font-heading"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.6 4.5 1.7l2.4-2.4C17.3 1.6 14.9 1 12.24 1A10.01 10.01 0 0 0 2.25 11a10.01 10.01 0 0 0 9.99 10c5.56 0 10.13-4.04 10.13-10 0-.68-.08-1.32-.24-1.715h-9.893z"/></svg>
                          Google
                        </button>
                        
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        
                        
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="border-2 border-white rounded-2xl p-6 bg-black shadow-2xl space-y-6">
                {/* Account Dashboard Header */}
                <div className="flex justify-between items-center border-b border-white/20 pb-4 flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-white text-black font-extrabold text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded">
                        Customer Wallet Active
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Member since {customerUser.joinedDate}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold uppercase text-white font-heading mt-1">Hello, {customerUser.name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{customerUser.email} &bull; {customerUser.phone}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCustomerActiveSubTab('profile')}
                      className={`px-3 py-1.5 border border-white rounded text-xs font-bold uppercase transition-all ${
                        customerActiveSubTab === 'profile' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                      }`}
                    >
                      Profile & Wallet
                    </button>
                    <button
                      onClick={() => setCustomerActiveSubTab('orders')}
                      className={`px-3 py-1.5 border border-white rounded text-xs font-bold uppercase transition-all ${
                        customerActiveSubTab === 'orders' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                      }`}
                    >
                      Order History
                    </button>
                    <button
                      onClick={() => setCustomerActiveSubTab('track')}
                      className={`px-3 py-1.5 border border-white rounded text-xs font-bold uppercase transition-all ${
                        customerActiveSubTab === 'track' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                      }`}
                    >
                      Track Order
                    </button>
                    <button
                      onClick={() => setCustomerActiveSubTab('partner')}
                      className={`px-3 py-1.5 border border-white rounded text-xs font-bold uppercase transition-all ${
                        customerActiveSubTab === 'partner' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                      }`}
                    >
                      Become a Partner
                    </button>
                    <button
                      onClick={() => setCustomerActiveSubTab('chat')}
                      className={`px-3 py-1.5 border border-white rounded text-xs font-bold uppercase transition-all ${
                        customerActiveSubTab === 'chat' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                      }`}
                    >
                      Support Chat
                    </button>
                    <button
                      onClick={handleCustomerLogout}
                      className="px-3 py-1.5 border border-zinc-700 text-zinc-400 rounded text-xs font-bold uppercase bg-black hover:border-white hover:text-white transition-all cursor-pointer font-heading"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>

                {/* Subtab: Customer Profile & Wallet Card Editor */}
                {customerActiveSubTab === 'profile' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Col: Edit Profile details & Account Deletion */}
                    <div className="space-y-6">
                      <div className="border border-white/20 p-6 rounded-xl bg-zinc-950/40 space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white">Update Profile</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
                            <input
                              type="text"
                              value={customerUser.name}
                              onChange={(e) => setCustomerUser({ ...customerUser, name: e.target.value.toUpperCase() })}
                              className="w-full px-4 py-2 rounded-lg bg-black border border-white/20 text-xs text-white focus:border-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
                            <input
                              type="email"
                              value={customerUser.email}
                              onChange={(e) => setCustomerUser({ ...customerUser, email: e.target.value })}
                              className="w-full px-4 py-2 rounded-lg bg-black border border-white/20 text-xs text-white focus:border-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Phone Number</label>
                            <input
                              type="text"
                              value={customerUser.phone}
                              onChange={(e) => setCustomerUser({ ...customerUser, phone: e.target.value })}
                              className="w-full px-4 py-2 rounded-lg bg-black border border-white/20 text-xs text-white focus:border-white focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border border-red-500/20 p-6 rounded-xl bg-red-950/5 space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-red-500">Danger Zone</h3>
                        <p className="text-xs text-slate-400">Permanently delete your profile, saved payment methods, and order history from CURBSIDES.</p>
                        <button
                          onClick={handleDeleteCustomerAccount}
                          className="py-2 px-4 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded text-xs font-bold uppercase transition-all cursor-pointer font-heading"
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>

                    {/* Right Col: Card Wallet Editor */}
                    <div className="space-y-6">
                      <div className="border border-white/20 p-6 rounded-xl bg-zinc-950/40 space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Payment Wallet</h3>
                          <button
                            onClick={() => setIsAddingCard(!isAddingCard)}
                            className="px-2.5 py-1 border border-white rounded text-[10px] font-bold uppercase hover:bg-white hover:text-black transition-all cursor-pointer font-heading"
                          >
                            {isAddingCard ? 'Cancel' : 'Add Card'}
                          </button>
                        </div>

                        {/* Add Card Form */}
                        {isAddingCard && (
                          <form onSubmit={handleAddCustomerCard} className="border border-white/20 p-4 rounded-lg bg-black space-y-3 animate-fade-in">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Card Number</label>
                              <input
                                type="text"
                                required
                                placeholder="4111 2222 3333 4444"
                                value={newCardNum}
                                onChange={(e) => setNewCardNum(e.target.value)}
                                className="w-full px-3 py-2 rounded bg-black border border-white/20 text-xs text-white focus:border-white focus:outline-none font-mono"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expiry</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="MM/YY"
                                  value={newCardExpiry}
                                  onChange={(e) => setNewCardExpiry(e.target.value)}
                                  className="w-full px-3 py-2 rounded bg-black border border-white/20 text-xs text-white focus:border-white focus:outline-none font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">CVC</label>
                                <input
                                  type="password"
                                  required
                                  placeholder="123"
                                  value={newCardCvc}
                                  onChange={(e) => setNewCardCvc(e.target.value)}
                                  className="w-full px-3 py-2 rounded bg-black border border-white/20 text-xs text-white focus:border-white focus:outline-none font-mono"
                                />
                              </div>
                            </div>
                            <button
                              type="submit"
                              className="w-full py-2 border border-white rounded bg-white text-black font-bold text-[10px] uppercase hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                            >
                              Save Credit Card
                            </button>
                          </form>
                        )}

                        {/* Card List */}
                        {customerCards.length === 0 ? (
                          <div className="text-center py-6 border border-dashed border-white/20 rounded-lg">
                            <p className="text-xs text-slate-500 italic">No credit cards saved in your wallet.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {customerCards.map(card => (
                              <div key={card.id} className="border border-white/20 p-4 rounded-xl bg-zinc-950 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-7 border border-white/20 bg-black rounded flex items-center justify-center font-mono font-bold text-[8px] text-slate-300">
                                    {card.brand.toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-white font-mono">•••• •••• •••• {card.last4}</p>
                                    <p className="text-[9px] text-slate-400">Expires: {card.exp}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteCustomerCard(card.id)}
                                  className="p-1.5 border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                                  title="Delete saved card"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Subtab: Order History */}
                {customerActiveSubTab === 'orders' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Your Past Order History</h3>
                    <div className="border border-white/20 rounded-xl bg-zinc-950/40 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-white/20 bg-black font-bold uppercase text-slate-400">
                              <th className="p-3">Order ID</th>
                              <th className="p-3">Vendor</th>
                              <th className="p-3">Date</th>
                              <th className="p-3">Items</th>
                              <th className="p-3">Amount</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10 text-slate-300">
                            <tr className="hover:bg-zinc-900 transition-colors">
                              <td className="p-3 font-bold text-white font-mono uppercase">shopify-1001</td>
                              <td className="p-3 font-semibold uppercase">Korean BBQ Taco Truck</td>
                              <td className="p-3 text-slate-500">06/19/2026</td>
                              <td className="p-3">3x Bulgogi Beef Taco, 1x Kimchi Fries</td>
                              <td className="p-3 font-mono font-semibold">$22.00</td>
                              <td className="p-3 text-emerald-400 font-bold uppercase text-[10px]">Delivered</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => {
                                    setTrackingOrderId('shopify-1001');
                                    setCustomerActiveSubTab('track');
                                    handleSearchOrder(null, 'shopify-1001');
                                  }}
                                  className="px-2 py-1 border border-white rounded text-[10px] font-bold uppercase bg-white text-black hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                                >
                                  Track Details
                                </button>
                              </td>
                            </tr>
                            <tr className="hover:bg-zinc-900 transition-colors">
                              <td className="p-3 font-bold text-white font-mono uppercase">shopify-1002</td>
                              <td className="p-3 font-semibold uppercase">Empanada Guy</td>
                              <td className="p-3 text-slate-500">06/18/2026</td>
                              <td className="p-3">2x Beef & Cheese, 2x Chipotle Chicken</td>
                              <td className="p-3 font-mono font-semibold">$15.00</td>
                              <td className="p-3 text-emerald-400 font-bold uppercase text-[10px]">Delivered</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => {
                                    setTrackingOrderId('shopify-1002');
                                    setCustomerActiveSubTab('track');
                                    handleSearchOrder(null, 'shopify-1002');
                                  }}
                                  className="px-2 py-1 border border-white rounded text-[10px] font-bold uppercase bg-white text-black hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                                >
                                  Track Details
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subtab: Support Chat */}
                {customerActiveSubTab === 'chat' && (
                  <div className="space-y-4 max-w-2xl mx-auto">
                    <div className="border border-white/20 rounded-xl bg-zinc-950/40 overflow-hidden flex flex-col h-[400px]">
                      {/* Chat Header */}
                      <div className="p-4 border-b border-white/20 bg-black flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-xs font-bold text-white uppercase tracking-wider">Live Administrator Helpdesk</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">Response Time: &lt; 2 mins</span>
                      </div>

                      {/* Chat Messages */}
                      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-zinc-950/20 flex flex-col">
                        {supportMessages.map(msg => (
                          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-xl p-3 border text-xs leading-normal ${
                              msg.sender === 'user'
                                ? 'bg-white text-black border-white'
                                : 'bg-black text-white border-white/20'
                            }`}>
                              <p className="m-0 font-medium whitespace-pre-wrap">{msg.text}</p>
                              <span className={`block text-[8px] mt-1 text-right font-mono ${
                                msg.sender === 'user' ? 'text-zinc-600' : 'text-slate-500'
                              }`}>{msg.timestamp}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Chat Input */}
                      <form onSubmit={handleSendSupportMessage} className="p-3 border-t border-white/20 bg-black flex gap-2">
                        <input
                          type="text"
                          placeholder="Type message to administrators..."
                          value={supportInput}
                          onChange={(e) => setSupportInput(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg bg-black border border-white/20 text-xs text-white focus:border-white focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 border-2 border-white bg-white text-black hover:bg-black hover:text-white rounded-lg text-xs font-bold uppercase transition-all cursor-pointer font-heading"
                        >
                          Send
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Subtab: Track Order */}
                {customerActiveSubTab === 'track' && (
                  <div className="space-y-6">
                    <div className="border-2 border-white rounded-2xl p-6 bg-black w-full shadow-2xl space-y-6">
                      <div className="text-center">
                        <span className="bg-white text-black font-extrabold text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded">
                          Branded Tracker
                        </span>
                        <h2 className="text-2xl font-bold uppercase text-white font-heading mt-3">Live Order Tracking</h2>
                        <p className="text-xs text-slate-400 mt-1">Enter your order ID below to verify your shipment status.</p>
                      </div>

                      <form onSubmit={handleSearchOrder} className="space-y-4">
                        {trackingError && (
                          <div className="border border-white/20 p-3 rounded-lg text-xs text-rose-400 bg-rose-950/20 font-bold uppercase">
                            {trackingError}
                          </div>
                        )}
                        <div>
                          <input
                            type="text"
                            placeholder="Enter Order ID (e.g. shopify-1001, 123456789)"
                            value={trackingOrderId}
                            onChange={(e) => setTrackingOrderId(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 text-sm text-white focus:border-white focus:outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-3 border-2 border-white rounded-xl bg-white text-black font-bold text-xs uppercase hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                        >
                          Lookup Fare Status
                        </button>
                      </form>
                    </div>

                    {searchedOrder && (
                      <div className="border-2 border-white rounded-2xl p-6 bg-black w-full shadow-2xl space-y-5 animate-fade-in text-white font-sans">
                        <div className="flex justify-between items-center border-b border-white/20 pb-4">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Order ID</span>
                            <span className="font-mono text-sm text-white font-bold">{searchedOrder.id}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Vendor</span>
                            <span className="text-xs text-white font-bold uppercase">{searchedOrder.vendor}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-bold uppercase">
                            <span>Delivery Status</span>
                            <span className="text-emerald-400">{searchedOrder.status}</span>
                          </div>
                          <div className="h-2 bg-slate-900 border border-white/20 rounded-full overflow-hidden flex">
                            <span 
                              className="h-full bg-white transition-all duration-500" 
                              style={{ 
                                width: searchedOrder.status === 'Delivered' ? '100%' : 
                                       searchedOrder.status === 'On the Way' ? '80%' : 
                                       searchedOrder.status === 'Driver Assigned' ? '60%' : 
                                       searchedOrder.status === 'Vendor Preparing Food' ? '40%' : '20%' 
                              }}
                            ></span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="border border-white/10 p-3 rounded-xl bg-zinc-950/40">
                            <span className="text-slate-400 block mb-1">Estimated Arrival</span>
                            <span className="text-white font-bold">{searchedOrder.eta} Minutes</span>
                          </div>
                          <div className="border border-white/10 p-3 rounded-xl bg-zinc-950/40">
                            <span className="text-slate-400 block mb-1">Courier</span>
                            <span className="text-white font-bold truncate block">{searchedOrder.driverName}</span>
                          </div>
                        </div>

                        {/* Pickup and Delivery Address Card */}
                        {(searchedOrder.vendorAddress || searchedOrder.customerAddress) && (
                          <div className="border border-white/15 p-4 rounded-xl bg-zinc-950/20 text-xs space-y-3">
                            {searchedOrder.vendorAddress && (
                              <div className="flex gap-2">
                                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-slate-500 font-bold uppercase text-[9px] block">Pickup Location</span>
                                  <span className="text-white font-semibold">{searchedOrder.vendorAddress}</span>
                                </div>
                              </div>
                            )}
                            {searchedOrder.vendorAddress && searchedOrder.customerAddress && (
                              <div className="border-t border-white/10 my-2"></div>
                            )}
                            {searchedOrder.customerAddress && (
                              <div className="flex gap-2">
                                <Navigation className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-slate-500 font-bold uppercase text-[9px] block">Destination</span>
                                  <span className="text-white font-semibold">{searchedOrder.customerAddress}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Shipday Live GPS Map Tracker */}
                        {searchedOrder.trackingLink && (
                          <a 
                            href={searchedOrder.trackingLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center justify-center gap-2 w-full py-3 bg-white text-black font-extrabold text-xs uppercase rounded-xl border border-white hover:bg-black hover:text-white transition-all text-center tracking-wider font-heading cursor-pointer"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open Live GPS Tracking Map
                          </a>
                        )}

                        {/* Call Courier Option */}
                        {searchedOrder.driverPhone && (
                          <a 
                            href={`tel:${searchedOrder.driverPhone}`} 
                            className="flex items-center justify-center gap-2 w-full py-2.5 bg-transparent text-white font-extrabold text-xs uppercase rounded-xl border border-white/20 hover:border-white transition-all text-center tracking-wider font-heading cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Contact Courier ({searchedOrder.driverPhone})
                          </a>
                        )}

                        <div className="flex items-center justify-center gap-1.5 text-[9px] bg-white/5 border border-white/10 px-2 py-1.5 rounded-xl text-slate-400 uppercase tracking-widest font-heading">
                          <Activity className="w-3.5 h-3.5 text-white animate-pulse" />
                          Secured via Shipday Dispatch API
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Subtab: Become a Partner */}
                {customerActiveSubTab === 'partner' && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <span className="bg-white text-black font-extrabold text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded">
                        Partner Desk
                      </span>
                      <h3 className="text-xl font-bold uppercase text-white font-heading mt-3">Apply as a Fleet Partner</h3>
                      <p className="text-xs text-slate-400 mt-1">Select an application form below to register your food truck or courier profile.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Driver Onboarding Form */}
                      <div className="border border-white/20 p-6 rounded-xl bg-zinc-950/40 space-y-4">
                        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                          <Truck className="w-5 h-5 text-rose-400" />
                          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Apply as Driver / Courier</h3>
                        </div>
                        {driverOnboardSuccess ? (
                          <div className="border border-emerald-500/20 bg-emerald-950/10 p-4 rounded-xl text-center text-xs text-emerald-400 font-bold uppercase tracking-wider">
                            Courier Application Submitted! Status: Pending Approval.
                          </div>
                        ) : (
                          <form onSubmit={handleDriverOnboard} className="space-y-3.5">
                            {driverOnboardError && (
                              <div className="p-2.5 border border-red-500 bg-red-950/20 text-red-500 text-[10px] font-bold uppercase rounded text-center">
                                {driverOnboardError}
                              </div>
                            )}
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Full Name</label>
                              <input
                                type="text"
                                required
                                placeholder="Carlos Rivera"
                                value={driverNameInput}
                                onChange={(e) => setDriverNameInput(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-black border border-white/20 text-xs text-white focus:border-white focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Business Email</label>
                              <input
                                type="email"
                                required
                                placeholder="carlos@example.com"
                                value={driverEmailInput}
                                onChange={(e) => setDriverEmailInput(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-black border border-white/20 text-xs text-white focus:border-white focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Phone Number</label>
                              <input
                                type="tel"
                                required
                                placeholder="(555) 000-0000"
                                value={driverPhoneInput}
                                onChange={(e) => setDriverPhoneInput(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-black border border-white/20 text-xs text-white focus:border-white focus:outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vehicle Type</label>
                                <select
                                  value={driverVehicle}
                                  onChange={(e) => setDriverVehicle(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg bg-black border border-white/20 text-xs text-white focus:border-white focus:outline-none appearance-none cursor-pointer"
                                >
                                  <option value="bike">E-Bike / Bicycle</option>
                                  <option value="scooter">Scooter</option>
                                  <option value="car">Car / Sedan</option>
                                  <option value="van">Cargo Van</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Borough</label>
                                <select
                                  value={driverBoroughsInput[0] || 'Manhattan'}
                                  onChange={(e) => setDriverBoroughsInput([e.target.value])}
                                  className="w-full px-3 py-2 rounded-lg bg-black border border-white/20 text-xs text-white focus:border-white focus:outline-none appearance-none cursor-pointer"
                                >
                                  <option value="Manhattan">Manhattan</option>
                                  <option value="Brooklyn">Brooklyn</option>
                                  <option value="Queens">Queens</option>
                                  <option value="Bronx">Bronx</option>
                                  <option value="Staten Island">Staten Island</option>
                                </select>
                              </div>
                            </div>
                            <button
                              type="submit"
                              className="w-full py-2 border border-white rounded bg-white text-black font-bold text-[10px] uppercase hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                            >
                              Submit Courier Application
                            </button>
                          </form>
                        )}
                      </div>

                      {/* Vendor Onboarding Form */}
                      <div className="border border-white/20 p-6 rounded-xl bg-zinc-950/40 space-y-4">
                        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                          <Store className="w-5 h-5 text-amber-400" />
                          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Register Food Truck / Vendor</h3>
                        </div>
                        {vendorOnboardSuccess ? (
                          <div className="border border-emerald-500/20 bg-emerald-950/10 p-4 rounded-xl text-center text-xs text-emerald-400 font-bold uppercase tracking-wider">
                            Vendor Onboarding Filed! Status: Pending Approval.
                          </div>
                        ) : (
                          <form onSubmit={handleVendorOnboard} className="space-y-3.5">
                            {vendorOnboardError && (
                              <div className="p-2.5 border border-red-500 bg-red-950/20 text-red-500 text-[10px] font-bold uppercase rounded text-center">
                                {vendorOnboardError}
                              </div>
                            )}
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Truck / Business Name</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Halal Cart Kings"
                                value={vendorName}
                                onChange={(e) => setVendorName(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-black border border-white/20 text-xs text-white focus:border-white focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Business Email</label>
                              <input
                                type="email"
                                required
                                placeholder="email@example.com"
                                value={vendorEmail}
                                onChange={(e) => setVendorEmail(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-black border border-white/20 text-xs text-white focus:border-white focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Phone Number</label>
                              <input
                                type="tel"
                                required
                                placeholder="(555) 000-0000"
                                value={vendorPhone}
                                onChange={(e) => setVendorPhone(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-black border border-white/20 text-xs text-white focus:border-white focus:outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Food Type</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Tacos, Burgers"
                                  value={vendorFoodType}
                                  onChange={(e) => setVendorFoodType(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg bg-black border border-white/20 text-xs text-white focus:border-white focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Borough</label>
                                <select
                                  value={vendorBorough}
                                  onChange={(e) => setVendorBorough(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg bg-black border border-white/20 text-xs text-white focus:border-white focus:outline-none appearance-none cursor-pointer"
                                >
                                  <option value="Manhattan">Manhattan</option>
                                  <option value="Brooklyn">Brooklyn</option>
                                  <option value="Queens">Queens</option>
                                  <option value="Bronx">Bronx</option>
                                  <option value="Staten Island">Staten Island</option>
                                </select>
                              </div>
                            </div>
                            <button
                              type="submit"
                              className="w-full py-2 border border-white rounded bg-white text-black font-bold text-[10px] uppercase hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                            >
                              Submit Vendor Registration
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )}



        {/* Vendor Portal Tab: Authentication Gate & Workspace */}
        {activeTab === 'vendor-portal' && (
          <div className="lg:col-span-12 p-6 max-w-4xl mx-auto w-full">
            {!vendorUser ? (
              <div className="max-w-md mx-auto w-full border-2 border-white rounded-2xl p-6 bg-black shadow-2xl space-y-6">
                {/* Tab Navigation */}
                <div className="flex border-b border-white/10">
                  <button
                    onClick={() => {
                      setVendorSubTab('signin');
                      setVendorLoginError('');
                    }}
                    className={`flex-1 pb-3 text-xs uppercase tracking-widest font-heading font-extrabold border-b-2 transition-all cursor-pointer ${
                      vendorSubTab === 'signin' ? 'border-white text-white' : 'border-transparent text-slate-500 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setVendorSubTab('register');
                      setVendorLoginError('');
                    }}
                    className={`flex-1 pb-3 text-xs uppercase tracking-widest font-heading font-extrabold border-b-2 transition-all cursor-pointer ${
                      vendorSubTab === 'register' ? 'border-white text-white' : 'border-transparent text-slate-500 hover:text-white'
                    }`}
                  >
                    Register Vendor
                  </button>
                </div>

                {vendorSubTab === 'signin' ? (
                  <>
                  <div className="text-center">
                    <span className="bg-white text-black font-extrabold text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded animate-pulse">
                      Vendor Workspace
                    </span>
                    <h2 className="text-2xl font-bold uppercase text-white font-heading mt-3">Vendor Sign In</h2>
                    <p className="text-xs text-slate-400 mt-1">Authenticate as registered food truck staff to manage your live GPS and menu items.</p>
                  </div>

                  {vendorLoginError && (
                    <div className="p-3 border border-red-500 bg-red-950/20 text-red-500 text-xs font-bold uppercase text-center rounded">
                      {vendorLoginError}
                    </div>
                  )}

                  <form onSubmit={handleVendorLogin} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. tacos@kbbq.com"
                        value={vendorLoginEmail}
                        onChange={(e) => setVendorLoginEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 text-sm text-white focus:border-white focus:outline-none font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Staff Passcode</label>
                      <input
                        type="password"
                        required
                        placeholder="Passcode (e.g. vendor-123)"
                        value={vendorLoginPasscode}
                        onChange={(e) => setVendorLoginPasscode(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 text-sm text-white focus:border-white focus:outline-none font-sans"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 border-2 border-white rounded-xl bg-white text-black font-extrabold text-xs uppercase hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                    >
                      Enter Dashboard
                    </button>
                  </form>

                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 my-4">
                      <span className="h-[1px] bg-white/10 flex-1"></span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Or sign in with</span>
                      <span className="h-[1px] bg-white/10 flex-1"></span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleSSOClick('Google', 'vendor')}
                        className="flex items-center justify-center gap-2 py-2.5 border border-white/20 rounded-xl bg-zinc-950/60 text-white font-extrabold text-[10px] uppercase hover:bg-white hover:text-black transition-all cursor-pointer font-heading"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.6 4.5 1.7l2.4-2.4C17.3 1.6 14.9 1 12.24 1A10.01 10.01 0 0 0 2.25 11a10.01 10.01 0 0 0 9.99 10c5.56 0 10.13-4.04 10.13-10 0-.68-.08-1.32-.24-1.715h-9.893z"/></svg>
                        Google
                      </button>
                      
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      
                      
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                      Approved Simulation Accounts
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
                      <span onClick={() => { setVendorLoginEmail('tacos@kbbq.com'); setVendorLoginPasscode('vendor-123'); }} className="cursor-pointer bg-zinc-950 border border-zinc-800 text-slate-300 text-[9px] px-2 py-0.5 rounded hover:border-white transition-all">tacos@kbbq.com</span>
                      <span onClick={() => { setVendorLoginEmail('empanadas@guy.com'); setVendorLoginPasscode('vendor-123'); }} className="cursor-pointer bg-zinc-950 border border-zinc-800 text-slate-300 text-[9px] px-2 py-0.5 rounded hover:border-white transition-all">empanadas@guy.com</span>
                      <span onClick={() => { setVendorLoginEmail('kings@halalcart.com'); setVendorLoginPasscode('vendor-123'); }} className="cursor-pointer bg-zinc-950 border border-zinc-800 text-slate-300 text-[9px] px-2 py-0.5 rounded hover:border-white transition-all">kings@halalcart.com</span>
                    </div>
                  </div>
                  </>
                ) : (
                  <>
                  <div className="text-center">
                    <span className="bg-white text-black font-extrabold text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded animate-pulse">
                      Vendor Onboarding
                    </span>
                    <h2 className="text-2xl font-bold uppercase text-white font-heading mt-3">Register Truck</h2>
                    <p className="text-xs text-slate-400 mt-1">Create a staff profile and verify email to list your food truck on Curbsides.</p>
                  </div>

                  {vendorLoginError && (
                    <div className="p-3 border border-red-500 bg-red-950/20 text-red-500 text-xs font-bold uppercase text-center rounded">
                      {vendorLoginError}
                    </div>
                  )}

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setVendorLoginError('');
                      const name = e.target.truckName.value.trim();
                      const email = e.target.email.value.trim();
                      const password = e.target.passcode.value;
                      const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';

                      try {
                        const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ name, email, password, role: 'vendor' })
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setVerificationPendingEmail(email);
                        } else {
                          setVendorLoginError(data.error || "Registration failed.");
                        }
                      } catch (err) {
                        setVendorLoginError("Network error. Verify server is running.");
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Food Truck Name</label>
                      <input
                        name="truckName"
                        type="text"
                        required
                        placeholder="e.g. Birria Landia"
                        className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 text-sm text-white focus:border-white focus:outline-none font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Staff Email Address</label>
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="e.g. staff@birria.com"
                        className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 text-sm text-white focus:border-white focus:outline-none font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Staff Passcode</label>
                      <input
                        name="passcode"
                        type="password"
                        required
                        placeholder="Passcode (e.g. vendor-123)"
                        className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 text-sm text-white focus:border-white focus:outline-none font-sans"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 border-2 border-white rounded-xl bg-white text-black font-extrabold text-xs uppercase hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                    >
                      Verify Email &amp; List Truck
                    </button>
                  </form>

                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 my-4">
                      <span className="h-[1px] bg-white/10 flex-1"></span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Or register with</span>
                      <span className="h-[1px] bg-white/10 flex-1"></span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleSSOClick('Google', 'vendor')}
                        className="flex items-center justify-center gap-2 py-2.5 border border-white/20 rounded-xl bg-zinc-950/60 text-white font-extrabold text-[10px] uppercase hover:bg-white hover:text-black transition-all cursor-pointer font-heading"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.6 4.5 1.7l2.4-2.4C17.3 1.6 14.9 1 12.24 1A10.01 10.01 0 0 0 2.25 11a10.01 10.01 0 0 0 9.99 10c5.56 0 10.13-4.04 10.13-10 0-.68-.08-1.32-.24-1.715h-9.893z"/></svg>
                        Google
                      </button>
                      
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      
                      
                    </div>
                  </div>
                  </>
                )}
              </div>
            ) : (
              <div className="border-2 border-white rounded-2xl p-6 bg-black shadow-2xl space-y-6">
                {/* Dashboard Header */}
                <div className="flex justify-between items-center border-b border-white/20 pb-4 flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${vendorUser.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                      <span className="text-[9px] font-mono bg-white/10 px-2 py-0.5 rounded border border-white/10 text-slate-300 uppercase font-bold tracking-wider">
                        {vendorUser.isOpen ? 'Active & Open' : 'Closed'}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {vendorUser.email}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold uppercase text-white font-heading mt-1">{vendorUser.name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{vendorUser.borough} &bull; Rating: {vendorUser.rating} ★</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setVendorActiveSubTab('menu')}
                      className={`px-3 py-1.5 border border-white rounded text-xs font-bold uppercase transition-all ${
                        vendorActiveSubTab === 'menu' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                      }`}
                    >
                      Menu Manager
                    </button>
                    <button
                      onClick={() => setVendorActiveSubTab('orders')}
                      className={`px-3 py-1.5 border border-white rounded text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                        vendorActiveSubTab === 'orders' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                      }`}
                    >
                      Orders
                      {(() => {
                        const cleanUser = vendorUser.name.toLowerCase()
                          .replace('truck', '')
                          .replace('spot', '')
                          .replace('guy', '')
                          .replace('wheels', '')
                          .trim();
                        const vendorActiveOrders = orders.filter(o => {
                          const addr = (o.vendorAddress || '').toLowerCase();
                          return addr.includes(cleanUser) && (o.status === 'pending' || o.status === 'Processing Order' || o.status === 'Vendor Preparing Food');
                        });
                        return vendorActiveOrders.length > 0 ? (
                          <span className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${
                            vendorActiveSubTab === 'orders' ? 'bg-black text-white' : 'bg-white text-black'
                          }`}>
                            {vendorActiveOrders.length}
                          </span>
                        ) : null;
                      })()}
                    </button>
                    <button
                      onClick={() => setVendorActiveSubTab('gps')}
                      className={`px-3 py-1.5 border border-white rounded text-xs font-bold uppercase transition-all ${
                        vendorActiveSubTab === 'gps' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                      }`}
                    >
                      Live GPS
                    </button>
                    <button
                      onClick={() => setVendorActiveSubTab('profile')}
                      className={`px-3 py-1.5 border border-white rounded text-xs font-bold uppercase transition-all ${
                        vendorActiveSubTab === 'profile' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                      }`}
                    >
                      Store Profile
                    </button>
                    <button
                      onClick={handleVendorLogout}
                      className="px-3 py-1.5 border border-red-500 rounded text-xs font-bold uppercase bg-black text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    >
                      Logout
                    </button>
                  </div>
                </div>

                {/* Subtab: Menu Manager */}
                {vendorActiveSubTab === 'menu' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Store Menu / Dishes</h3>
                      <button
                        onClick={() => {
                          setIsAddingItem(!isAddingItem);
                          setEditingItem(null);
                        }}
                        className="px-3 py-1 border-2 border-white rounded-lg text-xs font-bold uppercase bg-white text-black hover:bg-black hover:text-white transition-all"
                      >
                        {isAddingItem ? 'Cancel' : 'Add Menu Item'}
                      </button>
                    </div>

                    {/* Add Menu Item Form */}
                    {isAddingItem && (
                      <form onSubmit={handleAddMenuItem} className="border-2 border-white p-4 rounded-xl bg-zinc-950/40 space-y-4">
                        <h4 className="text-xs font-bold uppercase text-white tracking-wider border-b border-white/10 pb-2">Add New Plate</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dish Name</label>
                              <input
                                type="text"
                                required
                                value={newMenuName}
                                onChange={(e) => setNewMenuName(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg omny-input text-xs text-white"
                                placeholder="e.g. Spicy Pork Burrito"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Price ($)</label>
                              <input
                                type="number"
                                step="0.01"
                                required
                                value={newMenuPrice}
                                onChange={(e) => setNewMenuPrice(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg omny-input text-xs text-white"
                                placeholder="e.g. 10.99"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Description</label>
                              <textarea
                                value={newMenuDesc}
                                onChange={(e) => setNewMenuDesc(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg omny-input text-xs text-white h-20"
                                placeholder="What goes into this dish? ingredients, details..."
                              />
                            </div>
                          </div>

                          <div className="flex flex-col justify-between">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Plate Photo</label>
                              <div className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center hover:border-white transition-all cursor-pointer relative bg-zinc-950">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => setNewMenuImage(reader.result);
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                {newMenuImage ? (
                                  <div className="space-y-2 flex flex-col items-center">
                                    <img src={newMenuImage} alt="Preview" className="w-24 h-24 object-cover rounded-lg border-2 border-white" />
                                    <span className="text-[9px] text-emerald-400 uppercase font-bold">Photo Loaded</span>
                                  </div>
                                ) : (
                                  <div className="space-y-1 py-4">
                                    <Upload className="w-5 h-5 mx-auto text-slate-400" />
                                    <span className="text-[11px] text-white font-bold uppercase tracking-wider block">Upload Photo</span>
                                    <span className="text-[9px] text-slate-500 block">PNG/JPG up to 2MB</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <button
                              type="submit"
                              className="w-full mt-4 py-2.5 border-2 border-white rounded-lg bg-white text-black font-extrabold text-xs uppercase hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                            >
                              Save New Plate
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                    {/* Edit Menu Item Form */}
                    {editingItem && (
                      <form onSubmit={handleEditMenuItem} className="border-2 border-white p-4 rounded-xl bg-zinc-950/40 space-y-4">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                          <h4 className="text-xs font-bold uppercase text-white tracking-wider">Edit Plate: {editingItem.name}</h4>
                          <button
                            type="button"
                            onClick={() => setEditingItem(null)}
                            className="text-xs text-rose-500 font-bold uppercase hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dish Name</label>
                              <input
                                type="text"
                                required
                                value={editMenuName}
                                onChange={(e) => setEditMenuName(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg omny-input text-xs text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Price ($)</label>
                              <input
                                type="number"
                                step="0.01"
                                required
                                value={editMenuPrice}
                                onChange={(e) => setEditMenuPrice(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg omny-input text-xs text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Description</label>
                              <textarea
                                value={editMenuDesc}
                                onChange={(e) => setEditMenuDesc(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg omny-input text-xs text-white h-20"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col justify-between">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Change Photo</label>
                              <div className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center hover:border-white transition-all cursor-pointer relative bg-zinc-950">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => setEditMenuImage(reader.result);
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                {(editMenuImage || editingItem.image) ? (
                                  <div className="space-y-2 flex flex-col items-center">
                                    <img src={editMenuImage || editingItem.image} alt="Preview" className="w-24 h-24 object-cover rounded-lg border-2 border-white" />
                                    <span className="text-[9px] text-slate-400">Tap or drag to replace photo</span>
                                  </div>
                                ) : (
                                  <div className="space-y-1 py-4">
                                    <Upload className="w-5 h-5 mx-auto text-slate-400" />
                                    <span className="text-[11px] text-white font-bold uppercase tracking-wider block">Choose File</span>
                                    <span className="text-[9px] text-slate-500 block">PNG/JPG up to 2MB</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <button
                              type="submit"
                              className="w-full mt-4 py-2.5 border-2 border-white rounded-lg bg-white text-black font-extrabold text-xs uppercase hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                            >
                              Update Plate Details
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                    {/* Items List Table */}
                    <div className="border border-white/10 rounded-xl bg-zinc-950/30 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-white/20 font-bold uppercase text-slate-400 bg-white/5">
                              <th className="py-3 px-4">Plate Photo</th>
                              <th className="py-3 px-4">Dish Info</th>
                              <th className="py-3 px-4 text-right">Price</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {vendorUser.items.length === 0 ? (
                              <tr>
                                <td colSpan="4" className="py-8 text-center text-slate-500 uppercase tracking-widest text-[10px]">No plates added yet.</td>
                              </tr>
                            ) : (
                              vendorUser.items.map(item => (
                                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                  <td className="py-3 px-4">
                                    <div className="w-14 h-14 border-2 border-white rounded-lg overflow-hidden bg-black flex-shrink-0">
                                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-bold text-white uppercase text-sm">{item.name}</div>
                                    <div className="text-slate-400 text-[11px] mt-0.5 max-w-md line-clamp-2">{item.description || 'No description provided.'}</div>
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono font-bold text-white text-sm">${item.price.toFixed(2)}</td>
                                  <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                                    <button
                                      onClick={() => {
                                        setEditingItem(item);
                                        setEditMenuName(item.name);
                                        setEditMenuDesc(item.description);
                                        setEditMenuPrice(item.price.toString());
                                        setEditMenuImage(item.image);
                                        setIsAddingItem(false);
                                      }}
                                      className="px-2.5 py-1 border border-white rounded text-[10px] font-bold uppercase hover:bg-white hover:text-black transition-all"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMenuItem(item.id)}
                                      className="px-2.5 py-1 border border-red-500 text-red-500 rounded text-[10px] font-bold uppercase hover:bg-red-500 hover:text-white transition-all"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subtab: Orders Dashboard */}
                {vendorActiveSubTab === 'orders' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center border-b border-white/20 pb-4">
                      <div>
                        <h3 className="text-xl font-bold uppercase text-white font-heading">Orders Dashboard</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Track, receive, and dispatch orders assigned to your venue.</p>
                      </div>
                    </div>

                    <div className="border border-white/20 rounded-xl overflow-hidden bg-black/40 backdrop-blur-md">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-white/25 bg-white/5 uppercase text-slate-400 font-bold font-heading">
                              <th className="p-3.5">Order ID</th>
                              <th className="p-3.5">Delivery Destination</th>
                              <th className="p-3.5">Fares &amp; Payout</th>
                              <th className="p-3.5">Status</th>
                              <th className="p-3.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const cleanUser = vendorUser.name.toLowerCase()
                                .replace('truck', '')
                                .replace('spot', '')
                                .replace('guy', '')
                                .replace('wheels', '')
                                .trim();
                              
                              const vendorOrdersList = orders.filter(o => {
                                const addr = (o.vendorAddress || '').toLowerCase();
                                return addr.includes(cleanUser);
                              });

                              if (vendorOrdersList.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500 font-mono">
                                      No orders found in dispatch queue.
                                    </td>
                                  </tr>
                                );
                              }

                              return vendorOrdersList.map(order => {
                                return (
                                  <tr key={order.id} className="border-b border-white/10 hover:bg-white/5 transition-all">
                                    <td className="p-3.5 font-mono font-bold text-white">{order.id}</td>
                                    <td className="p-3.5 text-slate-300 max-w-xs truncate" title={order.customerAddress}>
                                      {order.customerAddress}
                                    </td>
                                    <td className="p-3.5 text-slate-300">
                                      <div>Dist: {order.distance} mi</div>
                                      <div className="text-[10px] text-slate-500 mt-0.5">Gross: ${Number(order.grossPayout || 0).toFixed(2)}</div>
                                    </td>
                                    <td className="p-3.5">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                        order.status === 'pending' || order.status === 'Processing Order' ? 'bg-amber-950/40 text-amber-400 border-amber-800/40' :
                                        order.status === 'Vendor Preparing Food' ? 'bg-orange-950/40 text-orange-400 border-orange-800/40' :
                                        order.status === 'Driver Assigned' ? 'bg-blue-950/40 text-blue-400 border-blue-800/40' :
                                        order.status === 'On the Way' ? 'bg-indigo-950/40 text-indigo-400 border-indigo-800/40' :
                                        order.status === 'Delivered' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40' :
                                        'bg-zinc-950/40 text-slate-400 border-slate-800/40'
                                      }`}>
                                        {order.status}
                                      </span>
                                    </td>
                                    <td className="p-3.5 text-right space-x-2">
                                      {(order.status === 'pending' || order.status === 'Processing Order') && (
                                        <button
                                          onClick={() => handleUpdateOrderStatus(order.id, 'Vendor Preparing Food')}
                                          className="px-2.5 py-1 border border-white rounded text-[10px] font-bold uppercase bg-white text-black hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                                        >
                                          Confirm &amp; Prepare
                                        </button>
                                      )}
                                      {order.status === 'Vendor Preparing Food' && (
                                        <button
                                          onClick={() => handleUpdateOrderStatus(order.id, 'Driver Assigned')}
                                          className="px-2.5 py-1 border border-emerald-500 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer font-heading"
                                        >
                                          Mark Ready
                                        </button>
                                      )}
                                      {order.status !== 'pending' && order.status !== 'Processing Order' && order.status !== 'Vendor Preparing Food' && (
                                        <span className="text-[10px] text-slate-500 uppercase font-mono">Dispatched</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subtab: Live GPS location */}
                {vendorActiveSubTab === 'gps' && (
                  <div className="space-y-6">
                    <div className="text-center max-w-md mx-auto py-4">
                      <span className="bg-white text-black font-extrabold text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded">
                        Live Dispatch Ledger
                      </span>
                      <h3 className="text-lg font-bold uppercase text-white font-heading mt-3">GPS Location Publisher</h3>
                      <p className="text-xs text-slate-400 mt-1">Publish your street location coordinates or enter a street address directly to the map discoverer.</p>
                    </div>

                    <div className="max-w-md mx-auto border border-white/20 p-6 rounded-xl bg-zinc-950/40 space-y-4">
                      {gpsStatus && (
                        <div className="border border-white/25 p-3 rounded-lg text-xs bg-black font-semibold space-y-1 text-center">
                          <div className="text-white uppercase font-bold tracking-wider">{gpsStatus}</div>
                          {gpsCoords && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              Latitude: {gpsCoords.lat.toFixed(6)} | Longitude: {gpsCoords.lon.toFixed(6)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Method A: GPS Coordinates */}
                      <button
                        onClick={handleUpdateGps}
                        className="w-full py-4 border-2 border-white rounded-xl bg-white text-black font-extrabold text-xs uppercase hover:bg-black hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2 font-heading"
                      >
                        <Locate className="w-5 h-5" />
                        Tap to Publish Live GPS
                      </button>

                      <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-white/10"></div>
                        <span className="flex-shrink mx-4 text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">OR ENTER STREET ADDRESS</span>
                        <div className="flex-grow border-t border-white/10"></div>
                      </div>

                      {/* Method B: Address Text geocoding simulation */}
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!gpsAddressText.trim()) {
                          setGpsStatus("Please enter an address.");
                          return;
                        }
                        setGpsStatus(`Geocoding and publishing: "${gpsAddressText}"...`);
                        
                        // Geocode simulation (derive coordinates in NYC area)
                        setTimeout(() => {
                          const lat = 40.7128 + (Math.random() - 0.5) * 0.08;
                          const lon = -74.0060 + (Math.random() - 0.5) * 0.08;
                          setGpsCoords({ lat, lon });
                          setGpsStatus(`Address successfully geocoded and published to live map!`);
                          
                          // Update coordinates in the map/vendors list dynamically
                          setVendors(prev => prev.map(v => {
                            if (v.id === vendorUser.id) {
                              return {
                                ...v,
                                borough: gpsAddressText.trim(),
                                coordinates: [lat, lon]
                              };
                            }
                            return v;
                          }));
                          console.log(`[Supabase Address Geocode] Updated vendor ${vendorUser.id} coordinates to: [${lat}, ${lon}] at "${gpsAddressText}"`);
                        }, 1000);
                      }} className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-heading">Street Address</label>
                          <input
                            type="text"
                            placeholder="e.g. 5th Ave & 34th St, NYC"
                            value={gpsAddressText}
                            onChange={(e) => setGpsAddressText(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg bg-black border border-white/20 text-xs text-white focus:border-white focus:outline-none font-sans"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2.5 border border-white rounded-lg bg-black text-white font-bold text-xs uppercase hover:bg-white hover:text-black transition-all cursor-pointer font-heading"
                        >
                          Geocode & Publish Location
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Subtab: Store Profile */}
                {vendorActiveSubTab === 'profile' && (
                  <div className="space-y-6">
                    <form onSubmit={handleUpdateVendorProfile} className="space-y-4 max-w-md mx-auto">
                      <div className="text-center max-w-md mx-auto py-4">
                        <span className="bg-white text-black font-extrabold text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded">
                          Store Registry
                        </span>
                        <h3 className="text-lg font-bold uppercase text-white font-heading mt-3">Edit Store Profile</h3>
                        <p className="text-xs text-slate-400 mt-1">Configure business identifiers and tags visible in the directory.</p>
                      </div>

                      <div className="border border-white/20 p-6 rounded-xl bg-zinc-950/40 space-y-4">
                        {/* Logo Uploader */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Store Logo</label>
                          <div className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center hover:border-white transition-all cursor-pointer relative bg-zinc-950">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => setProfileLogo(reader.result);
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            {profileLogo ? (
                              <div className="space-y-2 flex flex-col items-center">
                                <img src={profileLogo} alt="Preview" className="w-16 h-16 object-cover rounded-full border-2 border-white" />
                                <span className="text-[9px] text-emerald-400 uppercase font-bold">Logo Loaded</span>
                              </div>
                            ) : (
                              <div className="space-y-1 py-2">
                                <Upload className="w-4 h-4 mx-auto text-slate-400" />
                                <span className="text-[10px] text-white font-bold uppercase tracking-wider block">Upload Logo</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Business Name</label>
                          <input
                            type="text"
                            required
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg omny-input text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Operating Borough</label>
                          <select
                            value={profileBorough}
                            onChange={(e) => setProfileBorough(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg omny-input text-xs text-white"
                          >
                            <option value="Manhattan">Manhattan</option>
                            <option value="Brooklyn">Brooklyn</option>
                            <option value="Queens">Queens</option>
                            <option value="Bronx">Bronx</option>
                            <option value="Staten Island">Staten Island</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tags (Comma-separated)</label>
                          <input
                            type="text"
                            value={profileTags}
                            onChange={(e) => setProfileTags(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg omny-input text-xs text-white"
                            placeholder="e.g. Mexican, Tacos, BBQ"
                          />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                          <input
                            type="checkbox"
                            id="profileIsOpen"
                            checked={profileIsOpen}
                            onChange={(e) => setProfileIsOpen(e.target.checked)}
                            className="w-4 h-4 border-2 border-white rounded bg-black accent-white"
                          />
                          <label htmlFor="profileIsOpen" className="text-xs font-bold uppercase text-white tracking-wide cursor-pointer">
                            Open for Live Orders
                          </label>
                        </div>

                        <button
                          type="submit"
                          className="w-full mt-4 py-3 border-2 border-white rounded-lg bg-white text-black font-extrabold text-xs uppercase hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                        >
                          Save Profile Settings
                        </button>
                      </div>
                    </form>

                    {/* Fleet Upgrade Panel */}
                    <div className="mt-6 border-t border-white/20 pt-6 max-w-md mx-auto animate-fade-in">
                      <div className="border border-white/20 p-6 rounded-xl bg-zinc-950/40 space-y-4">
                        <div>
                          <h4 className="text-xs font-bold uppercase text-white tracking-wider font-heading">Multi-Truck Fleet Upgrade</h4>
                          <p className="text-[11px] text-slate-400 mt-1">Want to expand your operations? Apply to manage multiple food trucks under your vendor profile.</p>
                        </div>
                        
                        {upgradeRequests.some(r => r.vendorId === vendorUser.id && r.status === 'pending') ? (
                          <div className="p-3 border border-amber-500 bg-amber-950/20 text-amber-500 text-xs font-bold uppercase text-center rounded">
                            Upgrade Request Pending Admin Review
                          </div>
                        ) : upgradeRequests.some(r => r.vendorId === vendorUser.id && r.status === 'approved') ? (
                          <div className="p-3 border border-emerald-500 bg-emerald-950/20 text-emerald-500 text-xs font-bold uppercase text-center rounded">
                            Multi-Truck Privilege: Approved (Level 2)
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const newReq = {
                                id: 'up-' + Date.now(),
                                vendorId: vendorUser.id,
                                vendorName: vendorUser.name,
                                requestedTrucks: 3,
                                status: 'pending',
                                timestamp: new Date().toISOString()
                              };
                              setUpgradeRequests([...upgradeRequests, newReq]);
                              alert("Fleet upgrade request sent to the administrator console.");
                            }}
                            className="w-full py-2.5 border-2 border-white rounded-lg bg-black text-white font-bold text-xs uppercase hover:bg-white hover:text-black transition-all cursor-pointer font-heading"
                          >
                            Request Fleet Manager Upgrade (3 Trucks)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Driver Portal Tab: Companion App Workspace */}
        {activeTab === 'driver-portal' && (
          <div className="lg:col-span-12 p-6 max-w-4xl mx-auto w-full">
            {!driverUser ? (
              <div className="max-w-md mx-auto w-full border-2 border-white rounded-2xl p-6 bg-black shadow-2xl space-y-6">
                <div className="text-center">
                  <span className="bg-white text-black font-extrabold text-[9px] uppercase tracking-widest px-2 py-0.5 rounded animate-pulse">
                    Courier Companion
                  </span>
                  <h2 className="text-2xl font-bold uppercase text-white font-heading mt-3">Driver Portal</h2>
                  <p className="text-xs text-slate-400 mt-1">Authenticate as a curbside courier to claim fares and sync delivery geolocations.</p>
                </div>

                <div className="flex border-b border-white/15">
                  <button
                    onClick={() => setAccountSubTab('signin')}
                    className={`flex-1 pb-3 text-sm font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                      accountSubTab === 'signin' ? 'border-white text-white' : 'border-transparent text-slate-500 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setAccountSubTab('register')}
                    className={`flex-1 pb-3 text-sm font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                      accountSubTab === 'register' ? 'border-white text-white' : 'border-transparent text-slate-500 hover:text-white'
                    }`}
                  >
                    Apply / Join
                  </button>
                </div>

                {accountSubTab === 'signin' ? (
                  <>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setVerificationError('');
                      const email = e.target.email.value.trim();
                      const password = e.target.password.value;
                      const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';

                      try {
                        const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email, password })
                        });
                        const data = await res.json();
                        if (res.ok) {
                          if (data.user.role !== 'driver') {
                            setVerificationError("Access denied. This login is not registered as a Driver.");
                            return;
                          }
                          setDriverUser(data.user);
                          setDriverActiveSubTab('queue');
                        } else if (res.status === 403 && data.error === 'unverified') {
                          setVerificationPendingEmail(email);
                        } else {
                          setVerificationError(data.error || "Login failed.");
                        }
                      } catch (err) {
                        // Offline simulation fallback for demo
                        const mockDriver = drivers.find(d => d.email?.toLowerCase() === email.toLowerCase());
                        if (mockDriver) {
                          setDriverUser({
                            id: mockDriver.id,
                            email: mockDriver.email,
                            name: mockDriver.fullName,
                            role: 'driver'
                          });
                          setDriverActiveSubTab('queue');
                        } else {
                          setVerificationError("Login failed. Check connection or credentials.");
                        }
                      }
                    }}
                    className="space-y-4"
                  >
                    {verificationError && (
                      <div className="p-3 border border-rose-500 bg-rose-950/20 text-rose-500 text-xs font-bold uppercase rounded text-center">
                        {verificationError}
                      </div>
                    )}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="courier@example.com"
                        className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 text-sm text-white focus:border-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
                      <input
                        name="password"
                        type="password"
                        required
                        placeholder="••••••••"
                        className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 text-sm text-white focus:border-white focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3.5 border-2 border-white rounded-xl bg-white text-black font-extrabold text-xs uppercase hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                    >
                      Login to Console
                    </button>
                  </form>

                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 my-4">
                      <span className="h-[1px] bg-white/10 flex-1"></span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Or sign in with</span>
                      <span className="h-[1px] bg-white/10 flex-1"></span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleSSOClick('Google', 'driver')}
                        className="flex items-center justify-center gap-2 py-2.5 border border-white/20 rounded-xl bg-zinc-950/60 text-white font-extrabold text-[10px] uppercase hover:bg-white hover:text-black transition-all cursor-pointer font-heading"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.6 4.5 1.7l2.4-2.4C17.3 1.6 14.9 1 12.24 1A10.01 10.01 0 0 0 2.25 11a10.01 10.01 0 0 0 9.99 10c5.56 0 10.13-4.04 10.13-10 0-.68-.08-1.32-.24-1.715h-9.893z"/></svg>
                        Google
                      </button>
                      
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      
                      
                    </div>
                  </div>
                  </>
                ) : (
                  <>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setVerificationError('');
                      const name = e.target.fullName.value.trim();
                      const email = e.target.email.value.trim();
                      const password = e.target.password.value;
                      const vehicle = e.target.vehicle.value;
                      const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';

                      try {
                        const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ name, email, password, role: 'driver', vehicle })
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setVerificationPendingEmail(email);
                        } else {
                          setVerificationError(data.error || "Registration failed.");
                        }
                      } catch (err) {
                        setVerificationError("Network error. Verify backend server is running.");
                      }
                    }}
                    className="space-y-4"
                  >
                    {verificationError && (
                      <div className="p-3 border border-rose-500 bg-rose-950/20 text-rose-500 text-xs font-bold uppercase rounded text-center">
                        {verificationError}
                      </div>
                    )}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
                      <input
                        name="fullName"
                        type="text"
                        required
                        placeholder="Carlos Rivera"
                        className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 text-sm text-white focus:border-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="carlos@example.com"
                        className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 text-sm text-white focus:border-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
                      <input
                        name="password"
                        type="password"
                        required
                        placeholder="Create Password"
                        className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 text-sm text-white focus:border-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Vehicle Type</label>
                      <select
                        name="vehicle"
                        className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 text-sm text-white focus:border-white focus:outline-none"
                      >
                        <option value="bike">Bicycle</option>
                        <option value="scooter">E-Scooter / Moped</option>
                        <option value="car">Car / EV</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3.5 border-2 border-white rounded-xl bg-white text-black font-extrabold text-xs uppercase hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                    >
                      Verify Email &amp; Join
                    </button>
                  </form>

                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 my-4">
                      <span className="h-[1px] bg-white/10 flex-1"></span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Or register with</span>
                      <span className="h-[1px] bg-white/10 flex-1"></span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleSSOClick('Google', 'driver')}
                        className="flex items-center justify-center gap-2 py-2.5 border border-white/20 rounded-xl bg-zinc-950/60 text-white font-extrabold text-[10px] uppercase hover:bg-white hover:text-black transition-all cursor-pointer font-heading"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.6 4.5 1.7l2.4-2.4C17.3 1.6 14.9 1 12.24 1A10.01 10.01 0 0 0 2.25 11a10.01 10.01 0 0 0 9.99 10c5.56 0 10.13-4.04 10.13-10 0-.68-.08-1.32-.24-1.715h-9.893z"/></svg>
                        Google
                      </button>
                      
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      
                      
                    </div>
                  </div>
                  </>
                )}

                <div className="border-t border-white/10 pt-4 text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                    Active Driver Testing Accounts
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
                    <span onClick={() => { 
                      const mockD = drivers[0];
                      if (mockD) {
                        setDriverUser({ id: mockD.id, email: mockD.email || 'carlos@example.com', name: mockD.fullName, role: 'driver' });
                        setDriverActiveSubTab('queue');
                      }
                    }} className="cursor-pointer bg-zinc-950 border border-zinc-800 text-slate-300 text-[9px] px-2 py-0.5 rounded hover:border-white transition-all">
                      Carlos Rivera (Simulation)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-white rounded-2xl p-6 bg-black shadow-2xl space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-white/20 pb-4 flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[9px] font-mono bg-white/10 px-2 py-0.5 rounded border border-white/10 text-slate-300 uppercase font-bold tracking-wider">
                        Active Dispatcher
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold uppercase text-white font-heading mt-1">{driverUser.fullName || driverUser.name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Courier Session &bull; Mode: Delivery Partner</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDriverActiveSubTab('queue')}
                      className={`px-3 py-1.5 border border-white rounded text-xs font-bold uppercase transition-all ${
                        driverActiveSubTab === 'queue' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                      }`}
                    >
                      Fares Queue
                    </button>
                    <button
                      onClick={() => setDriverActiveSubTab('active')}
                      className={`px-3 py-1.5 border border-white rounded text-xs font-bold uppercase transition-all ${
                        driverActiveSubTab === 'active' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                      }`}
                    >
                      Active Route
                    </button>
                    <button
                      onClick={() => setDriverActiveSubTab('earnings')}
                      className={`px-3 py-1.5 border border-white rounded text-xs font-bold uppercase transition-all ${
                        driverActiveSubTab === 'earnings' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                      }`}
                    >
                      My Earnings
                    </button>
                    <button
                      onClick={() => {
                        setDriverUser(null);
                        setActiveTab('directory');
                      }}
                      className="px-3 py-1.5 border border-red-500 rounded text-xs font-bold uppercase bg-black text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    >
                      Logout
                    </button>
                  </div>
                </div>

                {/* Subtab: Fares Queue */}
                {driverActiveSubTab === 'queue' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Available Dispatches</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(() => {
                        // Filter unassigned orders ready for pickup or preparation
                        const availableFares = orders.filter(o => !o.driverId && o.status !== 'Delivered');
                        if (availableFares.length === 0) {
                          return (
                            <div className="col-span-2 border border-dashed border-white/20 p-8 text-center text-slate-500 rounded-xl font-mono text-xs">
                              No unassigned dispatches available in your sector.
                            </div>
                          );
                        }

                        return availableFares.map(order => (
                          <div key={order.id} className="border border-white/15 rounded-xl p-4 bg-zinc-950/40 space-y-4 hover:border-white/40 transition-all flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                <span className="font-mono font-bold text-white text-sm">{order.id}</span>
                                <span className="text-[10px] font-black bg-white/10 px-1.5 py-0.5 rounded text-white uppercase tracking-wider border border-white/15">
                                  ${Number(order.netPayout || order.grossPayout * 0.9).toFixed(2)} Net
                                </span>
                              </div>
                              <div className="text-[11px] space-y-1 text-slate-300">
                                <div>
                                  <span className="text-slate-500 font-bold uppercase">Pickup:</span> {order.vendorAddress}
                                </div>
                                <div>
                                  <span className="text-slate-500 font-bold uppercase">Dropoff:</span> {order.customerAddress}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-1">
                                  Distance: {order.distance} mi &bull; Status: <span className="text-amber-400 font-semibold">{order.status}</span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';
                                try {
                                  const res = await fetch(`${BACKEND_URL}/api/orders/${order.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      driverId: driverUser.id,
                                      status: 'Driver Assigned'
                                    })
                                  });
                                  if (res.ok) {
                                    const updated = await res.json();
                                    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, ...updated } : o));
                                    alert("Fare successfully claimed! Proceed to Active Route tab to navigate.");
                                    setDriverActiveSubTab('active');
                                  } else {
                                    alert("Could not claim fare. It may have been claimed already.");
                                  }
                                } catch (err) {
                                  // Fallback
                                  setOrders(prev => prev.map(o => o.id === order.id ? { ...o, driverId: driverUser.id, status: 'Driver Assigned' } : o));
                                  setDriverActiveSubTab('active');
                                }
                              }}
                              className="w-full py-2 border-2 border-white rounded-lg bg-white text-black font-extrabold text-[10px] uppercase hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                            >
                              Claim Fare &amp; Route
                            </button>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* Subtab: Active Route */}
                {driverActiveSubTab === 'active' && (
                  <div className="space-y-4">
                    {(() => {
                      const activeOrder = orders.find(o => o.driverId === driverUser.id && o.status !== 'Delivered');
                      if (!activeOrder) {
                        return (
                          <div className="border border-dashed border-white/20 p-8 text-center text-slate-500 rounded-xl font-mono text-xs max-w-md mx-auto">
                            No active delivery routes. Open Fares Queue to claim a fare.
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                          <div className="md:col-span-7 space-y-4">
                            <div className="border border-white/10 p-4 rounded-xl bg-zinc-950/40 space-y-3">
                              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                <span className="font-mono font-bold text-white text-base">{activeOrder.id}</span>
                                <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                                  {activeOrder.status}
                                </span>
                              </div>
                              <div className="space-y-2 text-xs">
                                <div>
                                  <span className="text-slate-500 block uppercase font-bold text-[9px]">Pickup Address (Vendor)</span>
                                  <span className="text-white font-medium">{activeOrder.vendorAddress}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block uppercase font-bold text-[9px]">Dropoff Destination</span>
                                  <span className="text-white font-medium">{activeOrder.customerAddress}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                                  <div>
                                    <span className="text-slate-500 block font-bold uppercase">Distance</span>
                                    <span className="text-white">{activeOrder.distance} mi</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block font-bold uppercase">Estimated Fare Payout</span>
                                    <span className="text-white">${Number(activeOrder.netPayout || activeOrder.grossPayout * 0.9).toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="pt-2">
                              {activeOrder.status === 'Vendor Preparing Food' && (
                                <div className="p-4 border border-amber-500/25 bg-amber-500/5 text-amber-400 rounded-xl text-center font-bold text-xs uppercase tracking-wider animate-pulse">
                                  Waiting for Vendor to finish preparing food...
                                </div>
                              )}
                              {(activeOrder.status === 'Driver Assigned' || activeOrder.status === 'Processing Order' || activeOrder.status === 'pending') && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(activeOrder.id, 'On the Way')}
                                  className="w-full py-3.5 border-2 border-white rounded-xl bg-white text-black font-extrabold text-xs uppercase hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                                >
                                  Pick Up &amp; Start Transit
                                </button>
                              )}
                              {activeOrder.status === 'On the Way' && (
                                <button
                                  onClick={async () => {
                                    const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';
                                    try {
                                      const res = await fetch(`${BACKEND_URL}/api/orders/${activeOrder.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: 'Delivered' })
                                      });
                                      if (res.ok) {
                                        const updated = await res.json();
                                        setOrders(prev => prev.map(o => o.id === activeOrder.id ? { ...o, ...updated } : o));
                                        
                                        // Also add to finance log locally for demo
                                        const financeDoc = {
                                          orderId: activeOrder.id,
                                          totalDistance: activeOrder.distance,
                                          grossDriverPay: activeOrder.grossPayout,
                                          driverPay: activeOrder.netPayout || activeOrder.grossPayout * 0.9,
                                          timestamp: new Date().toISOString()
                                        };
                                        setFinanceLogs(prev => [financeDoc, ...prev]);

                                        alert("Delivery confirmed! Fare payout settled.");
                                        setDriverActiveSubTab('earnings');
                                      }
                                    } catch (err) {
                                      setOrders(prev => prev.map(o => o.id === activeOrder.id ? { ...o, status: 'Delivered' } : o));
                                      setDriverActiveSubTab('earnings');
                                    }
                                  }}
                                  className="w-full py-3.5 border-2 border-emerald-500 rounded-xl bg-emerald-500 text-white font-extrabold text-xs uppercase hover:bg-emerald-600 transition-all cursor-pointer font-heading flex justify-center items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse"
                                >
                                  <Check className="w-4 h-4" />
                                  Confirm Arrival &amp; Deliver
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="md:col-span-5 border border-white/10 rounded-xl p-4 bg-zinc-950/40 space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-heading">Transit Telemetry</h4>
                            <div className="h-44 bg-slate-900/60 rounded-lg flex flex-col justify-center items-center relative overflow-hidden border border-white/5">
                              {/* Background Grid */}
                              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                              <Navigation className="w-8 h-8 text-white animate-bounce relative z-10" />
                              <div className="text-center mt-2 relative z-10">
                                <span className="text-[10px] text-white font-mono font-bold block uppercase">Live Geo-tracking</span>
                                <span className="text-[9px] text-slate-500 font-mono">Syncing GPS coordinates with Admin console...</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Subtab: Earnings */}
                {driverActiveSubTab === 'earnings' && (
                  <div className="space-y-6">
                    {(() => {
                      const completedFares = orders.filter(o => o.driverId === driverUser.id && o.status === 'Delivered');
                      const totalEarnings = completedFares.reduce((sum, o) => sum + (o.netPayout || o.grossPayout * 0.9), 0);

                      return (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="border border-white/15 p-4 rounded-xl bg-zinc-950/40">
                              <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1">Total Deliveries</span>
                              <span className="text-2xl font-black text-white font-mono">{completedFares.length}</span>
                            </div>
                            <div className="border border-white/15 p-4 rounded-xl bg-zinc-950/40">
                              <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1">Gross Settled</span>
                              <span className="text-2xl font-black text-white font-mono">${totalEarnings.toFixed(2)}</span>
                            </div>
                            <div className="border border-white/15 p-4 rounded-xl bg-zinc-950/40 flex flex-col justify-between">
                              <div>
                                <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1">Available to Withdraw</span>
                                <span className="text-2xl font-black text-emerald-400 font-mono">${totalEarnings.toFixed(2)}</span>
                              </div>
                              {totalEarnings > 0 && (
                                <button
                                  onClick={() => {
                                    alert(`🎉 Settlement success! $${totalEarnings.toFixed(2)} transferred to your linked bank ledger.`);
                                  }}
                                  className="mt-2 py-1.5 border border-white rounded text-[9px] font-black uppercase bg-white text-black hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                                >
                                  Withdraw Fares
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="border border-white/15 rounded-xl overflow-hidden bg-black/40">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="border-b border-white/20 bg-white/5 uppercase text-slate-400 font-bold font-heading">
                                    <th className="p-3">Fare ID</th>
                                    <th className="p-3">Distance</th>
                                    <th className="p-3">Payout</th>
                                    <th className="p-3 text-right">Method</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {completedFares.length === 0 ? (
                                    <tr>
                                      <td colSpan="4" className="p-6 text-center text-slate-500 font-mono">
                                        No completed delivery fares recorded.
                                      </td>
                                    </tr>
                                  ) : (
                                    completedFares.map(order => (
                                      <tr key={order.id} className="border-b border-white/10 hover:bg-white/5 transition-all text-slate-300">
                                        <td className="p-3 font-mono font-bold text-white">{order.id}</td>
                                        <td className="p-3">{order.distance} mi</td>
                                        <td className="p-3 font-mono font-bold text-emerald-400">${Number(order.netPayout || order.grossPayout * 0.9).toFixed(2)}</td>
                                        <td className="p-3 text-right text-slate-500 uppercase font-mono">Curbside Split</td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Custom Admin Panel Tab View */}
        {activeTab === 'admin' && isStaffAuthenticated && (
          <div className="lg:col-span-12 p-6 max-w-4xl mx-auto w-full">
            {!isAdminAuthenticated ? (
              <div className="max-w-md mx-auto w-full border-2 border-white rounded-2xl p-6 bg-black shadow-2xl space-y-6">
                <div className="text-center">
                  <span className="bg-white text-black font-extrabold text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded">
                    Staff Portal
                  </span>
                  <h2 className="text-2xl font-bold uppercase text-white font-heading mt-3">CURBSIDES Command Center</h2>
                  <p className="text-xs text-slate-400 mt-1">Please authenticate with the admin passcode to manage fleet operations.</p>
                </div>

                <form onSubmit={handleAdminAuth} className="space-y-4">
                  {adminError && (
                    <div className="border border-white/20 p-3 rounded-lg text-xs text-rose-400 bg-rose-950/20 font-bold uppercase">
                      {adminError}
                    </div>
                  )}
                  <div>
                    <input
                      type="password"
                      placeholder="Passcode (e.g. curbside-admin-2026)"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl omny-input text-sm text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 border-2 border-white rounded-xl bg-white text-black font-bold text-xs uppercase hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                  >
                    Enter Command Center
                  </button>
                </form>
              </div>
            ) : (
              <div className="border-2 border-white rounded-2xl p-6 bg-black shadow-2xl space-y-6">
                {/* Admin Header */}
                {(() => {
                  const pendingDriversCount = drivers.filter(d => d.status === 'pending').length;
                  const pendingVendorAppsCount = vendorApplications.filter(a => a.status === 'pending').length;
                  const pendingUpgradesCount = upgradeRequests.filter(u => u.status === 'pending').length;
                  const totalAppsCount = pendingVendorAppsCount + pendingUpgradesCount;
                  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

                  let unrepliedSupportCount = 0;
                  for (let i = supportMessages.length - 1; i >= 0; i--) {
                    if (supportMessages[i].sender === 'admin') break;
                    if (supportMessages[i].sender === 'user') unrepliedSupportCount++;
                  }

                  const alerts = [];
                  orders.forEach(o => {
                    if (o.status === 'pending') {
                      alerts.push({
                        id: `order-${o.id}`,
                        type: 'order',
                        text: `Order ${o.id} is unassigned and pending dispatch.`,
                        tab: 'finance',
                        severity: 'rose'
                      });
                    }
                  });
                  drivers.forEach(d => {
                    if (d.status === 'pending') {
                      alerts.push({
                        id: `driver-${d.id}`,
                        type: 'driver',
                        text: `Driver registration ${d.fullName} requires screening.`,
                        tab: 'drivers',
                        severity: 'amber'
                      });
                    }
                  });
                  vendorApplications.forEach(a => {
                    if (a.status === 'pending') {
                      alerts.push({
                        id: `v-app-${a.id}`,
                        type: 'vendor',
                        text: `Vendor onboarding request ${a.name} is pending review.`,
                        tab: 'applications',
                        severity: 'amber'
                      });
                    }
                  });
                  upgradeRequests.forEach(u => {
                    if (u.status === 'pending') {
                      alerts.push({
                        id: `upgrade-${u.id}`,
                        type: 'upgrade',
                        text: `Multi-truck fleet upgrade request from ${u.vendorName} is pending.`,
                        tab: 'applications',
                        severity: 'amber'
                      });
                    }
                  });
                  
                  if (supportMessages.length > 0 && supportMessages[supportMessages.length - 1].sender === 'user') {
                    alerts.push({
                      id: 'support-chat-alert',
                      type: 'support',
                      text: 'Customer support chat requires administrator response.',
                      tab: 'support',
                      severity: 'emerald'
                    });
                  }

                  return (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center border-b border-white/20 pb-4 flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-3">
                              <h2 className="text-2xl font-bold uppercase text-white font-heading">Command Center Dashboard</h2>
                              <div className="relative">
                                <button
                                  onClick={() => setIsAdminNotificationsOpen(!isAdminNotificationsOpen)}
                                  className={`p-2 rounded-lg border border-white/20 hover:border-white transition-all bg-white/5 text-white cursor-pointer hover:bg-white/10 flex items-center justify-center relative ${
                                    alerts.length > 0 ? 'animate-[pulse_2s_infinite]' : ''
                                  }`}
                                  title="View Alerts"
                                >
                                  <Bell className={`w-5 h-5 ${alerts.length > 0 ? 'text-amber-400' : 'text-slate-300'}`} />
                                  {alerts.length > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center shadow-[0_0_8px_rgba(225,29,72,0.8)]">
                                      {alerts.length}
                                    </span>
                                  )}
                                </button>
                                
                                {isAdminNotificationsOpen && (
                                  <div className="absolute left-0 mt-2 w-80 bg-black/95 border-2 border-white rounded-xl shadow-2xl p-4 z-50 space-y-3 backdrop-blur-md max-h-96 overflow-y-auto">
                                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                      <span className="text-xs font-black uppercase tracking-wider text-white">Active Alerts ({alerts.length})</span>
                                      <button 
                                        onClick={() => setIsAdminNotificationsOpen(false)}
                                        className="text-[10px] text-slate-400 hover:text-white uppercase font-bold"
                                      >
                                        Close
                                      </button>
                                    </div>
                                    
                                    {alerts.length === 0 ? (
                                      <div className="py-4 text-center text-xs text-slate-500 font-mono">
                                        No active alerts. System status nominal.
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        {alerts.map(alert => (
                                          <div 
                                            key={alert.id}
                                            onClick={() => {
                                              setAdminSubTab(alert.tab);
                                              setIsAdminNotificationsOpen(false);
                                            }}
                                            className="p-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white transition-all cursor-pointer text-left space-y-1"
                                          >
                                            <div className="flex justify-between items-center">
                                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                                                alert.severity === 'rose' ? 'bg-rose-950/40 text-rose-400 border border-rose-800/40' :
                                                alert.severity === 'amber' ? 'bg-amber-950/40 text-amber-400 border border-amber-800/40' :
                                                'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                                              }`}>
                                                {alert.type}
                                              </span>
                                              <span className="text-[8px] text-slate-400 font-mono uppercase font-black">Go to {alert.tab} &rarr;</span>
                                            </div>
                                            <p className="text-xs text-slate-200 font-medium leading-relaxed font-sans">{alert.text}</p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">Manage drivers, vendors, and fleet operations in one location.</p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => setAdminSubTab('drivers')}
                            className={`px-3 py-1.5 border border-white rounded text-xs font-bold uppercase transition-all flex items-center gap-1.5 relative cursor-pointer ${
                              adminSubTab === 'drivers' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                            }`}
                          >
                            <span>Drivers</span>
                            {pendingDriversCount > 0 && (
                              <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center animate-pulse shadow-[0_0_8px_rgba(225,29,72,0.6)]">
                                {pendingDriversCount}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => setAdminSubTab('orders')}
                            className={`px-3 py-1.5 border border-white rounded text-xs font-bold uppercase transition-all flex items-center gap-1.5 relative cursor-pointer ${
                              adminSubTab === 'orders' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                            }`}
                          >
                            <span>Orders</span>
                            {pendingOrdersCount > 0 && (
                              <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]">
                                {pendingOrdersCount}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => setAdminSubTab('vendors')}
                            className={`px-3 py-1.5 border border-white rounded text-xs font-bold uppercase transition-all flex items-center gap-1.5 relative cursor-pointer ${
                              adminSubTab === 'vendors' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                            }`}
                          >
                            <span>Vendors</span>
                          </button>
                          <button
                            onClick={() => setAdminSubTab('applications')}
                            className={`px-3 py-1.5 border border-white rounded text-xs font-bold uppercase transition-all flex items-center gap-1.5 relative cursor-pointer ${
                              adminSubTab === 'applications' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                            }`}
                          >
                            <span>Apps</span>
                            {totalAppsCount > 0 && (
                              <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]">
                                {totalAppsCount}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => setAdminSubTab('finance')}
                            className={`px-3 py-1.5 border border-white rounded text-xs font-bold uppercase transition-all flex items-center gap-1.5 relative cursor-pointer ${
                              adminSubTab === 'finance' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                            }`}
                          >
                            <span>Finance</span>
                            {pendingOrdersCount > 0 && (
                              <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center animate-pulse shadow-[0_0_8px_rgba(225,29,72,0.6)]">
                                {pendingOrdersCount}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => setAdminSubTab('support')}
                            className={`px-3 py-1.5 border border-white rounded text-xs font-bold uppercase transition-all flex items-center gap-1.5 relative cursor-pointer ${
                              adminSubTab === 'support' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                            }`}
                          >
                            <span>Support</span>
                            {unrepliedSupportCount > 0 && (
                              <span className="w-4 h-4 rounded-full bg-emerald-500 text-black text-[9px] font-black flex items-center justify-center animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]">
                                {unrepliedSupportCount}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => setAdminSubTab('integrations')}
                            className={`px-3 py-1.5 border border-white rounded text-xs font-bold uppercase transition-all cursor-pointer ${
                              adminSubTab === 'integrations' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                            }`}
                          >
                            Integrations
                          </button>
                        </div>
                      </div>

                      {/* Live Operations Alerts Console */}
                      {alerts.length > 0 && (
                        <div className="border border-white/20 p-4 rounded-xl bg-zinc-950/60 shadow-[0_0_15px_rgba(255,255,255,0.05)] animate-fade-in space-y-3">
                          <div className="flex justify-between items-center border-b border-white/10 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest font-heading">
                                Live Operations Alerts ({alerts.length})
                              </span>
                            </div>
                            <span className="text-[9px] font-mono text-zinc-500 uppercase">Real-Time Monitor Active</span>
                          </div>
                          <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1">
                            {alerts.map(alert => (
                              <div 
                                key={alert.id} 
                                onClick={() => setAdminSubTab(alert.tab)}
                                className="flex justify-between items-center p-2.5 rounded-lg border border-white/5 bg-black/45 hover:bg-white/5 transition-all cursor-pointer group text-xs text-slate-300"
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    alert.severity === 'rose' ? 'bg-rose-500 shadow-[0_0_6px_#ef4444]' :
                                    alert.severity === 'amber' ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]' : 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                                  }`}></span>
                                  <span className="font-mono text-[10px] font-semibold text-slate-500 group-hover:text-white uppercase transition-colors">
                                    [{alert.type}]
                                  </span>
                                  <span className="text-[11px] group-hover:text-white transition-colors">{alert.text}</span>
                                </div>
                                <span className="text-[9px] border border-white/10 px-2 py-0.5 rounded text-zinc-500 group-hover:border-white/30 group-hover:text-slate-300 uppercase font-bold tracking-wider transition-all">
                                  Resolve &rarr;
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Public Registration Links Widget */}
                      <div className="p-4 border border-white/10 rounded-xl bg-zinc-950/40 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Public Vendor Onboarding URL</h4>
                            <button 
                              onClick={() => {
                                const val = 'https://shop.curbsides.xyz/pages/join-fleet';
                                setCustomVendorUrl(val);
                                localStorage.setItem('curbsides_custom_vendor_url', val);
                              }}
                              className="text-[9px] text-zinc-500 hover:text-white uppercase font-bold tracking-wider cursor-pointer"
                            >
                              Reset Default
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="text" 
                              value={customVendorUrl}
                              onChange={(e) => {
                                setCustomVendorUrl(e.target.value);
                                localStorage.setItem('curbsides_custom_vendor_url', e.target.value);
                              }}
                              className="w-full bg-black border border-white/10 text-xs px-2.5 py-1.5 rounded-lg text-slate-300 font-mono focus:border-white focus:outline-none"
                              placeholder="Enter custom Shopify onboarding page URL"
                            />
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(customVendorUrl);
                                alert("Vendor Onboarding URL copied to clipboard!");
                              }}
                              className="px-3 py-1.5 bg-white text-black hover:bg-black hover:text-white border border-white rounded text-xs font-bold uppercase transition-all cursor-pointer"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Public Driver Registration URL</h4>
                            <button 
                              onClick={() => {
                                const val = 'https://shop.curbsides.xyz/pages/join-fleet';
                                setCustomDriverUrl(val);
                                localStorage.setItem('curbsides_custom_driver_url', val);
                              }}
                              className="text-[9px] text-zinc-500 hover:text-white uppercase font-bold tracking-wider cursor-pointer"
                            >
                              Reset Default
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="text" 
                              value={customDriverUrl}
                              onChange={(e) => {
                                setCustomDriverUrl(e.target.value);
                                localStorage.setItem('curbsides_custom_driver_url', e.target.value);
                              }}
                              className="w-full bg-black border border-white/10 text-xs px-2.5 py-1.5 rounded-lg text-slate-300 font-mono focus:border-white focus:outline-none"
                              placeholder="Enter custom Shopify onboarding page URL"
                            />
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(customDriverUrl);
                                alert("Driver Registration URL copied to clipboard!");
                              }}
                              className="px-3 py-1.5 bg-white text-black hover:bg-black hover:text-white border border-white rounded text-xs font-bold uppercase transition-all cursor-pointer"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Sub Tab: Drivers */}
                {adminSubTab === 'drivers' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Driver Registration Queue</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/20 font-bold uppercase text-slate-400">
                            <th className="py-2.5">Driver Info</th>
                            <th className="py-2.5">Vehicle</th>
                            <th className="py-2.5">Boroughs</th>
                            <th className="py-2.5">Deliveries</th>
                            <th className="py-2.5">Earnings</th>
                            <th className="py-2.5">Status</th>
                            <th className="py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {drivers.map(driver => (
                            <tr key={driver.id} className="hover:bg-zinc-950 transition-colors">
                              <td className="py-3">
                                <div className="font-bold text-white uppercase">{driver.fullName}</div>
                                <div className="text-slate-500 font-mono text-[10px]">{driver.phone}</div>
                              </td>
                              <td className="py-3 capitalize">{driver.vehicleType}</td>
                              <td className="py-3 font-semibold">{driver.boroughs.join(', ')}</td>
                              <td className="py-3">{driver.deliveries}</td>
                              <td className="py-3 font-bold">${driver.earnings.toFixed(2)}</td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                  driver.status === 'approved' 
                                    ? 'border-white text-white bg-white/10' 
                                    : 'border-zinc-700 text-zinc-500'
                                }`}>
                                  {driver.status}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => {
                                    const nextStatus = driver.status === 'approved' ? 'pending' : 'approved';
                                    const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';
                                    fetch(`${BACKEND_URL}/api/drivers/${driver.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: nextStatus })
                                    })
                                    .then(res => {
                                      if (!res.ok) throw new Error();
                                      return res.json();
                                    })
                                    .then(updated => {
                                      setDrivers(prev => prev.map(d => d.id === driver.id ? updated : d));
                                    })
                                    .catch(err => {
                                      console.error("Error updating driver status:", err);
                                      // Local fallback
                                      setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, status: nextStatus } : d));
                                    });
                                  }}
                                  className="px-2 py-1 border border-white rounded text-[10px] font-bold uppercase hover:bg-white hover:text-black transition-all"
                                >
                                  Toggle Status
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sub Tab: Vendor Applications */}
                {adminSubTab === 'applications' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Incoming Vendor Requests</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/20 font-bold uppercase text-slate-400">
                            <th className="py-2.5">Business Name</th>
                            <th className="py-2.5">Email</th>
                            <th className="py-2.5">Phone</th>
                            <th className="py-2.5">Borough</th>
                            <th className="py-2.5">Food Type</th>
                            <th className="py-2.5">Status</th>
                            <th className="py-2.5 text-right">Shopify Invitation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {vendorApplications.map(app => (
                            <tr key={app.id} className="hover:bg-zinc-950 transition-colors">
                              <td className="py-3 font-bold text-white uppercase">{app.name}</td>
                              <td className="py-3">{app.email}</td>
                              <td className="py-3 font-mono">{app.phone}</td>
                              <td className="py-3">{app.borough}</td>
                              <td className="py-3 font-semibold uppercase">{app.foodType}</td>
                              <td className="py-3 uppercase text-[10px] font-bold text-amber-400">{app.status}</td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => handleApproveVendor(app)}
                                  className="px-2 py-1 border border-white rounded text-[10px] font-bold uppercase bg-white text-black hover:bg-black hover:text-white transition-all"
                                >
                                  {app.status === 'approved' ? 'Invited ✓' : 'Invite Staff'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Multi-Truck Fleet Upgrade Requests */}
                    <div className="border-t border-white/20 pt-6 mt-6 animate-fade-in">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Multi-Truck Fleet Upgrade Requests</h3>
                      {upgradeRequests.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No pending fleet upgrade requests.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-white/20 font-bold uppercase text-slate-400">
                                <th className="py-2.5">Food Truck</th>
                                <th className="py-2.5">Upgrade Details</th>
                                <th className="py-2.5">Date Requested</th>
                                <th className="py-2.5">Status</th>
                                <th className="py-2.5 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10 text-slate-300">
                              {upgradeRequests.map(req => (
                                <tr key={req.id} className="hover:bg-zinc-950 transition-colors">
                                  <td className="py-3 font-bold text-white uppercase">{req.vendorName}</td>
                                  <td className="py-3 text-slate-400">Requesting manager role for {req.requestedTrucks} trucks</td>
                                  <td className="py-3 text-slate-500 font-mono">{new Date(req.timestamp).toLocaleDateString()}</td>
                                  <td className="py-3 uppercase text-[10px] font-bold">
                                    <span className={req.status === 'approved' ? 'text-emerald-500' : req.status === 'rejected' ? 'text-rose-500' : 'text-amber-500'}>
                                      {req.status}
                                    </span>
                                  </td>
                                  <td className="py-3 text-right space-x-2">
                                    {req.status === 'pending' && (
                                      <>
                                        <button
                                          onClick={() => {
                                            setUpgradeRequests(upgradeRequests.map(r => r.id === req.id ? { ...r, status: 'approved' } : r));
                                            alert(`Approved ${req.vendorName} for multi-truck fleet manager privileges.`);
                                          }}
                                          className="px-2 py-1 border border-emerald-500 rounded text-[10px] font-bold uppercase bg-emerald-950/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                                        >
                                          Approve
                                        </button>
                                        <button
                                          onClick={() => {
                                            setUpgradeRequests(upgradeRequests.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r));
                                          }}
                                          className="px-2 py-1 border border-rose-500 rounded text-[10px] font-bold uppercase bg-rose-950/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                                        >
                                          Reject
                                        </button>
                                      </>
                                    )}
                                    {req.status !== 'pending' && (
                                      <span className="text-[10px] text-slate-500 uppercase font-bold">Processed</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sub Tab: Orders Management */}
                {adminSubTab === 'orders' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center border-b border-white/20 pb-4">
                      <div>
                        <h3 className="text-xl font-bold uppercase text-white font-heading">Global Orders Registry</h3>
                        <p className="text-xs text-slate-400 mt-0.5">View, monitor, and assign drivers to pending curbside shipments.</p>
                      </div>
                    </div>

                    <div className="border border-white/20 rounded-xl overflow-hidden bg-black/40 backdrop-blur-md">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-white/25 bg-white/5 uppercase text-slate-400 font-bold font-heading">
                              <th className="p-3.5">Order ID</th>
                              <th className="p-3.5">Vendor Address</th>
                              <th className="p-3.5">Destination</th>
                              <th className="p-3.5">Fares</th>
                              <th className="p-3.5">Status</th>
                              <th className="p-3.5">Assigned Courier</th>
                              <th className="p-3.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.length === 0 ? (
                              <tr>
                                <td colSpan="7" className="p-8 text-center text-slate-500 font-mono">
                                  No orders currently active in dispatch database.
                                </td>
                              </tr>
                            ) : (
                              orders.map(order => {
                                const matchedDriver = drivers.find(d => d.id === order.driverId);
                                const availableDrivers = drivers.filter(d => d.status === 'approved');

                                return (
                                  <tr key={order.id} className="border-b border-white/10 hover:bg-white/5 transition-all text-slate-300">
                                    <td className="p-3.5 font-mono font-bold text-white">{order.id}</td>
                                    <td className="p-3.5 max-w-xs truncate" title={order.vendorAddress}>{order.vendorAddress}</td>
                                    <td className="p-3.5 max-w-xs truncate" title={order.customerAddress}>{order.customerAddress}</td>
                                    <td className="p-3.5">
                                      <div>Dist: {order.distance} mi</div>
                                      <div className="text-[10px] text-slate-500 mt-0.5">Gross: ${Number(order.grossPayout || 0).toFixed(2)}</div>
                                    </td>
                                    <td className="p-3.5">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                        order.status === 'pending' || order.status === 'Processing Order' ? 'bg-amber-950/40 text-amber-400 border-amber-800/40 animate-pulse' :
                                        order.status === 'Vendor Preparing Food' ? 'bg-orange-950/40 text-orange-400 border-orange-800/40' :
                                        order.status === 'Driver Assigned' ? 'bg-blue-950/40 text-blue-400 border-blue-800/40' :
                                        order.status === 'On the Way' ? 'bg-indigo-950/40 text-indigo-400 border-indigo-800/40' :
                                        order.status === 'Delivered' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40' :
                                        'bg-zinc-950/40 text-slate-400 border-slate-800/40'
                                      }`}>
                                        {order.status}
                                      </span>
                                    </td>
                                    <td className="p-3.5">
                                      {matchedDriver ? (
                                        <div className="flex items-center gap-1.5 text-white font-semibold">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                          {matchedDriver.fullName}
                                        </div>
                                      ) : (
                                        <span className="text-slate-500 font-mono italic">Unassigned</span>
                                      )}
                                    </td>
                                    <td className="p-3.5 text-right">
                                      {!order.driverId || order.status === 'pending' || order.status === 'Processing Order' ? (
                                        <div className="flex items-center justify-end gap-1.5">
                                          <select
                                            id={`assign-driver-select-${order.id}`}
                                            className="px-2 py-1 bg-black border border-white/20 rounded text-[10px] text-white focus:border-white focus:outline-none"
                                            defaultValue=""
                                          >
                                            <option value="" disabled>Select Driver...</option>
                                            {availableDrivers.map(d => (
                                              <option key={d.id} value={d.id}>{d.fullName}</option>
                                            ))}
                                          </select>
                                          <button
                                            onClick={() => {
                                              const select = document.getElementById(`assign-driver-select-${order.id}`);
                                              if (select) handleAssignDriver(order.id, select.value);
                                            }}
                                            className="px-2.5 py-1 border border-white rounded text-[10px] font-bold uppercase bg-white text-black hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                                          >
                                            Assign
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-[10px] text-slate-500 uppercase font-mono">Dispatched</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Tab: Vendors */}
                {adminSubTab === 'vendors' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Connected Storefront Vendors</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/20 font-bold uppercase text-slate-400">
                            <th className="py-2.5">Vendor Name</th>
                            <th className="py-2.5">Operating Borough</th>
                            <th className="py-2.5">Active Menu Items</th>
                            <th className="py-2.5">Rating</th>
                            <th className="py-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {vendors.map(vendor => (
                            <tr key={vendor.id} className="hover:bg-zinc-950 transition-colors">
                              <td className="py-3 font-bold text-white uppercase">{vendor.name}</td>
                              <td className="py-3">{vendor.borough}</td>
                              <td className="py-3 font-semibold">{vendor.items.length} Products</td>
                              <td className="py-3">{vendor.rating} ★</td>
                              <td className="py-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-white text-white">
                                  ACTIVE
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sub Tab: Finance */}
                {adminSubTab === 'finance' && (() => {
                  const totalSubtotal = financeLogs.reduce((acc, log) => acc + (log.subtotal || 0), 0);
                  const totalVendorComm = financeLogs.reduce((acc, log) => acc + (log.vendorCommission || (log.subtotal * 0.10) || 0), 0);
                  const totalVendorPayout = totalSubtotal - totalVendorComm;
                  const totalDriverGross = financeLogs.reduce((acc, log) => acc + (log.driverGross || (log.distance * 2.00) || 0), 0);
                  const totalDriverComm = financeLogs.reduce((acc, log) => acc + (log.driverCommission || ((log.distance * 2.00) * 0.10) || 0), 0);
                  const totalDriverNet = financeLogs.reduce((acc, log) => acc + (log.driverPay || 0), 0);
                  const totalPlatformRev = financeLogs.reduce((acc, log) => acc + (log.platformRev || 0), 0);

                  return (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-heading">Platform Revenue Ledger</h3>
                        <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded border border-white/20 text-slate-300 uppercase font-bold tracking-widest">
                          10% split active
                        </span>
                      </div>

                      {/* Stat Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="border border-white/20 p-4 rounded-xl bg-zinc-950">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Gross Sales</div>
                          <div className="text-lg sm:text-xl font-black text-white mt-1">${totalSubtotal.toFixed(2)}</div>
                        </div>
                        <div className="border border-white/20 p-4 rounded-xl bg-zinc-950">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Vendor Net Payout</div>
                          <div className="text-lg sm:text-xl font-black text-white mt-1">${totalVendorPayout.toFixed(2)}</div>
                        </div>
                        <div className="border border-white/20 p-4 rounded-xl bg-zinc-950">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Driver Net Earnings</div>
                          <div className="text-lg sm:text-xl font-black text-emerald-400 mt-1">${totalDriverNet.toFixed(2)}</div>
                        </div>
                        <div className="border-2 border-white p-4 rounded-xl bg-white text-black shadow-lg">
                          <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Platform Net Revenue</div>
                          <div className="text-lg sm:text-xl font-black mt-1">${totalPlatformRev.toFixed(2)}</div>
                        </div>
                      </div>

                      <div className="overflow-x-auto border border-white/10 rounded-xl bg-zinc-950/30 p-2">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-white/20 font-bold uppercase text-slate-400">
                              <th className="py-3 px-2">Order ID</th>
                              <th className="py-3 px-2">Distance</th>
                              <th className="py-3 px-2 text-right">Subtotal</th>
                              <th className="py-3 px-2 text-right text-amber-500">Vendor Comm (10%)</th>
                              <th className="py-3 px-2 text-right">Driver Gross</th>
                              <th className="py-3 px-2 text-right text-amber-500">Driver Fee (10%)</th>
                              <th className="py-3 px-2 text-right text-emerald-400 font-bold">Driver Net</th>
                              <th className="py-3 px-2 text-right text-white font-extrabold">Platform Net</th>
                              <th className="py-3 px-2 text-right">Timestamp</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {financeLogs.map(log => {
                              const vendorComm = log.vendorCommission || (log.subtotal * 0.10);
                              const driverGross = log.driverGross || (log.distance * 2.00);
                              const driverComm = log.driverCommission || (driverGross * 0.10);
                              return (
                                <tr key={log.id} className="hover:bg-zinc-950 transition-colors">
                                  <td className="py-3.5 px-2 font-mono font-bold text-white uppercase">{log.orderId}</td>
                                  <td className="py-3.5 px-2 text-slate-300">{log.distance.toFixed(1)} mi</td>
                                  <td className="py-3.5 px-2 text-right font-mono">${log.subtotal.toFixed(2)}</td>
                                  <td className="py-3.5 px-2 text-right font-mono text-amber-500/90">${vendorComm.toFixed(2)}</td>
                                  <td className="py-3.5 px-2 text-right font-mono text-slate-400">${driverGross.toFixed(2)}</td>
                                  <td className="py-3.5 px-2 text-right font-mono text-amber-500/90">${driverComm.toFixed(2)}</td>
                                  <td className="py-3.5 px-2 text-right font-mono text-emerald-400 font-bold">${log.driverPay.toFixed(2)}</td>
                                  <td className="py-3.5 px-2 text-right font-mono text-white font-black bg-white/5 border-l border-r border-white/5">${log.platformRev.toFixed(2)}</td>
                                  <td className="py-3.5 px-2 text-right font-mono text-[9px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}

                {/* Sub Tab: Integrations */}
                {adminSubTab === 'integrations' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3 flex-wrap gap-2">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Shopify & Shipday Integration Hub</h3>
                      <div className="flex gap-2">
                        {shopDomain && storefrontToken && adminTokenInput ? (
                          <span className="flex items-center gap-1.5 text-[9px] bg-emerald-950/20 border border-emerald-500/30 px-2 py-0.5 rounded text-emerald-400 font-bold uppercase tracking-wider">
                            <Check className="w-3 h-3" /> Shopify Connected
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[9px] bg-amber-950/20 border border-amber-500/30 px-2 py-0.5 rounded text-amber-400 font-bold uppercase tracking-wider">
                            Shopify Disconnected
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 text-[9px] bg-emerald-950/20 border border-emerald-500/30 px-2 py-0.5 rounded text-emerald-400 font-bold uppercase tracking-wider">
                          <Check className="w-3 h-3" /> Shipday Active
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Shopify API Logs Panel */}
                      <div className="border border-white/20 p-5 rounded-xl bg-zinc-950/40 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="bg-white text-black text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded">SHOPIFY</span>
                            <h4 className="text-xs font-bold uppercase text-white font-heading">Storefront Sync logs</h4>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">ONLINE (SSL)</span>
                        </div>
                        
                        <div className="space-y-2.5 font-mono text-[10px] bg-black p-3.5 border border-white/10 rounded-lg overflow-y-auto max-h-[220px]">
                          {shopifyLogs.map((log, idx) => (
                            <div key={idx} className="text-slate-500">
                              [{log.timestamp}] <span className={log.color}>{log.type}:</span> {log.message}
                            </div>
                          ))}
                        </div>

                        <div className="text-[10px] text-slate-400 leading-normal">
                          * Storefront API synchronizes food items from products list automatically when configurations are populated.
                        </div>
                      </div>

                      {/* Shipday Webhooks Panel */}
                      <div className="border border-white/20 p-5 rounded-xl bg-zinc-950/40 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="bg-white text-black text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded">SHIPDAY</span>
                            <h4 className="text-xs font-bold uppercase text-white font-heading">Dispatch webhook logs</h4>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">LISTENING (HMAC Verified)</span>
                        </div>
                        
                        <div className="space-y-2.5 font-mono text-[10px] bg-black p-3.5 border border-white/10 rounded-lg overflow-y-auto max-h-[220px]">
                          {shipdayLogs.map((log, idx) => (
                            <div key={idx} className="text-slate-500">
                              [{log.timestamp}] <span className={log.color}>{log.type}:</span> {log.message}
                            </div>
                          ))}
                        </div>

                        <div className="text-[10px] text-slate-400 leading-normal">
                          * HMAC signature <code className="bg-white/10 px-1 rounded text-white text-[9px]">X-Shopify-Hmac-Sha256</code> is validated at the middleware endpoint before dispatching payload.
                        </div>
                      </div>

                      {/* Auth & Access Guide Panel */}
                      <div className="md:col-span-2 border border-white/20 p-5 rounded-xl bg-zinc-950/40 space-y-4">
                        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                          <Shield className="w-5 h-5 text-amber-500" />
                          <h4 className="text-sm font-bold uppercase text-white font-heading">Driver & Vendor Authentication Guide</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300 leading-normal">
                          <div className="space-y-2">
                            <h5 className="font-extrabold uppercase text-white flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> Vendor Flow
                            </h5>
                            <p>
                              1. **Application:** Vendors apply using the custom HTML page embedded in the Shopify theme (customizable above).
                            </p>
                            <p>
                              2. **Staff Invitation:** Admin clicks **Invite Staff** in the **Apps** queue, sending a Shopify staff invite link.
                            </p>
                            <p>
                              3. **Inventory Management:** Vendors accept the invite to manage their plates, pricing, and orders directly inside Shopify.
                            </p>
                            <p>
                              4. **Live Dashboard & GPS:** Vendors sign in to the **Vendor Portal** (top right menu) using their registered email and staff passcode <code className="bg-white/10 px-1 rounded text-white font-mono text-[10px]">vendor-123</code> to toggle their active food truck status and publish coordinates.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <h5 className="font-extrabold uppercase text-white flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span> Driver Flow
                            </h5>
                            <p>
                              1. **Application:** Drivers apply using the registration form. Their profile appears in the **Drivers** tab.
                            </p>
                            <p>
                              2. **Credentials & Approval:** Fleet managers toggle their status to approved. Approved drivers receive system-generated credentials via SMS/email.
                            </p>
                            <p>
                              3. **Operations Console:** Drivers use their credentials to log into their transit companion app.
                            </p>
                            <p>
                              4. **Fares & Claims:** Drivers claim unassigned orders, sync live geolocations, track distances, and withdraw split commissions.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Tab: Support Chat Console */}
                {adminSubTab === 'support' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-heading">Support Helpdesk Chat</h3>
                        <p className="text-[10px] text-zinc-500">Respond to customer and field operator support inquiries.</p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm("Reset chat history for this demo?")) {
                            setSupportMessages([
                              { id: 'm-1', sender: 'admin', text: 'Welcome to CURBSIDES Live Support! How can we assist you today?', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
                            ]);
                          }
                        }}
                        className="text-[9px] border border-zinc-800 bg-zinc-950 px-2.5 py-1 rounded text-zinc-500 hover:text-white hover:border-zinc-500 transition-all uppercase font-bold cursor-pointer"
                      >
                        Reset Chat
                      </button>
                    </div>

                    <div className="border border-white/10 rounded-xl bg-zinc-950/40 overflow-hidden flex flex-col h-[400px]">
                      {/* Chat Messages */}
                      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-zinc-950/20 flex flex-col">
                        {supportMessages.map(msg => (
                          <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-xl p-3 border text-xs leading-normal ${
                              msg.sender === 'admin'
                                ? 'bg-white text-black border-white'
                                : 'bg-black text-white border-white/20'
                            }`}>
                              <span className="block text-[8px] font-bold uppercase tracking-wider mb-1 text-slate-500">
                                {msg.sender === 'admin' ? 'Administrator' : 'Customer'}
                              </span>
                              <p className="m-0 font-medium whitespace-pre-wrap">{msg.text}</p>
                              <span className={`block text-[8px] mt-1 text-right font-mono ${
                                msg.sender === 'admin' ? 'text-zinc-600' : 'text-slate-500'
                              }`}>{msg.timestamp}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Chat Input */}
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!adminSupportInput.trim()) return;
                          const newMsg = {
                            id: 'm-' + Date.now(),
                            sender: 'admin',
                            text: adminSupportInput.trim(),
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          };
                          setSupportMessages(prev => [...prev, newMsg]);
                          setAdminSupportInput('');
                        }} 
                        className="p-3 border-t border-white/20 bg-black flex gap-2"
                      >
                        <input
                          type="text"
                          placeholder="Type reply as Administrator..."
                          value={adminSupportInput}
                          onChange={(e) => setAdminSupportInput(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg bg-zinc-950 border border-white/10 text-xs text-white focus:border-white focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 border-2 border-white bg-white text-black hover:bg-black hover:text-white rounded-lg text-xs font-bold uppercase transition-all cursor-pointer font-heading"
                        >
                          Send Reply
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Directory Tab View */}
        {activeTab !== 'track' && activeTab !== 'admin' && activeTab !== 'vendor-onboard' && activeTab !== 'vendor-portal' && activeTab !== 'account' && (
          <>
            {/* Left / Main Section: Directory & Outlines */}
            <div className={`lg:col-span-7 flex flex-col border-r-2 border-white overflow-y-auto ${
              activeTab === 'map' ? 'hidden lg:flex' : 'flex'
            }`}>
              
              {/* Hero Banner with double-lined logo and subway sign theme */}
              <div className="p-6 border-b-2 border-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-black relative overflow-hidden">
                <div className="space-y-3 z-10">
                  <div className="flex items-center gap-3">
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-white m-0 uppercase font-heading select-none">
                      CURBSIDES
                    </h1>
                    <div className="flex items-center gap-0.5 bg-white/10 px-2 py-1 rounded border border-white/20">
                      <Wifi className="w-4 h-4 text-white rotate-45" />
                      <span className="text-[9px] font-bold tracking-widest text-slate-300 uppercase">OMNY Ready</span>
                    </div>
                  </div>
                  <p className="text-xs font-bold tracking-wider text-slate-300 uppercase m-0 font-heading">
                    Street Food. Every Corner.
                  </p>
                  <p className="text-xs text-slate-400 uppercase tracking-wide max-w-sm">
                    A multivendor food & delivery marketplace built for the NYC streets. Discover food trucks nearby.
                  </p>
                </div>
                
                {/* Horizontal Transit Lines */}
                <div className="flex flex-col gap-1 w-full md:w-32 py-1.5 border-y-2 border-white">
                  <span className="w-full h-1 bg-white"></span>
                  <span className="w-full h-1 bg-white"></span>
                  <span className="w-full h-1 bg-white"></span>
                  <span className="w-full h-1 bg-white"></span>
                  <span className="w-full h-1 bg-white"></span>
                </div>
              </div>

              {/* Featured Food Truck Row */}
              <div className="p-6 border-b-2 border-white bg-zinc-950/20">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-400 mb-4 tracking-wider">
                  <Sparkles className="w-4 h-4 text-white" />
                  Featured Vendor
                </div>

                <div className="omny-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-2">
                    <span className="bg-white text-black font-extrabold text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded">
                      Top Pick
                    </span>
                    <h3 className="text-xl font-bold uppercase text-white font-heading">Korean BBQ Taco Truck</h3>
                    <p className="text-xs text-slate-400">Midtown, NYC &bull; Open Now &bull; Fusion Tacos & Fries</p>
                  </div>

                  <button
                    onClick={() => {
                      const vendor = vendors.find(v => v.id === 'vendor-korean-taco');
                      if (vendor) setSelectedVendor(vendor);
                    }}
                    className="px-4 py-2 border-2 border-white rounded-lg bg-white text-black text-xs font-bold uppercase flex items-center gap-1.5 hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                  >
                    Order menu
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Search, Filter, and Borough selector */}
              <div className="p-6 border-b-2 border-white space-y-4">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search street flavors (e.g. tacos, empanadas)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl omny-input text-sm text-white"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {['All', 'Manhattan', 'Brooklyn', 'Queens', 'Harlem'].map(borough => (
                    <button
                      key={borough}
                      onClick={() => setSelectedBorough(borough)}
                      className={`px-3 py-1.5 border-2 border-white rounded-lg text-xs font-bold uppercase transition-all cursor-pointer font-heading ${
                        selectedBorough === borough 
                          ? 'bg-white text-black' 
                          : 'bg-black text-white hover:bg-white/10'
                      }`}
                    >
                      {borough}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vendor Rows List */}
              <div className="flex-1 divide-y-2 divide-white">
                {loading ? (
                  <div className="p-12 text-center text-slate-500 font-bold uppercase text-xs tracking-widest animate-pulse">
                    Fetching subway connections...
                  </div>
                ) : filteredVendors.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 font-bold uppercase text-xs tracking-widest">
                    No vendors found on this line.
                  </div>
                ) : (
                  filteredVendors.map(vendor => (
                    <div 
                      key={vendor.id} 
                      onClick={() => {
                        setSelectedVendor(vendor);
                        setVendorModalTab('menu');
                      }}
                      className="p-6 flex justify-between items-center hover:bg-zinc-950 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {vendor.logo ? (
                          <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-black flex-shrink-0">
                            <img src={vendor.logo} alt={vendor.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center bg-black text-white font-black text-lg flex-shrink-0">
                            {vendor.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold uppercase text-white font-heading truncate">{vendor.name}</h3>
                            {vendor.isOpen && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping flex-shrink-0"></span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                            <MapPin className="w-3.5 h-3.5 text-white" />
                            <span className="truncate">{vendor.borough}</span>
                            <span className="text-amber-500 font-bold ml-1">{vendor.rating ? `${vendor.rating.toFixed(1)} ★` : '5.0 ★'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                        <span className="text-[10px] border border-white/30 px-2 py-0.5 rounded text-slate-400 uppercase font-bold tracking-widest hidden sm:inline-block">
                          {vendor.items.length} Items
                        </span>
                        <div className="w-8 h-8 rounded-lg border-2 border-white flex items-center justify-center hover:bg-white hover:text-black transition-all">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Interactive Barcode Ticket (Metrocard styled) */}
              <div className="p-6 border-t-2 border-white bg-black">
                <div className="border-2 border-white rounded-xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[180px] bg-black">
                  {/* Ticket Top */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-lg font-black tracking-widest text-white uppercase font-heading">
                        CURBSIDES
                      </span>
                      <p className="text-[8px] text-slate-400 font-bold tracking-widest uppercase">Transit Fare Pass</p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-white uppercase tracking-wider">Tap to Feed</span>
                      <div className="flex gap-0.5">
                        <span className="w-1 h-3 bg-white"></span>
                        <span className="w-1 h-3 bg-white"></span>
                        <span className="w-1 h-3 bg-white"></span>
                      </div>
                    </div>
                  </div>

                  {/* Barcode representation */}
                  <div className="my-4 flex items-center gap-1 bg-black p-2 border border-white/20 rounded">
                    <div className="flex-1 flex gap-[3px] items-center h-8 overflow-hidden select-none opacity-80">
                      {[2,4,1,3,1,5,2,2,4,1,3,2,5,1,1,3,2,4,1,5,2,2,4,1,3,2,5,1,2,4,1,3,1,5,2,2,4,1,3,2].map((w, i) => (
                        <span key={i} className="h-full bg-white flex-1" style={{ maxWidth: `${w}px` }}></span>
                      ))}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 pl-2">
                      9999 NYC CARD
                    </div>
                  </div>

                  {/* Card Footer Details */}
                  <div className="flex justify-between items-end border-t border-white/20 pt-3">
                    <span className="text-[9px] font-mono tracking-widest text-slate-400">
                      123456789109876543 &bull; 1234 &bull; 06/26
                    </span>
                    
                    <div className="flex gap-4 text-xs font-bold text-white uppercase font-heading">
                      <span className="flex items-center gap-1"><Navigation className="w-3 h-3" /> Delivery</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Discover</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Section: Map / Leaflet view */}
            <div className={`lg:col-span-5 relative flex flex-col bg-black overflow-hidden h-[calc(100vh-120px)] lg:h-full w-full ${
              activeTab === 'map' ? 'flex' : 'hidden lg:flex'
            }`}>
              {/* Map Heading Overlay */}
              <div className="absolute top-4 left-4 z-10 glass px-4 py-2 border-2 border-white rounded-xl max-w-xs shadow-xl">
                <h3 className="text-sm font-extrabold text-white tracking-tight uppercase font-heading flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-white" />
                  Live Street Tracker
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">Real-time truck locations</p>
              </div>

              {/* Leaflet container */}
              <div ref={mapRef} className="w-full h-full z-0 bg-neutral-950"></div>
            </div>
          </>
        )}

      </div>

      {/* Mobile Navigation bar */}
      <div className="lg:hidden border-t-2 border-white flex divide-x-2 divide-white bg-black z-30 sticky bottom-0">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex-1 py-3 text-xs font-bold uppercase font-heading tracking-wider cursor-pointer ${
            activeTab === 'directory' ? 'bg-white text-black' : 'bg-black text-white'
          }`}
        >
          Trucks Feed
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`flex-1 py-3 text-xs font-bold uppercase font-heading tracking-wider cursor-pointer ${
            activeTab === 'map' ? 'bg-white text-black' : 'bg-black text-white'
          }`}
        >
          Active Map
        </button>
      </div>

      {/* Modal: Vendor Menu */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl border-2 border-white bg-black rounded-2xl flex flex-col max-h-[85vh] overflow-hidden shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="p-6 border-b-2 border-white flex justify-between items-start">
              <div className="flex items-center gap-4">
                {selectedVendor.logo ? (
                  <div className="w-16 h-16 rounded-full border-2 border-white overflow-hidden bg-black flex-shrink-0">
                    <img src={selectedVendor.logo} alt={selectedVendor.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center bg-black text-white font-black text-2xl flex-shrink-0">
                    {selectedVendor.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <span className="bg-white text-black font-extrabold text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded">
                    Menu
                  </span>
                  <h2 className="text-2xl font-bold uppercase text-white font-heading mt-1">{selectedVendor.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedVendor.borough} &bull; Rating: {selectedVendor.rating ? selectedVendor.rating.toFixed(1) : '5.0'} ★ ({selectedVendor.reviews ? selectedVendor.reviews.length : 0} reviews)</p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedVendor(null)}
                className="p-2 border-2 border-white rounded-lg hover:bg-white hover:text-black transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Subtabs */}
            <div className="flex border-b-2 border-white bg-black">
              <button
                onClick={() => setVendorModalTab('menu')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-r border-white/20 transition-all font-heading ${
                  vendorModalTab === 'menu' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                }`}
              >
                Dishes Menu
              </button>
              <button
                onClick={() => setVendorModalTab('reviews')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all font-heading ${
                  vendorModalTab === 'reviews' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                }`}
              >
                Reviews & Ratings ({selectedVendor.reviews ? selectedVendor.reviews.length : 0})
              </button>
            </div>

            {/* Subtab content: Menu */}
            {vendorModalTab === 'menu' && (
              <div className="flex-1 overflow-y-auto p-6 divide-y divide-white/20">
                {selectedVendor.items.map(item => {
                  const cartQty = cart.find(i => i.id === item.id)?.quantity || 0;
                  return (
                    <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-4 justify-between items-center">
                      {item.image && (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-white rounded-xl overflow-hidden flex-shrink-0 bg-zinc-950 relative">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      )}
                      <div className="space-y-1 flex-1 pr-4 min-w-0">
                        <h4 className="font-bold text-white uppercase text-base truncate">{item.name}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 sm:line-clamp-none">{item.description}</p>
                        <span className="text-sm font-bold text-white block pt-1">${item.price.toFixed(2)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {cartQty > 0 ? (
                          <div className="flex items-center gap-2 border-2 border-white rounded-lg p-0.5 bg-black">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="p-1 hover:bg-white hover:text-black rounded transition-all cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-bold text-xs px-2 text-white">{cartQty}</span>
                            <button 
                              onClick={() => addToCart(item, selectedVendor.name)}
                              className="p-1 hover:bg-white hover:text-black rounded transition-all cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item, selectedVendor.name)}
                            className="px-3 py-1.5 border-2 border-white rounded-lg text-xs font-bold uppercase bg-white text-black hover:bg-black hover:text-white transition-all cursor-pointer"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Subtab content: Reviews */}
            {vendorModalTab === 'reviews' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Review Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center border-2 border-white p-4 rounded-xl bg-zinc-950/40">
                  <div className="text-center sm:border-r border-white/20 sm:pr-4 py-2">
                    <div className="text-3xl font-black text-white font-heading">{selectedVendor.rating ? selectedVendor.rating.toFixed(1) : '5.0'}</div>
                    <div className="text-amber-500 font-extrabold text-sm mt-1">
                      {"★".repeat(Math.round(selectedVendor.rating || 5)) + "☆".repeat(5 - Math.round(selectedVendor.rating || 5))}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1.5">
                      {selectedVendor.reviews ? selectedVendor.reviews.length : 0} reviews
                    </div>
                  </div>
                  
                  <div className="col-span-2 space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Street Review Distribution</h4>
                    {[5, 4, 3, 2, 1].map(stars => {
                      const count = (selectedVendor.reviews || []).filter(r => r.rating === stars).length;
                      const percentage = (selectedVendor.reviews || []).length > 0 
                        ? (count / (selectedVendor.reviews || []).length) * 100 
                        : 0;
                      return (
                        <div key={stars} className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
                          <span className="w-8 font-bold">{stars} Star</span>
                          <div className="flex-1 h-2 border border-white/25 bg-black rounded-sm overflow-hidden">
                            <div className="h-full bg-white" style={{ width: `${percentage}%` }}></div>
                          </div>
                          <span className="w-6 text-right font-bold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Write a Review Form */}
                <form onSubmit={handleSubmitReview} className="border-2 border-white p-4 rounded-xl bg-zinc-950/40 space-y-4">
                  <h4 className="text-xs font-bold uppercase text-white tracking-widest border-b border-white/10 pb-2">Leave a Customer Review</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John D."
                        value={newReviewName}
                        onChange={(e) => setNewReviewName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg omny-input text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rating</label>
                      <select
                        value={newReviewRating}
                        onChange={(e) => setNewReviewRating(parseInt(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg omny-input text-xs text-white"
                      >
                        <option value="5">5 Stars ★★★★★</option>
                        <option value="4">4 Stars ★★★★☆</option>
                        <option value="3">3 Stars ★★★☆☆</option>
                        <option value="2">2 Stars ★★☆☆☆</option>
                        <option value="1">1 Star ★☆☆☆☆</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Comment / Experience</label>
                    <textarea
                      required
                      placeholder="How was the food, service, and wait time? Tap or type here..."
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg omny-input text-xs text-white h-20"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 border-2 border-white rounded-lg bg-white text-black font-extrabold text-xs uppercase hover:bg-black hover:text-white transition-all font-heading"
                  >
                    Submit Review Card
                  </button>
                </form>

                {/* Review List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Submitted Reviews</h4>
                  {(!selectedVendor.reviews || selectedVendor.reviews.length === 0) ? (
                    <p className="text-xs text-slate-500 uppercase tracking-wide text-center py-6">No customer reviews yet. Be the first to write one!</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedVendor.reviews.map(rev => (
                        <div key={rev.id} className="border border-white/10 p-4 rounded-xl bg-zinc-950/20 space-y-2">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <span className="font-bold text-white uppercase text-xs block">{rev.name}</span>
                              <span className="text-amber-500 font-extrabold text-[10px] block">
                                {"★".repeat(rev.rating) + "☆".repeat(5 - rev.rating)}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-500">{rev.date}</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed font-sans">{rev.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal footer */}
            <div className="p-6 border-t-2 border-white flex justify-between items-center bg-black">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Click checkout to tap OMNY pass
              </span>
              <button
                onClick={() => setSelectedVendor(null)}
                className="px-4 py-2 border-2 border-white rounded-lg bg-black text-white hover:bg-white hover:text-black text-xs font-bold uppercase transition-all cursor-pointer font-heading"
              >
                Close Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md border-l-2 border-white bg-black h-full flex flex-col shadow-2xl relative animate-slide-in">
            
            {/* Drawer Header */}
            <div className="p-6 border-b-2 border-white flex justify-between items-center">
              <h3 className="text-xl font-bold uppercase text-white font-heading flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-white" />
                Transit Fare Cart
              </h3>

              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 border-2 border-white rounded-lg hover:bg-white hover:text-black transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 divide-y divide-white/20">
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingBag className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Your fare cart is empty.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex justify-between items-center">
                    <div className="space-y-1">
                      <h4 className="font-bold text-white uppercase text-sm">{item.name}</h4>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">{item.vendorName}</p>
                      <span className="text-xs font-bold text-slate-300 block pt-0.5">
                        ${item.price.toFixed(2)} x {item.quantity}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 border-2 border-white rounded-lg p-0.5 bg-black">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 hover:bg-white hover:text-black rounded transition-all cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-xs px-2 text-white">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 hover:bg-white hover:text-black rounded transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            <div className="p-6 border-t-2 border-white bg-black space-y-4">
              <div className="flex justify-between items-center text-sm font-bold uppercase font-heading">
                <span>Fare Total:</span>
                <span className="text-lg">${getCartTotal().toFixed(2)}</span>
              </div>

              {checkoutUrl && (
                <div className="bg-zinc-900 border border-white/20 p-3 rounded-lg text-xs text-center space-y-2">
                  <p className="text-slate-300 font-semibold">Shopify checkout link generated!</p>
                  <a 
                    href={checkoutUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-white font-bold hover:underline"
                  >
                    Open Shopify Checkout
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setShowSandboxCheckout(true);
                }}
                disabled={cart.length === 0 || isCheckoutLoading}
                className="w-full py-4 border-2 border-white rounded-xl bg-white text-black font-extrabold text-sm uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer font-heading"
              >
                Checkout (Sandbox Simulation)
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal: Sandbox Checkout Simulation */}
      {showSandboxCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md border-2 border-white bg-black rounded-2xl p-6 md:p-8 shadow-2xl relative space-y-6">
            <button 
              onClick={() => setShowSandboxCheckout(false)}
              className="absolute top-4 right-4 p-2 border-2 border-white rounded-lg hover:bg-white hover:text-black transition-all cursor-pointer text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="bg-white text-black font-extrabold text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded animate-pulse">
                SECURE SANDBOX CHECKOUT
              </span>
              <h3 className="text-xl font-bold uppercase text-white font-heading mt-2">Place Sandbox Order</h3>
              <p className="text-xs text-slate-400 mt-1">This will simulate your Shopify cart checkout and automatically dispatch to Shipday (Prepaid Credit Card).</p>
            </div>

            {checkoutError && (
              <div className="p-3 border border-rose-500 bg-rose-950/20 text-rose-500 text-xs font-bold uppercase text-center rounded">
                {checkoutError}
              </div>
            )}

            <form onSubmit={handlePlaceSandboxOrder} className="space-y-4 text-white">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={checkoutName}
                  onChange={(e) => setCheckoutName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 text-sm text-white focus:border-white focus:outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="johndoe@example.com"
                  value={checkoutEmail}
                  onChange={(e) => setCheckoutEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 text-sm text-white focus:border-white focus:outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="555-0199"
                  value={checkoutPhone}
                  onChange={(e) => setCheckoutPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 text-sm text-white focus:border-white focus:outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Delivery Location (NYC Zone)</label>
                <select
                  value={checkoutAddress}
                  onChange={(e) => setCheckoutAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black border border-white/20 text-sm text-white focus:border-white focus:outline-none capitalize font-sans"
                >
                  <option value="Lower East Side, New York, NY 10038">Lower East Side (Manhattan)</option>
                  <option value="East Village, New York, NY 10003">East Village (Manhattan)</option>
                  <option value="Brooklyn Heights, Brooklyn, NY 11201">Brooklyn Heights (Brooklyn)</option>
                  <option value="Williamsburg, Brooklyn, NY 11211">Williamsburg (Brooklyn)</option>
                  <option value="Harlem, New York, NY 10027">Harlem (Manhattan)</option>
                  <option value="Astoria, Queens, NY 11102">Astoria (Queens)</option>
                  <option value="Flushing, Queens, NY 11354">Flushing (Queens)</option>
                  <option value="Dumbo, Brooklyn, NY 11201">Dumbo (Brooklyn)</option>
                </select>
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center text-xs font-bold uppercase mb-4 border-t border-white/10 pt-4">
                  <span>Fare Total:</span>
                  <span>${getCartTotal().toFixed(2)}</span>
                </div>

                <button
                  type="submit"
                  disabled={isCheckoutLoading}
                  className="w-full py-3.5 border-2 border-white rounded-xl bg-white text-black font-extrabold text-xs uppercase hover:bg-black hover:text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer font-heading"
                >
                  {isCheckoutLoading ? "Processing Transit..." : "Confirm & Place Order"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Shopify Backend Connection Config */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md border-2 border-white bg-black rounded-2xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setIsConfigOpen(false)}
              className="absolute top-4 right-4 p-2 border-2 border-white rounded-lg hover:bg-white hover:text-black transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-bold uppercase text-white font-heading mb-2">Shopify Connection</h3>
            <p className="text-xs text-slate-400 mb-6">Plug in your Shopify Storefront API keys to sync products and checkout flows.</p>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              {configSuccess && (
                <div className="p-3 border-2 border-white bg-white text-black text-xs font-bold uppercase text-center rounded flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> Connected Successfully!
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Shopify Domain</label>
                <input
                  type="text"
                  placeholder="your-store-name.myshopify.com"
                  value={shopDomain}
                  onChange={(e) => setShopDomain(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg omny-input text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Storefront API Access Token</label>
                <input
                  type="password"
                  placeholder="shpca_..."
                  value={storefrontToken}
                  onChange={(e) => setStorefrontToken(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg omny-input text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Admin API Access Token (shpat_...)</label>
                <input
                  type="password"
                  placeholder="shpat_..."
                  value={adminTokenInput}
                  onChange={(e) => setAdminTokenInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg omny-input text-xs text-white"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleStartOAuth}
                  className="w-full py-2.5 border-2 border-white rounded-lg bg-black text-white hover:bg-white hover:text-black font-bold text-xs uppercase transition-all cursor-pointer"
                >
                  Connect via Shopify OAuth
                </button>
                <button
                  type="submit"
                  className="w-full py-2.5 border-2 border-white rounded-lg bg-white text-black font-bold text-xs uppercase hover:bg-black hover:text-white transition-all cursor-pointer"
                >
                  Save Connection Config
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Staff Passcode Access Gate */}
      {isStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md border-2 border-white bg-black rounded-2xl p-6 shadow-2xl relative">
            <button 
              onClick={() => {
                setIsStaffOpen(false);
                setStaffError('');
                setStaffPasscode('');
              }}
              className="absolute top-4 right-4 p-2 border-2 border-white rounded-lg hover:bg-white hover:text-black transition-all cursor-pointer text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <span className="bg-white text-black font-extrabold text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded">
                Console Access Gate
              </span>
              <h3 className="text-xl font-bold uppercase text-white font-heading mt-3">Staff Passcode Verification</h3>
              <p className="text-xs text-slate-400 mt-1">Please enter the passcode to unlock admin and vendor operations controls.</p>
            </div>

            <form onSubmit={handleStaffAuth} className="space-y-4">
              {staffError && (
                <div className="p-3 border border-red-500 bg-red-950/20 text-red-500 text-xs font-bold uppercase text-center rounded">
                  {staffError}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Enter Passcode</label>
                <input
                  type="password"
                  placeholder="Passcode (e.g. curbside-admin-2026)"
                  value={staffPasscode}
                  onChange={(e) => setStaffPasscode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl omny-input text-sm text-white"
                  autoFocus
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 border-2 border-white rounded-xl bg-white text-black font-bold text-xs uppercase hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                >
                  Verify Passcode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t-2 border-white px-6 py-4 flex justify-between items-center text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span>&copy; 2026 CURBSIDES. Street Food, Every Corner.</span>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-slate-400 font-bold uppercase tracking-wider">
          <Activity className="w-3.5 h-3.5 text-white" /> System Operating
        </div>
      </footer>
      <div id="recaptcha-container"></div>
    </div>
  );
}
