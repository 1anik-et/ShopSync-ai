"""
ShopSync AI Engine — FastAPI Application
Provides advanced AI styling recommendations, outfit analysis,
and intelligent fashion search powered by NLP.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

from app.api.routes import router as api_router

app = FastAPI(
    title="ShopSync AI Engine",
    description="Advanced fashion AI for styling recommendations, outfit analysis, and size prediction",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/ai")

@app.get("/")
async def root():
    return {
        "service": "ShopSync AI Engine",
        "status": "running",
        "endpoints": [
            "POST /ai/analyze-style",
            "POST /ai/outfit-suggest",
            "POST /ai/color-match",
            "POST /ai/trend-score",
        ],
    }

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai-engine"}
