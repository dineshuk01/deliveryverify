import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2, Plus, Minus, ShoppingCart, ArrowRight,
  CreditCard, Smartphone, Truck, Shield, CheckCircle,
  Copy, AlertCircle, Loader, ChevronRight, Mail
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { API } from '../context/AuthContext';
import toast from 'react-hot-toast';

/* UPI QR code + manual ID entry */
function UPIPayment({ total, onPaid, onBack }) {
  const [upiId, setUpiId] = useState('');
  const [txnId, setTxnId] = useState('');
  const [step, setStep] = useState('choose'); // choose | qr | verify
  const merchantUpi = 'deliververify@upi'; // demo UPI ID
  const upiUrl = `upi://pay?pa=${merchantUpi}&pn=DeliverVerify&am=${total}&cu=INR`;

  const handleVerify = () => {
    if (!txnId.trim() || txnId.trim().length < 6)
      return toast.error('Enter a valid UPI Transaction ID (min 6 characters)');
    onPaid({ upiId: upiId || merchantUpi, upiTransactionId: txnId.trim() });
  };

  if (step === 'choose') return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400 mb-4">Choose how to pay via UPI:</p>
      <button onClick={() => setStep('qr')}
        className="w-full flex items-center gap-4 p-4 bg-dark-700/50 hover:bg-dark-700 border border-white/10 hover:border-brand-500/30 rounded-2xl transition-all text-left group">
        <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-brand-500/20 transition-colors">
          <Smartphone size={22} className="text-brand-500" />
        </div>
        <div>
          <p className="font-semibold text-sm">Pay via UPI App / QR Code</p>
          <p className="text-xs text-gray-500 mt-0.5">GPay, PhonePe, Paytm, BHIM</p>
        </div>
        <ChevronRight size={16} className="text-gray-600 ml-auto" />
      </button>
      <button onClick={onBack}
        className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
        ← Go back
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* QR + UPI ID */}
      <div className="bg-white rounded-2xl p-5 text-center">
        {/* Simulated QR code using a public QR API */}
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiUrl)}`}
          alt="UPI QR Code"
          className="w-40 h-40 mx-auto rounded-xl mb-3"
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div className="flex items-center justify-center gap-2 bg-gray-100 rounded-xl px-4 py-2">
          <span className="text-gray-800 font-mono font-bold text-sm">{merchantUpi}</span>
          <button onClick={() => { navigator.clipboard.writeText(merchantUpi); toast.success('UPI ID copied!'); }}
            className="text-gray-400 hover:text-gray-700 transition-colors">
            <Copy size={13} />
          </button>
        </div>
        <p className="text-gray-500 text-xs mt-2">Scan with any UPI app or copy UPI ID</p>
      </div>

      <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-3 flex items-center gap-2">
        <AlertCircle size={14} className="text-brand-400 shrink-0" />
        <p className="text-xs text-brand-300">Pay exactly <strong>₹{total.toLocaleString('en-IN')}</strong> to complete your order</p>
      </div>

      {/* Transaction ID entry */}
      <div>
        <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">UPI Transaction ID *</label>
        <input
          value={txnId}
          onChange={e => setTxnId(e.target.value)}
          placeholder="e.g. 407892345678 (from your UPI app)"
          className="w-full px-4 py-3 bg-dark-700/60 border border-white/10 focus:border-brand-500 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-colors"
        />
        <p className="text-xs text-gray-600 mt-1">Find this in your UPI app after payment</p>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Your UPI ID (optional)</label>
        <input
          value={upiId}
          onChange={e => setUpiId(e.target.value)}
          placeholder="yourname@upi"
          className="w-full px-4 py-3 bg-dark-700/60 border border-white/10 focus:border-brand-500 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-colors"
        />
      </div>

      <button onClick={handleVerify}
        className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
        style={{ boxShadow: '0 0 20px rgba(233,69,96,0.3)' }}>
        <CheckCircle size={18} /> Confirm Payment & Place Order
      </button>
      <button onClick={onBack} className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
        ← Back to payment options
      </button>
    </div>
  );
}

/* Order success screen */
function OrderSuccess({ orderId, paymentMethod }) {
  const navigate = useNavigate();
  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in"
        style={{ boxShadow: '0 0 40px rgba(34,197,94,0.3)' }}>
        <CheckCircle size={40} className="text-green-400" />
      </div>
      <h2 className="font-display text-2xl font-black mb-2">Order Placed! 🎉</h2>
      <p className="text-gray-400 text-sm mb-2">Your order has been confirmed.</p>
      <div className="inline-flex items-center gap-2 bg-dark-700/50 rounded-xl px-4 py-2 mb-4">
        <Mail size={14} className="text-brand-500" />
        <span className="text-xs text-gray-400">Confirmation email sent to your inbox</span>
      </div>
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-6 mx-auto max-w-xs">
        <p className="text-xs text-blue-300">🔐 When your agent arrives, you'll receive a <strong>delivery OTP</strong> on your email to confirm receipt.</p>
      </div>
      <button onClick={() => navigate(`/orders/${orderId}`)}
        className="px-8 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all flex items-center gap-2 mx-auto">
        Track Order <ArrowRight size={16} />
      </button>
    </div>
  );
}

export default function Cart() {
  const { cart, removeFromCart, updateQty, clearCart, total } = useCart();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState(null); // null | 'UPI' | 'COD'
  const [upiData, setUpiData] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState(null);
  const navigate = useNavigate();

  const placeOrder = async (pmOverride, upiOverride) => {
    const pm = pmOverride || paymentMethod;
    const upd = upiOverride || upiData;
    if (!pm) return toast.error('Please select a payment method');
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      const res = await API.post('/order', {
        products: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: user.address,
        paymentMethod: pm,
        ...(upd && { upiId: upd.upiId, upiTransactionId: upd.upiTransactionId })
      });
      clearCart();
      setPlacedOrderId(res.data.order._id);
      toast.success('Order placed! Check your email 📧', { duration: 4000 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  // UPI flow: after payment confirmed
  const handleUpiPaid = (data) => {
    setUpiData(data);
    placeOrder('UPI', data);
  };

  if (placedOrderId) return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <OrderSuccess orderId={placedOrderId} paymentMethod={paymentMethod} />
    </div>
  );

  if (cart.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="text-7xl mb-4 float-slow">🛒</div>
      <h2 className="font-display text-2xl font-bold mb-2">Your cart is empty</h2>
      <p className="text-gray-500 mb-6">Add some products to get started</p>
      <Link to="/products"
        className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all"
        style={{ boxShadow: '0 0 15px rgba(233,69,96,0.3)' }}>
        Browse Products <ArrowRight size={18} />
      </Link>
    </div>
  );

  const delivery = 0;
  const grandTotal = total + delivery;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl font-bold mb-8 flex items-center gap-3">
        <ShoppingCart size={28} className="text-brand-500" /> Shopping Cart
        <span className="text-sm text-gray-500 font-normal ml-1">({cart.length} item{cart.length !== 1 ? 's' : ''})</span>
      </h1>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ── Cart items ── */}
        <div className="lg:col-span-3 space-y-3">
          {cart.map(item => (
            <div key={item.productId}
              className="group flex gap-4 p-4 bg-dark-800/60 border border-white/5 hover:border-white/10 rounded-2xl transition-all">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-dark-700 shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  onError={e => e.target.src = 'https://placehold.co/80x80/1a1a2e/e94560?text=IMG'} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1 truncate">{item.name}</h3>
                <p className="text-brand-500 font-bold text-lg">₹{item.price.toLocaleString('en-IN')}</p>
                <div className="flex items-center gap-3 mt-2">
                  {/* Qty control */}
                  <div className="flex items-center bg-dark-700 rounded-xl overflow-hidden border border-white/5">
                    <button onClick={() => updateQty(item.productId, item.quantity - 1)}
                      className="px-3 py-1.5 hover:bg-brand-500/20 hover:text-brand-400 transition-colors text-gray-400">
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => updateQty(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="px-3 py-1.5 hover:bg-brand-500/20 hover:text-brand-400 transition-colors text-gray-400 disabled:opacity-30">
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className="text-gray-600 text-xs">= ₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  <button onClick={() => removeFromCart(item.productId)}
                    className="ml-auto p-1.5 text-gray-700 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Order summary + payment ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary card */}
          <div className="bg-dark-800/60 border border-white/5 rounded-2xl p-5">
            <h2 className="font-display font-bold text-lg mb-4">Order Summary</h2>
            <div className="space-y-1.5 mb-4 max-h-36 overflow-y-auto scrollbar-hide">
              {cart.map(item => (
                <div key={item.productId} className="flex justify-between text-sm text-gray-400">
                  <span className="truncate mr-2">{item.name} <span className="text-gray-600">×{item.quantity}</span></span>
                  <span className="shrink-0 text-white">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/8 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Subtotal</span><span>₹{total.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm text-green-400">
                <span>Delivery</span><span>FREE 🎉</span>
              </div>
              <div className="flex justify-between font-display font-black text-xl pt-2 border-t border-white/8">
                <span>Total</span>
                <span style={{ background: 'linear-gradient(135deg,#e94560,#ff8fa3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery address */}
          {user?.address?.city && (
            <div className="bg-dark-800/60 border border-white/5 rounded-2xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Truck size={12} /> Delivering to
              </p>
              <p className="text-sm font-medium text-white">{user.address.street}</p>
              <p className="text-sm text-gray-400">{user.address.city}, {user.address.state} — {user.address.pincode}</p>
            </div>
          )}

          {/* ── Payment method selector ── */}
          {!paymentMethod ? (
            <div className="bg-dark-800/60 border border-white/5 rounded-2xl p-5">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <CreditCard size={15} className="text-brand-500" /> Select Payment Method
              </h3>
              <div className="space-y-3">
                {/* UPI option */}
                <button onClick={() => setPaymentMethod('UPI')}
                  className="w-full flex items-center gap-4 p-4 bg-dark-700/50 hover:bg-dark-700 border border-white/8 hover:border-brand-500/40 rounded-xl transition-all text-left group">
                  <div className="w-11 h-11 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                    <Smartphone size={20} className="text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">UPI Payment</p>
                    <p className="text-xs text-gray-500 mt-0.5">GPay · PhonePe · Paytm · BHIM</p>
                  </div>
                  <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded-full">Instant</span>
                </button>

                {/* COD option */}
                <button onClick={() => placeOrder('COD', null)}
                  disabled={placing}
                  className="w-full flex items-center gap-4 p-4 bg-dark-700/50 hover:bg-dark-700 border border-white/8 hover:border-brand-500/40 rounded-xl transition-all text-left group disabled:opacity-50">
                  <div className="w-11 h-11 bg-orange-500/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-orange-500/20 transition-colors">
                    {placing ? <Loader size={20} className="text-orange-400 animate-spin" /> : <Truck size={20} className="text-orange-400" />}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm">Cash on Delivery</p>
                    <p className="text-xs text-gray-500 mt-0.5">Pay ₹{grandTotal.toLocaleString('en-IN')} when delivered</p>
                  </div>
                  <span className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded-full">COD</span>
                </button>
              </div>
              <p className="text-center text-xs text-gray-700 mt-4 flex items-center justify-center gap-1.5">
                <Shield size={11} /> OTP verification at delivery
              </p>
            </div>
          ) : paymentMethod === 'UPI' ? (
            <div className="bg-dark-800/60 border border-white/5 rounded-2xl p-5">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Smartphone size={15} className="text-blue-400" /> UPI Payment
                <span className="ml-auto font-black text-brand-500">₹{grandTotal.toLocaleString('en-IN')}</span>
              </h3>
              {placing ? (
                <div className="text-center py-8">
                  <Loader size={32} className="text-brand-500 animate-spin mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Placing your order...</p>
                </div>
              ) : (
                <UPIPayment total={grandTotal} onPaid={handleUpiPaid} onBack={() => setPaymentMethod(null)} />
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
