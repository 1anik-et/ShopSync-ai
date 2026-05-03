import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { ProductProvider } from './context/ProductContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Cart from './pages/Cart';
import Stylist from './pages/Stylist';
import ProductView from './pages/ProductView';
import ComparePage from './pages/ComparePage';
import TopLoader from './components/TopLoader';
import { AuthProvider } from './context/AuthContext';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <ProductProvider>
            <ToastProvider>
              <div className="app-container">
                <TopLoader />
                <Navbar />
                <main className="main-content container">
                  <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/stylist" element={<Stylist />} />
                  <Route path="/compare" element={<ComparePage />} />
                  <Route path="/product/:id" element={<ProductView />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/profile" element={<Profile />} />
                </Routes>
              </main>
            </div>
          </ToastProvider>
        </ProductProvider>
      </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
