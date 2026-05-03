import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, TrendingDown, Star, MessageSquare, ShoppingBag, Loader, ExternalLink } from 'lucide-react';
import SizeRecommender from '../components/SizeRecommender';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { useToast } from '../components/Toast';
import { fetchProductById } from '../services/api';
import Reviews from '../components/Reviews';
import './ProductView.css';

const ProductView = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { getProductById } = useProducts();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try from context first, then API
    const cached = getProductById(id);
    if (cached) {
      setProduct(cached);
      setLoading(false);
    } else {
      fetchProductById(id)
        .then(data => { setProduct(data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [id, getProductById]);

  const handleAddToCart = async () => {
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
    }
  };

  if (loading) {
    return (
      <div className="product-view animate-enter" style={{ padding: '6rem', textAlign: 'center' }}>
        <Loader size={32} className="spin-animation" />
        <p className="text-secondary mt-4">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-view animate-enter" style={{ padding: '6rem', textAlign: 'center' }}>
        <h2 className="text-secondary">Product not found</h2>
        <Link to="/" className="btn btn-primary mt-4" style={{ display: 'inline-flex', marginTop: '1.5rem' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const discount = product.originalPrice > product.price 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Dynamic star rendering based on actual product rating
  const productRating = parseFloat(product.rating) || 4.0;
  const fullStars = Math.floor(productRating);
  const hasHalf = productRating - fullStars >= 0.3;
  const reviewCount = product.reviews || 0;

  return (
    <div className="product-view animate-enter">
      <div className="mb-4">
        <Link to="/" className="text-secondary hover-text-primary flex-center gap-1" style={{justifyContent: 'flex-start', width: 'fit-content'}}>
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      <div className="product-view-layout">
        <div className="product-gallery glass-panel">
          <img src={product.image} alt={product.name} />
        </div>

        <div className="product-details">
          <span className="retailer-badge mb-4">{product.retailer}</span>
          <h1 className="product-view-title">{product.name}</h1>
          
          <div className="flex-center gap-1 mb-6 mt-2" style={{justifyContent: 'flex-start'}}>
            <div className="stars flex-center text-gradient">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  size={16} 
                  fill={i < fullStars || (i === fullStars && hasHalf) ? 'currentColor' : 'none'}
                  style={{opacity: i < fullStars ? 1 : (i === fullStars && hasHalf) ? 0.6 : 0.2}}
                />
              ))}
            </div>
            <span className="text-secondary text-sm ml-2">
              {productRating.toFixed(1)} ({reviewCount > 0 ? reviewCount.toLocaleString() : 'No'} reviews)
            </span>
          </div>

          <div className="price-section flex-center gap-1 mb-8" style={{justifyContent: 'flex-start'}}>
            <span className="current-price-lg">Rs. {product.price.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
            {discount > 0 && (
              <>
                <span className="original-price-lg">Rs. {product.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
                <span className="tag tag-sale ml-2">{discount}% OFF</span>
              </>
            )}
          </div>

          {product.description && (
            <p className="text-secondary mb-8 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Delivery info */}
          {product.deliveryText && (
            <div className="delivery-badge mb-4">
              <span className="text-sm">🚚 {product.deliveryText}</span>
            </div>
          )}

          <div className="size-widget-container mb-8">
            <SizeRecommender retailer={product.retailer} category={product.category} />
          </div>

          <div className="action-buttons flex-between gap-1">
            <button 
              className="btn btn-primary" 
              style={{flex: 1, padding: '1rem', fontSize: '1.1rem'}}
              onClick={handleAddToCart}
            >
              <ShoppingBag size={20} /> Add to Unified Cart
            </button>
            {product.productUrl && (
              <a 
                href={product.productUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-icon btn-secondary" 
                style={{padding: '1rem', borderRadius: '16px'}}
                title={`View on ${product.retailer}`}
              >
                <ExternalLink size={24} />
              </a>
            )}
            {!product.productUrl && (
              <button className="btn-icon btn-secondary" style={{padding: '1rem', borderRadius: '16px'}}>
                <TrendingDown size={24} />
              </button>
            )}
          </div>
          
          {product.brand && product.brand !== 'Generic' && (
            <div className="mt-8 border-t pt-4 text-sm text-muted flex-center gap-1" style={{justifyContent: 'flex-start'}}>
              <MessageSquare size={16} />
              <span>Brand: <strong style={{color: 'var(--text-secondary)'}}>{product.brand}</strong> • Category: <strong style={{color: 'var(--text-secondary)'}}>{product.category}</strong></span>
            </div>
          )}
        </div>
      </div>
      
      <Reviews productId={product.id || product._id} />
    </div>
  );
};

export default ProductView;
