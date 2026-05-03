const { image_search } = require('duckduckgo-images-api');
const ddgs = require('ddgs');

async function testDDG() {
  const query = 'samsung s24 ultra';
  
  // 1. Get real images
  try {
    const images = await image_search({ query: query, moderate: true });
    // console.log("Images:", images.slice(0, 3));
    console.log("Image URL:", images[0].image);
  } catch(e) {
    console.log('Image Error:', e.message);
  }

  // 2. Get real text
  try {
    const results = await ddgs.search(`site:amazon.in ${query}`);
    console.log("Text Results:", results.slice(0, 3));
  } catch(e) {
    console.log('Text Error:', e.message);
  }
}
testDDG();
