# ============================================
# PROTORINA AI - Core
# ============================================

import requests
from config import *
from prompts import DEVELOPER_PROMPT, NORMAL_PROMPT
from memory import load_memory, save_memory, get_history, add_entry

def chat(user_id, text):
    """الدالة الرئيسية للمحادثة"""
    
    # 1. حمّل الذاكرة
    mem = load_memory(MEMORY_FILE)
    
    # 2. هل المستخدم مطور؟
    is_dev = text.startswith(DEVELOPER_KEY)
    if is_dev:
        text = text.replace(DEVELOPER_KEY, "").strip()
        system = DEVELOPER_PROMPT
    else:
        system = NORMAL_PROMPT
    
    # 3. جيب السياق من الذاكرة
    history = get_history(mem, user_id, is_dev)
    
    # 4. جهز الرسائل
    messages = [{"role": "system", "content": system}]
    for h in history:
        messages.append({"role": "user", "content": h["user"]})
        messages.append({"role": "assistant", "content": h["ai"]})
    messages.append({"role": "user", "content": text})
    
    # 5. اطلب من Ollama
    try:
        r = requests.post(OLLAMA_URL, json={
            "model": MODEL_NAME,
            "messages": messages,
            "stream": False
        }, timeout=120)
        
        if r.status_code != 200:
            return f"⚠️ خطأ من Ollama: {r.status_code}"
        
        reply = r.json()["message"]["content"]
    except requests.exceptions.Timeout:
        return "⚠️ الموديل خد وقت طويل في الرد. جرب تاني."
    except Exception as e:
        return f"⚠️ خطأ: {str(e)}"
    
    # 6. خزّن في الذاكرة
    add_entry(MEMORY_FILE, mem, user_id, is_dev, text, reply)
    
    return reply