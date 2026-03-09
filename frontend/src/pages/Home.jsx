import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Package, Truck, CheckCircle, ArrowRight, Zap, Lock, Star, Box } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API } from '../context/AuthContext';
import toast from 'react-hot-toast';

/* ── Particle system ── */
function Particles({ count = 24 }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 5,
    dur: 3 + Math.random() * 4,
    dx: (Math.random() - 0.5) * 80,
    dy: -(40 + Math.random() * 80),
    color: Math.random() > 0.6 ? '#e94560' : Math.random() > 0.5 ? '#ff8fa3' : 'rgba(255,255,255,0.3)',
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div key={p.id} className="particle"
          style={{
            width: p.size, height: p.size,
            left: `${p.x}%`, top: `${p.y}%`,
            backgroundColor: p.color,
            '--dx': `${p.dx}px`, '--dy': `${p.dy}px`,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ── 3D Orbiting product orbs ── */
function OrbitScene() {
  const emojis = ['📱', '💻', '🎧', '⌚', '📷', '🎮', '👟', '📦'];
  return (
    <div className="relative w-72 h-72 mx-auto" style={{ perspective: '800px' }}>
      {/* Core glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-brand-500/20 animate-glow-pulse flex items-center justify-center animate-morph"
          style={{ boxShadow: '0 0 40px rgba(233,69,96,0.4), 0 0 80px rgba(233,69,96,0.2)' }}>
          <Shield size={36} className="text-brand-500" />
        </div>
        {/* Spinning ring 1 */}
        <div className="absolute w-48 h-48 rounded-full border border-brand-500/20 animate-spin-slow" />
        {/* Spinning ring 2 */}
        <div className="absolute w-64 h-64 rounded-full border border-white/5 animate-counter-spin" />
      </div>
      {/* Orbiting product items */}
      {emojis.map((emoji, i) => {
        const angle = (i / emojis.length) * 360;
        const rad = 110;
        const x = Math.cos((angle * Math.PI) / 180) * rad;
        const y = Math.sin((angle * Math.PI) / 180) * rad * 0.4;
        const zIndex = y > 0 ? 10 : 5;
        return (
          <div key={i} className="absolute"
            style={{
              left: '50%', top: '50%',
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              zIndex,
              animation: `float-slow ${4 + i * 0.3}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}>
            <div className="w-10 h-10 rounded-xl bg-dark-700 border border-white/10 flex items-center justify-center text-lg shadow-lg hover:scale-125 transition-transform"
              style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.4)' }}>
              {emoji}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Animated delivery road ── */
function DeliveryRoad() {
  return (
    <div className="relative w-full h-20 overflow-hidden rounded-2xl bg-dark-800/80 border border-white/5">
      {/* Road */}
      <div className="absolute inset-0 bg-gradient-to-r from-dark-700 via-dark-800 to-dark-700" />
      {/* Road stripes - animated */}
      <div className="absolute top-1/2 left-0 w-[200%] flex gap-6 -translate-y-1/2 animate-road">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="w-12 h-1.5 rounded-full bg-yellow-400/30 shrink-0" />
        ))}
      </div>
      {/* Moving truck */}
      <div className="absolute top-1/2 -translate-y-1/2 animate-truck" style={{ left: 0 }}>
        <div className="flex items-center gap-1">
          <div className="text-2xl" style={{ filter: 'drop-shadow(0 0 8px rgba(233,69,96,0.8))' }}>🚚</div>
          {/* Speed lines */}
          <div className="flex flex-col gap-1 opacity-50">
            {[16, 10, 13].map((w, i) => (
              <div key={i} className="h-0.5 bg-gradient-to-r from-brand-500 to-transparent rounded-full" style={{ width: w }} />
            ))}
          </div>
        </div>
      </div>
      {/* Destination marker */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center">
        <div className="text-lg">🏠</div>
        <div className="w-0.5 h-3 bg-brand-500" />
        <div className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
      </div>
    </div>
  );
}

/* ── Floating 3D product cards (hero right side) ── */
function FloatingProductCards() {
  const cards = [
    { emoji: '📱', name: 'iPhone 15 Pro', price: '₹1,59,999', color: 'from-blue-500/20 to-purple-500/20', delay: '0s' },
    { emoji: '💻', name: 'MacBook Air M3', price: '₹1,14,999', color: 'from-gray-500/20 to-slate-500/20', delay: '0.8s' },
    { emoji: '🎧', name: 'Sony WH-1000XM5', price: '₹29,999', color: 'from-orange-500/20 to-red-500/20', delay: '1.6s' },
  ];
  return (
    <div className="relative h-80 w-full max-w-xs mx-auto">
      {cards.map((card, i) => (
        <div key={i}
          className={`absolute product-card rounded-2xl border border-white/10 p-4 bg-dark-800/80 backdrop-blur-sm w-52`}
          style={{
            top: `${i * 80}px`,
            left: `${i * 20}px`,
            zIndex: 3 - i,
            animation: `float-slow ${5 + i}s ease-in-out infinite`,
            animationDelay: card.delay,
            transform: `rotateY(${-5 + i * 3}deg) rotateX(${3 - i}deg)`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          }}>
          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.color} opacity-50`} />
          <div className="relative flex items-center gap-3">
            <div className="text-3xl">{card.emoji}</div>
            <div>
              <p className="text-xs font-semibold text-white">{card.name}</p>
              <p className="text-brand-500 font-bold text-sm">{card.price}</p>
            </div>
          </div>
          {/* Shimmer overlay */}
          <div className="absolute inset-0 rounded-2xl animate-shimmer opacity-50" />
        </div>
      ))}
    </div>
  );
}

/* ── Stats counter ── */
function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = target / 60;
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 20);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{count.toLocaleString('en-IN')}{suffix}</span>;
}

export default function Home() {
  const { user } = useAuth();
  const heroRef = useRef(null);

  // Parallax on mouse move
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!heroRef.current) return;
      const { clientX, clientY, currentTarget } = e;
      const { width, height } = currentTarget.getBoundingClientRect();
      const x = (clientX / width - 0.5) * 20;
      const y = (clientY / height - 0.5) * 10;
      const layers = heroRef.current.querySelectorAll('[data-parallax]');
      layers.forEach(el => {
        const depth = parseFloat(el.dataset.parallax);
        el.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
      });
    };
    const hero = heroRef.current?.parentElement;
    hero?.addEventListener('mousemove', handleMouseMove);
    return () => hero?.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const seedData = async () => {
    try {
      toast.loading('Seeding demo data...', { id: 'seed' });
      const res = await API.post('/admin/seed');
      toast.success(res.data.message, { id: 'seed', duration: 6000 });
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error('Login as admin first: admin@deliververify.com / Admin@123', { id: 'seed', duration: 5000 });
      } else {
        toast.error(msg || 'Seed failed — is the backend running?', { id: 'seed' });
      }
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* ══ HERO SECTION ══ */}
      <section className="relative min-h-[90vh] flex items-center grid-bg" ref={heroRef}>
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div data-parallax="0.3" className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl animate-glow-pulse" />
          <div data-parallax="0.5" className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl animate-glow-pulse delay-1000" />
          <div data-parallax="0.2" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/3 blur-3xl" />
        </div>
        <Particles count={30} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 mb-8 animate-slide-up">
                <Zap size={12} className="text-brand-500 animate-glow-pulse" />
                <span className="text-brand-500 text-xs font-medium tracking-widest uppercase">OTP-Secured Delivery</span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              </div>

              <h1 className="font-display text-6xl md:text-8xl font-black leading-[0.9] tracking-tight mb-6 animate-slide-up delay-100">
                <span className="block text-white">Deliver</span>
                <span className="block text-gradient-red" style={{ textShadow: 'none' }}>Verified.</span>
                <span className="block text-white/20">Always.</span>
              </h1>

              <p className="text-gray-400 text-lg mb-8 leading-relaxed max-w-lg animate-slide-up delay-200">
                The only e-commerce platform where every package requires a <span className="text-brand-500 font-semibold">one-time password</span> to confirm delivery. Zero fraud. Total peace of mind.
              </p>

              <div className="flex flex-wrap gap-3 mb-6 animate-slide-up delay-300">
                <Link to="/products"
                  className="group relative flex items-center gap-2 px-7 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl transition-all overflow-hidden"
                  style={{ boxShadow: '0 0 20px rgba(233,69,96,0.4)' }}>
                  <span className="relative z-10 flex items-center gap-2">
                    Shop Now <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 animate-shimmer" />
                </Link>
                {!user && (
                  <Link to="/register"
                    className="flex items-center gap-2 px-7 py-3.5 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-2xl border border-white/10 hover:border-white/20 transition-all backdrop-blur-sm">
                    Create Account
                  </Link>
                )}
                <button onClick={seedData}
                  className="flex items-center gap-2 px-5 py-3.5 bg-dark-700/60 hover:bg-dark-700 text-gray-400 hover:text-white text-sm font-medium rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                  🌱 Seed Demo
                </button>
              </div>
              <p className="text-gray-700 text-xs animate-slide-up delay-400">Demo: admin@deliververify.com / Admin@123</p>

              {/* Mini stats */}
              <div className="flex gap-6 mt-8 animate-slide-up delay-500">
                {[
                  { val: 50, suffix: '+', label: 'Products' },
                  { val: 100, suffix: '%', label: 'Verified' },
                  { val: 3, suffix: ' roles', label: 'User Types' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="font-display font-black text-2xl text-brand-500">
                      <AnimatedCounter target={s.val} suffix={s.suffix} />
                    </div>
                    <div className="text-gray-600 text-xs">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: 3D orbit scene */}
            <div className="hidden lg:block animate-scale-in delay-300">
              <OrbitScene />
            </div>
          </div>
        </div>
      </section>

      {/* ══ ANIMATED DELIVERY ROAD ══ */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-3">
          <Truck size={14} className="text-brand-500" />
          <span className="text-xs text-gray-600 uppercase tracking-widest">Live Delivery Simulation</span>
        </div>
        <DeliveryRoad />
      </section>

      {/* ══ HOW IT WORKS — 3D STEP CARDS ══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <p className="text-brand-500 text-xs uppercase tracking-widest mb-3">Simple Process</p>
          <h2 className="font-display text-4xl font-bold">How It Works</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 scene-3d">
          {[
            { icon: Package, step: '01', title: 'Browse & Order', desc: 'Shop 50+ products across 12 categories. Add to cart, checkout instantly.', emoji: '🛒', color: 'from-blue-500/10 to-indigo-500/10', glow: 'blue' },
            { icon: Truck, step: '02', title: 'Agent Dispatched', desc: 'Admin assigns a delivery agent. Real-time status updates all the way.', emoji: '🚚', color: 'from-orange-500/10 to-amber-500/10', glow: 'orange' },
            { icon: Shield, step: '03', title: 'OTP Verified', desc: 'Agent generates OTP. Customer receives it via email. Share → Delivered!', emoji: '🔐', color: 'from-green-500/10 to-emerald-500/10', glow: 'green' },
          ].map(({ icon: Icon, step, title, desc, emoji, color, glow }, i) => (
            <div key={step} className={`card-3d relative p-7 bg-dark-800/50 rounded-3xl border border-white/5 hover:border-white/10 overflow-hidden group`}
              style={{ animationDelay: `${i * 0.15}s` }}>
              <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              {/* Step number watermark */}
              <div className="absolute top-3 right-4 font-display font-black text-7xl text-white/[0.03] leading-none">{step}</div>
              <div className="relative">
                <div className="text-5xl mb-4 float-slow" style={{ animationDelay: `${i * 0.5}s` }}>{emoji}</div>
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon size={20} className="text-brand-500" />
                </div>
                <h3 className="font-display font-bold text-xl mb-3">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
              {/* Bottom connector line */}
              {i < 2 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight size={18} className="text-brand-500/30" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ══ FLOATING PRODUCT PREVIEW ══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-brand-500 text-xs uppercase tracking-widest mb-3">50+ Premium Products</p>
            <h2 className="font-display text-4xl font-bold mb-4">Everything in one place</h2>
            <p className="text-gray-500 mb-6">Smartphones, laptops, audio gear, gaming, fashion and more — all with guaranteed OTP delivery verification.</p>
            <Link to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-400 font-semibold rounded-xl transition-all">
              Browse All Products <ArrowRight size={16} />
            </Link>
          </div>
          <div className="relative h-72">
            <FloatingProductCards />
          </div>
        </div>
      </section>

      {/* ══ ANIMATED STATS BANNER ══ */}
      <div className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-500/5 to-transparent" />
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: 50, suffix: '+', label: 'Products', sub: 'Across 12 categories' },
              { val: 5, suffix: ' min', label: 'OTP Expiry', sub: 'Time-sensitive security' },
              { val: 3, suffix: 'x', label: 'Max Attempts', sub: 'Brute-force protection' },
              { val: 100, suffix: '%', label: 'Delivered', sub: 'With OTP verification' },
            ].map(s => (
              <div key={s.label} className="group">
                <div className="font-display text-4xl font-black text-brand-500 mb-1 group-hover:neon-text transition-all">
                  <AnimatedCounter target={s.val} suffix={s.suffix} />
                </div>
                <div className="font-semibold text-sm mb-1">{s.label}</div>
                <div className="text-gray-600 text-xs">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ CTA ══ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="relative inline-block mb-6">
          <div className="w-20 h-20 rounded-3xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto animate-box-bounce"
            style={{ boxShadow: '0 0 30px rgba(233,69,96,0.3)' }}>
            <Lock size={32} className="text-brand-500" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse border-2 border-dark-900" />
        </div>
        <h2 className="font-display text-5xl font-black mb-4 text-gradient">Ready to shop securely?</h2>
        <p className="text-gray-500 mb-8 text-lg">Join the platform where every delivery is verified.</p>
        <Link to="/products"
          className="inline-flex items-center gap-3 px-10 py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl transition-all text-lg group"
          style={{ boxShadow: '0 0 30px rgba(233,69,96,0.4), 0 4px 20px rgba(0,0,0,0.3)' }}>
          Explore Products
          <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </section>
    </div>
  );
}
