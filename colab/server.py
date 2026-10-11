# ============================================
# PROTORINA AI - Server
# ============================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os

# ضيف المسار الحالي
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai_core import chat

app = FastAPI(title="PROTORINA AI")

# اسمح للمتصفحات بالاتصال
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== نماذج البيانات =====
class ChatRequest(BaseModel):
    user_id: str
    message: str

class ChatResponse(BaseModel):
    reply: str

# ===== المسارات =====
@app.get("/")
def root():
    return {
        "status": "ok",
        "name": "PROTORINA AI",
        "message": "السيرفر شغال ✅"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    """نقطة الاتصال الرئيسية للمحادثة"""
    reply = chat(req.user_id, req.message)
    return ChatResponse(reply=reply)