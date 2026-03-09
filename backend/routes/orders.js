const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');
const { sendOTPEmail, sendOrderConfirmationEmail } = require('../utils/email');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ── POST /api/order ── place order with payment + send OTP to customer
router.post('/order', auth, async (req, res) => {
  try {
    const { products, shippingAddress, paymentMethod = 'COD', upiId, upiTransactionId } = req.body;
    if (!products || products.length === 0)
      return res.status(400).json({ message: 'No products in order.' });

    // Validate UPI fields
    if (paymentMethod === 'UPI') {
      if (!upiTransactionId || upiTransactionId.trim().length < 6)
        return res.status(400).json({ message: 'Valid UPI Transaction ID is required.' });
    }

    let totalAmount = 0;
    const orderProducts = [];

    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive)
        return res.status(400).json({ message: `Product ${item.productId} not found.` });
      if (product.stock < item.quantity)
        return res.status(400).json({ message: `Insufficient stock for ${product.name}.` });

      orderProducts.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image
      });
      totalAmount += product.price * item.quantity;
      await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
    }

    const address = shippingAddress || req.user.address;
    const estimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    // Generate confirmation OTP (sent to customer on order placement)
    const confirmOtp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min to note it down

    const timeline = [{
      status: 'Pending',
      message: 'Order placed successfully',
      location: 'DeliverVerify Fulfillment Center',
      timestamp: new Date()
    }];

    const order = new Order({
      userId: req.user._id,
      products: orderProducts,
      totalAmount,
      shippingAddress: address,
      estimatedDelivery,
      trackingTimeline: timeline,
      paymentMethod,
      paymentStatus: paymentMethod === 'UPI' ? 'Paid' : 'Pending',
      upiId: upiId || null,
      upiTransactionId: upiTransactionId || null,
    });
    await order.save();

    // Send order confirmation email with OTP preview
    const customer = req.user;
    const emailResult = await sendOrderConfirmationEmail(
      customer.email, customer.name, order._id,
      orderProducts, totalAmount, paymentMethod, upiTransactionId
    );

    const populatedOrder = await Order.findById(order._id).populate('userId', 'name email phone');

    res.status(201).json({
      message: 'Order placed successfully! Confirmation sent to your email.',
      order: populatedOrder,
      emailSent: emailResult.success,
      ...(process.env.NODE_ENV !== 'production' && { note: 'Check your email for order confirmation' })
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to place order.', error: err.message });
  }
});

// ── GET /api/orders/my ──
router.get('/orders/my', auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('deliveryAgentId', 'name phone')
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders.', error: err.message });
  }
});

// ── GET /api/order/:id ──
router.get('/order/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('deliveryAgentId', 'name phone');
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    const isOwner = order.userId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isAgent = req.user.role === 'agent' && order.deliveryAgentId?._id?.toString() === req.user._id.toString();
    if (!isOwner && !isAdmin && !isAgent) return res.status(403).json({ message: 'Access denied.' });

    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch order.', error: err.message });
  }
});

// ── GET /api/orders ── (admin)
router.get('/orders', adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .populate('deliveryAgentId', 'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ orders, total });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders.', error: err.message });
  }
});

// ── PUT /api/order/:id/cancel ── customer cancels their own order
router.put('/order/:id/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    // Only owner can cancel
    if (order.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'You can only cancel your own orders.' });

    // Only cancellable if Pending or Confirmed
    const cancellable = ['Pending', 'Confirmed'];
    if (!cancellable.includes(order.status))
      return res.status(400).json({
        message: `Cannot cancel order with status "${order.status}". Only Pending or Confirmed orders can be cancelled.`
      });

    // Restore stock
    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
    }

    order.status = 'Cancelled';
    order.cancellationReason = reason || 'Cancelled by customer';
    order.cancelledBy = 'customer';
    if (order.paymentMethod === 'UPI') order.paymentStatus = 'Refunded';

    order.trackingTimeline.push({
      status: 'Cancelled',
      message: reason || 'Order cancelled by customer',
      location: 'N/A',
      timestamp: new Date()
    });

    await order.save();
    const updated = await Order.findById(order._id).populate('userId', 'name email phone');
    res.json({ message: 'Order cancelled successfully. Stock has been restored.', order: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel order.', error: err.message });
  }
});

// ── PUT /api/order/:id/status ── (admin)
router.put('/order/:id/status', adminAuth, async (req, res) => {
  try {
    const { status, deliveryAgentId, cancellationReason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    const messages = {
      'Confirmed':        { message: 'Order confirmed and being prepared', location: 'DeliverVerify Fulfillment Center' },
      'Shipped':          { message: 'Order packed and dispatched from warehouse', location: 'DeliverVerify Fulfillment Center' },
      'Out for Delivery': { message: 'Out for delivery — agent heading to your location', location: 'En route to ' + (order.shippingAddress?.city || 'your location') },
      'Delivered':        { message: 'Order delivered successfully', location: order.shippingAddress?.city || 'Delivery address' },
      'Cancelled':        { message: cancellationReason || 'Order cancelled by admin', location: 'N/A' }
    };

    const entry = messages[status];
    if (entry) {
      order.trackingTimeline.push({ status, message: entry.message, location: entry.location, timestamp: new Date() });
    }

    order.status = status;
    if (deliveryAgentId) order.deliveryAgentId = deliveryAgentId;
    if (cancellationReason) { order.cancellationReason = cancellationReason; order.cancelledBy = 'admin'; }
    if (status === 'Delivered') order.deliveredAt = new Date();

    if (status === 'Cancelled') {
      for (const item of order.products) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
      }
      if (order.paymentMethod === 'UPI') order.paymentStatus = 'Refunded';
    }

    await order.save();
    const updated = await Order.findById(order._id)
      .populate('userId', 'name email phone')
      .populate('deliveryAgentId', 'name phone');
    res.json({ message: 'Order status updated!', order: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update order.', error: err.message });
  }
});

module.exports = router;
