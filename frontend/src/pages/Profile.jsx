import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Save } from 'lucide-react';
import { useAuth, API } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: { street: user?.address?.street || '', city: user?.address?.city || '', state: user?.address?.state || '', pincode: user?.address?.pincode || '' }
  });
  const [saving, setSaving] = useState(false);

  const setAddr = (k, v) => setForm(p => ({ ...p, address: { ...p.address, [k]: v } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.put('/profile', form);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const roleBadge = { admin: 'bg-red-500/10 text-red-400', agent: 'bg-blue-500/10 text-blue-400', customer: 'bg-green-500/10 text-green-400' };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl font-bold mb-8">Profile</h1>
      <div className="bg-dark-800/50 border border-white/5 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center text-white font-display font-black text-2xl">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-display font-bold text-xl">{user?.name}</h2>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize mt-1 inline-block ${roleBadge[user?.role]}`}>{user?.role}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Full Name</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full pl-9 pr-4 py-2.5 bg-dark-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 text-sm transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Phone</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full pl-9 pr-4 py-2.5 bg-dark-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 text-sm transition-colors" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Email (read-only)</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={user?.email} disabled className="w-full pl-9 pr-4 py-2.5 bg-dark-700/30 border border-white/5 rounded-xl text-gray-500 text-sm cursor-not-allowed" />
            </div>
          </div>

          <div className="border-t border-white/5 pt-4">
            <p className="text-xs text-gray-500 mb-3 flex items-center gap-1"><MapPin size={12} /> Delivery Address</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <input value={form.address.street} onChange={e => setAddr('street', e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-700/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 text-sm"
                  placeholder="Street address" />
              </div>
              {[['city', 'City'], ['state', 'State'], ['pincode', 'Pincode']].map(([k, l]) => (
                <input key={k} value={form.address[k]} onChange={e => setAddr(k, e.target.value)}
                  className="px-4 py-2.5 bg-dark-700/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 text-sm"
                  placeholder={l} />
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors">
            <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
