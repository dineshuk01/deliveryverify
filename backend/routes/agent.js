const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { agentAuth } = require('../middleware/auth');

// GET /api/agent/deliveries - get assigned deliveries
router.get('/agent/deliveries', agentAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { deliveryAgentId: req.user._id };
    if (status) query.status = status;
    else query.status = { $in: ['Shipped', 'Out for Delivery', 'Delivered'] };

    const orders = await Order.find(query)
      .populate('userId', 'name email phone address')
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch deliveries.', error: err.message });
  }
});

// GET /api/agent/stats
router.get('/agent/stats', agentAuth, async (req, res) => {
  try {
    const [assigned, outForDelivery, delivered] = await Promise.all([
      Order.countDocuments({ deliveryAgentId: req.user._id, status: 'Shipped' }),
      Order.countDocuments({ deliveryAgentId: req.user._id, status: 'Out for Delivery' }),
      Order.countDocuments({ deliveryAgentId: req.user._id, status: 'Delivered' })
    ]);

    res.json({ assigned, outForDelivery, delivered, total: assigned + outForDelivery + delivered });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get agent stats.', error: err.message });
  }
});

module.exports = router;
