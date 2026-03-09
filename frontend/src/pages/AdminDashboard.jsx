import React, { useState, useEffect } from 'react';
import { Package, Users, TrendingUp, Truck, Plus, X, RefreshCw, Edit2, Trash2 } from 'lucide-react';
import { API } from '../context/AuthContext';
import toast from 'react-hot-toast';

const statusConfig = {
  'Pending':          { badge: 'bg-yellow-400/10 text-yellow-400' },
  'Confirmed':        { badge: 'bg-blue-400/10 text-blue-400' },
  'Shipped':          { badge: 'bg-purple-400/10 text-purple-400' },
  'Out for Delivery': { badge: 'bg-orange-400/10 text-orange-400' },
  'Delivered':        { badge: 'bg-green-400/10 text-green-400' },
  'Cancelled':        { badge: 'bg-red-400/10 text-red-400' },
};

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('All');
  const [products, setProducts] = useState([]);
  const [agents, setAgents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', stock: '', category: 'Electronics', image: '' });
  const [editProduct, setEditProduct] = useState(null);

  useEffect(() => { fetchStats(); fetchAgents(); }, []);
  useEffect(() => {
    if (tab === 'orders') fetchOrders();
    if (tab === 'products') fetchProducts();
    if (tab === 'users') fetchUsers();
  }, [tab]);

  const fetchStats = async () => {
    try { const res = await API.get('/admin/stats'); setStats(res.data); } catch {}
  };

  const fetchOrders = async () => {
    setLoading(true);
    try { const res = await API.get('/orders'); setOrders(res.data.orders); } catch { toast.error('Failed to load orders'); } finally { setLoading(false); }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try { const res = await API.get('/products'); setProducts(res.data.products); } catch { toast.error('Failed to load products'); } finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try { const res = await API.get('/admin/users'); setUsers(res.data.users); } catch { toast.error('Failed to load users'); } finally { setLoading(false); }
  };

  const fetchAgents = async () => {
    try { const res = await API.get('/admin/agents'); setAgents(res.data.agents); } catch {}
  };

  const updateOrderStatus = async (orderId, status, cancellationReason) => {
    try {
      await API.put(`/order/${orderId}/status`, { status, cancellationReason });
      toast.success('Status updated!');
      fetchOrders();
    } catch { toast.error('Failed to update'); }
  };

  const assignAgent = async (orderId, agentId) => {
    if (!agentId) return;
    try {
      await API.put(`/admin/order/${orderId}/assign`, { agentId });
      toast.success('Agent assigned!');
      fetchOrders();
    } catch { toast.error('Failed to assign agent'); }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      if (editProduct) {
        await API.put(`/products/${editProduct._id}`, { ...productForm, price: +productForm.price, stock: +productForm.stock });
        toast.success('Product updated!');
      } else {
        await API.post('/products', { ...productForm, price: +productForm.price, stock: +productForm.stock });
        toast.success('Product added!');
      }
      setShowAddProduct(false);
      setEditProduct(null);
      setProductForm({ name: '', description: '', price: '', stock: '', category: 'Electronics', image: '' });
      fetchProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await API.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch { toast.error('Failed to delete'); }
  };

  const updateUserRole = async (userId, role) => {
    try {
      await API.put(`/admin/user/${userId}/role`, { role });
      toast.success('Role updated!');
      fetchUsers();
    } catch { toast.error('Failed to update role'); }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'users', label: 'Users', icon: Users },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800/50 border border-white/5 rounded-xl p-1 mb-8 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === id ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Customers', value: stats.totalUsers, color: 'text-blue-400' },
            { label: 'Total Orders', value: stats.totalOrders, color: 'text-purple-400' },
            { label: 'Products', value: stats.totalProducts, color: 'text-yellow-400' },
            { label: 'Delivered', value: stats.deliveredOrders, color: 'text-green-400' },
            { label: 'Pending', value: stats.pendingOrders, color: 'text-orange-400' },
            { label: 'Revenue', value: `₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`, color: 'text-brand-500' },
          ].map(s => (
            <div key={s.label} className="bg-dark-800/50 border border-white/5 rounded-2xl p-5">
              <div className={`font-display text-3xl font-black ${s.color} mb-1`}>{s.value ?? '...'}</div>
              <div className="text-gray-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Orders */}
      {tab === 'orders' && (
        <div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {['All', 'Pending', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map(s => (
              <button key={s} onClick={() => { setOrderFilter(s); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${orderFilter === s ? 'bg-brand-500 text-white' : 'bg-dark-700/50 text-gray-400 hover:text-white border border-white/5'}`}>
                {s}
              </button>
            ))}
          </div>
          {loading ? <div className="text-center py-12 text-gray-500">Loading orders...</div> : (
            <div className="space-y-3">
              {orders.filter(o => orderFilter === 'All' || o.status === orderFilter).map(order => (
                <div key={order._id} className="p-4 bg-dark-800/50 border border-white/5 rounded-2xl">
                  <div className="flex flex-wrap gap-4 items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs text-gray-500">#{order._id.slice(-8).toUpperCase()}</span>
                        <span className="text-brand-500 font-bold text-sm">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[order.status]?.badge || 'bg-gray-400/10 text-gray-400'}`}>{order.status}</span>
                      </div>
                      <p className="font-medium text-sm">{order.userId?.name} <span className="text-gray-500 font-normal text-xs">({order.userId?.email})</span></p>
                      <p className="text-gray-500 text-xs mt-0.5 truncate">{order.products.map(p => `${p.name} ×${p.quantity}`).join(', ')}</p>
                      <p className="text-gray-600 text-xs mt-0.5">📍 {order.shippingAddress?.street}, {order.shippingAddress?.city}</p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <div className="flex gap-2">
                        <select value={order.status} onChange={e => {
                          if (e.target.value === 'Cancelled') {
                            const reason = prompt('Cancellation reason (optional):') || 'Cancelled by admin';
                            updateOrderStatus(order._id, 'Cancelled', reason);
                          } else {
                            updateOrderStatus(order._id, e.target.value);
                          }
                        }}
                          className="px-3 py-1.5 bg-dark-700 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500">
                          {['Pending', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select defaultValue="" onChange={e => assignAgent(order._id, e.target.value)}
                          className="px-3 py-1.5 bg-dark-700 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500">
                          <option value="">Assign Agent</option>
                          {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                        </select>
                      </div>
                      {order.deliveryAgentId && (
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Truck size={11} /> {order.deliveryAgentId.name}
                        </p>
                      )}
                    </div>
                  </div>
                  {order.cancellationReason && (
                    <p className="text-xs text-red-400/70 mt-2 border-t border-white/5 pt-2">❌ Reason: {order.cancellationReason}</p>
                  )}
                </div>
              ))}
              {orders.filter(o => orderFilter === 'All' || o.status === orderFilter).length === 0 && (
                <div className="text-center py-12 text-gray-500">No {orderFilter !== 'All' ? orderFilter : ''} orders found</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Products */}
      {tab === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-500 text-sm">{products.length} products</p>
            <button onClick={() => { setShowAddProduct(true); setEditProduct(null); setProductForm({ name: '', description: '', price: '', stock: '', category: 'Electronics', image: '' }); }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-colors">
              <Plus size={16} /> Add Product
            </button>
          </div>

          {showAddProduct && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-dark-800 border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-display font-bold text-lg">{editProduct ? 'Edit' : 'Add'} Product</h2>
                  <button onClick={() => setShowAddProduct(false)} className="p-1 text-gray-500 hover:text-white"><X size={18} /></button>
                </div>
                <form onSubmit={handleAddProduct} className="space-y-3">
                  {[
                    { key: 'name', label: 'Product Name', placeholder: 'iPhone 15 Pro' },
                    { key: 'image', label: 'Image URL', placeholder: 'https://...' },
                    { key: 'category', label: 'Category', placeholder: 'Electronics' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-400 mb-1">{label}</label>
                      <input value={productForm[key]} onChange={e => setProductForm(p => ({ ...p, [key]: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 text-sm"
                        placeholder={placeholder} required={key !== 'image' && key !== 'category'} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Description</label>
                    <textarea value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 text-sm resize-none"
                      rows={3} placeholder="Product description..." required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Price (₹)</label>
                      <input type="number" min="0" value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 text-sm" required />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Stock</label>
                      <input type="number" min="0" value={productForm.stock} onChange={e => setProductForm(p => ({ ...p, stock: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 text-sm" required />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowAddProduct(false)}
                      className="flex-1 py-2.5 bg-dark-700 text-gray-400 rounded-xl text-sm font-medium hover:bg-dark-600 transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors">
                      {editProduct ? 'Update' : 'Add Product'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {loading ? <div className="text-center py-12 text-gray-500">Loading...</div> : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {products.map(p => (
                <div key={p._id} className="bg-dark-800/50 border border-white/5 rounded-2xl overflow-hidden">
                  <img src={p.image} alt={p.name} className="w-full h-36 object-cover bg-dark-700" onError={e => e.target.src='https://via.placeholder.com/300x150/1a1a2e/e94560?text=Product'} />
                  <div className="p-3">
                    <p className="font-semibold text-sm truncate mb-1">{p.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-brand-500 font-bold text-sm">₹{p.price.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-gray-500">Stock: {p.stock}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => { setEditProduct(p); setProductForm({ name: p.name, description: p.description, price: p.price, stock: p.stock, category: p.category, image: p.image || '' }); setShowAddProduct(true); }}
                        className="flex-1 py-1.5 bg-dark-700 hover:bg-dark-600 text-gray-400 hover:text-white text-xs rounded-lg flex items-center justify-center gap-1 transition-colors">
                        <Edit2 size={11} /> Edit
                      </button>
                      <button onClick={() => deleteProduct(p._id)}
                        className="flex-1 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg flex items-center justify-center gap-1 transition-colors">
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div>
          {loading ? <div className="text-center py-12 text-gray-500">Loading users...</div> : (
            <div className="space-y-2">
              {users.map(u => (
                <div key={u._id} className="flex items-center gap-4 p-3 bg-dark-800/50 border border-white/5 rounded-xl">
                  <div className="w-9 h-9 bg-brand-500/20 rounded-full flex items-center justify-center font-bold text-brand-400 shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{u.name}</p>
                    <p className="text-gray-500 text-xs">{u.email} • {u.phone}</p>
                  </div>
                  <select value={u.role} onChange={e => updateUserRole(u._id, e.target.value)}
                    className="px-2 py-1 bg-dark-700 border border-white/10 rounded-lg text-xs text-white focus:outline-none">
                    <option value="customer">Customer</option>
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
