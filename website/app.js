// ============================================
// PROTORINA AI - Main App
// ============================================

// الحالة العامة
let state = {
    username: null,
    chats: {},       // { chatId: { title, messages: [] } }
    activeChat: null
};

// ===== تسجيل الدخول =====
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app');
const usernameInput = document.getElementById('username-input');
const loginBtn = document.getElementById('login-btn');
const userDisplay = document.getElementById('user-display');
const logoutBtn = document.getElementById('logout-btn');

loginBtn.addEventListener('click', login);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') login();
});

function login() {
    const name = usernameInput.value.trim();
    if (!name) {
        usernameInput.style.borderColor = '#ef4444';
        setTimeout(() => usernameInput.style.borderColor = '', 1000);
        return;
    }
    
    state.username = name;
    userDisplay.textContent = name;
    
    // احفظ الاسم
    localStorage.setItem('protorina_username', name);
    
    // حمّل المحادثات القديمة
    loadChats();
    
    // انتقل للتطبيق
    loginScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    
    // لو مفيش محادثات، اعمل واحدة
    if (Object.keys(state.chats).length === 0) {
        createNewChat();
    } else {
        // افتح آخر محادثة
        const lastChatId = localStorage.getItem('protorina_last_chat');
        if (lastChatId && state.chats[lastChatId]) {
            openChat(lastChatId);
        } else {
            openChat(Object.keys(state.chats)[0]);
        }
    }
}

logoutBtn.addEventListener('click', () => {
    if (confirm('متأكد عايز تخرج؟')) {
        localStorage.removeItem('protorina_username');
        location.reload();
    }
});

// ===== إدارة المحادثات =====
const newChatBtn = document.getElementById('new-chat-btn');
const chatList = document.getElementById('chat-list');

newChatBtn.addEventListener('click', createNewChat);

function createNewChat() {
    const id = 'chat_' + Date.now();
    state.chats[id] = {
        title: 'محادثة جديدة',
        messages: []
    };
    saveChats();
    renderChatList();
    openChat(id);
}

function openChat(id) {
    state.activeChat = id;
    localStorage.setItem('protorina_last_chat', id);
    renderChatList();
    renderMessages();
}

function deleteChat(id, e) {
    e.stopPropagation();
    if (!confirm('مسح المحادثة؟')) return;
    delete state.chats[id];
    saveChats();
    
    if (state.activeChat === id) {
        const remaining = Object.keys(state.chats);
        if (remaining.length > 0) {
            openChat(remaining[0]);
        } else {
            createNewChat();
        }
    } else {
        renderChatList();
    }
}

function renderChatList() {
    chatList.innerHTML = '';
    Object.entries(state.chats).forEach(([id, chat]) => {
        const item = document.createElement('div');
        item.className = 'chat-item' + (id === state.activeChat ? ' active' : '');
        item.innerHTML = `
            <span>${escapeHtml(chat.title)}</span>
            <button class="chat-delete" title="حذف">✕</button>
        `;
        item.querySelector('span').onclick = () => openChat(id);
        item.querySelector('.chat-delete').onclick = (e) => deleteChat(id, e);
        chatList.appendChild(item);
    });
}

// ===== حفظ / تحميل =====
function saveChats() {
    localStorage.setItem('protorina_chats', JSON.stringify(state.chats));
}

function loadChats() {
    const saved = localStorage.getItem('protorina_chats');
    if (saved) {
        try {
            state.chats = JSON.parse(saved);
        } catch (e) {
            state.chats = {};
        }
    }
    
    const savedName = localStorage.getItem('protorina_username');
    if (savedName) {
        usernameInput.value = savedName;
    }
}

// ===== عرض الرسائل =====
const messagesEl = document.getElementById('messages');

function renderMessages() {
    const chat = state.chats[state.activeChat];
    if (!chat) return;
    
    messagesEl.innerHTML = '';
    
    if (chat.messages.length === 0) {
        messagesEl.innerHTML = `
            <div class="welcome">
                <div class="logo-welcome">P</div>
                <h3>أهلاً بك في PROTORINA AI</h3>
                <p>ابدأ محادثتك الأولى</p>
            </div>
        `;
        return;
    }
    
    chat.messages.forEach(msg => {
        addMessageToDOM(msg.role, msg.content, false);
    });
    
    scrollToBottom();
}

function addMessageToDOM(role, content, animate = true) {
    // شيل الـ welcome لو موجود
    const welcome = messagesEl.querySelector('.welcome');
    if (welcome) welcome.remove();
    
    const div = document.createElement('div');
    div.className = `message ${role}`;
    if (!animate) div.style.animation = 'none';
    div.textContent = content;
    messagesEl.appendChild(div);
    
    if (animate) scrollToBottom();
}

function addTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'message ai typing';
    div.id = 'typing-indicator';
    div.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
    messagesEl.appendChild(div);
    scrollToBottom();
    return div;
}

function removeTypingIndicator() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
}

function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ===== إرسال الرسائل =====
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendBtn.addEventListener('click', sendMessage);

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;
    
    const chat = state.chats[state.activeChat];
    if (!chat) return;
    
    // ضيف رسالة المستخدم
    chat.messages.push({ role: 'user', content: text });
    addMessageToDOM('user', text);
    
    // لو أول رسالة، خليها عنوان المحادثة
    if (chat.messages.length === 1) {
        chat.title = text.slice(0, 30) + (text.length > 30 ? '...' : '');
        renderChatList();
    }
    
    saveChats();
    
    // فضّي input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    sendBtn.disabled = true;
    
    // typing
    addTypingIndicator();
    
    try {
        const reply = await callAI(text);
        removeTypingIndicator();
        
        chat.messages.push({ role: 'ai', content: reply });
        addMessageToDOM('ai', reply);
        saveChats();
    } catch (err) {
        removeTypingIndicator();
        addMessageToDOM('ai', '⚠️ خطأ في الاتصال: ' + err.message);
    } finally {
        sendBtn.disabled = false;
        messageInput.focus();
    }
}

// ===== الاتصال بالـ AI =====
async function callAI(text) {
    // لو مفيش endpoint متظبط، رجّع رد تجريبي
    if (!CONFIG.AI_ENDPOINT) {
        await new Promise(r => setTimeout(r, 1000));
        return `[رد تجريبي] أهلاً ${state.username}! أنا ${CONFIG.AI_NAME}. لسه محتاجين نربطني بالـ Colab.`;
    }
    
    // ⚠️ هنظبط دي لما نشغل Gradio
    const res = await fetch(`${CONFIG.AI_ENDPOINT}/api/predict`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            data: [text, []]
        })
    });
    
    if (!res.ok) throw new Error('فشل الاتصال');
    const data = await res.json();
    return data.data[0];
}

// ===== أدوات مساعدة =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== تشغيل تلقائي =====
(function init() {
    loadChats();
    const savedName = localStorage.getItem('protorina_username');
    if (savedName) {
        usernameInput.value = savedName;
        // دخول تلقائي
        // login(); // فك التعليق لو عايز دخول تلقائي
    }
    messageInput.focus();
})();
