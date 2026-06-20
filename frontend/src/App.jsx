import React, { useState, useEffect, useRef } from 'react';
import { 
  fetchVendorsAndProducts, 
  createShopifyCheckout, 
  getShopifyConfig, 
  saveShopifyConfig, 
  isShopifyConnected 
} from './shopify';
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
  Upload
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
  
  // Shopify Configuration Modal State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [shopDomain, setShopDomain] = useState('');
  const [storefrontToken, setStorefrontToken] = useState('');
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
  const [adminSubTab, setAdminSubTab] = useState('drivers'); // 'drivers' | 'finance' | 'vendors' | 'applications'
  const [adminError, setAdminError] = useState('');

  // Vendor User Authentication & Dashboard State
  const [vendorUser, setVendorUser] = useState(null);
  const [vendorLoginEmail, setVendorLoginEmail] = useState('');
  const [vendorLoginPasscode, setVendorLoginPasscode] = useState('');
  const [vendorLoginError, setVendorLoginError] = useState('');
  const [vendorActiveSubTab, setVendorActiveSubTab] = useState('menu'); // 'menu' | 'gps' | 'profile'
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

  // Synchronize profile forms safely
  useEffect(() => {
    if (vendorUser) {
      setProfileName(vendorUser.name);
      setProfileBorough(vendorUser.borough.replace(', NYC', '').trim());
      setProfileTags((vendorUser.tags || []).join(', '));
      setProfileIsOpen(vendorUser.isOpen);
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
      // Map mock emails for easy vendor login simulation
      const mappedData = data.map(v => ({
        ...v,
        email: v.email || (
          v.id === 'vendor-korean-taco' ? 'tacos@kbbq.com' :
          v.id === 'vendor-empanada-guy' ? 'empanadas@guy.com' :
          v.id === 'vendor-halal-kings' ? 'kings@halalcart.com' :
          `${v.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`
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
  }, [isConfigOpen]);

  // Sync Finance and Drivers from local operations server if running
  useEffect(() => {
    if (activeTab === 'admin' && isAdminAuthenticated) {
      const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';
      
      // Fetch finance ledger
      fetch(`${BACKEND_URL}/api/finance`)
        .then(res => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then(data => {
          if (data && data.length > 0) {
            const mapped = data.map(item => ({
              id: item.orderId || 'f-' + Math.random(),
              orderId: item.orderId,
              distance: item.totalDistance || item.distance || 0,
              subtotal: item.subtotal || (item.vendorCommissionSplit ? item.vendorCommissionSplit * 10 : 0) || 0,
              vendorCommission: item.vendorCommissionSplit || 0,
              driverGross: item.grossDriverPay || 0,
              driverCommission: item.driverCommissionSplit || 0,
              driverPay: item.netDriverPayout || item.driverPay || 0,
              platformRev: item.platformRevenue || item.platformRev || 0,
              timestamp: item.timestamp || new Date().toISOString()
            }));
            setFinanceLogs(mapped);
          }
        })
        .catch(err => console.log('Backend /api/finance not available, using mock logs.', err));

      // Fetch driver list
      fetch(`${BACKEND_URL}/api/drivers`)
        .then(res => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then(data => {
          if (data && data.length > 0) {
            setDrivers(data);
          }
        })
        .catch(err => console.log('Backend /api/drivers not available, using mock drivers.', err));
    }
  }, [activeTab, isAdminAuthenticated, adminSubTab]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (activeTab === 'map' || window.innerWidth >= 1024) {
      // Small timeout to let container render
      setTimeout(() => {
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
            const pos = coords[v.id] || [40.7128 + (Math.random() - 0.5) * 0.1, -74.0060 + (Math.random() - 0.5) * 0.1];
            
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

  // Shopify Checkout Creation
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
    setConfigSuccess(true);
    setTimeout(() => {
      setConfigSuccess(false);
      setIsConfigOpen(false);
    }, 1500);
  };

  // Search Order for Custom Customer Tracking
  const handleSearchOrder = (e) => {
    e.preventDefault();
    setTrackingError('');
    setSearchedOrder(null);

    if (!trackingOrderId.trim()) {
      setTrackingError('Please enter a valid order number.');
      return;
    }

    const statuses = ['Processing Order', 'Vendor Preparing Food', 'Driver Assigned', 'On the Way', 'Delivered'];
    const orderHash = trackingOrderId.length % 5;
    const currentStatus = statuses[orderHash];
    const vendorMap = {
      0: 'Korean BBQ Taco Truck',
      1: 'Empanada Guy',
      2: 'Ramen on Wheels',
      3: 'Jerk Chicken Spot',
      4: 'Korean BBQ Taco Truck'
    };

    setSearchedOrder({
      id: trackingOrderId.trim(),
      status: currentStatus,
      vendor: vendorMap[orderHash],
      eta: 10 + orderHash * 5,
      driverName: orderHash % 2 === 0 ? 'Carlos Rivera' : 'Sarah Chen',
      driverPhone: '555-0144'
    });
  };

  // Handle Vendor Onboarding Form
  const handleVendorOnboard = (e) => {
    e.preventDefault();
    setVendorOnboardError('');
    setVendorOnboardSuccess(false);

    if (!vendorName.trim() || !vendorEmail.trim() || !vendorPhone.trim() || !vendorFoodType.trim()) {
      setVendorOnboardError('All fields are required.');
      return;
    }

    const newApp = {
      id: 'v-app-' + Date.now(),
      name: vendorName.trim(),
      email: vendorEmail.trim(),
      phone: vendorPhone.trim(),
      foodType: vendorFoodType.trim(),
      borough: vendorBorough,
      status: 'pending'
    };

    setVendorApplications([...vendorApplications, newApp]);
    setVendorOnboardSuccess(true);

    // Clear form fields
    setVendorName('');
    setVendorEmail('');
    setVendorPhone('');
    setVendorFoodType('');
  };

  // Handle Vendor GPS Location Update
  const handleUpdateGps = () => {
    setGpsStatus('Locating your food truck...');
    setGpsCoords(null);

    if (!selectedPortalVendorId) {
      setGpsStatus('Please select your food truck name first.');
      return;
    }

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
        console.log(`[Supabase] Updated vendor ${selectedPortalVendorId} location to: [${lat}, ${lon}]`);
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
  const handleVendorLogin = (e) => {
    e.preventDefault();
    setVendorLoginError('');
    
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
      // Auto-register a new vendor so the user can sign in with whatever email they want
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
        items: [
          {
            id: 'mock-new-1',
            name: 'Signature Dish',
            description: 'Our house special prepared fresh daily.',
            price: 9.99,
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'
          }
        ]
      };
      
      setVendors([...vendors, newVendor]);
      setVendorUser(newVendor);
      setSelectedPortalVendorId(newVendorId);
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

  // Add a new menu item to the vendor
  const handleAddMenuItem = (e) => {
    e.preventDefault();
    if (!newMenuName || !newMenuPrice || !vendorUser) return;
    
    const newItem = {
      id: 'menu-' + Date.now(),
      name: newMenuName,
      description: newMenuDesc,
      price: parseFloat(newMenuPrice),
      image: newMenuImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60' // Default fallback photo
    };

    const updatedVendors = vendors.map(v => {
      if (v.id === vendorUser.id) {
        const updatedItems = [...v.items, newItem];
        // Set vendorUser inside state updates correctly
        setVendorUser({ ...v, items: updatedItems });
        return { ...v, items: updatedItems };
      }
      return v;
    });

    setVendors(updatedVendors);
    
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
          isOpen: profileIsOpen
        };
        setVendorUser(updated);
        return updated;
      }
      return v;
    });

    setVendors(updatedVendors);
    alert('Store Profile updated successfully!');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col antialiased selection:bg-white selection:text-black">
      
      {/* Header */}
      <header className="border-b-2 border-white px-6 py-4 flex justify-between items-center sticky top-0 z-40 bg-black">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 cursor-pointer" onClick={() => setActiveTab('directory')}>
            <span className="text-xl font-bold tracking-tighter text-white uppercase font-heading">
              CURBSIDES
            </span>
            <div className="flex flex-col gap-0.5 ml-2">
              <span className="w-4 h-0.5 bg-white"></span>
              <span className="w-4 h-0.5 bg-white"></span>
              <span className="w-4 h-0.5 bg-white"></span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:gap-3">
          <button
            onClick={() => setActiveTab(activeTab === 'vendor-portal' ? 'directory' : 'vendor-portal')}
            className={`px-3 py-1.5 border-2 border-white rounded-lg text-xs font-bold uppercase transition-all cursor-pointer font-heading ${
              activeTab === 'vendor-portal' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
            }`}
          >
            Vendor Portal
          </button>

          {isStaffAuthenticated ? (
            <>
              <button
                onClick={() => setActiveTab(activeTab === 'admin' ? 'directory' : 'admin')}
                className={`px-3 py-1.5 border-2 border-white rounded-lg text-xs font-bold uppercase transition-all cursor-pointer font-heading ${
                  activeTab === 'admin' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                }`}
              >
                Admin Panel
              </button>

              <button
                onClick={() => setActiveTab(activeTab === 'vendor-onboard' ? 'directory' : 'vendor-onboard')}
                className={`px-3 py-1.5 border-2 border-white rounded-lg text-xs font-bold uppercase transition-all cursor-pointer font-heading ${
                  activeTab === 'vendor-onboard' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                }`}
              >
                Vendor Join
              </button>

              <button 
                onClick={() => setIsConfigOpen(true)}
                className="p-2 border-2 border-white rounded-lg hover:bg-white hover:text-black transition-all cursor-pointer"
                title="Configure Shopify Backend"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                onClick={handleStaffLogout}
                className="px-3 py-1.5 border-2 border-red-500 rounded-lg text-xs font-bold uppercase bg-black text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer font-heading"
                title="Lock Console / Log out staff"
              >
                Lock
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsStaffOpen(true)}
              className="px-3 py-1.5 border-2 border-zinc-700 rounded-lg text-xs font-bold uppercase bg-black text-zinc-400 hover:border-white hover:text-white transition-all cursor-pointer font-heading"
            >
              Admin Access
            </button>
          )}

          <button
            onClick={() => setActiveTab(activeTab === 'track' ? 'directory' : 'track')}
            className={`px-3 py-1.5 border-2 border-white rounded-lg text-xs font-bold uppercase transition-all cursor-pointer font-heading ${
              activeTab === 'track' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
            }`}
          >
            Track Order
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
        </div>
      </header>

      {/* Main Grid: Mobile Tabs or Dual Column Desktop Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Customer Tracking Page */}
        {activeTab === 'track' && (
          <div className="lg:col-span-12 p-6 flex flex-col justify-center items-center max-w-lg mx-auto w-full space-y-6">
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
                    className="w-full px-4 py-3 rounded-xl omny-input text-sm text-white"
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
              <div className="border-2 border-white rounded-2xl p-6 bg-black w-full shadow-2xl space-y-6 animate-fade-in">
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
                               searchedOrder.status === 'On the Way' ? '75%' : 
                               searchedOrder.status === 'Driver Assigned' ? '50%' : '25%' 
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
                    <span className="text-white font-bold">{searchedOrder.driverName}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[9px] bg-white/5 border border-white/10 px-2 py-1.5 rounded-xl text-slate-400 uppercase tracking-widest font-heading">
                  <Activity className="w-3.5 h-3.5 text-white animate-pulse" />
                  Secured via Shipday Dispatch API
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vendor Onboarding Application Form */}
        {activeTab === 'vendor-onboard' && isStaffAuthenticated && (
          <div className="lg:col-span-12 p-6 flex flex-col justify-center items-center max-w-lg mx-auto w-full">
            <div className="border-2 border-white rounded-2xl p-6 bg-black w-full shadow-2xl space-y-6">
              <div className="text-center">
                <span className="bg-white text-black font-extrabold text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded">
                  Join Curbsides
                </span>
                <h2 className="text-2xl font-bold uppercase text-white font-heading mt-3">Vendor Registration</h2>
                <p className="text-xs text-slate-400 mt-1">Apply to list your food truck menu on the CURBSIDES fleet marketplace.</p>
              </div>

              {vendorOnboardSuccess ? (
                <div className="border border-white/20 bg-white/5 p-6 rounded-xl text-center space-y-4 animate-fade-in">
                  <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center mx-auto bg-white text-black">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold uppercase text-white">Application Received!</h3>
                  <p className="text-xs text-slate-300">
                    Your onboarding application has been filed. To finalize menu setup:
                  </p>
                  <div className="bg-black border border-white/10 p-3 rounded-lg text-left text-xs space-y-1.5 text-slate-400 font-mono">
                    <div>1. Admin approves your app on the Admin Panel.</div>
                    <div>2. You will receive a Shopify Staff Account Invite.</div>
                    <div>3. Accept the invite to add/edit menu products.</div>
                  </div>
                  <button 
                    onClick={() => setVendorOnboardSuccess(false)}
                    className="text-xs text-white font-bold hover:underline"
                  >
                    Submit another application
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVendorOnboard} className="space-y-4">
                  {vendorOnboardError && (
                    <div className="border border-white/20 p-3 rounded-lg text-xs text-rose-400 bg-rose-950/20 font-bold uppercase">
                      {vendorOnboardError}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Food Truck Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Halal Cart Kings"
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg omny-input text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Business Email</label>
                      <input
                        type="email"
                        placeholder="email@example.com"
                        value={vendorEmail}
                        onChange={(e) => setVendorEmail(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg omny-input text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="(555) 000-0000"
                        value={vendorPhone}
                        onChange={(e) => setVendorPhone(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg omny-input text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Type of Food</label>
                      <input
                        type="text"
                        placeholder="e.g. Gyros, Tacos, Ramen"
                        value={vendorFoodType}
                        onChange={(e) => setVendorFoodType(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg omny-input text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Operating Borough</label>
                      <select
                        value={vendorBorough}
                        onChange={(e) => setVendorBorough(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg omny-input text-xs text-white"
                      >
                        <option value="Manhattan">Manhattan</option>
                        <option value="Brooklyn">Brooklyn</option>
                        <option value="Queens">Queens</option>
                        <option value="Bronx">Bronx</option>
                        <option value="Staten Island">Staten Island</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 border-2 border-white rounded-lg bg-white text-black font-bold text-xs uppercase hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                    >
                      Submit Joining Request
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Vendor Portal Tab: Authentication Gate & Workspace */}
        {activeTab === 'vendor-portal' && (
          <div className="lg:col-span-12 p-6 max-w-4xl mx-auto w-full">
            {!vendorUser ? (
              <div className="max-w-md mx-auto w-full border-2 border-white rounded-2xl p-6 bg-black shadow-2xl space-y-6">
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
                      className="w-full px-4 py-3 rounded-xl omny-input text-sm text-white"
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
                      className="w-full px-4 py-3 rounded-xl omny-input text-sm text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 border-2 border-white rounded-xl bg-white text-black font-extrabold text-xs uppercase hover:bg-black hover:text-white transition-all cursor-pointer font-heading"
                  >
                    Enter Dashboard
                  </button>
                </form>

                <div className="border-t border-white/10 pt-4 text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                    Approved Simulation Accounts
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
                    <span onClick={() => { setVendorLoginEmail('tacos@kbbq.com'); setVendorLoginPasscode('vendor-123'); }} className="cursor-pointer bg-zinc-950 border border-zinc-800 text-slate-300 text-[9px] px-2 py-0.5 rounded hover:border-white transition-all">tacos@kbbq.com</span>
                    <span onClick={() => { setVendorLoginEmail('empanadas@guy.com'); setVendorLoginPasscode('vendor-123'); }} className="cursor-pointer bg-zinc-950 border border-zinc-800 text-slate-300 text-[9px] px-2 py-0.5 rounded hover:border-white transition-all">empanadas@guy.com</span>
                    <span onClick={() => { setVendorLoginEmail('kings@halalcart.com'); setVendorLoginPasscode('vendor-123'); }} className="cursor-pointer bg-zinc-950 border border-zinc-800 text-slate-300 text-[9px] px-2 py-0.5 rounded hover:border-white transition-all">kings@halalcart.com</span>
                  </div>
                  <p className="mt-3 text-[9px] text-zinc-500 leading-normal">
                    * Logging in with a new email automatically registers a fresh vendor profile so you can manage a new store immediately (Passcode: vendor-123).
                  </p>
                </div>
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

                {/* Subtab: Live GPS location */}
                {vendorActiveSubTab === 'gps' && (
                  <div className="space-y-6">
                    <div className="text-center max-w-md mx-auto py-4">
                      <span className="bg-white text-black font-extrabold text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded">
                        Live Dispatch Ledger
                      </span>
                      <h3 className="text-lg font-bold uppercase text-white font-heading mt-3">GPS Location Publisher</h3>
                      <p className="text-xs text-slate-400 mt-1">Publish your street location coordinates directly to the map discoverer.</p>
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

                      <button
                        onClick={handleUpdateGps}
                        className="w-full py-4 border-2 border-white rounded-xl bg-white text-black font-extrabold text-xs uppercase hover:bg-black hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2 font-heading"
                      >
                        <Locate className="w-5 h-5" />
                        Tap to Publish Live GPS
                      </button>
                    </div>
                  </div>
                )}

                {/* Subtab: Store Profile */}
                {vendorActiveSubTab === 'profile' && (
                  <form onSubmit={handleUpdateVendorProfile} className="space-y-4 max-w-md mx-auto">
                    <div className="text-center max-w-md mx-auto py-4">
                      <span className="bg-white text-black font-extrabold text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded">
                        Store Registry
                      </span>
                      <h3 className="text-lg font-bold uppercase text-white font-heading mt-3">Edit Store Profile</h3>
                      <p className="text-xs text-slate-400 mt-1">Configure business identifiers and tags visible in the directory.</p>
                    </div>

                    <div className="border border-white/20 p-6 rounded-xl bg-zinc-950/40 space-y-4">
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
                <div className="flex justify-between items-center border-b border-white/20 pb-4 flex-wrap gap-4">
                  <div>
                    <h2 className="text-2xl font-bold uppercase text-white font-heading">Command Center Dashboard</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Manage drivers, vendors, and finance ledgers in one location.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAdminSubTab('drivers')}
                      className={`px-3 py-1.5 border border-white rounded text-xs font-bold uppercase transition-all ${
                        adminSubTab === 'drivers' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                      }`}
                    >
                      Drivers
                    </button>
                    <button
                      onClick={() => setAdminSubTab('vendors')}
                      className={`px-3 py-1.5 border border-white rounded text-xs font-bold uppercase transition-all ${
                        adminSubTab === 'vendors' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                      }`}
                    >
                      Vendors
                    </button>
                    <button
                      onClick={() => setAdminSubTab('applications')}
                      className={`px-3 py-1.5 border border-white rounded text-xs font-bold uppercase transition-all ${
                        adminSubTab === 'applications' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                      }`}
                    >
                      Apps
                    </button>
                    <button
                      onClick={() => setAdminSubTab('finance')}
                      className={`px-3 py-1.5 border border-white rounded text-xs font-bold uppercase transition-all ${
                        adminSubTab === 'finance' ? 'bg-white text-black' : 'bg-black text-white hover:bg-white/10'
                      }`}
                    >
                      Finance
                    </button>
                  </div>
                </div>

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
                                    setDrivers(drivers.map(d => d.id === driver.id ? { ...d, status: d.status === 'approved' ? 'pending' : 'approved' } : d));
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
                                  onClick={() => {
                                    setVendorApplications(vendorApplications.map(a => a.id === app.id ? { ...a, status: 'approved' } : a));
                                    alert(`Email invitation sent to: ${app.email}. Connect them as staff in Shopify Settings.`);
                                  }}
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
              </div>
            )}
          </div>
        )}

        {/* Directory Tab View */}
        {activeTab !== 'track' && activeTab !== 'admin' && activeTab !== 'vendor-onboard' && activeTab !== 'vendor-portal' && (
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
                      onClick={() => setSelectedVendor(vendor)}
                      className="p-6 flex justify-between items-center hover:bg-zinc-950 transition-colors cursor-pointer"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold uppercase text-white font-heading">{vendor.name}</h3>
                          {vendor.isOpen && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-white" />
                          {vendor.borough}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] border border-white/30 px-2 py-0.5 rounded text-slate-400 uppercase font-bold tracking-widest">
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
            <div className={`lg:col-span-5 relative flex-col bg-black overflow-hidden ${
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
              <div ref={mapRef} className="w-full h-full min-h-[400px] lg:h-full z-0 bg-neutral-950"></div>
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
              <div>
                <span className="bg-white text-black font-extrabold text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded">
                  Menu
                </span>
                <h2 className="text-2xl font-bold uppercase text-white font-heading mt-2">{selectedVendor.name}</h2>
                <p className="text-xs text-slate-400 mt-1">{selectedVendor.borough} &bull; Rating: {selectedVendor.rating} ★</p>
              </div>

              <button 
                onClick={() => setSelectedVendor(null)}
                className="p-2 border-2 border-white rounded-lg hover:bg-white hover:text-black transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items */}
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
                onClick={handleCheckout}
                disabled={cart.length === 0 || isCheckoutLoading}
                className="w-full py-4 border-2 border-white rounded-xl bg-white text-black font-extrabold text-sm uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer font-heading"
              >
                {isCheckoutLoading ? "Loading..." : "Tap to checkout"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

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

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 border-2 border-white rounded-lg bg-white text-black font-bold text-xs uppercase hover:bg-black hover:text-white transition-all cursor-pointer"
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
        <div>&copy; 2026 CURBSIDES. Street Food, Every Corner.</div>
        <div className="flex items-center gap-1.5 text-[9px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-slate-400 font-bold uppercase tracking-wider">
          <Activity className="w-3.5 h-3.5 text-white" /> System Operating
        </div>
      </footer>

    </div>
  );
}
