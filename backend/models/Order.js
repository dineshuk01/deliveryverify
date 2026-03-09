const mongoose = require('mongoose');

// ── WAREHOUSE LOCATION ──
// Update lat/lng once you confirm the Google Maps link: https://share.google/J8TrE3IVnfmJcqDU9
const WAREHOUSE_LOCATION = {
  name: 'DeliverVerify Fulfillment Center',
  address: 'Sector 18, Noida',   // ← update with actual address from Maps link
  city: 'Noida',
  state: 'Uttar Pradesh',
  pincode: '201301',
  lat: 28.5700,    // ← replace once Maps link is confirmed
  lng: 77.3219,    // ← replace once Maps link is confirmed
  mapsLink: 'https://share.google/J8TrE3IVnfmJcqDU9'
};

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    price: Number,
    quantity: { type: Number, required: true, min: 1 },
    image: String
  }],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },

  // ── PAYMENT ──
  paymentMethod: {
    type: String,
    enum: ['UPI', 'COD'],
    default: 'COD'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  upiTransactionId: { type: String, default: null },
  upiId: { type: String, default: null },

  shippingAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    lat: { type: Number, default: 28.6139 },
    lng: { type: Number, default: 77.2090 }
  },
  warehouseLocation: {
    type: Object,
    default: WAREHOUSE_LOCATION
  },
  trackingTimeline: [{
    status: String,
    message: String,
    location: String,
    timestamp: { type: Date, default: Date.now }
  }],
  otp: { type: String, default: null },
  otpExpiry: { type: Date, default: null },
  otpAttempts: { type: Number, default: 0 },
  otpMaxAttempts: { type: Number, default: 3 },
  deliveryAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  deliveredAt: { type: Date, default: null },
  estimatedDelivery: { type: Date, default: null },
  cancellationReason: { type: String, default: null },
  cancelledBy: { type: String, enum: ['customer', 'admin', null], default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Order', orderSchema);
module.exports.WAREHOUSE_LOCATION = WAREHOUSE_LOCATION;
