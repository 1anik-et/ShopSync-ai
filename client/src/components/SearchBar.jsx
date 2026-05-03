import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Loader, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchProducts } from '../services/api';
import './SearchBar.css';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  // Debounced search
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);
    setHasSearched(true);

    try {
      const data = await searchProducts(searchQuery);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Clear previous debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Debounce 300ms
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  const handleResultClick = (product) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/product/${product.id}`);
  };

  const handleSearchSubmit = () => {
    if (query.trim().length >= 2) {
      setIsOpen(false);
      inputRef.current?.blur();
      navigate(`/compare?q=${encodeURIComponent(query.trim())}`);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape, Navigate on Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  // Highlight matching text
  const highlightMatch = (text, q) => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="search-highlight">{text.slice(idx, idx + q.length)}</span>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div className="search-bar" ref={containerRef}>
      <Search size={18} className="search-icon" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search products across all retailers..."
        value={query}
        onChange={handleInputChange}
        onFocus={() => { if (results.length > 0 || hasSearched) setIsOpen(true); }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {query && (
        <button className="search-clear-btn" onClick={handleClear}>
          <X size={16} />
        </button>
      )}

      {isOpen && (
        <div className="search-dropdown">
          {loading ? (
            <div className="search-loading">
              <Loader size={16} className="spin-animation" />
              Searching...
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="search-dropdown-header">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </div>
              {results.slice(0, 5).map(product => {
                const discount = product.originalPrice > product.price
                  ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                  : 0;

                return (
                  <div
                    key={product.id}
                    className="search-result-item"
                    onClick={() => handleResultClick(product)}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="search-result-image"
                    />
                    <div className="search-result-info">
                      <div className="search-result-name">
                        {highlightMatch(product.name, query)}
                      </div>
                      <div className="search-result-meta">
                        <span>{product.retailer}</span>
                        <span>•</span>
                        <span>{product.category}</span>
                        {discount > 0 && (
                          <>
                            <span>•</span>
                            <span style={{ color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <TrendingDown size={10} /> {discount}% OFF
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="search-result-price">
                      Rs. {product.price.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                );
              })}
            </>
          ) : hasSearched ? (
            <div className="search-no-results">
              No saved products match "<strong>{query}</strong>"
            </div>
          ) : null}
          
          {/* Primary action: Search across all retailers */}
          {query.trim().length >= 2 && !loading && (
            <div 
              className="search-cross-platform-link"
              onClick={handleSearchSubmit}
              style={{
                padding: '1rem',
                textAlign: 'center',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.08), rgba(6, 182, 212, 0.08))',
                cursor: 'pointer',
                color: 'var(--accent-cyan)',
                fontWeight: '600',
                fontSize: '0.9rem',
                borderBottomLeftRadius: '16px',
                borderBottomRightRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Search size={14} />
              Search "{query}" across all retailers →
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
