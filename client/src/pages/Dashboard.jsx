import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../context/ProductContext';
import { AuthContext } from '../context/AuthContext';
import { Sparkles, Loader, TrendingUp, Zap, Search, Shield } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { products, loading } = useProducts();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dealUrl, setDealUrl] = useState('');

  const handleBestDealSubmit = (e) => {
    e.preventDefault();
    if (dealUrl.trim()) {
      navigate(`/compare?url=${encodeURIComponent(dealUrl.trim())}`);
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const userName = user?.name || 'Shopper';

  const trendingCategories = [
    { name: 'Sneakers', icon: '👟', query: 'sneakers', color: '#FF6B35' },
    { name: 'T-Shirts', icon: '👕', query: 't-shirts', color: '#06b6d4' },
    { name: 'Watches', icon: '⌚', query: 'watches', color: '#a855f7' },
    { name: 'Sunglasses', icon: '🕶️', query: 'sunglasses', color: '#ec4899' },
    { name: 'Backpacks', icon: '🎒', query: 'backpacks', color: '#22c55e' },
    { name: 'Jeans', icon: '👖', query: 'jeans', color: '#3b82f6' },
  ];

  const features = [
    { icon: <Search size={20} />, title: 'Smart Search', desc: 'Search across Amazon, Flipkart, Myntra & more' },
    { icon: <Zap size={20} />, title: 'AI Stylist', desc: 'Get personalized fashion advice powered by AI' },
    { icon: <TrendingUp size={20} />, title: 'Price Compare', desc: 'Find the lowest price across all retailers' },
    { icon: <Shield size={20} />, title: 'Unified Cart', desc: 'One cart, multiple retailers, single checkout' },
  ];

  return (
    <div className="dashboard animate-enter">
      <header className="dashboard-header flex-between mb-8">
        <div>
          <h1 className="text-gradient">{greeting()}, {userName}</h1>
          <p className="text-secondary mt-2">
            {products.length > 0
              ? 'Here are your tracked items and curated recommendations.'
              : 'Discover the best deals across all retailers with AI-powered shopping.'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/stylist')}>
          <Sparkles size={18} /> AI Stylist
        </button>
      </header>

      {/* Get the BEST deal here! */}
      <section className="section-block mb-8">
        <div className="glass-panel text-center" style={{ padding: '3.5rem 2rem', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', background: 'linear-gradient(145deg, rgba(20,20,25,0.8) 0%, rgba(10,10,15,0.9) 100%)' }}>
          <h2 className="mb-4 text-gradient" style={{ fontSize: '2rem' }}>Get the BEST deal here!</h2>
          <p className="text-secondary mb-6 max-w-2xl mx-auto">
            Paste a product link from any site (Flipkart, Myntra, Amazon, etc.) and our AI will instantly find the best price for it across all platforms.
          </p>
          <form onSubmit={handleBestDealSubmit} style={{ display: 'flex', alignItems: 'stretch', gap: '1rem', maxWidth: '42rem', margin: '0 auto' }}>
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={20} className="text-muted" style={{ position: 'absolute', left: '1rem', color: '#a1a1aa' }} />
              <input 
                type="url" 
                placeholder="https://www.flipkart.com/..." 
                className="form-input"
                value={dealUrl}
                onChange={(e) => setDealUrl(e.target.value)}
                required
                style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '1rem', outline: 'none' }}
              />
            </div>
            <button type="submit" className="btn btn-primary whitespace-nowrap" style={{ padding: '0 1.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 'bold' }}>
              Find Best Deal
            </button>
          </form>
        </div>
      </section>

      {/* Quick Categories */}
      <section className="section-block mb-8">
        <h2 className="mb-4">Trending Categories</h2>
        <div className="category-grid">
          {trendingCategories.map(cat => (
            <button
              key={cat.name}
              className="category-chip glass-panel"
              onClick={() => navigate(`/compare?q=${encodeURIComponent(cat.query)}`)}
            >
              <span className="category-icon" style={{ background: `${cat.color}20`, color: cat.color }}>{cat.icon}</span>
              <span className="category-name">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Tracked Products */}
      <section className="section-block">
        <div className="flex-between mb-4">
          <h2>{products.length > 0 ? 'Your Tracked Products' : 'Get Started'}</h2>
          {products.length > 0 && <span className="text-muted">{products.length} items</span>}
        </div>
        
        {loading ? (
          <div className="loading-state flex-center" style={{ padding: '4rem', gap: '1rem' }}>
            <Loader size={24} className="spin-animation" />
            <span className="text-secondary">Loading products...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="features-grid">
            {features.map((feature, i) => (
              <div key={i} className="feature-card glass-panel" style={{animationDelay: `${i * 100}ms`}}>
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p className="text-muted text-sm mt-1">{feature.desc}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="product-grid">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
      
      <section className="section-block mt-12">
        <div className="glass-panel promo-banner flex-between">
          <div className="promo-text">
            <h3>Try the AI Stylist</h3>
            <p className="text-secondary mt-2">Get personalized fashion advice. Tell the AI what you're looking for and it'll find the best deals.</p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/stylist')}>Chat Now</button>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
