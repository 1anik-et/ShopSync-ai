// Helper to extract data mainly from OpenGraph standard tags
function extractProductData() {
  const getMetaContent = (property) => {
    const el = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
    return el ? el.getAttribute('content') : null;
  };

  const title = getMetaContent('og:title') || document.title;
  const image = getMetaContent('og:image');
  
  // Try to find price via OG tags or generic fallback
  let priceStr = getMetaContent('product:price:amount') || getMetaContent('og:price:amount');
  
  // If no OG tag, do a naive search for the first visual price-like string (very basic fallback)
  if (!priceStr) {
    const priceEl = document.querySelector('[class*="price"], [id*="price"]');
    if (priceEl && priceEl.innerText.includes('$')) {
      priceStr = priceEl.innerText.replace(/[^0-9.]/g, '');
    }
  }

  // Parse retailer from domain
  const hostname = window.location.hostname;
  let retailer = 'Unknown Store';
  if (hostname.includes('amazon')) retailer = 'Amazon';
  if (hostname.includes('zara')) retailer = 'Zara';
  if (hostname.includes('nike')) retailer = 'Nike';
  if (hostname.includes('myntra')) retailer = 'Myntra';

  return {
    name: title,
    price: priceStr ? parseFloat(priceStr) : 0,
    image: image || 'https://via.placeholder.com/150',
    url: window.location.href,
    retailer: retailer,
    size: 'Auto-Detect', // Placeholder for integration with universal size chart
    color: 'Default'
  };
}

// Inject UI
function injectShopSyncBadge() {
  // Only inject if it looks like a product page (super basic heuristic: has an add to cart button or price)
  const isProductPage = document.querySelector('button[class*="cart"], button[id*="cart"], [class*="price"]') !== null;
  
  if (!isProductPage) return;

  const container = document.createElement('div');
  container.id = 'shopsync-extension-root';
  
  // Add Shadow DOM to isolate styles
  const shadow = container.attachShadow({ mode: 'open' });
  
  // Load CSS into shadow DOM
  const cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = chrome.runtime.getURL('src/content/content.css');
  shadow.appendChild(cssLink);

  const wrapper = document.createElement('div');
  wrapper.className = 'shopsync-floating-widget';
  
  const icon = document.createElement('div');
  icon.className = 'shopsync-icon';
  icon.innerHTML = '✨';
  
  const button = document.createElement('button');
  button.className = 'shopsync-btn';
  button.innerText = 'Add to ShopSync Cart';
  
  wrapper.appendChild(icon);
  wrapper.appendChild(button);
  shadow.appendChild(wrapper);
  document.body.appendChild(container);

  // Handle Click
  button.addEventListener('click', () => {
    button.innerText = 'Extracting...';
    
    // Slight delay to simulate scanning animations
    setTimeout(() => {
      const product = extractProductData();
      
      chrome.runtime.sendMessage({ action: 'ADD_TO_CART', product: product }, (response) => {
        if (chrome.runtime.lastError) {
           console.error(chrome.runtime.lastError);
           button.innerText = 'Error';
           return;
        }
        
        button.innerText = '✓ Added to Cart';
        button.classList.add('success');
        
        // Reset after 3 seconds
        setTimeout(() => {
          button.innerText = 'Add to ShopSync Cart';
          button.classList.remove('success');
        }, 3000);
      });
    }, 800);
  });
}

// Run injection after a slight delay to let SPA sites render
setTimeout(injectShopSyncBadge, 1500);
