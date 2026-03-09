import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Clock, XCircle, Smartphone, Truck, CreditCard } from 'lucide-react';
import { API } from '../context/AuthContext';
import toast from 'react-hot-toast';

const statusConfig = {
  'Pending':          { color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  'Confirmed':        { color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  'Shipped':          { color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  'Out for Delivery': { color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
  'Delivered':        { color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  'Cancelled':        { color: 'text-red-400 bg-red-400/10 border-red-400/20' },
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchOrders = () => {
    setLoading(true);
    API.get('/orders/my')
      .then(res => setOrders(res.data.orders))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const quickCancel = async (e, orderId) => {
    e.preventDefault();
    if (!window.confirm('Cancel this order?')) return;
    setCancellingId(orderId);
    try {
      await API.put(`/order/${orderId}/cancel`, { reason: 'Cancelled by customer' });
      toast.success('Order cancelled & stock restored');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 bg-dark-800/50 rounded-2xl relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-bold">My Orders</h1>
        <span className="text-xs text-gray-500">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-7xl mb-4 float-slow">📦</div>
          <p className="text-gray-400 text-xl font-bold mb-2">No orders yet</p>
          <p className="text-gray-600 text-sm mb-6">Start shopping to see your orders here</p>
          <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all"
            style={{ boxShadow: '0 0 15px rgba(233,69,96,0.3)' }}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const st = statusConfig[order.status] || statusConfig['Pending'];
            const canCancel = ['Pending', 'Confirmed'].includes(order.status);
            return (
              <Link key={order._id} to={`/orders/${order._id}`}
                className="flex items-start gap-4 p-4 bg-dark-800/60 hover:bg-dark-800 border border-white/5 hover:border-white/10 rounded-2xl transition-all group">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  order.status === 'Delivered' ? 'bg-green-500/10' :
                  order.status === 'Cancelled' ? 'bg-red-500/10' :
                  order.status === 'Out for Delivery' ? 'bg-orange-500/10' : 'bg-dark-700'
                }`}>
                  {order.status === 'Out for Delivery'
                    ? <Truck size={20} className="text-orange-400 animate-pulse" />
                    : <Package size={20} className="text-gray-500" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs text-gray-500">#{order._id.slice(-8).toUpperCase()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${st.color}`}>
                      {order.status}
                    </span>
                    {/* Payment badge */}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                      order.paymentMethod === 'UPI' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'
                    }`}>
                      {order.paymentMethod === 'UPI' ? <Smartphone size={10} /> : <Truck size={10} />}
                      {order.paymentMethod}
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">{order.products.map(p => p.name).join(', ')}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-brand-500 font-bold text-sm">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                    <span className="text-gray-600 text-xs flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-xs text-gray-700">{order.products.length} item{order.products.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2 shrink-0">
                  {canCancel && (
                    <button
                      onClick={(e) => quickCancel(e, order._id)}
                      disabled={cancellingId === order._id}
                      className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Cancel order">
                      {cancellingId === order._id
                        ? <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        : <XCircle size={16} />}
                    </button>
                  )}
                  <ChevronRight size={18} className="text-gray-600 group-hover:text-brand-500 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
