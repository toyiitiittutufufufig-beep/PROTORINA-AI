# ============================================
# PROTORINA AI - Memory
# ============================================

import json
import os

def load_memory(path):
    """حمّل الذاكرة من الملف"""
    if os.path.exists(path):
        try:
            with open(path, encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return {"developer": [], "users": {}}

def save_memory(path, mem):
    """احفظ الذاكرة في الملف"""
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(mem, f, ensure_ascii=False, indent=2)

def get_history(mem, user_id, is_dev, limit=10):
    """جيب آخر الرسائل من الذاكرة"""
    if is_dev:
        return mem.get("developer", [])[-limit:]
    return mem.get("users", {}).get(user_id, [])[-limit:]

def add_entry(path, mem, user_id, is_dev, user_msg, ai_reply):
    """ضيف رسالة جديدة للذاكرة"""
    entry = {"user": user_msg, "ai": ai_reply}
    
    if is_dev:
        mem.setdefault("developer", []).append(entry)
        mem["developer"] = mem["developer"][-50:]
    else:
        mem.setdefault("users", {})
        mem["users"].setdefault(user_id, []).append(entry)
        mem["users"][user_id] = mem["users"][user_id][-20:]
    
    save_memory(path, mem)