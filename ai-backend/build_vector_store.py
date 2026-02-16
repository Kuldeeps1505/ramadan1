"""
FIXED: Build Vector Store for RAG
Uses correct embedding model name
"""

import os
import json
from pathlib import Path
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS

load_dotenv()

print("="*60)
print("BUILDING RAG VECTOR STORE")
print("="*60)

# --- Load Knowledge Base ---
print("\n[1/5] Loading knowledge base...")

kb_path = Path("islamic_knowledge_base.json")

if not kb_path.exists():
    print(f"✗ ERROR: {kb_path} not found!")
    print("Please make sure islamic_knowledge_base.json is in the same directory")
    exit(1)

with open(kb_path, 'r', encoding='utf-8') as f:
    knowledge_data = json.load(f)

print(f"✓ Loaded {len(knowledge_data)} knowledge entries")

# --- Prepare Text ---
print("\n[2/5] Preparing texts for embeddings...")

texts = []
metadatas = []

for entry in knowledge_data:
    text = f"Topic: {entry['topic']}\nQuestion: {entry['question']}\nAnswer: {entry['answer']}"
    texts.append(text)
    
    metadatas.append({
        "topic": entry['topic'],
        "question": entry['question']
    })

print(f"✓ Prepared {len(texts)} texts")

# --- Create Embeddings with CORRECT model name ---
print("\n[3/5] Creating embeddings...")

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("✗ ERROR: GEMINI_API_KEY not found in .env file")
    exit(1)

try:
    # FIXED: Use correct model name
    # Options: "models/embedding-001" or "models/text-embedding-004"
    # We'll try both
    
    print("Trying embedding model: models/gemini-embedding-001")
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",  # ← FIXED: This is the correct one
        google_api_key=api_key
    )
    
    # Test if it works
    test_embed = embeddings.embed_query("test")
    print(f"✓ Embeddings model initialized (dimension: {len(test_embed)})")
    
except Exception as e:
    print(f"✗ ERROR with models/embedding-001: {e}")
    print("\nTrying alternative: models/text-embedding-004")
    
    try:
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004",
            google_api_key=api_key
        )
        test_embed = embeddings.embed_query("test")
        print(f"✓ Embeddings model initialized (dimension: {len(test_embed)})")
    except Exception as e2:
        print(f"✗ ERROR: {e2}")
        print("\nPlease check your Gemini API key and internet connection")
        exit(1)

# --- Build Vector Store ---
print("\n[4/5] Building FAISS vector store (this may take 30-60 seconds)...")

try:
    vector_store = FAISS.from_texts(
        texts=texts,
        embedding=embeddings,
        metadatas=metadatas
    )
    print("✓ Vector store created successfully!")
    
    # Save for later use
    save_path = "faiss_islamic_kb"
    vector_store.save_local(save_path)
    print(f"✓ Vector store saved to '{save_path}' folder")
    
except Exception as e:
    print(f"✗ ERROR building vector store: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# --- Test Similarity Search ---
print("\n[5/5] Testing similarity search...")

test_queries = [
    "What is Ayat al-Kursi?",
    "How do I perform wudu?",
    "Tell me about Laylatul Qadr"
]

print("\nRunning test searches:\n")

for query in test_queries:
    print(f"Query: '{query}'")
    
    results = vector_store.similarity_search(query, k=2)
    
    print(f"Found {len(results)} relevant results:")
    for i, doc in enumerate(results, 1):
        topic = doc.metadata.get('topic', 'Unknown')
        question = doc.metadata.get('question', 'Unknown')
        print(f"  {i}. [{topic}] {question}")
    print()


































