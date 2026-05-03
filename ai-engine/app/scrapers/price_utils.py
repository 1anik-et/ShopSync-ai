"""
Price Scraper Utilities
Helpers for extracting and normalizing price data from scraped product pages.
"""
import re
from typing import Optional


def extract_price(price_string: str) -> Optional[float]:
    """Extract a numeric price from a string like '$149.99' or '149,99 EUR'"""
    if not price_string:
        return None
    
    # Remove currency symbols and whitespace
    cleaned = re.sub(r'[^\d.,]', '', price_string.strip())
    
    if not cleaned:
        return None
    
    # Handle European comma format (149,99)
    if ',' in cleaned and '.' not in cleaned:
        cleaned = cleaned.replace(',', '.')
    elif ',' in cleaned and '.' in cleaned:
        # Format like 1,234.56 — remove thousand separator
        cleaned = cleaned.replace(',', '')
    
    try:
        return round(float(cleaned), 2)
    except ValueError:
        return None


def normalize_retailer(url: str) -> str:
    """Extract retailer name from a URL"""
    retailer_map = {
        "amazon": "Amazon",
        "nike": "Nike",
        "zara": "Zara",
        "nordstrom": "Nordstrom",
        "hm": "H&M",
        "uniqlo": "Uniqlo",
        "asos": "ASOS",
        "shein": "SHEIN",
        "target": "Target",
        "walmart": "Walmart",
        "macys": "Macy's",
        "gap": "Gap",
    }
    
    url_lower = url.lower()
    for key, name in retailer_map.items():
        if key in url_lower:
            return name
    
    # Fallback: extract domain name
    try:
        from urllib.parse import urlparse
        hostname = urlparse(url).hostname or ""
        return hostname.replace("www.", "").split(".")[0].capitalize()
    except Exception:
        return "Unknown"


def calculate_discount(current: float, original: float) -> dict:
    """Calculate discount percentage and savings"""
    if not original or original <= current:
        return {"discount_percent": 0, "savings": 0.0, "has_discount": False}
    
    savings = round(original - current, 2)
    percent = round((savings / original) * 100, 1)
    
    return {
        "discount_percent": percent,
        "savings": savings,
        "has_discount": True,
    }
