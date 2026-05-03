"""
AI Engine API Routes
Endpoints for style analysis, outfit suggestions, color matching, and trend scoring.
"""
from fastapi import APIRouter
from app.models.schemas import (
    StyleAnalysisRequest, StyleAnalysisResponse,
    OutfitSuggestionRequest, OutfitSuggestionResponse,
    ColorMatchRequest, ColorMatchResponse,
    TrendScoreRequest, TrendScoreResponse,
    ChatRequest, ChatResponse,
)
from app.utils.style_engine import StyleEngine
from app.utils.color_engine import ColorEngine
from app.utils.trend_engine import TrendEngine

router = APIRouter()
style_engine = StyleEngine()
color_engine = ColorEngine()
trend_engine = TrendEngine()


@router.post("/analyze-style", response_model=StyleAnalysisResponse)
async def analyze_style(req: StyleAnalysisRequest):
    """Analyze the style attributes of a product"""
    return style_engine.analyze(
        product_name=req.product_name,
        category=req.category,
        description=req.description,
        color=req.color,
        retailer=req.retailer,
    )


@router.post("/outfit-suggest", response_model=OutfitSuggestionResponse)
async def suggest_outfit(req: OutfitSuggestionRequest):
    """Generate outfit suggestions for an occasion"""
    return style_engine.suggest_outfit(
        occasion=req.occasion,
        gender=req.gender,
        budget=req.budget,
        style_preference=req.style_preference,
        existing_items=req.existing_items,
    )


@router.post("/color-match", response_model=ColorMatchResponse)
async def match_colors(req: ColorMatchRequest):
    """Get color palette recommendations"""
    return color_engine.match(
        primary_color=req.primary_color,
        style=req.style,
    )


@router.post("/trend-score", response_model=TrendScoreResponse)
async def score_trend(req: TrendScoreRequest):
    """Score how trendy/timeless a product is"""
    return trend_engine.score(
        product_name=req.product_name,
        category=req.category,
    )
@router.post("/chat", response_model=ChatResponse)
async def chat_stylist(req: ChatRequest):
    """General fashion stylist chat conversation"""
    return style_engine.chat(
        message=req.message,
        history=req.history,
        product_context=req.product_context,
    )
