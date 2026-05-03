import React, { useState, useContext } from 'react';
import CartItem from '../components/CartItem';
import { useCart } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { ShieldCheck, Truck, ShoppingBag, Loader, CreditCard, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { checkoutOrder } from '../services/api';
import './Cart.css';

const Cart = () => {
  const { cartItems, loading, clearCart } = useCart();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.18; // 18% GST for India
  const total = subtotal + tax;

  const formatPrice = (amount) => `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const handleCheckout = async () => {
    if (!user) {
      alert('Please login to place an order.');
      navigate('/auth');
      return;
    }

    if (cartItems.length === 0) return;

    setCheckoutLoading(true);
    try {
      const data = await checkoutOrder(cartItems);
      if (data.success) {
        clearCart();
        alert('🎉 Universal Order Placed Successfully!');
        navigate('/profile');
      }
    } catch (err) {
      alert('Error placing order: ' + err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading || checkoutLoading) {
    return (
      <div className="cart-page animate-enter">
        <div className="loading-state flex-center" style={{ padding: '6rem', gap: '1rem' }}>
          <Loader size={24} className="spin-animation" />
          <span className="text-secondary">{checkoutLoading ? 'Processing cross-platform order...' : 'Loading your cart...'}</span>
        </div>
      </div>
    );
  }

  // Group by retailer
  const groupedItems = cartItems.reduce((acc, item) => {
    if (!acc[item.retailer]) acc[item.retailer] = [];
    acc[item.retailer].push(item);
    return acc;
  }, {});

  return (
    <div className="cart-page animate-enter">
      <header className="mb-8 flex-between">
        <div>
          <h1 className="text-gradient">Unified Cart</h1>
          <p className="text-secondary mt-2">
            {cartItems.length === 0 
              ? 'Your cart is empty.' 
              : `${cartItems.length} item${cartItems.length > 1 ? 's' : ''} from ${Object.keys(groupedItems).length} retailer${Object.keys(groupedItems).length > 1 ? 's' : ''}`
            }
          </p>
        </div>
        {cartItems.length > 0 && (
          <button className="btn btn-secondary" onClick={clearCart} style={{ fontSize: '0.9rem' }}>
            Clear Cart
          </button>
        )}
      </header>

      {cartItems.length === 0 ? (
        <div className="empty-cart glass-panel" style={{ padding: '5rem', textAlign: 'center' }}>
          <ShoppingBag size={48} style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }} />
          <h2 style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Your cart is empty</h2>
          <p className="text-muted" style={{ marginBottom: '2rem' }}>Browse products and add items to your unified cart.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items-section">
            {Object.entries(groupedItems).map(([retailer, items]) => (
               <div key={retailer} className="glass-panel" style={{marginBottom: '1.5rem', padding: '1.5rem'}}>
                 <h3 style={{marginBottom: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '10px'}}>
                   <span className={`platform-badge ${retailer.toLowerCase()}`}>{retailer}</span> 
                   <span className="text-secondary text-sm">({items.length} item{items.length > 1 ? 's' : ''})</span>
                 </h3>
                 {items.map(item => (
                   <CartItem key={item.id} item={item} />
                 ))}
                 <div style={{textAlign: 'right', marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
                    Retailer Subtotal: <strong style={{color: 'var(--text-primary)'}}>{formatPrice(items.reduce((s, i) => s + (i.price * i.quantity), 0))}</strong>
                 </div>
               </div>
            ))}
          </div>
          
          <div className="cart-summary-section">
            <div className="glass-panel summary-panel">
              <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem', fontWeight: '800' }}>
                <CreditCard size={24} style={{display: 'inline', marginRight: '8px', verticalAlign: 'middle'}} />
                Order Summary
              </h2>
              
              <div className="summary-row text-secondary">
                <span>Subtotal</span>
                <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{formatPrice(subtotal)}</span>
              </div>
              <div className="summary-row text-secondary">
                <span>GST (18%)</span>
                <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{formatPrice(tax)}</span>
              </div>
              <div className="summary-row text-secondary">
                <span>Delivery</span>
                <span style={{ fontWeight: '500', color: '#34d399' }}>FREE</span>
              </div>
              
              <div className="summary-divider"></div>
              
              <div className="summary-row total-row">
                <span className="total-label">Total</span>
                <span className="total-amount">{formatPrice(total)}</span>
              </div>
              
              <button className="btn btn-primary checkout-btn" onClick={handleCheckout}>
                <Package size={18} /> Pay {formatPrice(total)}
              </button>
              
              <div className="checkout-trust-badges">
                <div className="trust-badge">
                  <ShieldCheck size={18} className="mr-2"/> Secure Multi-Platform Checkout
                </div>
                <div className="trust-badge">
                  <Truck size={18} className="mr-2"/> Automated delivery tracking
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
