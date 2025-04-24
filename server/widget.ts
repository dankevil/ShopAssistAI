// Generate JS widget code for embedding on Shopify stores
export function generateWidgetCode(storeId: string): string {
  const script = `
  <script>
    (function(w, d, s, o, f, js, fjs) {
      w['ShopifyAIChatWidget'] = o;
      w[o] = w[o] || function() {
        (w[o].q = w[o].q || []).push(arguments);
      };
      js = d.createElement(s);
      fjs = d.getElementsByTagName(s)[0];
      js.id = o;
      js.src = f;
      js.async = 1;
      fjs.parentNode.insertBefore(js, fjs);
    }(window, document, 'script', 'saiChat', 'https://${process.env.HOST || 'localhost:5000'}/widget.js?id=${storeId}'));
  </script>
  `;
  
  return script.trim();
}

// Generate the widget JS file content
export function generateWidgetJsContent(storeId: string): string {
  return `
  (function() {
    // Configuration
    var config = {
      storeId: "${storeId}",
      position: "right",
      apiUrl: "${process.env.HOST || 'localhost:5000'}/api"
    };
    
    // State
    var chatOpen = false;
    var chatWidget = null;
    var chatButton = null;
    var currentConversation = null;
    
    // Custom options passed by the user
    var customOptions = {};
    
    // Process the command queue
    if (window.saiChat && window.saiChat.q) {
      for (var i = 0; i < window.saiChat.q.length; i++) {
        var args = window.saiChat.q[i];
        var command = args[0];
        
        if (command === 'init' && args[1]) {
          customOptions = args[1];
          if (customOptions.position) {
            config.position = customOptions.position;
          }
        }
      }
    }
    
    // Fetch widget settings from API
    function fetchSettings() {
      return fetch(config.apiUrl + '/widget/' + config.storeId + '/settings')
        .then(function(response) {
          if (!response.ok) throw new Error('Failed to load widget settings');
          return response.json();
        })
        .catch(function(error) {
          console.error('AI Chatbot widget error:', error);
          return {
            brandColor: '#4F46E5',
            chatTitle: 'Chat with us',
            welcomeMessage: 'Hello! How can I help you today?',
            buttonPosition: 'right',
            chatBackgroundType: 'solid',
            chatBackgroundColor: '#f9fafb',
            chatBackgroundGradient: 'linear-gradient(to right, #f9fafb, #f3f4f6)',
            chatBackgroundPattern: '',
            chatBackgroundImage: ''
          };
        });
    }
    
    // Create DOM elements for the widget
    function createWidget(settings) {
      // Use settings or fallback to defaults
      var brandColor = settings.brandColor || '#4F46E5';
      var chatTitle = settings.chatTitle || 'Chat with us';
      var welcomeMessage = settings.welcomeMessage || 'Hello! How can I help you today?';
      var logoUrl = settings.logoUrl;
      var buttonPosition = settings.buttonPosition || config.position;
      
      // Background theme settings
      var chatBackgroundType = settings.chatBackgroundType || 'solid';
      var chatBackgroundColor = settings.chatBackgroundColor || '#f9fafb';
      var chatBackgroundGradient = settings.chatBackgroundGradient || 'linear-gradient(to right, #f9fafb, #f3f4f6)';
      var chatBackgroundPattern = settings.chatBackgroundPattern || '';
      var chatBackgroundImage = settings.chatBackgroundImage || '';
      
      // Create chat button
      chatButton = document.createElement('button');
      chatButton.className = 'ai-chat-button';
      chatButton.setAttribute('aria-label', 'Open chat');
      chatButton.style.position = 'fixed';
      chatButton.style.bottom = '20px';
      chatButton.style[buttonPosition] = '20px';
      chatButton.style.width = '60px';
      chatButton.style.height = '60px';
      chatButton.style.borderRadius = '50%';
      chatButton.style.backgroundColor = brandColor;
      chatButton.style.color = 'white';
      chatButton.style.border = 'none';
      chatButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
      chatButton.style.cursor = 'pointer';
      chatButton.style.zIndex = '10000';
      chatButton.style.display = 'flex';
      chatButton.style.alignItems = 'center';
      chatButton.style.justifyContent = 'center';
      
      chatButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
      
      chatButton.addEventListener('click', toggleChat);
      
      // Create chat widget
      chatWidget = document.createElement('div');
      chatWidget.className = 'ai-chat-widget';
      chatWidget.style.position = 'fixed';
      chatWidget.style.bottom = '100px';
      chatWidget.style[buttonPosition] = '20px';
      chatWidget.style.width = '380px';
      chatWidget.style.height = '500px';
      chatWidget.style.borderRadius = '10px';
      chatWidget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.12)';
      chatWidget.style.overflow = 'hidden';
      chatWidget.style.display = 'none';
      chatWidget.style.flexDirection = 'column';
      chatWidget.style.zIndex = '10001';
      chatWidget.style.backgroundColor = 'white';
      chatWidget.style.transition = 'all 0.3s ease';
      
      // Chat header
      var header = document.createElement('div');
      header.className = 'ai-chat-header';
      header.style.backgroundColor = brandColor;
      header.style.color = 'white';
      header.style.padding = '16px';
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.justifyContent = 'space-between';
      
      var titleContainer = document.createElement('div');
      titleContainer.style.display = 'flex';
      titleContainer.style.alignItems = 'center';
      
      if (logoUrl) {
        var logo = document.createElement('img');
        logo.src = logoUrl;
        logo.style.width = '24px';
        logo.style.height = '24px';
        logo.style.marginRight = '8px';
        logo.style.borderRadius = '50%';
        logo.style.backgroundColor = 'white';
        logo.style.padding = '2px';
        titleContainer.appendChild(logo);
      }
      
      var title = document.createElement('span');
      title.textContent = chatTitle;
      title.style.fontWeight = '500';
      titleContainer.appendChild(title);
      
      var closeButton = document.createElement('button');
      closeButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      closeButton.style.background = 'transparent';
      closeButton.style.border = 'none';
      closeButton.style.color = 'white';
      closeButton.style.cursor = 'pointer';
      closeButton.setAttribute('aria-label', 'Close chat');
      
      closeButton.addEventListener('click', toggleChat);
      
      header.appendChild(titleContainer);
      header.appendChild(closeButton);
      
      // Chat messages container
      var messagesContainer = document.createElement('div');
      messagesContainer.className = 'ai-chat-messages';
      messagesContainer.style.flex = '1';
      messagesContainer.style.overflowY = 'auto';
      messagesContainer.style.padding = '16px';
      // Apply background based on the theme type
      if (chatBackgroundType === 'solid') {
        messagesContainer.style.backgroundColor = chatBackgroundColor;
      } else if (chatBackgroundType === 'gradient') {
        messagesContainer.style.background = chatBackgroundGradient;
      } else if (chatBackgroundType === 'pattern' && chatBackgroundPattern) {
        messagesContainer.style.backgroundImage = 'url(' + chatBackgroundPattern + ')';
        messagesContainer.style.backgroundRepeat = 'repeat';
      } else if (chatBackgroundType === 'image' && chatBackgroundImage) {
        messagesContainer.style.backgroundImage = 'url(' + chatBackgroundImage + ')';
        messagesContainer.style.backgroundSize = 'cover';
        messagesContainer.style.backgroundPosition = 'center';
      } else {
        // Default fallback
        messagesContainer.style.backgroundColor = '#f9fafb';
      }
      
      // Initial bot message
      if (welcomeMessage) {
        var initialMessage = document.createElement('div');
        initialMessage.className = 'ai-chat-message bot';
        initialMessage.style.display = 'flex';
        initialMessage.style.marginBottom = '16px';
        
        var botIcon = document.createElement('div');
        botIcon.style.width = '32px';
        botIcon.style.height = '32px';
        botIcon.style.marginRight = '8px';
        botIcon.style.backgroundColor = brandColor + '33'; // 20% opacity of brand color
        botIcon.style.borderRadius = '50%';
        botIcon.style.display = 'flex';
        botIcon.style.alignItems = 'center';
        botIcon.style.justifyContent = 'center';
        botIcon.style.color = brandColor;
        botIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>';
        
        var botBubble = document.createElement('div');
        botBubble.style.backgroundColor = 'white';
        botBubble.style.padding = '12px 16px';
        botBubble.style.borderRadius = '8px';
        botBubble.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
        botBubble.style.maxWidth = '80%';
        botBubble.textContent = welcomeMessage;
        
        initialMessage.appendChild(botIcon);
        initialMessage.appendChild(botBubble);
        messagesContainer.appendChild(initialMessage);
      }
      
      // Input area
      var inputContainer = document.createElement('div');
      inputContainer.className = 'ai-chat-input';
      inputContainer.style.padding = '16px';
      inputContainer.style.borderTop = '1px solid #e5e7eb';
      
      var form = document.createElement('form');
      form.style.display = 'flex';
      form.style.alignItems = 'center';
      
      var input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Type your message...';
      input.style.flex = '1';
      input.style.padding = '10px 12px';
      input.style.border = '1px solid #e5e7eb';
      input.style.borderRadius = '9999px';
      input.style.fontSize = '14px';
      input.style.outline = 'none';
      
      var sendButton = document.createElement('button');
      sendButton.type = 'submit';
      sendButton.style.marginLeft = '8px';
      sendButton.style.backgroundColor = brandColor;
      sendButton.style.color = 'white';
      sendButton.style.width = '32px';
      sendButton.style.height = '32px';
      sendButton.style.borderRadius = '50%';
      sendButton.style.border = 'none';
      sendButton.style.display = 'flex';
      sendButton.style.alignItems = 'center';
      sendButton.style.justifyContent = 'center';
      sendButton.style.cursor = 'pointer';
      sendButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';
      
      form.appendChild(input);
      form.appendChild(sendButton);
      
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (input.value.trim()) {
          sendMessage(input.value.trim());
          input.value = '';
        }
      });
      
      inputContainer.appendChild(form);
      
      // Assemble the widget
      chatWidget.appendChild(header);
      chatWidget.appendChild(messagesContainer);
      chatWidget.appendChild(inputContainer);
      
      // Add to document
      document.body.appendChild(chatButton);
      document.body.appendChild(chatWidget);
      
      // Handle responsiveness
      window.addEventListener('resize', handleResize);
      handleResize();
    }
    
    function handleResize() {
      if (window.innerWidth < 480) {
        chatWidget.style.width = '100%';
        chatWidget.style.height = '100%';
        chatWidget.style.bottom = '0';
        chatWidget.style.right = '0';
        chatWidget.style.borderRadius = '0';
      } else {
        chatWidget.style.width = '380px';
        chatWidget.style.height = '500px';
        chatWidget.style.bottom = '100px';
        chatWidget.style[config.position] = '20px';
        chatWidget.style.borderRadius = '10px';
      }
    }
    
    function toggleChat() {
      chatOpen = !chatOpen;
      
      if (chatOpen) {
        chatWidget.style.display = 'flex';
        triggerEvent('open');
        
        // Start a new conversation if needed
        if (!currentConversation) {
          startNewConversation();
        }
      } else {
        chatWidget.style.display = 'none';
        triggerEvent('close');
      }
    }
    
    function startNewConversation() {
      // Create a new conversation
      fetch(config.apiUrl + '/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storeId: config.storeId,
          source: 'widget',
          customData: customOptions.customData || {}
        })
      })
      .then(function(response) {
        if (!response.ok) throw new Error('Failed to create conversation');
        return response.json();
      })
      .then(function(data) {
        currentConversation = data;
      })
      .catch(function(error) {
        console.error('AI Chatbot error:', error);
        addSystemMessage('I\'m having trouble connecting to our servers. Please try again later.');
      });
    }
    
    function sendMessage(text) {
      // Add user message to UI
      addUserMessage(text);
      
      // Indicate bot is typing
      var typingIndicator = addTypingIndicator();
      
      // Send to server
      fetch(config.apiUrl + '/conversations/' + (currentConversation?.id || 'new') + '/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storeId: config.storeId,
          content: text,
          sender: 'user',
          customData: customOptions.customData || {}
        })
      })
      .then(function(response) {
        if (!response.ok) throw new Error('Failed to send message');
        return response.json();
      })
      .then(function(data) {
        // Remove typing indicator
        if (typingIndicator) {
          typingIndicator.remove();
        }
        
        // Set conversation ID if this is the first message
        if (data.conversationId && !currentConversation) {
          currentConversation = { id: data.conversationId };
        }
        
        // Add bot response to UI
        if (data.botResponse) {
          addBotMessage(data.botResponse);
        }
      })
      .catch(function(error) {
        console.error('AI Chatbot error:', error);
        
        // Remove typing indicator
        if (typingIndicator) {
          typingIndicator.remove();
        }
        
        addSystemMessage('I\'m having trouble connecting right now. Please try again later.');
      });
    }
    
    function addUserMessage(text) {
      var messagesContainer = document.querySelector('.ai-chat-messages');
      
      var messageEl = document.createElement('div');
      messageEl.className = 'ai-chat-message user';
      messageEl.style.display = 'flex';
      messageEl.style.justifyContent = 'flex-end';
      messageEl.style.marginBottom = '16px';
      
      var bubble = document.createElement('div');
      bubble.style.backgroundColor = '#e0e7ff'; // Light indigo
      bubble.style.color = '#4338ca'; // Indigo 800
      bubble.style.padding = '12px 16px';
      bubble.style.borderRadius = '8px';
      bubble.style.maxWidth = '80%';
      bubble.textContent = text;
      
      messageEl.appendChild(bubble);
      messagesContainer.appendChild(messageEl);
      
      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    function addBotMessage(text) {
      var messagesContainer = document.querySelector('.ai-chat-messages');
      
      var messageEl = document.createElement('div');
      messageEl.className = 'ai-chat-message bot';
      messageEl.style.display = 'flex';
      messageEl.style.marginBottom = '16px';
      
      // Get brand color from chat header for the bot icon
      var chatHeader = document.querySelector('.ai-chat-header');
      var brandColor = chatHeader ? window.getComputedStyle(chatHeader).backgroundColor : '#4F46E5';
      
      var botIcon = document.createElement('div');
      botIcon.style.width = '32px';
      botIcon.style.height = '32px';
      botIcon.style.marginRight = '8px';
      botIcon.style.backgroundColor = 'rgba(79, 70, 229, 0.2)'; // Light indigo with transparency
      botIcon.style.borderRadius = '50%';
      botIcon.style.display = 'flex';
      botIcon.style.alignItems = 'center';
      botIcon.style.justifyContent = 'center';
      botIcon.style.color = '#4F46E5';
      botIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>';
      
      var bubble = document.createElement('div');
      bubble.style.backgroundColor = 'white';
      bubble.style.padding = '12px 16px';
      bubble.style.borderRadius = '8px';
      bubble.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
      bubble.style.maxWidth = '80%';
      
      // Support simple markdown-like formatting
      var formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
      
      bubble.innerHTML = formattedText;
      
      messageEl.appendChild(botIcon);
      messageEl.appendChild(bubble);
      messagesContainer.appendChild(messageEl);
      
      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    function addSystemMessage(text) {
      var messagesContainer = document.querySelector('.ai-chat-messages');
      
      var messageEl = document.createElement('div');
      messageEl.className = 'ai-chat-message system';
      messageEl.style.display = 'flex';
      messageEl.style.justifyContent = 'center';
      messageEl.style.marginBottom = '16px';
      
      var bubble = document.createElement('div');
      bubble.style.backgroundColor = '#f3f4f6';
      bubble.style.color = '#6b7280';
      bubble.style.padding = '8px 12px';
      bubble.style.borderRadius = '8px';
      bubble.style.fontSize = '12px';
      bubble.textContent = text;
      
      messageEl.appendChild(bubble);
      messagesContainer.appendChild(messageEl);
      
      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    function addTypingIndicator() {
      var messagesContainer = document.querySelector('.ai-chat-messages');
      
      var messageEl = document.createElement('div');
      messageEl.className = 'ai-chat-message bot typing';
      messageEl.style.display = 'flex';
      messageEl.style.marginBottom = '16px';
      
      var botIcon = document.createElement('div');
      botIcon.style.width = '32px';
      botIcon.style.height = '32px';
      botIcon.style.marginRight = '8px';
      botIcon.style.backgroundColor = 'rgba(79, 70, 229, 0.2)';
      botIcon.style.borderRadius = '50%';
      botIcon.style.display = 'flex';
      botIcon.style.alignItems = 'center';
      botIcon.style.justifyContent = 'center';
      botIcon.style.color = '#4F46E5';
      botIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>';
      
      var bubble = document.createElement('div');
      bubble.style.backgroundColor = 'white';
      bubble.style.padding = '12px 16px';
      bubble.style.borderRadius = '8px';
      bubble.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
      
      // Typing dots
      var dots = document.createElement('div');
      dots.style.display = 'flex';
      dots.style.alignItems = 'center';
      dots.style.justifyContent = 'center';
      dots.style.gap = '4px';
      
      for (var i = 0; i < 3; i++) {
        var dot = document.createElement('div');
        dot.style.width = '6px';
        dot.style.height = '6px';
        dot.style.borderRadius = '50%';
        dot.style.backgroundColor = '#6b7280';
        dot.style.animation = 'ai-chat-typing 1.4s infinite both';
        dot.style.animationDelay = (i * 0.2) + 's';
        dots.appendChild(dot);
      }
      
      // Add keyframes for typing animation
      var style = document.createElement('style');
      style.textContent = '@keyframes ai-chat-typing { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }';
      document.head.appendChild(style);
      
      bubble.appendChild(dots);
      messageEl.appendChild(botIcon);
      messageEl.appendChild(bubble);
      messagesContainer.appendChild(messageEl);
      
      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      return messageEl;
    }
    
    function triggerEvent(name) {
      var event = new CustomEvent('aichatbot:' + name, {
        detail: {
          widgetId: config.storeId
        }
      });
      document.dispatchEvent(event);
    }
    
    // Main initialization
    function init() {
      // Fetch settings and create widget
      fetchSettings().then(function(settings) {
        createWidget(settings);
        triggerEvent('ready');
      });
    }
    
    // Initialize the widget
    init();
  })();
  `;
}
