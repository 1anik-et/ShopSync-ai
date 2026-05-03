"""
Pydantic models for AI Engine request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional


class StyleAnalysisRequest(BaseModel):
    """Request for analyzing style from a product or description"""
    product_name: str = Field(..., description="Name of the product")
    category: str = Field(default="General", description="Product category")
    description: str = Field(default="", description="Product description")
    color: str = Field(default="", description="Primary color")
    retailer: str = Field(default="Unknown", description="Retailer name")


class StyleAnalysisResponse(BaseModel):
    """Style analysis results"""
    style_tags: list[str]
    occasion_match: list[str]
    season_match: list[str]
    versatility_score: float = Field(ge=0, le=10)
    style_description: str


class OutfitSuggestionRequest(BaseModel):
    """Request for outfit completion suggestions"""
    occasion: str = Field(..., description="Event/occasion type")
    gender: str = Field(default="unisex", description="Gender preference")
    budget: Optional[float] = Field(default=None, description="Max budget")
    style_preference: str = Field(default="balanced", description="Style preference: classic, trendy, minimal, bold")
    existing_items: list[str] = Field(default=[], description="Items user already has")


class OutfitSuggestionResponse(BaseModel):
    """Outfit suggestion results"""
    outfit_components: list[dict]
    style_notes: str
    estimated_cost: float
    confidence: float


class ColorMatchRequest(BaseModel):
    """Request for color palette matching"""
    primary_color: str = Field(..., description="Primary color to match")
    style: str = Field(default="complementary", description="complementary, analogous, triadic, monochromatic")


class ColorMatchResponse(BaseModel):
    """Color matching results"""
    primary: str
    suggested_palette: list[str]
    avoid_colors: list[str]
    palette_name: str
    tip: str


class TrendScoreRequest(BaseModel):
    """Request for trending score analysis"""
    product_name: str
    category: str = "General"


class TrendScoreResponse(BaseModel):
    """Trend scoring results"""
    trend_score: float = Field(ge=0, le=100)
    trend_direction: str  # rising, stable, declining
    peak_season: str
    style_longevity: str  # timeless, seasonal, trendy
    recommendation: str


class ChatRequest(BaseModel):
    """User message for the AI stylist"""
    message: str
    history: list[dict] = []
    product_context: list[dict] = []


class ChatResponse(BaseModel):
    """AI stylist message response"""
    response: str
