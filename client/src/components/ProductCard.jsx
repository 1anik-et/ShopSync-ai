import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, TrendingDown, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { useToast } from './Toast';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleTracking } = useProducts();
  const { showToast } = useToast();
  
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const success = await addToCart({
      name: product.name,
      price: product.price,
      image: product.image,
      retailer: product.retailer,
      size: '',
      color: '',
      quantity: 1,
    });
    if (success) {
      showToast(`${product.name} added to cart!`, 'success');
    } else {
      showToast('Failed to add to cart', 'error');
    }
  };

  const handleTrackToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleTracking(product.id);
    showToast(
      product.isTracking ? 'Stopped tracking price' : 'Now tracking price drops!',
      'info'
    );
  };

  return (
    <div className="product-card glass-panel">
      <div className="product-image-wrapper">
        <img src={product.image} alt={product.name} className="product-image" />
        <div className="product-badges">
          <span className="retailer-badge">{product.retailer}</span>
          {discount > 0 && (
            <span className="tag tag-sale flex-center gap-1">
              <TrendingDown size={12} /> {discount}% OFF
            </span>
          )}
        </div>
        <button 
          className={`btn-icon heart-btn ${product.isTracking ? 'active' : ''}`}
          onClick={handleTrackToggle}
        >
          <Heart size={18} fill={product.isTracking ? "var(--accent-pink)" : "none"} color={product.isTracking ? "var(--accent-pink)" : "currentColor"} />
        </button>
      </div>
      
      <div className="product-content">
        <Link to={`/product/${product.id}`}>
          <h3 className="product-title">{product.name}</h3>
        </Link>
        <div className="product-price-row flex-between">
          <div className="price-block">
            <span className="current-price">Rs. {product.price.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            {discount > 0 && (
              <span className="original-price">Rs. {product.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            )}
          </div>
          <button className="btn btn-primary add-to-cart-sm" onClick={handleAddToCart}>
            <ShoppingBag size={14} /> Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
