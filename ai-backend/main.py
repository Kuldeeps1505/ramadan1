"""
Main FastAPI Application with Cache Management (RAG removed)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Hafiz AI API",
    description="Islamic AI Assistant with Memory and Caching",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
from routers.chat import router as chat_router
from routers.cache import router as cache_router  # Cache endpoints

# Include routers
app.include_router(chat_router)
app.include_router(cache_router)

@app.get("/")
async def root():
    return {
        "message": "Hafiz AI API",
        "version": "2.0.0",
        "features": [
            "Conversation Memory",
            "Advanced Prompting",
            "Response Caching"
        ],
        "endpoints": {
            "chat": "/chat/",
            "cache_stats": "/cache/stats",
            "cache_invalidate": "/cache/invalidate",
            "cache_health": "/cache/health"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "api": "running",
        "features": {
            "memory": True,
            "caching": True,
            "advanced_prompting": True
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

