document.addEventListener('DOMContentLoaded', () => {
  const cartItemsContainer = document.getElementById('cart-items');
  const emptyState = document.getElementById('empty-state');
  const cartCount = document.getElementById('cart-count');
  const goBtn = document.getElementById('go-to-dashboard');

  // Load cart data from storage
  chrome.storage.local.get(['shopsync_cart'], (result) => {
    const cart = result.shopsync_cart || [];
    
    if (cart.length > 0) {
      emptyState.style.display = 'none';
      cartCount.innerText = cart.reduce((acc, item) => acc + item.quantity, 0);

      cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
          <img src="${item.image}" alt="Product" class="item-image" />
          <div class="item-details">
            <div class="item-header">
              <span class="item-title">${item.name}</span>
            </div>
            <div class="item-meta">
              <span>${item.retailer}</span>
              <span class="item-price">$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
            <div class="item-meta" style="margin-top:4px;">
              <span>Qty: ${item.quantity}</span>
            </div>
          </div>
        `;
        cartItemsContainer.appendChild(div);
      });
    } else {
      emptyState.style.display = 'block';
    }
  });

  // Redirect to localhost Dashboard
  goBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5173/cart' });
  });
});
