import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchOrderHistory } from '../services/api';
import { Package, LogOut, Clock, ShoppingBag, Loader, User, CheckCircle } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrderHistory = async () => {
    setLoading(true);
    try {
      const data = await fetchOrderHistory();
      if (data.success) setOrders(data.orders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else {
      loadOrderHistory();
    }
  }, [user, navigate]);

  const formatPrice = (amount) => `Rs. ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return '#34d399';
      case 'processing': return '#60a5fa';
      case 'tracked': return '#fbbf24';
      default: return '#a78bfa';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return <CheckCircle size={14} />;
      case 'processing': return <Loader size={14} className="spin-animation" />;
      default: return <Clock size={14} />;
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (!user) return null;

  return (
    <div className="profile-container animate-enter">
      <div className="profile-header glass-panel">
        <div className="profile-info">
          <div className="profile-avatar">{user.name?.charAt(0) || 'U'}</div>
          <div>
            <h1>{user.name}</h1>
            <p className="text-secondary">{user.email || user.phone}</p>
            <span className="member-badge">
              <User size={12} /> ShopSync Member
            </span>
          </div>
        </div>
        <button className="btn btn-secondary logout-btn" onClick={() => { logout(); navigate('/'); }}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="profile-orders">
        <div className="orders-header flex-between mb-6">
          <h2 className="text-gradient">
            <Package size={24} style={{display: 'inline', verticalAlign: 'middle', marginRight: '8px'}} />
            Universal Order History
          </h2>
          <span className="text-muted text-sm">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="flex-center" style={{padding: '4rem', gap: '0.5rem'}}>
            <Loader size={24} className="spin-animation" />
            <span className="text-secondary">Loading order history...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-orders glass-panel">
            <ShoppingBag size={48} style={{color: 'var(--text-muted)', marginBottom: '1rem'}} />
            <h3>No orders yet</h3>
            <p className="text-muted mt-2">Start shopping to see your orders here!</p>
            <button className="btn btn-primary mt-4" onClick={() => navigate('/')}>
              Explore Products
            </button>
          </div>
        ) : (
          <div className="orders-grid">
            {orders.map(order => (
              <div key={order._id} className="order-card glass-panel">
                <div className="order-card-header">
                  <div className="order-retailer-badge" data-retailer={order.retailer}>
                    {order.retailer}
                  </div>
                  <div className="order-header">
                    <span className="text-muted text-sm">#{order._id.substring(18)}</span>
                    <span className="order-date text-muted text-sm">{formatDate(order.createdAt)}</span>
                  </div>
                </div>

                <div className="order-items">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="order-item-row">
                      {item.image && <img src={item.image} alt={item.name} />}
                      <div className="order-item-details">
                        <p className="order-item-name">{item.name}</p>
                        <p className="order-item-meta">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-footer">
                  <div className="order-status" style={{color: getStatusColor(order.status)}}>
                    {getStatusIcon(order.status)}
                    <span>{order.status}</span>
                  </div>
                  <strong className="order-total">{formatPrice(order.totalAmount)}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
