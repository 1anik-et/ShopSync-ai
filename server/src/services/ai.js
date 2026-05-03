const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs'); // Added for optional file stream capabilities for video
const path = require('path');

/**
 * ShopSync AI Multimodal Stylist Engine — Powered by Google Gemini 1.5 Pro
 * Advanced RAG Integration for Real-Time Fashion Advice, Web Scraping,
 * and Native Image/Video Processing.
 */

// Gemini supports massive context and natively processes images, video files, and multiple documents.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = GEMINI_API_KEY ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}` : '';

// Groq fallback (works with existing key when Gemini is unavailable)
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are ShopSync Stylist — an expert personal fashion assistant embedded in ShopSync.ai. Your personality is warm, knowledgeable, supportive, and trend-aware.

YOUR DOMAIN (STRICTLY ENFORCED):
You ONLY answer questions related to fashion, clothings, brands, style pairing, trends, appliances, accessories, essentials, and items relevant to e-commerce. You do NOT answer questions about coding, programming (e.g., reversing linked lists), geography (capital of India), history, politics, sports current affairs, or any non-fashion related topics. If a user asks a non-fashion question, politely redirect them back to style/shopping.

CAPABILITIES:
- Analyze images provided by the user to identify textures, cuts, fit, and color details. Provide direct outfit advice based on visual input.
- Process multiple images (or video frames passed as images) to understand context.
- Advise on color combinations, style pairings, and event suitability.
- Review sizing advice based on Indian retail standards (Amazon, Flipkart, Myntra, Ajio, Nike, Puma, H&M, Zara).
- Note on H&M Links: If a user provided an H&M link but your system could not fetch content, DO NOT hallucinate and say it is from a different brand like Zara. If the URL says hm.com, it is H&M. Advise accordingly.

GUIDELINES:
- Conversational and enthusiastic, never pushy.
- Concise responses (2-3 paragraphs max), useful and clear.
- Prices are in Indian Rupees (Rs.). Use realistic ranges for products like t-shirts (1,500-5,000) or sneakers (3,000-15,000).
- If context contains Reddit/web reviews, summarize the real public opinion on fit/quality.
- **You are directly speaking to the user.** Do not mention "groq", "multimodal", or "AI system". You are just a fashion expert.`;

/**
 * Perform a Web Search tailored for Reviews / Reddit / Alternatives
 */
async function searchWebContext(query, searchType = 'general') {
  try {
    let finalQuery = query;
    if (searchType === 'reddit') finalQuery += ' site:reddit.com fashion advice review fit';
    if (searchType === 'alternatives') finalQuery += ' alternatives comparison fashion';

    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(finalQuery)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 8000
    });
    const $ = cheerio.load(response.data);
    let snippets = [];
    $('.BNeawe.s3v9rd.AP7Wnd, .VwiC3b').each((i, el) => {
      if (i < 4) snippets.push($(el).text().trim());
    });
    
    if (snippets.length === 0) return '';
    return `[WEB SEARCH CONTEXT FOR "${finalQuery}"]: ${snippets.join(' | ')}`;
  } catch (err) {
    return '';
  }
}

/**
 * Fetch URL Content (Enhanced for Anti-Bot detection and H&M Fallback)
 */
async function fetchUrlContext(url) {
  try {
    // Upgrading headers to mimic a real browser better to reduce blocks on H&M/Zara
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,en;q=0.8',
        'Cache-Control': 'max-age=0',
        'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
      },
      timeout: 8000
    });
    const $ = cheerio.load(response.data);
    
    // Look for application/ld+json Product data, which e-commerce sites often use
    let productDetails = '';
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const jsonData = JSON.parse($(el).html());
        if (jsonData['@type'] === 'Product') {
          productDetails = `Brand: ${jsonData.brand?.name || 'Unknown'}, Price: ${jsonData.offers?.priceCurrency} ${jsonData.offers?.price}, Rating: ${jsonData.aggregateRating?.ratingValue || 'N/A'}`;
        }
      } catch (e) {}
    });

    if (productDetails) return `[SCRAPED DATA FROM ${url}]: ${productDetails}`;

    // Standard fallback scraping
    const title = $('title').text().trim() || $('h1').first().text().trim();
    const desc = $('meta[name="description"]').attr('content') || $('p').first().text().trim() || '';
    
    return `[SCRAPED DATA FROM ${url}]: Title: ${title}, Description: ${desc}`;
  } catch (err) {
    // If blocked, attempt fallback parsing from URL string itself (Critical for H&M hallucination)
    const urlString = url.toLowerCase();
    let fallbackInfo = '';
    
    // Detection fix for `image_2.png` context failure
    if (urlString.includes('hm.com')) fallbackInfo = `The user is looking at an H&M item (read from URL). Trust this brand identity over non-matching fetched data.`;
    if (urlString.includes('zara.com')) fallbackInfo = `The user is looking at a Zara item (read from URL).`;
    
    console.error(`[Scraper] Failed to fetch context from ${url}. Falling back.`);
    return `[SCRAPED DATA FROM ${url}]: Unable to fetch page content. ${fallbackInfo}`;
  }
}

/**
 * Main Function to generate response, upgraded for Multimodal capability (Images & Video)
 * @param {string} userMessage - Text input
 * @param {object[]} products - Browsing context
 * @param {object[]} history - Past conversation history
 * @param {object[]} mediaItems - EXPECTED MULTIMODAL INPUT: Objects like [{ mimeType: 'image/jpeg', base64Data: '...', type: 'image' | 'videoFrame' }]
 */
async function generateMultimodalResponse(userMessage, products, history, mediaItems = []) {
  let dynamicContext = [];
  try {
    if (!GEMINI_API_KEY && !GROQ_API_KEY) {
      throw new Error('[AI Error] No API key found. Add GEMINI_API_KEY or GROQ_API_KEY to .env');
    }

    const msgLower = userMessage.toLowerCase();
    
    // 1. Detect URLs
    const urls = userMessage.match(/https?:\/\/[^\s]+/g);
    if (urls && urls.length > 0) {
      for (const url of urls) {
         dynamicContext.push(await fetchUrlContext(url));
      }
    }
    
    // 2. Intelligent Web Searching for Reviews
    if (msgLower.includes('reddit') || msgLower.includes('review') || msgLower.includes('good quality') || msgLower.includes('worth it')) {
       // Isolate the subject from user message (e.g., "what people say on reddit about levos 501 jeans")
       const cleanQuery = userMessage.replace(/https?:\/\/[^\s]+/g, '').trim();
       dynamicContext.push(await searchWebContext(cleanQuery, 'reddit'));
    } else if (mediaItems && mediaItems.length > 0) {
        // If there's an image, consider a general search for visually similar styles based on user prompt.
    }

    // 3. Build the Gemini payload (Parts array required for multimodal)
    let parts = [];
    
    // Part 1: Persona and Dynamic Context (RAG text context)
    let systemInstructionText = SYSTEM_PROMPT;
    if (dynamicContext && dynamicContext.length > 0) {
      systemInstructionText += `\n\n=== LIVE DATA FOUND FOR THIS QUERY ===\nYou just found this data on the web. It is critical. USE IT. Do not fall back to generic advice or unrelated products if this live data answers the question. If the scraped data says H&M, trust it is H&M, not Zara.\n${dynamicContext.join('\n\n')}\n`;
    }
    
    if (products && products.length > 0) {
        const productList = products.map(p => ` - ${p.name} (Rs. ${Math.round(p.price).toLocaleString('en-IN')}) from ${p.retailer}. Link: ${p.url}`).join('\n');
        systemInstructionText += `\n\n=== CONTEXT (Products user is browsing) ===\n${productList}\nAlways recommend these specific products if visually similar/relevant to user's uploaded image.\n`;
    }

    // Part 2: Multimodal Input (Inline media)
    if (mediaItems && mediaItems.length > 0) {
        systemInstructionText += `\n\n=== MULTIMODAL VISUAL CONTEXT ===\nYou are analyzing user-uploaded images or video frames. Prioritize direct visual observations (texture, silhouette, specific logos visible) for direct advice.`;
        
        mediaItems.forEach(item => {
            if (item.mimeType && item.base64Data) {
                // Gemini expects object with inlineData property containing data and mimeType keys
                parts.push({
                    inlineData: {
                        data: item.base64Data,
                        mimeType: item.mimeType // Must be correct standard (image/jpeg, video/mp4, etc.)
                    }
                });
            }
        });
    }

    // Part 3: Text Prompt (User question)
    parts.push({ text: `${systemInstructionText}\n\nUSER'S QUESTION: ${userMessage}` });

    // 4. Send to Gemini or skip to Groq fallback
    if (!GEMINI_API_KEY) {
      throw new Error('No GEMINI_API_KEY — using Groq fallback');
    }
    const response = await axios.post(GEMINI_API_URL, {
      contents: [{
        role: "user",
        parts: parts
      }],
      generationConfig: {
          temperature: 0.4, // Reduced slightly to be more factual on multimodal context
          maxOutputTokens: 600,
          topP: 0.9
      }
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000, // Reduced timeout, multimodal is often fast
    });

    // 5. Format Gemini response
    if (response.data && response.data.candidates && response.data.candidates.length > 0) {
      const textResponsePart = response.data.candidates[0].content.parts.find(p => p.text);
      if (textResponsePart) {
          return textResponsePart.text.trim();
      }
    }

    throw new Error('Empty multimodal response from model.');
  } catch (error) {
    // If Gemini failed or not configured, try Groq fallback
    if (GROQ_API_KEY) {
      try {
        console.log('[AI] Falling back to Groq API...');
        let systemContent = SYSTEM_PROMPT;
        if (dynamicContext && dynamicContext.length > 0) {
          systemContent += `\n\n=== LIVE DATA ===\n${dynamicContext.join('\n\n')}`;
        }
        if (products && products.length > 0) {
          const pl = products.slice(0, 5).map(p => `- ${p.title || p.name} (Rs. ${Math.round(p.price)}) ${p.merchant || p.retailer || ''}`).join('\n');
          systemContent += `\n\nProducts user is browsing:\n${pl}`;
        }
        const msgs = [{ role: 'system', content: systemContent }];
        if (history && history.length > 0) {
          history.slice(-6).forEach(m => msgs.push({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));
        }
        msgs.push({ role: 'user', content: userMessage });
        
        const groqResp = await axios.post(GROQ_API_URL, {
          model: 'llama-3.1-8b-instant',
          messages: msgs,
          temperature: 0.4,
          max_tokens: 600,
          top_p: 0.9,
        }, {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
          timeout: 20000,
        });
        
        if (groqResp.data?.choices?.[0]?.message?.content) {
          return groqResp.data.choices[0].message.content.trim();
        }
      } catch (groqErr) {
        console.warn(`[AI] Groq fallback also failed: ${groqErr.message}`);
      }
    }
    
    const status = error.response?.status;
    const errMsg = error.response?.data?.error?.message || error.message;

    console.warn(`[Multimodal AI] Error (${status || 'network'}): ${errMsg}.`);
    return "Darling, I'm having a little trouble connecting to my visual studio right now! Could you describe the item or brand you're looking at, and I'll give you my expert opinion? 😊";
  }
}

/**
 * computeSizeRecommendation - Remains the same (as per context in Turn 1 history)
 */
function computeSizeRecommendation({ height, weight, gender, retailer, category }) {
  // Base logic computation using BMI heuristic
  const bmi = weight / ((height / 100) ** 2);
  let recommendedSize = 'M';
  let sizeLabel = 'Medium';
  let confidence = (height > 0 && weight > 0) ? 'High' : 'Medium';
  let reasoning = '';

  // Standard tops/shirts sizing logic based on Indian standards
  if (category.toLowerCase().includes('top') || category.toLowerCase().includes('shirt') || category.toLowerCase().includes('tee')) {
      if (bmi < 18.5) recommendedSize = 'S';
      else if (bmi >= 18.5 && bmi < 24) recommendedSize = 'M';
      else if (bmi >= 24 && bmi < 28) recommendedSize = 'L';
      else if (bmi >= 28) recommendedSize = 'XL';
      
      sizeLabel = recommendedSize;
      
      // Retailer specific adjustments
      const retailerQuirks = {
          'Nike': { offset: 1, note: 'Nike tends to run tight for standard Indian build. Sizing up one size is recommended for casual fit.' },
          'Puma': { offset: 0, note: 'Puma tops are typically true to standard Indian fit.' },
          'Zara': { offset: 1, note: 'Zara uses European sizing which runs slim. Size up one level recommended.' },
          'H&M': { offset: 0, note: 'H&M is generally true to Indian sizing, but some oversized tees might run large.' },
          'Amazon': { offset: 0, note: 'Standard Indian fit, though brands vary. Recommended M for average build.' },
          'Myntra': { offset: 0, note: 'Standard Indian fit on Myntra house brands like Roadster/HRX.' },
      };

      const quirks = retailerQuirks[retailer] || { offset: 0, note: '' };
      
      // Simple size offset calculation (incrementing S to M, M to L)
      const sizes = ['S', 'M', 'L', 'XL'];
      let currentIndex = sizes.indexOf(recommendedSize);
      if (quirks.offset > 0 && currentIndex < sizes.length - 1) {
          recommendedSize = sizes[currentIndex + 1];
          sizeLabel = recommendedSize;
      }
      
      reasoning = quirks.note;
  }
  
  return {
    recommendedSize,
    sizeLabel,
    retailer,
    category,
    confidence,
    tip: `For ${retailer}, we recommend trying ${recommendedSize}. ${reasoning}`,
  };
}

module.exports = { generateMultimodalResponse, computeSizeRecommendation };