import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Package, MapPin, Truck, CheckCircle, Clock, User,
  XCircle, AlertCircle, Warehouse, Home, Navigation,
  CreditCard, Smartphone, ExternalLink, ArrowLeft, Shield
} from 'lucide-react';
import { API } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const statusSteps = ['Pending', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];

const statusConfig = {
  'Pending':          { color: 'text-yellow-400', bg: 'bg-yellow-400', border: 'border-yellow-400/30', badge: 'bg-yellow-400/10 text-yellow-400' },
  'Confirmed':        { color: 'text-blue-400',   bg: 'bg-blue-400',   border: 'border-blue-400/30',   badge: 'bg-blue-400/10 text-blue-400' },
  'Shipped':          { color: 'text-purple-400', bg: 'bg-purple-400', border: 'border-purple-400/30', badge: 'bg-purple-400/10 text-purple-400' },
  'Out for Delivery': { color: 'text-orange-400', bg: 'bg-orange-400', border: 'border-orange-400/30', badge: 'bg-orange-400/10 text-orange-400' },
  'Delivered':        { color: 'text-green-400',  bg: 'bg-green-400',  border: 'border-green-400/30',  badge: 'bg-green-400/10 text-green-400' },
  'Cancelled':        { color: 'text-red-400',    bg: 'bg-red-400',    border: 'border-red-400/30',    badge: 'bg-red-400/10 text-red-400' },
};

/* Cancel order modal */
function CancelModal({ order, onCancel, onClose }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const reasons = [
    'Changed my mind',
    'Ordered by mistake',
    'Found a better price elsewhere',
    'Delivery taking too long',
    'Other',
  ];

  const handleCancel = async () => {
    setLoading(true);
    try {
      await API.put(`/order/${order._id}/cancel`, { reason: reason || 'Cancelled by customer' });
      toast.success('Order cancelled. Stock restored.');
      onCancel();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="bg-dark-800 border border-white/10 rounded-2xl p-6 w-full max-w-md animate-scale-in">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
            <XCircle size={20} className="text-red-400" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">Cancel Order</h3>
            <p className="text-xs text-gray-500">#{String(order._id).slice(-8).toUpperCase()}</p>
          </div>
        </div>

        <p className="text-sm text-gray-400 mb-4">Why are you cancelling this order?</p>

        <div className="space-y-2 mb-4">
          {reasons.map(r => (
            <label key={r} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-dark-700/50 transition-colors">
              <input type="radio" name="reason" value={r} checked={reason === r}
                onChange={() => setReason(r)} className="accent-brand-500" />
              <span className="text-sm">{r}</span>
            </label>
          ))}
        </div>

        {reason === 'Other' && (
          <textarea
            placeholder="Tell us more..."
            className="w-full px-4 py-3 bg-dark-700/60 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 outline-none resize-none mb-4"
            rows={2}
            onChange={e => setReason(e.target.value)}
          />
        )}

        {order.paymentMethod === 'UPI' && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-4">
            <p className="text-xs text-blue-300">💙 UPI payment will be marked as <strong>Refunded</strong>. Actual refund depends on your payment app.</p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-dark-700 hover:bg-dark-600 text-white text-sm font-semibold rounded-xl transition-colors">
            Keep Order
          </button>
          <button onClick={handleCancel} disabled={loading || !reason}
            className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <XCircle size={16} />}
            Confirm Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* Delivery map */
function DeliveryMap({ order }) {
  const warehouse = order.warehouseLocation || {};
  const wLat = warehouse.lat || 28.5700;
  const wLng = warehouse.lng || 77.3219;
  const dest = order.shippingAddress || {};
  const dLat = dest.lat || 28.6139;
  const dLng = dest.lng || 77.2090;
  const st = statusConfig[order.status] || statusConfig['Pending'];

  const progressPct = {
    'Pending': 5, 'Confirmed': 20, 'Shipped': 50,
    'Out for Delivery': 80, 'Delivered': 100, 'Cancelled': 0,
  }[order.status] || 0;

  const statusLabels = {
    'Pending': 'Order received at warehouse',
    'Confirmed': 'Being prepared for dispatch',
    'Shipped': 'Dispatched from warehouse',
    'Out for Delivery': '🚚 Agent is heading to you!',
    'Delivered': '✅ Delivered successfully',
    'Cancelled': '❌ Order cancelled',
  };

  return (
    <div className="bg-dark-800/50 border border-white/5 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <Navigation size={14} className="text-brand-500" /> Live Delivery Tracking
        </h2>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${st.badge}`}>{order.status}</span>
      </div>

      <div className="relative bg-dark-700/50 h-52 overflow-hidden">
        <iframe
          title="Delivery Map"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(wLng,dLng)-0.05},${Math.min(wLat,dLat)-0.05},${Math.max(wLng,dLng)+0.05},${Math.max(wLat,dLat)+0.05}&layer=mapnik`}
          className="w-full h-full border-0 opacity-70"
          style={{ filter: 'invert(1) hue-rotate(180deg) brightness(0.85) saturate(0.8)' }}
        />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-dark-900/90 border border-purple-400/30 rounded-lg px-2.5 py-1.5 backdrop-blur-sm">
            <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
              <Warehouse size={10} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-purple-300">Warehouse</p>
              <p className="text-xs text-gray-500">{warehouse.city || 'Fulfillment Center'}</p>
            </div>
          </div>
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-dark-900/90 border border-brand-500/30 rounded-lg px-2.5 py-1.5 backdrop-blur-sm">
            <div className="w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
              <Home size={10} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-300">Your Address</p>
              <p className="text-xs text-gray-500">{dest.city || 'Destination'}</p>
            </div>
          </div>
          {order.status === 'Out for Delivery' && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-orange-500/50">
                <Truck size={16} className="text-white" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0">
            <Warehouse size={11} className="text-purple-400" />
          </div>
          <div className="flex-1 relative h-2 bg-dark-700 rounded-full overflow-hidden">
            <div className={`absolute left-0 top-0 h-full ${st.bg} transition-all duration-1000 rounded-full`}
              style={{ width: `${progressPct}%` }} />
            {order.status === 'Out for Delivery' && (
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-1000" style={{ left: `${progressPct}%` }}>
                <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-dark-800 flex items-center justify-center">
                  <Truck size={8} className="text-white" />
                </div>
              </div>
            )}
          </div>
          <div className="w-6 h-6 bg-brand-500/20 rounded-full flex items-center justify-center shrink-0">
            <Home size={11} className="text-brand-400" />
          </div>
        </div>
        <p className={`text-center text-sm font-semibold mt-2 ${st.color}`}>{statusLabels[order.status]}</p>
      </div>
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancel, setShowCancel] = useState(false);

  const fetchOrder = () => {
    setLoading(true);
    API.get(`/order/${id}`)
      .then(res => setOrder(res.data.order))
      .catch(err => toast.error(err.response?.data?.message || 'Failed to load order'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleCancelled = () => {
    setShowCancel(false);
    fetchOrder();
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-dark-800/50 rounded-2xl relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer" />
        </div>
      ))}
    </div>
  );
  if (!order) return <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-500">Order not found.</div>;

  const st = statusConfig[order.status] || statusConfig['Pending'];
  const currentStep = statusSteps.indexOf(order.status);
  const canCancel = ['Pending', 'Confirmed'].includes(order.status);
  const isOwner = order.userId?._id === user?._id || order.userId === user?._id;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {showCancel && <CancelModal order={order} onCancel={handleCancelled} onClose={() => setShowCancel(false)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/orders')}
            className="p-2 rounded-xl bg-dark-700/50 hover:bg-dark-700 text-gray-400 hover:text-white transition-all">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-display font-bold text-xl">
              Order <span className="text-brand-500">#{String(order._id).slice(-8).toUpperCase()}</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Placed {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${st.badge}`}>{order.status}</span>
          {canCancel && isOwner && (
            <button onClick={() => setShowCancel(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-full text-xs font-semibold transition-all">
              <XCircle size={12} /> Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Status banners */}
      {order.status === 'Cancelled' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <XCircle size={22} className="text-red-400 shrink-0" />
          <div>
            <p className="font-semibold text-red-300">Order Cancelled</p>
            <p className="text-red-400/70 text-xs mt-0.5">{order.cancellationReason}</p>
            {order.paymentMethod === 'UPI' && <p className="text-xs text-blue-400 mt-1">💙 UPI payment has been marked as refunded</p>}
          </div>
        </div>
      )}
      {order.status === 'Out for Delivery' && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3 animate-neon-border">
          <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center shrink-0 animate-pulse">
            <Truck size={18} className="text-orange-400" />
          </div>
          <div>
            <p className="font-semibold text-orange-300">🚚 Agent is on the way!</p>
            <p className="text-orange-400/70 text-xs mt-0.5">Check your email for the delivery OTP when the agent arrives.</p>
          </div>
        </div>
      )}
      {order.status === 'Delivered' && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle size={22} className="text-green-400 shrink-0" />
          <div>
            <p className="font-semibold text-green-300">✅ Delivered successfully!</p>
            <p className="text-green-400/70 text-xs mt-0.5">
              {order.deliveredAt && `Delivered on ${new Date(order.deliveredAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
            </p>
          </div>
        </div>
      )}

      {/* Progress stepper */}
      {order.status !== 'Cancelled' && (
        <div className="bg-dark-800/50 border border-white/5 rounded-2xl p-5 mb-6">
          <div className="relative">
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-dark-600">
              <div className={`h-full ${st.bg} transition-all duration-700`}
                style={{ width: `${Math.max(0, currentStep / (statusSteps.length - 1)) * 100}%` }} />
            </div>
            <div className="relative flex justify-between">
              {statusSteps.map((step, i) => {
                const done = i <= currentStep;
                const icons = [Package, CheckCircle, Truck, Truck, CheckCircle];
                const Icon = icons[i];
                return (
                  <div key={step} className="flex flex-col items-center gap-2 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${done ? `${st.bg} border-transparent text-white` : 'bg-dark-800 border-dark-600 text-gray-600'}`}>
                      <Icon size={14} />
                    </div>
                    <span className={`text-xs text-center max-w-[64px] leading-tight ${done ? 'text-white font-medium' : 'text-gray-600'}`}>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {/* Left */}
        <div className="space-y-5">
          <DeliveryMap order={order} />

          {/* Tracking timeline */}
          {order.trackingTimeline?.length > 0 && (
            <div className="bg-dark-800/50 border border-white/5 rounded-2xl p-5">
              <h2 className="font-semibold text-sm text-gray-400 mb-4 flex items-center gap-2">
                <Clock size={14} /> Tracking History
              </h2>
              <div className="space-y-3">
                {[...order.trackingTimeline].reverse().map((entry, i) => {
                  const cfg = statusConfig[entry.status] || statusConfig['Pending'];
                  return (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1 ${i === 0 ? cfg.bg : 'bg-dark-600'}`} />
                        {i < order.trackingTimeline.length - 1 && <div className="w-0.5 flex-1 bg-dark-600 mt-1" />}
                      </div>
                      <div className="pb-3 min-w-0">
                        <p className={`text-sm font-medium ${i === 0 ? cfg.color : 'text-gray-400'}`}>{entry.message}</p>
                        <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5"><MapPin size={10} /> {entry.location}</p>
                        <p className="text-xs text-gray-700 mt-0.5">
                          {new Date(entry.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="space-y-5">
          {/* Order items */}
          <div className="bg-dark-800/50 border border-white/5 rounded-2xl p-5">
            <h2 className="font-semibold text-sm text-gray-400 mb-3 flex items-center gap-2">
              <Package size={14} /> Items ({order.products.length})
            </h2>
            <div className="space-y-3">
              {order.products.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <img src={item.image} alt={item.name}
                    className="w-14 h-14 rounded-xl object-cover bg-dark-700 shrink-0"
                    onError={e => e.target.src = 'https://placehold.co/56x56/1a1a2e/e94560?text=IMG'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}</p>
                  </div>
                  <p className="text-sm font-bold text-brand-500 shrink-0">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 mt-4 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Subtotal</span><span>₹{order.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm text-green-400"><span>Delivery</span><span>FREE</span></div>
              <div className="flex justify-between font-display font-black text-xl pt-2 border-t border-white/10">
                <span>Total</span><span className="text-brand-500">₹{order.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Payment info */}
          <div className="bg-dark-800/50 border border-white/5 rounded-2xl p-5">
            <h2 className="font-semibold text-sm text-gray-400 mb-3 flex items-center gap-2">
              <CreditCard size={14} /> Payment
            </h2>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${order.paymentMethod === 'UPI' ? 'bg-blue-500/10' : 'bg-orange-500/10'}`}>
                {order.paymentMethod === 'UPI'
                  ? <Smartphone size={16} className="text-blue-400" />
                  : <Truck size={16} className="text-orange-400" />}
              </div>
              <div>
                <p className="text-sm font-semibold">{order.paymentMethod === 'UPI' ? 'UPI Payment' : 'Cash on Delivery'}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  order.paymentStatus === 'Paid' ? 'bg-green-500/10 text-green-400' :
                  order.paymentStatus === 'Refunded' ? 'bg-blue-500/10 text-blue-400' :
                  order.paymentStatus === 'Failed' ? 'bg-red-500/10 text-red-400' :
                  'bg-yellow-500/10 text-yellow-400'
                }`}>{order.paymentStatus}</span>
              </div>
            </div>
            {order.upiTransactionId && (
              <p className="text-xs text-gray-500 mt-1">Txn ID: <span className="font-mono text-gray-400">{order.upiTransactionId}</span></p>
            )}
            {order.upiId && <p className="text-xs text-gray-500">UPI: {order.upiId}</p>}
          </div>

          {/* Shipping address */}
          <div className="bg-dark-800/50 border border-white/5 rounded-2xl p-5">
            <h2 className="font-semibold text-sm text-gray-400 mb-3 flex items-center gap-2"><MapPin size={14} /> Delivery Address</h2>
            <p className="text-sm font-medium">{order.userId?.name}</p>
            <p className="text-sm text-gray-400 mt-1">{order.shippingAddress?.street}</p>
            <p className="text-sm text-gray-400">{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
            <p className="text-sm text-gray-400">{order.shippingAddress?.pincode}</p>
            <p className="text-sm text-gray-500 mt-1">{order.userId?.phone}</p>
          </div>

          {/* Warehouse */}
          <div className="bg-dark-800/50 border border-white/5 rounded-2xl p-5">
            <h2 className="font-semibold text-sm text-gray-400 mb-3 flex items-center gap-2"><Warehouse size={14} /> Dispatched From</h2>
            <p className="text-sm font-semibold text-purple-300">{order.warehouseLocation?.name || 'DeliverVerify Fulfillment Center'}</p>
            <p className="text-sm text-gray-400 mt-1">{order.warehouseLocation?.address}</p>
            <p className="text-sm text-gray-400">{order.warehouseLocation?.city}, {order.warehouseLocation?.state} — {order.warehouseLocation?.pincode}</p>
            {order.warehouseLocation?.mapsLink && (
              <a href={order.warehouseLocation.mapsLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 mt-2 transition-colors">
                <ExternalLink size={11} /> View on Google Maps
              </a>
            )}
          </div>

          {/* Agent */}
          {order.deliveryAgentId && (
            <div className="bg-dark-800/50 border border-white/5 rounded-2xl p-5">
              <h2 className="font-semibold text-sm text-gray-400 mb-3 flex items-center gap-2"><User size={14} /> Delivery Agent</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center font-black text-orange-400">
                  {order.deliveryAgentId.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{order.deliveryAgentId.name}</p>
                  <p className="text-sm text-gray-400">{order.deliveryAgentId.phone}</p>
                </div>
              </div>
            </div>
          )}

          {/* OTP reminder */}
          {!['Delivered', 'Cancelled'].includes(order.status) && (
            <div className="bg-dark-700/50 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
              <Shield size={16} className="text-brand-500 shrink-0" />
              <p className="text-xs text-gray-400">A <strong className="text-white">6-digit OTP</strong> will be emailed to you when the agent arrives for doorstep verification.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
