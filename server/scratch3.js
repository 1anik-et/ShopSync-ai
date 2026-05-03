const axios = require('axios');

async function testAllOrigins() {
  const query = 'jeans';
  const url = encodeURIComponent(`https://www.amazon.in/s?k=${query}`);
  try {
    const res = await axios.get(`https://api.allorigins.win/get?url=${url}`);
    console.log(res.data.contents.substring(0, 500));
    console.log("SUCCESS length:", res.data.contents.length);
  } catch(e) {
    console.error("AllOrigins failed:", e.message);
  }
}
testAllOrigins();
