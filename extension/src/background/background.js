const API_BASE = 'http://localhost:3001/api';

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ADD_TO_CART') {
    addToCart(request.product);
    sendResponse({ status: 'success' });
  }
});

function addToCart(product) {
  // Save to local storage (local buffer)
  chrome.storage.local.get(['shopsync_cart'], (result) => {
    const cart = result.shopsync_cart || [];
    
    const existingIndex = cart.findIndex(item => item.url === product.url);
    
    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({
        ...product,
        id: 'ext_' + Date.now().toString(),
        quantity: 1,
        addedAt: new Date().toISOString()
      });
    }

    chrome.storage.local.set({ shopsync_cart: cart }, () => {
      console.log('ShopSync Cart Updated (local):', cart);
    });
  });

  // Also sync to the backend API server
  syncToBackend(product);
}

async function syncToBackend(product) {
  try {
    const response = await fetch(`${API_BASE}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: product.title || product.name || 'Unknown Product',
        price: parseFloat(product.price) || 0,
        image: product.image || '',
        retailer: product.retailer || extractRetailer(product.url),
        size: '',
        color: '',
        quantity: 1,
        sourceUrl: product.url || '',
      }),
    });

    if (response.ok) {
      console.log('✅ ShopSync: Synced to backend server');
    } else {
      console.warn('⚠️ ShopSync: Backend sync failed — server may be offline');
    }
  } catch (err) {
    console.warn('⚠️ ShopSync: Could not reach backend server at', API_BASE);
  }
}

function extractRetailer(url) {
  if (!url) return 'Unknown';
  try {
    const hostname = new URL(url).hostname;
    if (hostname.includes('amazon')) return 'Amazon';
    if (hostname.includes('nike')) return 'Nike';
    if (hostname.includes('zara')) return 'Zara';
    if (hostname.includes('nordstrom')) return 'Nordstrom';
    if (hostname.includes('hm') || hostname.includes('h&m')) return 'H&M';
    if (hostname.includes('uniqlo')) return 'Uniqlo';
    return hostname.replace('www.', '').split('.')[0];
  } catch {
    return 'Unknown';
  }
}
