import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle, Package, RefreshCw, Shield, AlertTriangle, Clock } from 'lucide-react';
import { API } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const statusColors = {
  'Shipped': 'text-purple-400 bg-purple-400/10',
  'Out for Delivery': 'text-orange-400 bg-orange-400/10',
  'Delivered': 'text-green-400 bg-green-400/10',
};

export default function AgentDashboard() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpData, setOtpData] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let interval;
    if (countdown > 0) {
      interval = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [delRes, statsRes] = await Promise.all([
        API.get('/agent/deliveries'),
        API.get('/agent/stats')
      ]);
      setDeliveries(delRes.data.orders);
      setStats(statsRes.data);
    } catch (err) {
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const generateOTP = async (orderId) => {
    setGenerating(true);
    try {
      const res = await API.post('/generate-otp', { orderId });
      setOtpData(res.data);
      setOtpInput('');
      setCountdown(300); // 5 min
      toast.success('OTP generated and sent to customer!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate OTP');
    } finally {
      setGenerating(false);
    }
  };

  const verifyOTP = async () => {
    if (!otpInput || otpInput.length !== 6) return toast.error('Enter a valid 6-digit OTP');
    setVerifying(true);
    try {
      const res = await API.post('/verify-otp', { orderId: activeOrder._id, otp: otpInput });
      toast.success(res.data.message);
      setActiveOrder(null);
      setOtpData(null);
      setOtpInput('');
      setCountdown(0);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const pending = deliveries.filter(d => d.status !== 'Delivered');
  const completed = deliveries.filter(d => d.status === 'Delivered');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Agent Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome, {user.name}</p>
        </div>
        <button onClick={fetchData} className="p-2 rounded-lg bg-dark-700/50 text-gray-400 hover:text-white transition-colors">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Assigned', value: stats.assigned || 0, color: 'text-purple-400', bg: 'bg-purple-400/10' },
          { label: 'Out for Delivery', value: stats.outForDelivery || 0, color: 'text-orange-400', bg: 'bg-orange-400/10' },
          { label: 'Delivered', value: stats.delivered || 0, color: 'text-green-400', bg: 'bg-green-400/10' },
        ].map(s => (
          <div key={s.label} className={`p-4 rounded-2xl border border-white/5 ${s.bg}`}>
            <div className={`font-display text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* OTP Verification Modal */}
      {activeOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-white/10 rounded-3xl p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-brand-500/10 border-2 border-brand-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield size={28} className="text-brand-500" />
              </div>
              <h2 className="font-display text-2xl font-bold">OTP Delivery Verification</h2>
              <p className="text-gray-500 text-sm mt-1">Order #{activeOrder._id.slice(-8).toUpperCase()}</p>
            </div>

            {/* Customer info */}
            <div className="bg-dark-700/50 rounded-xl p-3 mb-4 text-sm">
              <p className="text-gray-400">Customer: <span className="text-white font-medium">{activeOrder.userId?.name}</span></p>
              <p className="text-gray-400">Email: <span className="text-white">{activeOrder.userId?.email}</span></p>
              <p className="text-gray-400">Phone: <span className="text-white">{activeOrder.userId?.phone}</span></p>
            </div>

            {/* Generate OTP */}
            {!otpData ? (
              <button onClick={() => generateOTP(activeOrder._id)} disabled={generating}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors mb-3 flex items-center justify-center gap-2">
                {generating ? <><RefreshCw size={16} className="animate-spin" /> Generating...</> : <><Shield size={16} /> Generate & Send OTP</>}
              </button>
            ) : (
              <div className="space-y-4">
                {/* OTP Demo Display */}
                {otpData.otp && (
                  <div className="bg-brand-500/10 border border-brand-500/30 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">Demo OTP (sent to customer's email)</p>
                    <p className="font-mono font-black text-3xl text-brand-500 tracking-widest">{otpData.otp}</p>
                    <p className="text-xs text-gray-500 mt-1">{otpData.note}</p>
                  </div>
                )}

                {/* Countdown */}
                {countdown > 0 && (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Clock size={14} className={countdown < 60 ? 'text-red-400' : 'text-orange-400'} />
                    <span className={`font-mono font-bold ${countdown < 60 ? 'text-red-400' : 'text-orange-400'}`}>
                      {formatTime(countdown)}
                    </span>
                    <span className="text-gray-500">remaining</span>
                  </div>
                )}
                {countdown === 0 && (
                  <div className="flex items-center gap-2 text-red-400 text-sm justify-center">
                    <AlertTriangle size={14} />
                    <span>OTP expired. Generate a new one.</span>
                  </div>
                )}

                {/* OTP Input */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2 text-center">Enter OTP from customer:</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center text-3xl font-mono font-black tracking-widest px-4 py-4 bg-dark-700 border-2 border-white/10 focus:border-brand-500 rounded-xl text-white focus:outline-none transition-colors"
                    placeholder="------"
                  />
                </div>

                <button onClick={verifyOTP} disabled={verifying || otpInput.length !== 6 || countdown === 0}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                  {verifying ? <><RefreshCw size={16} className="animate-spin" /> Verifying...</> : <><CheckCircle size={16} /> Verify & Complete Delivery</>}
                </button>

                {countdown === 0 && (
                  <button onClick={() => { setOtpData(null); generateOTP(activeOrder._id); }}
                    className="w-full py-2.5 bg-dark-700 hover:bg-dark-600 text-gray-400 text-sm font-medium rounded-xl transition-colors">
                    Regenerate OTP
                  </button>
                )}
              </div>
            )}

            <button onClick={() => { setActiveOrder(null); setOtpData(null); setOtpInput(''); setCountdown(0); }}
              className="w-full mt-3 py-2.5 text-gray-600 hover:text-gray-400 text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pending deliveries */}
      <div className="mb-8">
        <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
          <Truck size={18} className="text-orange-400" /> Pending Deliveries ({pending.length})
        </h2>
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-dark-800/50 rounded-2xl animate-pulse" />)}</div>
        ) : pending.length === 0 ? (
          <div className="py-12 text-center bg-dark-800/30 rounded-2xl border border-white/5">
            <Package size={36} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">No pending deliveries</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(order => (
              <div key={order._id} className="p-4 bg-dark-800/50 border border-white/5 rounded-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-gray-500">#{order._id.slice(-8).toUpperCase()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] || 'text-gray-400 bg-gray-400/10'}`}>{order.status}</span>
                    </div>
                    <p className="font-medium text-sm">{order.userId?.name}</p>
                    <p className="text-gray-500 text-xs">{order.userId?.phone} • {order.userId?.email}</p>
                    <p className="text-gray-600 text-xs mt-1">
                      📍 {order.shippingAddress?.street}, {order.shippingAddress?.city}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {order.products.map(p => `${p.name} ×${p.quantity}`).join(', ')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-brand-500 font-bold text-sm mb-2">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                    <button onClick={() => setActiveOrder(order)}
                      className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5">
                      <Shield size={12} /> Verify OTP
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed deliveries */}
      {completed.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
            <CheckCircle size={18} className="text-green-400" /> Completed ({completed.length})
          </h2>
          <div className="space-y-2">
            {completed.slice(0, 5).map(order => (
              <div key={order._id} className="flex items-center gap-4 p-3 bg-dark-800/30 border border-white/5 rounded-xl opacity-70">
                <CheckCircle size={16} className="text-green-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-xs text-gray-500">#{order._id.slice(-8).toUpperCase()}</span>
                  <span className="text-sm ml-3 truncate">{order.userId?.name}</span>
                </div>
                <span className="text-green-400 text-xs font-medium">Delivered</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
