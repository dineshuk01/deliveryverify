const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { auth, agentAuth } = require('../middleware/auth');
const { sendOTPEmail } = require('../utils/email');
const crypto = require('crypto');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/generate-otp - agent generates OTP for delivery
router.post('/generate-otp', agentAuth, async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'Order ID is required.' });

    const order = await Order.findById(orderId).populate('userId', 'name email phone');
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    if (order.status === 'Delivered') return res.status(400).json({ message: 'Order already delivered.' });
    if (order.status === 'Cancelled') return res.status(400).json({ message: 'Order is cancelled.' });

    // Check if agent is assigned
    if (req.user.role === 'agent' && order.deliveryAgentId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not assigned to this order.' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Update order with OTP
    order.otp = otp;
    order.otpExpiry = otpExpiry;
    order.otpAttempts = 0;
    if (order.status !== 'Out for Delivery') order.status = 'Out for Delivery';
    if (!order.deliveryAgentId) order.deliveryAgentId = req.user._id;
    await order.save();

    // Send OTP email
    const customer = order.userId;
    const emailResult = await sendOTPEmail(customer.email, otp, orderId, customer.name);

    console.log(`🔐 OTP ${otp} generated for order ${orderId} - Customer: ${customer.email}`);

    res.json({
      message: `OTP generated and sent to customer's email (${customer.email})`,
      orderId,
      customerName: customer.name,
      customerEmail: customer.email,
      expiresIn: '5 minutes',
      emailSent: emailResult.success,
      // Include OTP in response for demo purposes (remove in production)
      ...(process.env.NODE_ENV !== 'production' && { otp, note: 'OTP shown for demo only - remove in production' })
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate OTP.', error: err.message });
  }
});

// POST /api/verify-otp - agent verifies OTP entered by customer
router.post('/verify-otp', agentAuth, async (req, res) => {
  try {
    const { orderId, otp } = req.body;
    if (!orderId || !otp) return res.status(400).json({ message: 'Order ID and OTP are required.' });

    const order = await Order.findById(orderId).populate('userId', 'name email phone');
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    if (order.status === 'Delivered') return res.status(400).json({ message: 'Order already delivered.' });

    if (!order.otp) return res.status(400).json({ message: 'No OTP generated for this order. Please generate first.' });

    // Check max attempts
    if (order.otpAttempts >= order.otpMaxAttempts) {
      return res.status(429).json({ message: 'Maximum OTP attempts exceeded. Please generate a new OTP.' });
    }

    // Check expiry
    if (new Date() > order.otpExpiry) {
      return res.status(400).json({ message: 'OTP has expired. Please generate a new OTP.' });
    }

    // Increment attempt count
    order.otpAttempts += 1;

    // Verify OTP
    if (order.otp !== otp.toString().trim()) {
      await order.save();
      const remaining = order.otpMaxAttempts - order.otpAttempts;
      return res.status(400).json({
        message: `Invalid OTP. ${remaining} attempt(s) remaining.`,
        attemptsRemaining: remaining
      });
    }

    // OTP correct - mark as delivered
    order.status = 'Delivered';
    order.otp = null;
    order.otpExpiry = null;
    order.deliveredAt = new Date();
    await order.save();

    res.json({
      message: '✅ OTP verified! Order marked as Delivered.',
      order: {
        _id: order._id,
        status: order.status,
        deliveredAt: order.deliveredAt,
        customerName: order.userId.name
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'OTP verification failed.', error: err.message });
  }
});

// GET /api/otp-status/:orderId - check OTP status
router.get('/otp-status/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    const hasActiveOtp = order.otp && new Date() < order.otpExpiry;
    const timeRemaining = hasActiveOtp ? Math.floor((order.otpExpiry - Date.now()) / 1000) : 0;

    res.json({
      hasActiveOtp,
      timeRemaining,
      attemptsUsed: order.otpAttempts,
      attemptsRemaining: order.otpMaxAttempts - order.otpAttempts,
      orderStatus: order.status
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get OTP status.', error: err.message });
  }
});

module.exports = router;
