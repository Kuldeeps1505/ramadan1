"""
Graph with Memory + Caching + QUALITY EVALUATION (RAG removed)
"""

from typing import TypedDict, Dict, Any, List, Optional
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_community.vectorstores import FAISS
import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime
import hashlib
import json

# Import quality evaluator
from response_evaluator import evaluator

load_dotenv()

# --- State Definition (add quality tracking) ---
class AgentState(TypedDict):
    query: str
    session_id: str
    intent: str
    response: Dict[str, Any]
    final_output: Dict[str, Any]
    conversation_history: List[Dict[str, str]]
    quality_score: Optional[float]  # Track quality
    retry_count: int  # Track retries

# --- LLM Setup ---
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY not found in .env")

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.3,
    google_api_key=api_key
)

print("✓ LLM initialized")

# --- Cache Setup ---
class SimpleCache:
    def __init__(self):
        self.cache = {}
        self.stats = {"hits": 0, "misses": 0}
    
    def _make_key(self, query: str, intent: str = "") -> str:
        return hashlib.md5(f"{intent}:{query.lower().strip()}".encode()).hexdigest()
    
    def get(self, query: str, intent: str = "") -> Optional[Dict[str, Any]]:
        key = self._make_key(query, intent)
        if key in self.cache:
            self.stats["hits"] += 1
            print(f"[CACHE] ✓ HIT")
            return self.cache[key]
        self.stats["misses"] += 1
        print(f"[CACHE] ✗ MISS")
        return None
    
    def set(self, query: str, data: Dict[str, Any], intent: str = ""):
        key = self._make_key(query, intent)
        self.cache[key] = data
        print(f"[CACHE] 💾 STORED")

response_cache = SimpleCache()

# --- Session Store ---
conversation_sessions = {}

def get_conversation_history(session_id: str) -> List[Dict[str, str]]:
    return conversation_sessions.get(session_id, [])

def save_conversation_history(session_id: str, history: List[Dict[str, str]]):
    conversation_sessions[session_id] = history[-10:]

# --- Nodes ---
def load_memory_node(state: AgentState):
    session_id = state.get("session_id", "default")
    history = get_conversation_history(session_id)
    print(f"[MEMORY] Loaded {len(history)} messages")
    return {"conversation_history": history, "retry_count": 0}

def analyzer_node(state: AgentState):
    query = state["query"]
    print(f"\n[ANALYZER] Query: {query}")
    
    cached_intent = response_cache.get(query, intent="analyzer")
    if cached_intent:
        return {"intent": cached_intent["intent"]}
    
    system = """Classify into: dua, ask_hafiz, or watch
Return: {{"intent": "dua" | "ask_hafiz" | "watch"}}"""
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system),
        ("human", "{query}")
    ])
    
    chain = prompt | llm | JsonOutputParser()
    
    try:
        result = chain.invoke({"query": query})
        intent = result.get("intent", "ask_hafiz")
        response_cache.set(query, {"intent": intent}, intent="analyzer")
        print(f"[ANALYZER] Intent: {intent}")
        return {"intent": intent}
    except Exception as e:
        print(f"[ANALYZER] Error: {e}")
        return {"intent": "ask_hafiz"}

# --- Dua Node ---
def find_dua_node(state: AgentState):
    query = state["query"]
    retry_count = state.get("retry_count", 0)
    
    print(f"[DUA] Searching (attempt {retry_count + 1})...")
    
    cached_dua = response_cache.get(query, intent="dua")
    if cached_dua:
        return {"response": cached_dua, "quality_score": 1.0}
    
    emphasis = ""
    if retry_count > 0:
        emphasis = "\n\n**IMPORTANT**: Previous response had quality issues. Please ensure full Arabic, transliteration, translation, source, and context."
    
    system = f"""You are an Islamic scholar specializing in Duas.

QUALITY REQUIREMENTS:
✅ Arabic: Accurate & complete with proper diacritics
✅ Transliteration: Clear and detailed
✅ Translation: Full meaning (15+ words)
✅ Source: Specific (Quran X:Y or Hadith reference)
✅ Context: Detailed explanation (20+ words)

{emphasis}

Return JSON with ALL 5 fields complete.
"""
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system),
        ("human", query)
    ])
    
    chain = prompt | llm | JsonOutputParser()
    
    try:
        result = chain.invoke({})
        evaluation = evaluator.evaluate(result, intent="dua", query=query)
        quality_score = evaluation["score"]
        
        print(f"[DUA] Quality Score: {quality_score:.2f} (threshold: {evaluation['threshold']})")
        
        if not evaluation["passed"] and retry_count < 2:
            new_state = {**state, "retry_count": retry_count + 1}
            return find_dua_node(new_state)
        
        if evaluation["passed"]:
            response_cache.set(query, result, intent="dua")
        
        return {"response": result, "quality_score": quality_score}
            
    except Exception as e:
        print(f"[DUA] Error: {e}")
        return {"response": {
            "arabic": "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً",
            "transliteration": "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan",
            "translation": "Our Lord, give us good in this world and the Hereafter",
            "source": "Quran 2:201",
            "context": "Comprehensive dua for all situations"
        }, "quality_score": 0.7}

# --- Ask Hafiz Node ---
def ask_hafiz_with_memory(state: AgentState):
    query = state["query"]
    history = state.get("conversation_history", [])
    retry_count = state.get("retry_count", 0)
    
    print(f"[HAFIZ] Answering (attempt {retry_count + 1}, history: {len(history)})")
    
    if not history:
        cached_response = response_cache.get(query, intent="ask_hafiz")
        if cached_response:
            return {"response": cached_response, "quality_score": 1.0}
    
    quality_reminder = ""
    if retry_count > 0:
        quality_reminder = "\n\nQUALITY IMPROVEMENT NEEDED: Previous response had issues. Include evidence, 2-3 paragraphs, practical advice."
    
    system = f"""You are 'Hafiz' - warm, knowledgeable Islamic companion.

RESPONSE STRUCTURE:
1. Greeting
2. Acknowledge question
3. Core answer with evidence (Quran/Hadith)
4. Practical guidance
5. Gentle closing

QUALITY CRITERIA:
- 100-400 words
- Include Islamic evidence
- Well-structured paragraphs
- Actionable advice
- Address query directly

{quality_reminder}

Return valid JSON with single text field containing your complete response.
"""
    
    messages = [("system", system)]
    
    for msg in history[-8:]:
        role = "human" if msg["role"] == "user" else "assistant"
        content = msg["content"].replace("{", "{{").replace("}", "}}")
        messages.append((role, content))
    
    messages.append(("human", query))
    
    prompt = ChatPromptTemplate.from_messages(messages)
    chain = prompt | llm
    
    try:
        raw_result = chain.invoke({})
        text = getattr(raw_result, 'content', str(raw_result))
        if '{"text":' in text:
            start = text.find('{')
            end = text.rfind('}') + 1
            result = json.loads(text[start:end])
        else:
            result = {"text": text}
        
        evaluation = evaluator.evaluate(result, intent="ask_hafiz", query=query)
        quality_score = evaluation["score"]
        
        if not evaluation["passed"] and retry_count < 1 and not history:
            new_state = {**state, "retry_count": retry_count + 1}
            return ask_hafiz_with_memory(new_state)
        
        if evaluation["passed"] and not history:
            response_cache.set(query, result, intent="ask_hafiz")
        
        return {"response": result, "quality_score": quality_score}
    except Exception as e:
        print(f"[HAFIZ] Error: {e}")
        return {"response": {"text": "I apologize, I'm momentarily unable to respond."}, "quality_score": 0.0}

# --- Video Node ---
def watch_node(state: AgentState):
    query = state["query"]
    retry_count = state.get("retry_count", 0)
    
    print(f"[WATCH] Searching (attempt {retry_count + 1})...")
    
    cached_videos = response_cache.get(query, intent="watch")
    if cached_videos:
        return {"response": cached_videos, "quality_score": 1.0}
    
    emphasis = ""
    if retry_count > 0:
        emphasis = "\n\nIMPROVE QUALITY: Return exactly 3 videos with detailed titles, approved channels only."
    
    system = f"""Islamic content curator.

TRUSTED CHANNELS ONLY:
- Yaqeen Institute
- Bayyinah Institute
- Mufti Menk
- Omar Suleiman
- Nouman Ali Khan

{emphasis}

Return EXACTLY 3 videos with title, channel, thumbnail, duration as JSON array 'videos'.
"""
    
    prompt = ChatPromptTemplate.from_messages([("system", system), ("human", "{query}")])
    chain = prompt | llm | JsonOutputParser()
    
    try:
        result = chain.invoke({"query": query})
        evaluation = evaluator.evaluate(result, intent="watch", query=query)
        quality_score = evaluation["score"]
        
        if not evaluation["passed"] and retry_count < 1:
            new_state = {**state, "retry_count": retry_count + 1}
            return watch_node(new_state)
        
        if evaluation["passed"]:
            response_cache.set(query, result, intent="watch")
        
        return {"response": result, "quality_score": quality_score}
    except Exception as e:
        print(f"[WATCH] Error: {e}")
        return {"response": {"videos": []}, "quality_score": 0.0}

# --- Memory Update & Finalizer ---
def update_memory_node(state: AgentState):
    session_id = state.get("session_id", "default")
    query = state["query"]
    response = state.get("response", {})
    history = state.get("conversation_history", [])
    
    history.append({"role": "user", "content": query, "timestamp": datetime.now().isoformat()})
    
    if "text" in response:
        history.append({"role": "assistant", "content": response["text"], "timestamp": datetime.now().isoformat()})
    
    save_conversation_history(session_id, history)
    return {"conversation_history": history}

def finalizer_node(state: AgentState):
    intent = state.get("intent", "ask_hafiz")
    raw_response = state.get("response", {})
    quality_score = state.get("quality_score", 0.0)
    
    if intent == "dua":
        return {"final_output": {
            "type": "dua_card",
            "content": "Here is a Dua:",
            "metadata": {**raw_response, "_quality_score": quality_score}
        }}
    elif intent == "watch":
        videos = raw_response.get("videos", [])
        return {"final_output": {
            "type": "video_card",
            "content": "Here are videos:" if videos else "No videos.",
            "metadata": videos
        }}
    else:
        return {"final_output": {
            "type": "text",
            "content": raw_response.get("text", "I'm here to help."),
            "metadata": {"_quality_score": quality_score}
        }}

# --- Build Graph ---
workflow = StateGraph(AgentState)

workflow.add_node("load_memory", load_memory_node)
workflow.add_node("analyzer", analyzer_node)
workflow.add_node("find_dua", find_dua_node)
workflow.add_node("ask_hafiz", ask_hafiz_with_memory)
workflow.add_node("watch", watch_node)
workflow.add_node("update_memory", update_memory_node)
workflow.add_node("finalizer", finalizer_node)

workflow.set_entry_point("load_memory")
workflow.add_edge("load_memory", "analyzer")

workflow.add_conditional_edges(
    "analyzer",
    lambda state: state.get("intent", "ask_hafiz"),
    {"dua": "find_dua", "ask_hafiz": "ask_hafiz", "watch": "watch"}
)

workflow.add_edge("find_dua", "update_memory")
workflow.add_edge("ask_hafiz", "update_memory")
workflow.add_edge("watch", "update_memory")
workflow.add_edge("update_memory", "finalizer")
workflow.add_edge("finalizer", END)

app = workflow.compile()

print("\n" + "="*60)
print("✓ QUALITY EVALUATION ENABLED (RAG REMOVED)")
print("  - Automatic quality scoring")
print("  - Retry logic for low-quality responses")
print("  - Quality thresholds: Dua=70%, Text=60%, Video=50%")
print("="*60 + "\n")
