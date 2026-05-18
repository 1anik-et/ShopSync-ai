const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Helper: get auth headers if user is logged in
 */
function getAuthHeaders() {
  const token = localStorage.getItem('shopsync_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ─── Products ───────────────────────────────────────────

export async function fetchProducts() {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function searchProducts(query) {
  if (!query || query.trim().length < 2) return [];
  const res = await fetch(`${API_BASE}/products/search?q=${encodeURIComponent(query.trim())}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function compareProducts(query) {
  if (!query || query.trim().length < 2) throw new Error('Query too short');
  const res = await fetch(`${API_BASE}/products/compare?q=${encodeURIComponent(query.trim())}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Compare failed');
  return res.json();
}

export async function compareDeal(url) {
  if (!url || url.trim().length < 5) throw new Error('Invalid URL');
  const res = await fetch(`${API_BASE}/products/deal?url=${encodeURIComponent(url.trim())}`);
  if (!res.ok) throw new Error('Deal comparison failed');
  return res.json();
}

export async function fetchProductById(id) {
  const res = await fetch(`${API_BASE}/products/${id}`);
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
}

export async function toggleProductTracking(id) {
  const res = await fetch(`${API_BASE}/products/${id}/track`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to toggle tracking');
  return res.json();
}

// ─── Cart ───────────────────────────────────────────────

export async function fetchCart() {
  const res = await fetch(`${API_BASE}/cart`);
  if (!res.ok) throw new Error('Failed to fetch cart');
  return res.json();
}

export async function addToCartAPI(item) {
  const res = await fetch(`${API_BASE}/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to add to cart');
  return res.json();
}

export async function updateCartItemQuantity(id, quantity) {
  const res = await fetch(`${API_BASE}/cart/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) throw new Error('Failed to update cart item');
  return res.json();
}

export async function deleteCartItem(id) {
  const res = await fetch(`${API_BASE}/cart/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete cart item');
  return res.json();
}

export async function clearCart() {
  const res = await fetch(`${API_BASE}/cart`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to clear cart');
  return res.json();
}

// ─── Chat / AI ──────────────────────────────────────────

export async function fetchChatHistory() {
  const res = await fetch(`${API_BASE}/chat/history`);
  if (!res.ok) throw new Error('Failed to fetch chat history');
  return res.json();
}

export async function sendChatMessage(text) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

export async function clearChatHistory() {
  const res = await fetch(`${API_BASE}/chat`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to clear chat');
  return res.json();
}

// ─── Size ───────────────────────────────────────────────

export async function getSizeRecommendation({ height, weight, gender, retailer, category }) {
  const res = await fetch(`${API_BASE}/size/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ height, weight, gender, retailer, category }),
  });
  if (!res.ok) throw new Error('Failed to get size recommendation');
  return res.json();
}

// ─── Auth ───────────────────────────────────────────────

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Login failed');
  }
  return res.json();
}

export async function registerUser(email, password, name, age, height, weight, skinColor, gender) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, age, height, weight, skinColor, gender }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Registration failed');
  }
  return res.json();
}

export async function requestOtp(phone) {
  const res = await fetch(`${API_BASE}/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to request OTP');
  }
  return res.json();
}

export async function verifyOtp(phone, otp) {
  const res = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Invalid OTP');
  }
  return res.json();
}

// ─── Orders ─────────────────────────────────────────────

export async function checkoutOrder(cartItems) {
  const res = await fetch(`${API_BASE}/orders/checkout`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ cartItems }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Checkout failed');
  }
  return res.json();
}

export async function fetchOrderHistory() {
  const res = await fetch(`${API_BASE}/orders/history`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch orders');
  }
  return res.json();
}

// ─── Reviews ────────────────────────────────────────────

export async function fetchReviews(productId) {
  const res = await fetch(`${API_BASE}/reviews/${productId}`);
  if (!res.ok) throw new Error('Failed to fetch reviews');
  return res.json();
}

export async function submitReview(productId, rating, title, comment) {
  const res = await fetch(`${API_BASE}/reviews`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ productId, rating, title, comment }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to submit review');
  }
  return res.json();
}

export async function likeReview(reviewId) {
  const res = await fetch(`${API_BASE}/reviews/${reviewId}/like`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to like review');
  return res.json();
}
