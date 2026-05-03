import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchProducts, toggleProductTracking } from '../services/api';

const ProductContext = createContext();

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const toggleTracking = useCallback(async (id) => {
    try {
      const updated = await toggleProductTracking(id);
      setProducts(prev => prev.map(p => p.id === id ? updated : p));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const getProductById = useCallback((id) => {
    return products.find(p => p.id === id);
  }, [products]);

  return (
    <ProductContext.Provider value={{
      products,
      loading,
      error,
      toggleTracking,
      getProductById,
      refreshProducts: loadProducts,
    }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}
