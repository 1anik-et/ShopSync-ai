import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Sparkles, User, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';
import SearchBar from './SearchBar';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { user } = useContext(AuthContext);
  
  const isActive = (path) => location.pathname === path ? 'active' : '';

  const handleHomeClick = (e) => {
    e.preventDefault();
    window.dispatchEvent(new Event('trigger-top-loader'));
    window.scrollTo({ top: 0, behavior: 'auto' });
    navigate('/', { replace: location.pathname === '/', state: { refreshKey: Date.now() } });
  };

  return (
    <nav className="navbar glass-panel">
      <div className="navbar-container container flex-between">
        
        <a 
          href="/" 
          className="navbar-logo"
          onClick={handleHomeClick}
        >
          <span className="logo-icon"><Sparkles size={24} /></span>
          <span className="logo-text text-gradient">ShopSync<span className="logo-ai">.ai</span></span>
        </a>
        
        <SearchBar />
        
        <div className="navbar-links">
          <a href="/" className={`nav-link ${isActive('/')}`} onClick={handleHomeClick}>Home</a>
          <Link to="/stylist" className={`nav-link nav-link-ai ${isActive('/stylist')}`}>
            <Sparkles size={16} /> AI Stylist
          </Link>
          <div className="nav-actions flex-center">
            {user && (
              <Link to="/profile" className={`nav-link ${isActive('/profile')}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '8px' }}>
                <Package size={16} /> Orders
              </Link>
            )}
            <Link to="/cart" className={`btn-icon cart-btn ${isActive('/cart')}`}>
              <ShoppingBag size={20} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
            <button className="btn-icon user-btn" onClick={() => navigate(user ? '/profile' : '/auth')} title={user ? 'Profile' : 'Login'}>
              {user ? <div className="user-avatar-small">{user.name?.charAt(0) || 'U'}</div> : <User size={20} />}
            </button>
          </div>
        </div>
        
      </div>
    </nav>
  );
};

export default Navbar;
