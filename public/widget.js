/**
 * Smart Chat Assistant - Embeddable Widget
 * Usage: Add this script to your website with data attributes for configuration
 * 
 * Example:
 * <script
 *   src="https://your-domain.com/widget.js"
 *   data-chatbot-id="your-chatbot-id"
 *   data-api-base="https://api.your-domain.com"
 *   data-position="bottom-right"
 *   data-color="#4f46e5"
 *   data-lang="vi"
 * ></script>
 */

(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.__SmartChatWidget) return;
  window.__SmartChatWidget = true;

  // Get configuration from script tag
  const currentScript = document.currentScript;
  const config = {
    chatbotId: currentScript?.getAttribute('data-chatbot-id') || '',
    widgetOrigin: currentScript?.getAttribute('data-widget-origin') || '',
    apiBase: currentScript?.getAttribute('data-api-base') || '',
    position: currentScript?.getAttribute('data-position') || 'bottom-right',
    primaryColor: currentScript?.getAttribute('data-color') || '#4f46e5',
    lang: currentScript?.getAttribute('data-lang') || 'vi'
  };

  // Translations
  const i18n = {
    vi: {
      title: 'Hỗ trợ khách hàng',
      placeholder: 'Nhập tin nhắn...',
      send: 'Gửi',
      greeting: 'Xin chào! Tôi có thể giúp gì cho bạn?',
      error: 'Có lỗi xảy ra. Vui lòng thử lại.',
      connecting: 'Đang kết nối...'
    },
    en: {
      title: 'Customer Support',
      placeholder: 'Type a message...',
      send: 'Send',
      greeting: 'Hello! How can I help you?',
      error: 'An error occurred. Please try again.',
      connecting: 'Connecting...'
    }
  };

  const t = i18n[config.lang] || i18n.vi;

  // Storage keys (unique per chatbot)
  const STORAGE_KEY_CONVERSATION = `scw_conversation_${config.chatbotId}`;
  const STORAGE_KEY_VISITOR = `scw_visitor_${config.chatbotId}`;

  // Generate or retrieve visitor ID
  function getVisitorId() {
    let visitorId = localStorage.getItem(STORAGE_KEY_VISITOR);
    if (!visitorId) {
      visitorId = 'visitor-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem(STORAGE_KEY_VISITOR, visitorId);
    }
    return visitorId;
  }

  // State
  let isOpen = false;
  let conversationId = localStorage.getItem(STORAGE_KEY_CONVERSATION) || null;
  let visitorId = getVisitorId();
  let messages = [];

  // Create widget styles
  const styles = `
    .scw-widget-container * {
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    }
    
    .scw-widget-button {
      position: fixed;
      ${config.position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
      bottom: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: ${config.primaryColor};
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 999999;
      transform-origin: center center;
    }
    
    .scw-widget-button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 25px rgba(0, 0, 0, 0.25);
    }
    
    .scw-widget-button svg {
      width: 28px;
      height: 28px;
      fill: white;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    
    .scw-widget-button.scw-hidden {
      opacity: 0;
      transform: scale(0);
      pointer-events: none;
    }
    
    .scw-chat-window {
      position: fixed;
      ${config.position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
      bottom: 20px;
      width: 380px;
      height: 520px;
      max-height: calc(100vh - 40px);
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 999998;
      transform-origin: ${config.position === 'bottom-left' ? 'left bottom' : 'right bottom'};
      opacity: 0;
      transform: scale(0.15);
      pointer-events: none;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .scw-chat-window.scw-open {
      opacity: 1;
      transform: scale(1);
      pointer-events: auto;
    }
    
    .scw-chat-window.scw-closing {
      opacity: 0;
      transform: scale(0.15);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .scw-chat-header {
      background: ${config.primaryColor};
      color: white;
      padding: 16px 20px;
      font-weight: 600;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    
    .scw-close-btn {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.8;
      transition: opacity 0.2s;
    }
    
    .scw-close-btn:hover {
      opacity: 1;
    }
    
    .scw-close-btn svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }
    
    .scw-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #f8f9fa;
    }
    
    .scw-message {
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
    }
    
    .scw-message.scw-bot {
      background: white;
      color: #333;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
    
    .scw-message.scw-user {
      background: ${config.primaryColor};
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    
    .scw-message.scw-typing {
      background: white;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    
    .scw-typing-dots {
      display: flex;
      gap: 4px;
    }
    
    .scw-typing-dots span {
      width: 8px;
      height: 8px;
      background: #999;
      border-radius: 50%;
      animation: scw-bounce 1.4s infinite ease-in-out both;
    }
    
    .scw-typing-dots span:nth-child(1) { animation-delay: -0.32s; }
    .scw-typing-dots span:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes scw-bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
    
    .scw-input-area {
      padding: 16px;
      background: white;
      border-top: 1px solid #e9ecef;
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
    
    .scw-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #e0e0e0;
      border-radius: 24px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    
    .scw-input:focus {
      border-color: ${config.primaryColor};
    }
    
    .scw-send-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: ${config.primaryColor};
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s, transform 0.2s;
    }
    
    .scw-send-btn:hover {
      opacity: 0.9;
      transform: scale(1.05);
    }
    
    .scw-send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    
    .scw-send-btn svg {
      width: 20px;
      height: 20px;
      fill: white;
    }
    
    @media (max-width: 480px) {
      .scw-chat-window {
        width: calc(100vw - 20px);
        height: calc(100vh - 40px);
        ${config.position === 'bottom-left' ? 'left: 10px;' : 'right: 10px;'}
        bottom: 16px;
        border-radius: 12px;
      }
      
      .scw-widget-button {
        width: 56px;
        height: 56px;
        ${config.position === 'bottom-left' ? 'left: 16px;' : 'right: 16px;'}
        bottom: 16px;
      }
    }
  `;

  // Create widget HTML
  function createWidget() {
    // Add styles
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    // Create container
    const container = document.createElement('div');
    container.className = 'scw-widget-container';
    container.innerHTML = `
      <button class="scw-widget-button" id="scw-toggle-btn" aria-label="Open chat">
        <svg viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        </svg>
      </button>
      
      <div class="scw-chat-window" id="scw-chat-window">
        <div class="scw-chat-header">
          <span>${t.title}</span>
          <button class="scw-close-btn" id="scw-close-btn" aria-label="Close chat">
            <svg viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <div class="scw-messages" id="scw-messages"></div>
        <div class="scw-input-area">
          <input 
            type="text" 
            class="scw-input" 
            id="scw-input" 
            placeholder="${t.placeholder}"
            autocomplete="off"
          />
          <button class="scw-send-btn" id="scw-send-btn" aria-label="${t.send}">
            <svg viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // Bind events
    const toggleBtn = document.getElementById('scw-toggle-btn');
    const closeBtn = document.getElementById('scw-close-btn');
    const chatWindow = document.getElementById('scw-chat-window');
    const input = document.getElementById('scw-input');
    const sendBtn = document.getElementById('scw-send-btn');

    toggleBtn.addEventListener('click', () => toggleChat());
    closeBtn.addEventListener('click', () => toggleChat(false));
    sendBtn.addEventListener('click', () => sendMessage());
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Add initial greeting
    addMessage(t.greeting, 'bot');
  }

  // Toggle chat window
  function toggleChat(state) {
    const chatWindow = document.getElementById('scw-chat-window');
    const toggleBtn = document.getElementById('scw-toggle-btn');
    isOpen = state !== undefined ? state : !isOpen;
    
    if (isOpen) {
      // Hide the button first, then expand chat window
      toggleBtn.classList.add('scw-hidden');
      chatWindow.classList.remove('scw-closing');
      
      // Small delay to allow button to start hiding
      setTimeout(() => {
        chatWindow.classList.add('scw-open');
        // Focus input after animation completes
        setTimeout(() => {
          document.getElementById('scw-input').focus();
        }, 400);
      }, 50);
    } else {
      // Shrink chat window first, then show button
      chatWindow.classList.add('scw-closing');
      chatWindow.classList.remove('scw-open');
      
      // Show button after chat window starts shrinking
      setTimeout(() => {
        toggleBtn.classList.remove('scw-hidden');
      }, 200);
    }
  }

  // Add message to chat
  function addMessage(text, type) {
    const messagesEl = document.getElementById('scw-messages');
    const messageEl = document.createElement('div');
    messageEl.className = `scw-message scw-${type}`;
    messageEl.textContent = text;
    messagesEl.appendChild(messageEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    
    messages.push({ text, type });
  }

  // Show typing indicator
  function showTyping() {
    const messagesEl = document.getElementById('scw-messages');
    const typingEl = document.createElement('div');
    typingEl.className = 'scw-message scw-typing';
    typingEl.id = 'scw-typing';
    typingEl.innerHTML = `
      <div class="scw-typing-dots">
        <span></span><span></span><span></span>
      </div>
    `;
    messagesEl.appendChild(typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // Hide typing indicator
  function hideTyping() {
    const typingEl = document.getElementById('scw-typing');
    if (typingEl) typingEl.remove();
  }

  // Send message to API
  async function sendMessage() {
    const input = document.getElementById('scw-input');
    const sendBtn = document.getElementById('scw-send-btn');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addMessage(message, 'user');
    input.value = '';
    sendBtn.disabled = true;
    
    // Show typing
    showTyping();
    
    try {
      // Build request body according to API spec
      const requestBody = {
        chatbotId: config.chatbotId,
        message: message,
        visitorId: visitorId,
        metadata: {
          page: window.location.pathname,
          url: window.location.href,
          referrer: document.referrer || null
        }
      };
      
      // Include conversation_id if we have one (for context continuity)
      if (conversationId) {
        requestBody.conversation_id = conversationId;
      }

      const response = await fetch(`${config.apiBase}/public/widget/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error('API error');
      }
      
      const data = await response.json();
      
      // Save conversation ID for context (both in memory and localStorage)
      if (data.conversation_id) {
        conversationId = data.conversation_id;
        localStorage.setItem(STORAGE_KEY_CONVERSATION, conversationId);
      }
      
      hideTyping();
      addMessage(data.response || data.message || t.error, 'bot');
      
    } catch (error) {
      console.error('[Smart Chat Widget] Error:', error);
      hideTyping();
      addMessage(t.error, 'bot');
    }
    
    sendBtn.disabled = false;
    input.focus();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }

})();
