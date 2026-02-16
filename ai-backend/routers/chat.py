"""
Chat Router with Session Management for Memory
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Union, List, Dict, Any
import os
import sys
import traceback
import uuid

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from graph import app as graph_app
    print("✓ Graph with memory loaded")
except ImportError as e:
    print(f"✗ Graph import error: {e}")
    graph_app = None

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None  # NEW: Optional session ID

class ChatResponse(BaseModel):
    response: str
    type: str = "text"
    metadata: Optional[Union[Dict[str, Any], List[Dict[str, Any]]]] = None
    session_id: str  # NEW: Return session ID

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat endpoint with conversation memory
    
    If session_id provided, conversation history is maintained.
    If not provided, a new session is created.
    """
    print(f"\n{'='*50}")
    print(f"Message: {request.message}")
    
    if not graph_app:
        raise HTTPException(
            status_code=500, 
            detail="AI Graph not initialized."
        )
    
    # Generate or use provided session ID
    session_id = request.session_id or str(uuid.uuid4())
    print(f"Session ID: {session_id}")
    print(f"{'='*50}\n")
    
    try:
        # Invoke graph with session ID
        result = graph_app.invoke({
            "query": request.message,
            "session_id": session_id  # NEW: Pass session ID
        })
        
        final_output = result.get("final_output", {})
        
        response = {
            "response": final_output.get("content", "I processed your request."),
            "type": final_output.get("type", "text"),
            "metadata": final_output.get("metadata", None),
            "session_id": session_id  # NEW: Return session ID
        }
        
        print(f"Response type: {response['type']}")
        print(f"Session: {session_id}\n")
        
        return response
        
    except Exception as e:
        print(f"\n✗ ERROR: {str(e)}")
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500, 
            detail=f"Error: {str(e)}"
        )

# NEW: Get conversation history endpoint
@router.get("/session/{session_id}/history")
async def get_session_history(session_id: str):
    """
    Get conversation history for a session
    """
    from graph import get_conversation_history
    
    history = get_conversation_history(session_id)
    
    return {
        "session_id": session_id,
        "message_count": len(history),
        "messages": history
    }

# NEW: Clear session endpoint
@router.delete("/session/{session_id}")
async def clear_session(session_id: str):
    """
    Clear conversation history for a session
    """
    from graph import conversation_sessions
    
    if session_id in conversation_sessions:
        del conversation_sessions[session_id]
        return {"message": f"Session {session_id} cleared", "success": True}
    else:
        return {"message": f"Session {session_id} not found", "success": False}