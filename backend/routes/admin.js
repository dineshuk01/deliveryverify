const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { adminAuth } = require('../middleware/auth');

// GET /api/admin/stats
router.get('/admin/stats', adminAuth, async (req, res) => {
  try {
    const [totalUsers, totalOrders, totalProducts, deliveredOrders, pendingOrders, revenue] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Order.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments({ status: 'Delivered' }),
      Order.countDocuments({ status: { $in: ['Pending', 'Confirmed', 'Shipped', 'Out for Delivery'] } }),
      Order.aggregate([{ $match: { status: 'Delivered' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }])
    ]);

    res.json({
      totalUsers,
      totalOrders,
      totalProducts,
      deliveredOrders,
      pendingOrders,
      totalRevenue: revenue[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get stats.', error: err.message });
  }
});

// GET /api/admin/users
router.get('/admin/users', adminAuth, async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};
    const users = await User.find(query).sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users.', error: err.message });
  }
});

// GET /api/admin/agents
router.get('/admin/agents', adminAuth, async (req, res) => {
  try {
    const agents = await User.find({ role: 'agent', isActive: true }).select('-password');
    res.json({ agents });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch agents.', error: err.message });
  }
});

// PUT /api/admin/user/:id/role
router.put('/admin/user/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['customer', 'admin', 'agent'].includes(role)) return res.status(400).json({ message: 'Invalid role.' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json({ message: 'User role updated.', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update role.', error: err.message });
  }
});

// PUT /api/admin/order/:id/assign
router.put('/admin/order/:id/assign', adminAuth, async (req, res) => {
  try {
    const { agentId } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { deliveryAgentId: agentId, status: 'Shipped' },
      { new: true }
    ).populate('userId', 'name email').populate('deliveryAgentId', 'name phone');

    if (!order) return res.status(404).json({ message: 'Order not found.' });
    res.json({ message: 'Agent assigned!', order });
  } catch (err) {
    res.status(500).json({ message: 'Failed to assign agent.', error: err.message });
  }
});

// Seed initial admin (dev only)
router.post('/admin/seed', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') return res.status(403).json({ message: 'Not allowed in production.' });

    const existing = await User.findOne({ email: 'admin@deliververify.com' });
    if (existing) {
      // Clear existing products and re-seed
      await Product.deleteMany({});
    } else {
      const admin = new User({ name: 'Super Admin', email: 'admin@deliververify.com', phone: '9999999999', password: 'Admin@123', role: 'admin', address: { street: 'Warehouse District, Sector 18', city: 'Noida', state: 'Uttar Pradesh', pincode: '201301' } });
      await admin.save();
      const agent1 = new User({ name: 'Raju Sharma', email: 'agent@deliververify.com', phone: '8888888888', password: 'Agent@123', role: 'agent', address: { street: 'Lajpat Nagar', city: 'New Delhi', state: 'Delhi', pincode: '110024' } });
      await agent1.save();
      const agent2 = new User({ name: 'Vikram Singh', email: 'agent2@deliververify.com', phone: '7777777777', password: 'Agent@123', role: 'agent', address: { street: 'Dwarka Sector 10', city: 'New Delhi', state: 'Delhi', pincode: '110075' } });
      await agent2.save();
    }

    const adminUser = await User.findOne({ email: 'admin@deliververify.com' });

    const sampleProducts = [
      // Electronics - Phones
      { name: 'iPhone 15 Pro Max', description: 'Apple flagship with titanium design, A17 Pro chip, 48MP camera system and USB-C', price: 159999, stock: 45, category: 'Smartphones', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500' },
      { name: 'iPhone 15', description: 'Dynamic Island, 48MP main camera, A16 Bionic chip, all-day battery', price: 79999, stock: 60, category: 'Smartphones', image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500' },
      { name: 'Samsung Galaxy S24 Ultra', description: 'Galaxy AI, built-in S Pen, 200MP camera, Snapdragon 8 Gen 3', price: 129999, stock: 35, category: 'Smartphones', image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500' },
      { name: 'Samsung Galaxy S24', description: 'Compact flagship with Galaxy AI, 50MP camera, 7 years of updates', price: 74999, stock: 50, category: 'Smartphones', image: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=500' },
      { name: 'OnePlus 12', description: 'Hasselblad camera, Snapdragon 8 Gen 3, 100W SUPERVOOC charging', price: 64999, stock: 40, category: 'Smartphones', image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500' },
      { name: 'Google Pixel 8 Pro', description: 'Best Android camera with Google AI, 7 years of OS updates, Temperature sensor', price: 89999, stock: 25, category: 'Smartphones', image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500' },
      { name: 'Xiaomi 14 Pro', description: 'Leica optics, HyperOS, 50MP triple camera, 120W HyperCharge', price: 54999, stock: 55, category: 'Smartphones', image: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=500' },

      // Laptops
      { name: 'MacBook Air M3 13"', description: 'Apple M3 chip, 18-hour battery, Liquid Retina display, fanless design', price: 114999, stock: 20, category: 'Laptops', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=500' },
      { name: 'MacBook Pro M3 14"', description: 'ProRes video, Liquid Retina XDR, M3 Pro chip, 22-hour battery', price: 168999, stock: 15, category: 'Laptops', image: 'https://images.unsplash.com/photo-1611186871525-3c9890da09cb?w=500' },
      { name: 'Dell XPS 15', description: 'Intel Core i9, OLED display, NVIDIA RTX 4070, premium build quality', price: 149999, stock: 18, category: 'Laptops', image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500' },
      { name: 'ASUS ROG Zephyrus G14', description: 'AMD Ryzen 9, RTX 4060, 165Hz display, AniMe Matrix LED lid', price: 119999, stock: 22, category: 'Laptops', image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500' },
      { name: 'Lenovo ThinkPad X1 Carbon', description: 'Business ultrabook, Intel Core i7, 14" display, military-grade durability', price: 134999, stock: 16, category: 'Laptops', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500' },
      { name: 'HP Spectre x360 14', description: '2-in-1 laptop, Intel Evo, OLED touchscreen, 360° hinge, pen included', price: 139999, stock: 14, category: 'Laptops', image: 'https://images.unsplash.com/photo-1544099858-75fc90e01eef?w=500' },

      // Audio
      { name: 'Sony WH-1000XM5', description: 'Industry-leading noise cancellation, 30hr battery, Multipoint connection', price: 29999, stock: 80, category: 'Audio', image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500' },
      { name: 'Apple AirPods Pro 2nd Gen', description: 'Active Noise Cancellation, Adaptive Audio, MagSafe charging case', price: 24999, stock: 100, category: 'Audio', image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500' },
      { name: 'Bose QuietComfort 45', description: 'Legendary noise cancellation, 24hr battery, premium comfort headband', price: 26999, stock: 45, category: 'Audio', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500' },
      { name: 'Samsung Galaxy Buds3 Pro', description: 'Intelligent ANC, Hi-Fi audio, 360° audio, blade-type design', price: 17999, stock: 60, category: 'Audio', image: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=500' },
      { name: 'JBL Charge 5', description: 'IP67 waterproof Bluetooth speaker, 20hr playtime, powerbank feature', price: 13999, stock: 70, category: 'Audio', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500' },
      { name: 'Sennheiser Momentum 4', description: 'Audiophile wireless headphones, 60hr battery, Crystal-clear calls', price: 34999, stock: 30, category: 'Audio', image: 'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=500' },

      // Tablets
      { name: 'iPad Pro M4 12.9"', description: 'Ultra Retina XDR display, M4 chip, ProRes video, Apple Pencil Pro support', price: 119999, stock: 25, category: 'Tablets', image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500' },
      { name: 'iPad Air M2', description: 'M2 chip, 11" Liquid Retina, landscape camera, USB-C fast charging', price: 59999, stock: 35, category: 'Tablets', image: 'https://images.unsplash.com/photo-1542393545-10f5cde2c810?w=500' },
      { name: 'Samsung Galaxy Tab S9 Ultra', description: '14.6" Dynamic AMOLED, Snapdragon 8 Gen 2, S Pen included, IP68', price: 109999, stock: 20, category: 'Tablets', image: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=500' },

      // Cameras
      { name: 'Sony Alpha A7 IV', description: 'Full-frame mirrorless, 33MP, 4K 60fps video, AI autofocus, weather sealed', price: 249999, stock: 10, category: 'Cameras', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500' },
      { name: 'Canon EOS R6 Mark II', description: '40fps burst, in-body stabilization, 4K 60fps, dual card slots', price: 229999, stock: 8, category: 'Cameras', image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500' },
      { name: 'GoPro HERO12 Black', description: '5.3K video, HyperSmooth 6.0, waterproof to 10m, HDR video', price: 44999, stock: 40, category: 'Cameras', image: 'https://images.unsplash.com/photo-1452721226468-f95fb66ebf83?w=500' },
      { name: 'DJI Mini 4 Pro', description: '4K/60fps drone, omnidirectional obstacle sensing, 34min flight time', price: 74999, stock: 15, category: 'Cameras', image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=500' },

      // Wearables
      { name: 'Apple Watch Series 9', description: 'Double tap gesture, Always-on Retina, ECG, crash detection, S9 chip', price: 41999, stock: 55, category: 'Wearables', image: 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=500' },
      { name: 'Samsung Galaxy Watch 6', description: 'Advanced health tracking, body composition, sleep coaching, sapphire glass', price: 28999, stock: 45, category: 'Wearables', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500' },
      { name: 'Garmin Forerunner 965', description: 'Premium GPS running watch, training readiness, HRV status, AMOLED', price: 54999, stock: 20, category: 'Wearables', image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500' },
      { name: 'Fitbit Charge 6', description: 'Google Maps, YouTube Music, ECG, skin temp sensor, stress score', price: 14999, stock: 65, category: 'Wearables', image: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=500' },

      // Gaming
      { name: 'PlayStation 5', description: 'Next-gen console, 4K gaming, 120fps, DualSense haptics, SSD storage', price: 54990, stock: 30, category: 'Gaming', image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500' },
      { name: 'Xbox Series X', description: '12 teraflops GPU, 4K 120fps, Quick Resume, Game Pass ready', price: 49990, stock: 25, category: 'Gaming', image: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=500' },
      { name: 'Nintendo Switch OLED', description: '7" OLED screen, enhanced audio, wide adjustable stand, 64GB storage', price: 34990, stock: 40, category: 'Gaming', image: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=500' },
      { name: 'Razer BlackWidow V4 Pro', description: 'Mechanical gaming keyboard, Razer Chroma RGB, wireless, wrist rest', price: 21999, stock: 35, category: 'Gaming', image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=500' },
      { name: 'Logitech G Pro X Superlight 2', description: 'Ultra-lightweight gaming mouse, HERO 25K sensor, 95hr battery', price: 14999, stock: 50, category: 'Gaming', image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500' },

      // Home Appliances
      { name: 'Dyson V15 Detect', description: 'Laser dust detection, HEPA filtration, 60min runtime, LCD screen', price: 59999, stock: 20, category: 'Appliances', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500' },
      { name: 'Philips Air Fryer XXL', description: '7.3L capacity, Rapid Air technology, digital display, 8 presets', price: 12999, stock: 45, category: 'Appliances', image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=500' },
      { name: 'Nespresso Vertuo Next', description: 'Barcode centrifusion technology, 5 cup sizes, 36 blends, compact', price: 15999, stock: 30, category: 'Appliances', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500' },
      { name: 'iRobot Roomba j9+', description: 'Smart mapping, self-emptying base, avoids obstacles, carpet boost', price: 89999, stock: 15, category: 'Appliances', image: 'https://images.unsplash.com/photo-1589428906832-26f5a1f14a69?w=500' },

      // Fashion & Footwear
      { name: 'Nike Air Max 270', description: 'Max Air heel unit, breathable mesh upper, foam midsole, lifestyle shoe', price: 12995, stock: 120, category: 'Footwear', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500' },
      { name: 'Adidas Ultraboost 23', description: 'BOOST midsole, Primeknit+ upper, Continental rubber outsole, responsive ride', price: 16999, stock: 90, category: 'Footwear', image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500' },
      { name: 'Levi\'s 511 Slim Jeans', description: 'Classic slim fit, stretch denim, five-pocket styling, versatile everyday jean', price: 4999, stock: 200, category: 'Fashion', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500' },
      { name: 'Ray-Ban Aviator Classic', description: 'G-15 green lenses, gold-tone frame, UV protection, iconic pilot silhouette', price: 9999, stock: 80, category: 'Fashion', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500' },

      // Books & Stationery
      { name: 'Kindle Paperwhite 11th Gen', description: '6.8" glare-free display, adjustable warm light, waterproof, 10 weeks battery', price: 13999, stock: 60, category: 'Books & Stationery', image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500' },
      { name: 'Moleskine Classic Notebook', description: 'Hard cover, ruled pages, ribbon bookmark, elastic closure, pocket', price: 999, stock: 300, category: 'Books & Stationery', image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=500' },

      // Sports
      { name: 'Decathlon Kiprun KS900', description: 'Competition running shoe, carbon plate, maximum energy return, 4mm drop', price: 8999, stock: 75, category: 'Sports', image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=500' },
      { name: 'Yoga Mat Premium 6mm', description: 'Non-slip surface, eco-friendly TPE, alignment lines, carry strap included', price: 2499, stock: 150, category: 'Sports', image: 'https://images.unsplash.com/photo-1601925228008-f71a6b7e8a09?w=500' },
      { name: 'Resistance Bands Set', description: 'Set of 5 bands (10-50lbs), door anchor, handles, ankle straps, carry bag', price: 1499, stock: 200, category: 'Sports', image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=500' },

      // Smart Home
      { name: 'Amazon Echo Dot 5th Gen', description: 'Improved bass, Alexa built-in, smart home hub, temp sensor, clock display', price: 4999, stock: 90, category: 'Smart Home', image: 'https://images.unsplash.com/photo-1512446816042-444d641267d4?w=500' },
      { name: 'Philips Hue Starter Kit', description: '3x color bulbs + Bridge, 16M colors, voice control, app controlled ambiance', price: 12999, stock: 40, category: 'Smart Home', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500' },
      { name: 'TP-Link Tapo C200 Camera', description: 'Full HD 1080p, 360° pan/tilt, night vision, motion detection, two-way audio', price: 3499, stock: 85, category: 'Smart Home', image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=500' },
    ];

    for (const p of sampleProducts) {
      await new Product({ ...p, createdBy: adminUser._id }).save();
    }

    res.json({ message: `✅ Seeded ${sampleProducts.length} products! Admin: admin@deliververify.com / Admin@123 | Agent: agent@deliververify.com / Agent@123` });
  } catch (err) {
    res.status(500).json({ message: 'Seed failed.', error: err.message });
  }
});

module.exports = router;
