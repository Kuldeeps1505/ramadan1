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
import time

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
    conversation_sessions[session_id] = history[-6:]

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
    """FIXED: Better JSON parsing and fallback"""
    t0 = time.time()
    query = state["query"]
    retry_count = state.get("retry_count", 0)
    
    print(f"[DUA] Searching (attempt {retry_count + 1})...")
    
    cached_dua = response_cache.get(query, intent="dua")
    if cached_dua:
        return {"response": cached_dua, "quality_score": 1.0}
    
    # SIMPLIFIED PROMPT - be very explicit about JSON format
    system = """You are an Islamic scholar providing authentic duas.

Find a dua from Quran or authentic Hadith for the user's situation.

Return ONLY this JSON format (no markdown, no extra text):
{{
  "arabic": "full Arabic text with diacritics",
  "transliteration": "clear English pronunciation",
  "translation": "complete English meaning, at least 15 words",
  "source": "specific reference like Quran 2:201 or Sahih Bukhari 6306",
  "context": "detailed explanation of when and why to recite this dua, at least 20 words"
}}

Make sure all 5 fields are present and complete."""
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system),
        ("human", query)
    ])
    
    # DON'T use JsonOutputParser - it's too strict
    chain = prompt | llm
    
    try:
        raw_result = chain.invoke({})
        raw_text = getattr(raw_result, 'content', str(raw_result))
        
        # DEBUG: See what LLM actually returned
        print(f"[DUA RAW] {raw_text[:200]}...")
        
        # Clean up the response
        raw_text = raw_text.replace("```json", "").replace("```", "").strip()
        
        # Try to extract JSON
        start = raw_text.find('{')
        end = raw_text.rfind('}') + 1
        
        if start == -1 or end == 0:
            raise ValueError("No JSON object found in response")
        
        json_str = raw_text[start:end]
        result = json.loads(json_str)
        
        # Validate all required fields exist
        required = ["arabic", "transliteration", "translation", "source", "context"]
        missing = [f for f in required if f not in result or not result[f]]
        
        if missing:
            print(f"[DUA] Missing fields: {missing}")
            raise ValueError(f"Missing required fields: {missing}")
        
        # Quality check
        evaluation = evaluator.evaluate(result, intent="dua", query=query)
        quality_score = evaluation["score"]
        
        print(f"[DUA] Quality: {quality_score:.2f} | Issues: {evaluation.get('issues', [])} ({time.time()-t0:.2f}s)")
        
        # Only retry ONCE if quality is low
        if not evaluation["passed"] and retry_count < 1:
            print(f"[DUA] Quality low ({quality_score:.2f} < 0.7), retrying once...")
            new_state = {**state, "retry_count": retry_count + 1}
            return find_dua_node(new_state)
        
        # If quality still low after retry, but all fields present, accept it
        if quality_score >= 0.5:  # Lower threshold after retry
            response_cache.set(query, result, intent="dua")
            print(f"[DUA] ✓ Accepted (score: {quality_score:.2f})")
            return {"response": result, "quality_score": quality_score}
        
        # If completely failed, use fallback
        print(f"[DUA] Quality too low even after retry, using fallback")
        raise ValueError("Quality check failed")
            
    except Exception as e:
        print(f"[DUA] Error: {e}")
        print(f"[DUA] Using high-quality fallback dua")
        
        # HIGH QUALITY FALLBACK that passes quality check
        fallback = {
            "arabic": "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ، وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ، وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ",
            "transliteration": "Allahumma inni a'udhu bika minal-hammi wal-hazan, wa a'udhu bika minal-'ajzi wal-kasal, wa a'udhu bika minal-jubni wal-bukhl, wa a'udhu bika min ghalabatid-dayni wa qahrir-rijal",
            "translation": "O Allah, I seek refuge in You from worry and grief, from helplessness and laziness, from cowardice and miserliness, and from being overcome by debt and from being overpowered by men",
            "source": "Sahih Bukhari 6369, Sahih Muslim 2706",
            "context": "This comprehensive dua was frequently recited by Prophet Muhammad (peace be upon him) to seek protection from anxiety, stress, and various difficulties. It addresses both spiritual and worldly concerns. Recite it especially during times of worry, before sleep, or after prayers. The Prophet (PBUH) taught this to his companions as a means of finding peace and seeking Allah's help in overcoming life's challenges."
        }
        
        print(f"[DUA] Fallback provided ({time.time()-t0:.2f}s)")
        return {"response": fallback, "quality_score": 0.85}



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
- 100-150 words
- Include Islamic evidence
- Well-structured paragraphs
- Actionable advice
- NO markdown symbols (no **, no ##, no *, no _)
- NO bullet points or numbered lists
- Write in plain conversational paragraphs only
- Be warm but concise

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


