import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, User, Mail, Phone, Lock, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ✅ FIXED: Defined outside component to prevent remount on every keystroke
const InputField = ({ icon: Icon, label, type = 'text', value, onChange, placeholder, required }) => (
  <div>
    <label className="block text-sm font-medium text-gray-400 mb-1.5">{label}</label>
    <div className="relative">
      <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
      <input type={type} value={value} onChange={onChange} required={required}
        className="w-full pl-10 pr-4 py-3 bg-dark-700/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-colors"
        placeholder={placeholder} />
    </div>
  </div>
);

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'customer', address: { street: '', city: '', state: '', pincode: '' } });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));
  const setAddr = (field, val) => setForm(p => ({ ...p, address: { ...p.address, [field]: val } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const data = await register(form);
      toast.success('Account created successfully!');
      if (data.user.role === 'agent') navigate('/agent');
      else navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={26} className="text-brand-500" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-gray-500 text-sm">Join DeliverVerify today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-dark-800/50 border border-white/5 rounded-2xl p-6">
          <div className="grid grid-cols-2 gap-4">
            <InputField icon={User} label="Full Name" value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Doe" required />
            <InputField icon={Phone} label="Phone Number" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 9876543210" required />
          </div>
          <InputField icon={Mail} label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" required />
          <InputField icon={Lock} label="Password" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 6 characters" required />

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Register as</label>
            <div className="grid grid-cols-2 gap-2">
              {['customer', 'agent'].map(role => (
                <button key={role} type="button" onClick={() => set('role', role)}
                  className={`py-2.5 rounded-xl border text-sm font-medium capitalize transition-all ${form.role === role ? 'bg-brand-500 border-brand-500 text-white' : 'bg-dark-700/50 border-white/10 text-gray-400 hover:border-white/20'}`}>
                  {role === 'customer' ? '🛒 Customer' : '🚚 Delivery Agent'}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-white/5">
            <p className="text-xs text-gray-600 mb-3 flex items-center gap-1"><MapPin size={12} /> Delivery Address</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <input value={form.address.street} onChange={e => setAddr('street', e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-700/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 text-sm transition-colors"
                  placeholder="Street address" />
              </div>
              <input value={form.address.city} onChange={e => setAddr('city', e.target.value)}
                className="px-4 py-2.5 bg-dark-700/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 text-sm transition-colors"
                placeholder="City" />
              <input value={form.address.state} onChange={e => setAddr('state', e.target.value)}
                className="px-4 py-2.5 bg-dark-700/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 text-sm transition-colors"
                placeholder="State" />
              <input value={form.address.pincode} onChange={e => setAddr('pincode', e.target.value)}
                className="px-4 py-2.5 bg-dark-700/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 text-sm transition-colors"
                placeholder="Pincode" />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all mt-2">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account? <Link to="/login" className="text-brand-500 hover:text-brand-400 font-medium">Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
