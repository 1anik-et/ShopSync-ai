import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { fetchCart, addToCartAPI, updateCartItemQuantity, deleteCartItem, clearCart as clearCartAPI } from '../services/api';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return { ...state, items: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: true };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    loading: true,
    error: null,
  });

  // Load cart from API on mount
  const loadCart = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING' });
      const items = await fetchCart();
      dispatch({ type: 'SET_CART', payload: items });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const addToCart = useCallback(async (item) => {
    try {
      await addToCartAPI(item);
      await loadCart(); // Refresh from server
      return true;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      return false;
    }
  }, [loadCart]);

  const updateQuantity = useCallback(async (id, newQuantity) => {
    try {
      await updateCartItemQuantity(id, newQuantity);
      await loadCart();
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }, [loadCart]);

  const removeFromCart = useCallback(async (id) => {
    try {
      await deleteCartItem(id);
      await loadCart();
      return true;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      return false;
    }
  }, [loadCart]);

  const clearCartItems = useCallback(async () => {
    try {
      await clearCartAPI();
      await loadCart();
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }, [loadCart]);

  const cartCount = state.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems: state.items,
      cartCount,
      loading: state.loading,
      error: state.error,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart: clearCartItems,
      refreshCart: loadCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
