import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, LogOut, LayoutDashboard, Truck, Menu, X, Shield, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [prevCount, setPrevCount] = useState(itemCount);
  const [cartPop, setCartPop] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (itemCount > prevCount) {
      setCartPop(true);
      setTimeout(() => setCartPop(false), 500);
    }
    setPrevCount(itemCount);
  }, [itemCount]);

  const handleLogout = () => { logout(); navigate('/login'); setMenuOpen(false); };
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const NavLink = ({ to, children, icon: Icon }) => (
    <Link to={to}
      className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all group ${
        isActive(to)
          ? 'text-brand-500 bg-brand-500/10'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}>
      {Icon && <Icon size={14} />}
      {children}
      {isActive(to) && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-500 rounded-full" />
      )}
    </Link>
  );

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-dark-900/95 backdrop-glow border-b border-white/5 shadow-2xl shadow-black/30'
        : 'bg-dark-800/80 backdrop-glow border-b border-white/5'
    }`}>
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center transition-all group-hover:scale-110"
              style={{ boxShadow: '0 0 15px rgba(233,69,96,0.4)' }}>
              <Shield size={18} className="text-white" />
              <div className="absolute inset-0 rounded-xl bg-brand-500/30 animate-ping" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <span className="font-display font-black text-lg tracking-tight">
                Deliver<span className="text-brand-500">Verify</span>
              </span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-gray-600 text-xs">Secure Delivery</span>
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/products">Products</NavLink>
            {user && <NavLink to="/orders">My Orders</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin" icon={LayoutDashboard}>Admin</NavLink>}
            {['admin','agent'].includes(user?.role) && <NavLink to="/agent" icon={Truck}>Agent</NavLink>}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {/* Cart */}
                <Link to="/cart" className="relative p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group">
                  <ShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
                  {itemCount > 0 && (
                    <span
                      key={itemCount}
                      className={`absolute -top-1 -right-1 w-5 h-5 bg-brand-500 text-white text-xs rounded-full flex items-center justify-center font-black ${cartPop ? 'cart-badge-pop' : ''}`}
                      style={{ boxShadow: '0 0 8px rgba(233,69,96,0.6)' }}>
                      {itemCount}
                    </span>
                  )}
                </Link>

                {/* User */}
                <Link to="/profile"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all group">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-black">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{user.name.split(' ')[0]}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full capitalize ${
                    user.role === 'admin' ? 'bg-red-500/10 text-red-400' :
                    user.role === 'agent' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-green-500/10 text-green-400'
                  }`}>{user.role}</span>
                </Link>

                <button onClick={handleLogout}
                  className="p-2.5 rounded-xl text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-white/5">Sign In</Link>
                <Link to="/register"
                  className="px-5 py-2 text-sm font-bold text-white rounded-xl transition-all relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg,#e94560,#c73652)', boxShadow: '0 0 15px rgba(233,69,96,0.3)' }}>
                  Get Started
                  <div className="absolute inset-0 animate-shimmer" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            {user && (
              <Link to="/cart" className="relative p-2 text-gray-400">
                <ShoppingCart size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 text-white text-xs rounded-full flex items-center justify-center font-black">
                    {itemCount}
                  </span>
                )}
              </Link>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg text-gray-400 hover:text-white transition-colors">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/5 bg-dark-800/95 backdrop-glow px-4 py-3 space-y-1 animate-slide-up">
          {[
            { to: '/products', label: 'Products' },
            ...(user ? [{ to: '/orders', label: 'My Orders' }, { to: '/profile', label: 'Profile' }] : []),
            ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin Dashboard' }] : []),
            ...(['admin','agent'].includes(user?.role) ? [{ to: '/agent', label: 'Agent Dashboard' }] : []),
          ].map(({ to, label }) => (
            <Link key={to} to={to} onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-xl text-sm transition-colors ${isActive(to) ? 'bg-brand-500/10 text-brand-500' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              {label}
            </Link>
          ))}
          {user ? (
            <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">Sign Out</button>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm text-gray-400 border border-white/10 hover:bg-white/5 transition-colors">Sign In</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-500">Get Started</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
