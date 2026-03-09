import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShoppingCart, Search, Plus, Minus, Package, AlertCircle, RefreshCw, Sparkles, Zap } from 'lucide-react';
import { API } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const CATEGORIES = ['All','Smartphones','Laptops','Audio','Tablets','Cameras','Wearables','Gaming','Appliances','Fashion','Footwear','Sports','Smart Home'];

const StatusBadge = ({ stock }) => {
  if (stock === 0) return <span className="text-xs px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full border border-red-500/20">Out of Stock</span>;
  if (stock < 5) return <span className="text-xs px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded-full border border-yellow-500/20">Low Stock</span>;
  return <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full border border-green-500/20">In Stock</span>;
};

/* 3D tilt card with mouse tracking */
function ProductCard({ product, onAddToCart, cartQty, qty, onQtyChange }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const tiltX = (y - 0.5) * 16;
    const tiltY = (x - 0.5) * -16;
    setTilt({ x: tiltX, y: tiltY });
    // Update CSS variable for spotlight
    cardRef.current.style.setProperty('--mx', `${x * 100}%`);
    cardRef.current.style.setProperty('--my', `${y * 100}%`);
  }, []);

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const handleAdd = () => {
    if (product.stock === 0) return toast.error('Out of stock');
    onAddToCart(product, qty);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 800);
    toast.success(`🛒 Added to cart!`, { duration: 1500 });
  };

  return (
    <div
      ref={cardRef}
      className="product-card rounded-2xl bg-dark-800/80 border border-white/5 overflow-hidden"
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(10px) scale(1.02)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)',
        transition: isHovered ? 'transform 0.1s ease' : 'transform 0.4s cubic-bezier(0.23,1,0.32,1)',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Card shine layer */}
      <div className="absolute inset-0 z-10 pointer-events-none rounded-2xl"
        style={{
          background: isHovered
            ? `radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.06) 0%, transparent 60%)`
            : 'none',
        }}
      />
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-dark-700">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.5s cubic-bezier(0.23,1,0.32,1)' }}
          onError={e => { e.target.src = `https://placehold.co/400x300/1a1a2e/e94560?text=${encodeURIComponent(product.name.split(' ')[0])}`; }}
        />
        {/* Category pill */}
        <div className="absolute top-2 left-2 z-20">
          <span className="text-xs px-2 py-0.5 bg-dark-900/80 backdrop-blur-sm text-gray-400 rounded-full border border-white/10">{product.category}</span>
        </div>
        {/* Cart badge */}
        {cartQty > 0 && (
          <div className="absolute top-2 right-2 z-20 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center text-xs font-black text-white cart-badge-pop"
            style={{ boxShadow: '0 0 10px rgba(233,69,96,0.6)' }}>
            {cartQty}
          </div>
        )}
        {/* Just added flash */}
        {justAdded && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-brand-500/20 backdrop-blur-sm animate-scale-in">
            <div className="text-4xl animate-box-bounce">🛒</div>
          </div>
        )}
        {/* Out of stock overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-dark-900/70 flex items-center justify-center z-20">
            <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">OUT OF STOCK</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 relative z-20">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm line-clamp-1 flex-1">{product.name}</h3>
          <StatusBadge stock={product.stock} />
        </div>
        <p className="text-gray-500 text-xs line-clamp-2 mb-3 leading-relaxed">{product.description}</p>
        <div className="font-display font-black text-xl mb-3"
          style={{ background: 'linear-gradient(135deg,#e94560,#ff8fa3)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          ₹{product.price.toLocaleString('en-IN')}
        </div>

        <div className="flex items-center gap-2">
          {/* Qty control */}
          <div className="flex items-center bg-dark-700/80 rounded-xl overflow-hidden border border-white/5">
            <button onClick={() => onQtyChange(product._id, Math.max(1, qty - 1))}
              disabled={qty <= 1}
              className="px-2.5 py-2 hover:bg-brand-500/20 hover:text-brand-400 transition-colors disabled:opacity-30 text-gray-400">
              <Minus size={12} />
            </button>
            <span className="w-7 text-center text-sm font-bold">{qty}</span>
            <button onClick={() => onQtyChange(product._id, Math.min(product.stock, qty + 1))}
              disabled={qty >= product.stock}
              className="px-2.5 py-2 hover:bg-brand-500/20 hover:text-brand-400 transition-colors disabled:opacity-30 text-gray-400">
              <Plus size={12} />
            </button>
          </div>

          {/* Add to cart btn */}
          <button
            onClick={handleAdd}
            disabled={product.stock === 0}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group"
            style={{
              background: product.stock > 0 ? 'linear-gradient(135deg, #e94560, #c73652)' : undefined,
              boxShadow: product.stock > 0 && isHovered ? '0 0 15px rgba(233,69,96,0.5)' : 'none',
            }}>
            <ShoppingCart size={13} className="group-hover:scale-110 transition-transform" />
            Add to Cart
            <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* Floating category chip carousel */
function CategoryFilter({ active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {CATEGORIES.map((cat, i) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 relative overflow-hidden"
          style={{
            background: active === cat ? 'linear-gradient(135deg,#e94560,#c73652)' : 'rgba(255,255,255,0.04)',
            border: active === cat ? '1px solid transparent' : '1px solid rgba(255,255,255,0.06)',
            color: active === cat ? 'white' : 'rgb(156,163,175)',
            boxShadow: active === cat ? '0 0 15px rgba(233,69,96,0.3)' : 'none',
            animationDelay: `${i * 0.05}s`,
          }}>
          {cat}
          {active === cat && <div className="absolute inset-0 animate-shimmer" />}
        </button>
      ))}
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [quantities, setQuantities] = useState({});
  const { addToCart, cart } = useCart();

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [search, category]);

  const fetchProducts = async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category !== 'All') params.append('category', category);
      const q = params.toString() ? `?${params}` : '';
      const res = await API.get(`/products${q}`);
      setProducts(res.data.products || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const seedAndRefetch = async () => {
    try {
      toast.loading('Seeding products...', { id: 'seed' });
      await API.post('/admin/seed');
      toast.success('Products loaded!', { id: 'seed' });
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Seed failed', { id: 'seed' });
    }
  };

  const getQty = (id) => quantities[id] || 1;
  const setQty = (id, val) => setQuantities(p => ({ ...p, [id]: val }));
  const cartCount = (id) => cart.find(i => i.productId === id)?.quantity || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-brand-500" />
            <h1 className="font-display text-3xl font-bold">Products</h1>
          </div>
          <p className="text-gray-500 text-sm">{loading ? 'Loading...' : `${products.length} items available`}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-dark-700/60 border border-white/8 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 text-sm transition-all focus:bg-dark-700/80 focus:shadow-lg"
              style={{ '--tw-border-opacity': '0.08' }}
              placeholder="Search products..."
            />
          </div>
          <button onClick={fetchProducts}
            className="p-2.5 bg-dark-700/60 border border-white/8 rounded-xl text-gray-400 hover:text-brand-500 hover:border-brand-500/30 transition-all"
            style={{ '--tw-border-opacity': '0.08' }}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="mb-8">
        <CategoryFilter active={category} onChange={setCategory} />
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="relative overflow-hidden bg-red-500/5 border border-red-500/20 rounded-3xl p-8 mb-8 text-center">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
          <p className="text-red-300 font-bold text-lg mb-2">Could not load products</p>
          <p className="text-red-400/60 text-sm mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={fetchProducts} className="px-5 py-2.5 bg-dark-700 hover:bg-dark-600 text-white text-sm rounded-xl transition-colors flex items-center gap-2">
              <RefreshCw size={14} /> Retry
            </button>
            <button onClick={seedAndRefetch} className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2">
              🌱 Load Demo Products
            </button>
          </div>
        </div>
      )}

      {/* Loading skeleton — 3D shimmer */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-dark-800/50 border border-white/5 overflow-hidden"
              style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="h-48 bg-dark-700 relative overflow-hidden">
                <div className="absolute inset-0 animate-shimmer" />
              </div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-dark-700 rounded-lg w-3/4 relative overflow-hidden"><div className="absolute inset-0 animate-shimmer" /></div>
                <div className="h-3 bg-dark-700 rounded-lg w-1/2 relative overflow-hidden"><div className="absolute inset-0 animate-shimmer" /></div>
                <div className="h-8 bg-dark-700 rounded-lg mt-4 relative overflow-hidden"><div className="absolute inset-0 animate-shimmer" /></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && products.length === 0 && (
        <div className="relative text-center py-28 rounded-3xl border border-white/5 bg-dark-800/30 overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-20" />
          <div className="text-7xl mb-4 float-slow">📦</div>
          <p className="text-gray-400 text-xl font-bold mb-2">No products found</p>
          <p className="text-gray-600 text-sm mb-6">
            {search || category !== 'All' ? 'Try a different search or category' : 'The store has no products yet'}
          </p>
          {!search && category === 'All' ? (
            <button onClick={seedAndRefetch} className="px-8 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl transition-all"
              style={{ boxShadow: '0 0 20px rgba(233,69,96,0.3)' }}>
              🌱 Load 50+ Demo Products
            </button>
          ) : (
            <button onClick={() => { setSearch(''); setCategory('All'); }} className="px-8 py-3.5 bg-dark-700 hover:bg-dark-600 text-white rounded-2xl transition-colors">
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Product grid */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((product, i) => (
            <div key={product._id}
              className="animate-slide-up"
              style={{ animationDelay: `${Math.min(i * 0.04, 0.5)}s`, opacity: 0, animationFillMode: 'forwards' }}>
              <ProductCard
                product={product}
                onAddToCart={addToCart}
                cartQty={cartCount(product._id)}
                qty={getQty(product._id)}
                onQtyChange={setQty}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
