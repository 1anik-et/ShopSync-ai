import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from './Toast';
import './CartItem.css';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const { showToast } = useToast();

  const handleIncrement = () => {
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity <= 1) {
      handleDelete();
    } else {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleDelete = async () => {
    const success = await removeFromCart(item.id);
    if (success) {
      showToast(`${item.name} removed from cart`, 'info');
    }
  };

  return (
    <div className="cart-item glass-panel">
      <img src={item.image} alt={item.name} className="cart-item-image" />
      
      <div className="cart-item-details">
        <div className="flex-between">
          <div>
            <span className="cart-item-retailer retailer-badge">{item.retailer}</span>
            <h3 className="cart-item-title">{item.name}</h3>
          </div>
          <button className="btn-icon delete-btn" onClick={handleDelete}>
            <Trash2 size={18} />
          </button>
        </div>
        
        {(item.size || item.color) && (
          <div className="cart-item-meta text-secondary">
            {item.size && <><span>Size: <strong>{item.size}</strong></span></>}
            {item.size && item.color && <span className="divider">•</span>}
            {item.color && <><span>Color: <strong>{item.color}</strong></span></>}
          </div>
        )}
        
        <div className="cart-item-bottom flex-between">
          <div className="quantity-controls glass-panel">
            <button className="qty-btn" onClick={handleDecrement}><Minus size={14} /></button>
            <span className="qty-value">{item.quantity}</span>
            <button className="qty-btn" onClick={handleIncrement}><Plus size={14} /></button>
          </div>
          
          <div className="cart-item-price">
            Rs. {(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
