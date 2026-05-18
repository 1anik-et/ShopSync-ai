import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, TrendingDown, ExternalLink, Star, ChevronRight, Loader, ShoppingBag, ShieldCheck, Filter, X, SlidersHorizontal } from 'lucide-react';
import { compareProducts, compareDeal } from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/Toast';
import './ComparePage.css';

const CompareResultCard = ({ product }) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const success = await addToCart({
      name: product.name,
      price: Math.round(product.price),
      image: product.image,
      retailer: product.retailer,
      size: product.availableSizes ? product.availableSizes[0] : '',
      color: '',
      quantity: 1,
    });
    if (success) {
      showToast(`${product.name} added to unified cart!`, 'success');
    }
  };

  return (
    <div className={`compare-card glass-panel ${product.isBestDeal ? 'best-deal-card' : ''}`}>
      {product.isBestDeal && (
        <div className="best-deal-badge flex-center">
          <SparklesIcon size={14} /> Best Deal
        </div>
      )}
      
      <div className="compare-card-image">
        <img src={product.image} alt={product.name} />
        <div 
          className="retailer-tag" 
          style={{ background: product.retailerMeta.color, color: ['#FFF', '#F8F9FA'].includes(product.retailerMeta.color) ? '#000' : '#FFF' }}
        >
          <span className="mr-1">{product.retailerMeta.logo}</span> {product.retailer}
        </div>
      </div>
      
      <div className="compare-card-content">
        <h3 className="compare-title">{product.name}</h3>
        
        <div className="compare-meta flex-center" style={{justifyContent: 'flex-start', margin: '0.4rem 0'}}>
          <div className="rating-box flex-center">
            <Star size={12} fill="currentColor" />
            <span>{product.rating}</span>
          </div>
          <span className="text-muted text-sm ml-2">({product.reviews.toLocaleString()})</span>
        </div>
        
        <div className="compare-price-row flex-between">
          <div className="price-block">
            <span className="current-price-lg">Rs. {product.price.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
            {product.discount > 0 && (
              <span className="original-price">Rs. {product.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
            )}
          </div>
        </div>
        
        <div className="delivery-info flex-center" style={{justifyContent: 'flex-start', margin: '0.5rem 0 1rem 0'}}>
          <span className="text-xs text-muted">Delivery: <span className="text-primary font-semibold">{product.deliveryText}</span></span>
        </div>
        
        <div className="compare-actions flex-between mt-auto" style={{gap: '0.5rem'}}>
          <button className="btn btn-primary flex-1 text-sm" onClick={handleAddToCart} style={{padding: '0.5rem'}}>
            Add to Cart
          </button>
          <a href={product.productUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary flex-1 text-sm" style={{padding: '0.5rem', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center'}} title={`Open on ${product.retailer}`}>
            View <ExternalLink size={14} className="ml-1" />
          </a>
        </div>
      </div>
    </div>
  );
};

// Internal Sparkles component
const SparklesIcon = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
  </svg>
);

const ComparePage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const urlParam = searchParams.get('url') || '';
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  
  // Filtering States
  const [filterRetailer, setFilterRetailer] = useState('all');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [customBrand, setCustomBrand] = useState('');
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        let result;
        if (urlParam) {
          result = await compareDeal(urlParam);
        } else {
          result = await compareProducts(query);
        }
        setData(result);
        setError(null);
        
        // Set default max price to 10 Crores (100,000,000)
        if (result && result.results.length > 0) {
           setMaxPrice(100000000);
        }
      } catch (err) {
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    if (query || urlParam) {
      fetchResults();
    } else {
      setLoading(false);
    }
  }, [query, urlParam]);

  // Derived Filter logic & Sidebar Extraction
  const { filteredItems, availableFilters } = useMemo(() => {
    if (!data) return { filteredItems: [], availableFilters: { brands: [], sizes: [], highestPrice: 1000 } };
    
    // Extract Sets
    const brandSet = new Set();
    const sizeSet = new Set();
    let highestPrice = 0;

    data.results.forEach(p => {
       if (p.brand && p.brand !== 'Generic') brandSet.add(p.brand);
       if (p.availableSizes) p.availableSizes.forEach(s => sizeSet.add(s));
       if (p.price > highestPrice) highestPrice = p.price;
    });

    const filters = {
       brands: Array.from(brandSet).sort(),
       sizes: Array.from(sizeSet).sort((a,b)=>a.localeCompare(b, undefined, {numeric:true})),
       highestPrice: 100000000 // 10 Cr
    };

    // Apply Active Filters
    const filtered = data.results.filter(p => {
       if (filterRetailer !== 'all' && p.retailer !== filterRetailer) return false;
       if (selectedBrands.length > 0 && (!p.brand || !selectedBrands.some(b => p.brand.toLowerCase().includes(b.toLowerCase())))) return false;
       if (selectedSizes.length > 0 && (!p.availableSizes || !p.availableSizes.some(s => selectedSizes.includes(s)))) return false;
       if (p.price > maxPrice) return false;
       return true;
    });

    return { filteredItems: filtered, availableFilters: filters };
  }, [data, filterRetailer, selectedBrands, selectedSizes, maxPrice]);

  const toggleFilterArray = (item, currentArray, setter) => {
     if (currentArray.includes(item)) {
         setter(currentArray.filter(i => i !== item));
     } else {
         setter([...currentArray, item]);
     }
  };

  if (loading) {
    return (
      <div className="compare-page flex-center" style={{ minHeight: '60vh', flexDirection: 'column' }}>
        <Loader size={48} className="spin-animation mb-4 text-accent-purple" />
        <h2 className="text-secondary text-gradient">Scanning retailers for best prices...</h2>
        <p className="text-muted mt-2">Checking Amazon, Flipkart, Myntra, and more.</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="compare-page container mt-12">
        <div className="glass-panel text-center" style={{ padding: '4rem' }}>
          <h2>Oops! Something went wrong.</h2>
          <p className="text-secondary mt-2">{error || 'Could not fetch comparison data.'}</p>
          <Link to="/" className="btn btn-primary mt-4">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="compare-page container animate-enter">
      {/* Header */}
      <header className="compare-header mb-6">
        <div className="flex-center mb-2 text-muted text-sm" style={{justifyContent: 'flex-start'}}>
          <Link to="/" className="hover-text-primary">Home</Link>
          <ChevronRight size={14} className="mx-2" />
          <span>Compare</span>
          <ChevronRight size={14} className="mx-2" />
          <span className="text-primary font-semibold">"{query}"</span>
        </div>
        
        <h1 className="mb-1 text-2xl">
          Results for <span className="text-gradient">"{query}"</span>
        </h1>
        <p className="text-secondary text-sm">
          Found <strong className="text-primary">{filteredItems.length} items</strong> from search query.
        </p>
      </header>
      
      {data.totalResults === 0 ? (
        <div className="glass-panel text-center" style={{ padding: '6rem' }}>
          <Search size={48} className="text-muted mb-4 mx-auto" />
          <h2>No matching products found.</h2>
          <p className="text-secondary mt-2">We couldn't find matches for "{query}" across our supported retailers.</p>
        </div>
      ) : (
        <div className="compare-layout">
          {/* MOBILE QUICK FILTERS */}
          <div className="mobile-quick-filters hidden-desktop">
            <button className="btn btn-secondary filter-toggle-btn" onClick={() => setIsMobileSidebarOpen(true)}>
              <SlidersHorizontal size={16} /> Filters
            </button>
            <div className="quick-filter-pills">
              {availableFilters.brands.slice(0, 8).map(brand => (
                <button 
                  key={brand} 
                  className={`pill-btn ${selectedBrands.includes(brand) ? 'active' : ''}`}
                  onClick={() => toggleFilterArray(brand, selectedBrands, setSelectedBrands)}
                >
                  {brand}
                </button>
              ))}
              {availableFilters.sizes.slice(0, 5).map(size => (
                <button 
                  key={size} 
                  className={`pill-btn ${selectedSizes.includes(size) ? 'active' : ''}`}
                  onClick={() => toggleFilterArray(size, selectedSizes, setSelectedSizes)}
                >
                  Size {size}
                </button>
              ))}
            </div>
          </div>

          {/* LEFT SIDEBAR (Filters) */}
          <aside className={`compare-sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-header hidden-desktop flex-between mb-4 pb-2 border-b">
              <h2 className="m-0" style={{ fontSize: '1.25rem' }}>Filters</h2>
              <button className="btn-icon" onClick={() => setIsMobileSidebarOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="sidebar-block mb-6">
              <h3 className="sidebar-heading text-sm text-secondary uppercase tracking-wider mb-3 flex-center" style={{justifyContent: 'flex-start'}}>
                <Filter size={14} className="mr-2"/> Retailer
              </h3>
              <div className="filter-options">
                <label className="checkbox-label">
                  <input type="radio" name="retailer" checked={filterRetailer === 'all'} onChange={() => setFilterRetailer('all')} />
                  <span>All Retailers</span>
                </label>
                {data.retailers.map(r => (
                  <label key={r.name} className="checkbox-label">
                    <input type="radio" name="retailer" checked={filterRetailer === r.name} onChange={() => setFilterRetailer(r.name)} />
                    <span style={{ borderLeft: `3px solid ${r.color}`, paddingLeft: '6px' }}>{r.name} ({r.count})</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="sidebar-block mb-6">
              <h3 className="sidebar-heading text-sm text-secondary uppercase tracking-wider mb-3">Brands</h3>
              
              <div className="custom-brand-input mb-3" style={{display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(0,0,0,0.25)', padding: '0.15rem 0.15rem 0.15rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)'}}>
                <input 
                  type="text" 
                  placeholder="Add brand..." 
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customBrand.trim()) {
                      window.location.href = `/compare?q=${encodeURIComponent(query + ' ' + customBrand.trim())}`;
                    }
                  }}
                  style={{ 
                    flex: 1,
                    padding: '0.3rem 0', 
                    border: 'none',
                    background: 'transparent',
                    color: 'white',
                    outline: 'none',
                    fontSize: '0.8rem',
                    minWidth: 0,
                  }}
                />
                <button 
                  className="btn btn-primary" 
                  style={{padding: '0.3rem 0.6rem', borderRadius: '5px', fontSize: '0.75rem', whiteSpace: 'nowrap', lineHeight: 1}}
                  onClick={() => {
                    if (customBrand.trim()) {
                      window.location.href = `/compare?q=${encodeURIComponent(query + ' ' + customBrand.trim())}`;
                    }
                  }}
                >Add</button>
              </div>

              <div className="filter-options">
                {Array.from(new Set([...availableFilters.brands, ...selectedBrands])).sort().map(brand => (
                  <label key={brand} className="checkbox-label">
                    <input 
                       type="checkbox" 
                       checked={selectedBrands.includes(brand)} 
                       onChange={() => toggleFilterArray(brand, selectedBrands, setSelectedBrands)}
                    />
                    <span>{brand}</span>
                  </label>
                ))}
              </div>
            </div>

            {availableFilters.sizes.length > 0 && (
              <div className="sidebar-block mb-6">
                <h3 className="sidebar-heading text-sm text-secondary uppercase tracking-wider mb-3">Size Options</h3>
                <div className="size-grid">
                  {availableFilters.sizes.map(size => (
                    <button 
                      key={size}
                      className={`size-btn ${selectedSizes.includes(size) ? 'active' : ''}`}
                      onClick={() => toggleFilterArray(size, selectedSizes, setSelectedSizes)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="sidebar-block mb-6">
              <h3 className="sidebar-heading text-sm text-secondary uppercase tracking-wider mb-3">Max Price</h3>
              <div className="price-slider-container">
                <input 
                  type="number" 
                  min="0" 
                  max={availableFilters.highestPrice} 
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(parseInt(e.target.value) || 0)}
                  className="form-input mb-2"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <input 
                  type="range" 
                  min="0" 
                  max={availableFilters.highestPrice} 
                  step="1000"
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  className="price-slider"
                />
                <div className="flex-between mt-2 text-sm text-muted">
                  <span>Rs. 0</span>
                  <span className="text-primary font-semibold">Rs. {maxPrice.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
            
            {(selectedBrands.length > 0 || selectedSizes.length > 0) && (
              <button 
                className="btn btn-secondary w-full text-sm" 
                onClick={() => { setSelectedBrands([]); setSelectedSizes([]); setMaxPrice(availableFilters.highestPrice); }}
              >
                Clear Filters
              </button>
            )}
          </aside>

          {/* RIGHT GRID */}
          <main className="compare-main">
            {filteredItems.length === 0 ? (
               <div className="glass-panel text-center py-12">
                 <p className="text-secondary">No products match the selected filters.</p>
                 <button className="text-accent-cyan mt-2 mr-4 underline" onClick={() => { setSelectedBrands([]); setSelectedSizes([]); setMaxPrice(availableFilters.highestPrice); }}>Clear Filters</button>
                 {selectedBrands.length > 0 && (
                   <a href={`/compare?q=${encodeURIComponent(query + ' ' + selectedBrands.join(' '))}`} className="btn btn-primary mt-4 inline-block">
                     Deep Search for "{selectedBrands.join(', ')}"
                   </a>
                 )}
               </div>
            ) : (
               <div className="compare-grid">
                 {filteredItems.map(product => (
                   <CompareResultCard key={product.id} product={product} />
                 ))}
               </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
};

export default ComparePage;
