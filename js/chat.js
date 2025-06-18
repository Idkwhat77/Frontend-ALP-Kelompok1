class ChatManager {
    constructor() {
        this.currentUser = null;
        this.activeConversation = null;
        this.conversations = [];
        this.messages = [];
        this.typingTimer = null;
        this.isTyping = false;
        this.init();
    }

    async init() {
        this.currentUser = window.apiClient.getCurrentUser();
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }
        
        console.log('Initializing ChatManager for user:', this.currentUser);
        
        this.setupDOMElements();
        this.setupEventListeners();
        
        // Wait a bit before initializing WebSocket to ensure everything is loaded
        setTimeout(() => {
            this.initializeWebSocket();
        }, 1000);
        
        // Load conversations
        await this.loadConversations();
        
        // Check for URL parameters to auto-select conversation
        await this.handleURLParameters();
    }

    initializeWebSocket() {
        if (!window.webSocketManager) {
            console.error('WebSocketManager not available');
            return;
        }
        
        console.log('Initializing WebSocket for user:', this.currentUser.id);
        
        // Connect to WebSocket
        window.webSocketManager.connect(this.currentUser.id);
        
        // Add message handler
        window.webSocketManager.addMessageHandler((message) => {
            console.log('Received WebSocket message:', message);
            this.handleIncomingMessage(message);
        });

        // Add typing handler
        window.webSocketManager.addTypingHandler((typingMessage) => {
            console.log('Received typing indicator:', typingMessage);
            this.handleTypingIndicator(typingMessage);
        });
    }

    handleIncomingMessage(message) {
        // Only handle if it's for the active conversation
        if (this.activeConversation && 
            this.activeConversation.otherUser.userId === message.senderId) {
            
            // Create message object compatible with existing UI
            const messageObj = {
                id: message.id,
                content: message.content,
                sender: { id: message.senderId },
                receiver: { id: message.receiverId },
                createdAt: message.createdAt
            };
            
            // Add to UI
            this.addMessageToUI(messageObj, true);
            
            // Update conversation in sidebar
            this.updateConversationLastMessage(messageObj);
            
            // Mark as read
            this.markMessagesAsRead(message.senderId);
        } else {
            // Show notification for other conversations
            this.showMessageNotification(message);
        }
    }

    handleTypingIndicator(typingMessage) {
        if (!this.activeConversation || 
            this.activeConversation.otherUser.userId !== typingMessage.senderId) {
            return;
        }

        if (typingMessage.type === 'typing') {
            this.showTypingIndicator(typingMessage.senderName);
        } else if (typingMessage.type === 'stopTyping') {
            this.hideTypingIndicator();
        }
    }

    setupEventListeners() {
        // Send message button
        this.sendButton?.addEventListener('click', () => this.sendMessage());
        
        // Send message on Enter key
        this.chatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Typing indicators
        this.chatInput?.addEventListener('input', () => {
            this.handleTypingStart();
        });

        this.chatInput?.addEventListener('blur', () => {
            this.handleTypingStop();
        });

        // Search conversations
        const searchInput = document.querySelector('input[placeholder="Search conversations..."]');
        searchInput?.addEventListener('input', (e) => this.searchConversations(e.target.value));
    }

    handleTypingStart() {
        if (!this.activeConversation) return;

        if (!this.isTyping) {
            this.isTyping = true;
            window.webSocketManager.sendTyping(
                this.activeConversation.otherUser.userId,
                this.currentUser.fullName || 'User'
            );
        }

        // Reset timer
        clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => {
            this.handleTypingStop();
        }, 3000); // Stop typing after 3 seconds of inactivity
    }

    handleTypingStop() {
        if (this.isTyping && this.activeConversation) {
            this.isTyping = false;
            window.webSocketManager.sendStopTyping(
                this.activeConversation.otherUser.userId,
                this.currentUser.fullName || 'User'
            );
        }
        clearTimeout(this.typingTimer);
    }

    showTypingIndicator(senderName) {
        // Remove existing typing indicator
        this.hideTypingIndicator();
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'flex justify-start typing-indicator-message';
        typingDiv.innerHTML = `
            <div class="max-w-[80%] bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2">
                <div class="flex items-center space-x-2">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <span class="text-xs text-gray-500">${senderName} is typing...</span>
                </div>
            </div>
        `;
        
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator-message');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    showMessageNotification(message) {
        // Create browser notification if permission granted
        if (Notification.permission === 'granted') {
            new Notification(`New message from ${message.senderName}`, {
                body: message.content,
                icon: message.senderProfileImageUrl || 'img/default-profile.png'
            });
        }

        // Update conversation count or highlight
        const conversationElement = document.querySelector(`[data-other-user-id="${message.senderId}"]`);
        if (conversationElement) {
            conversationElement.style.backgroundColor = '#f0f9ff';
        }
    }

    setupDOMElements() {
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.chatHeader = document.getElementById('chat-header');
        this.conversationsContainer = document.querySelector('.divide-y');
        
        console.log('DOM Elements found:');
        console.log('chatMessages:', !!this.chatMessages);
        console.log('chatInput:', !!this.chatInput);
        console.log('sendButton:', !!this.sendButton);
        console.log('chatHeader:', !!this.chatHeader);
        console.log('conversationsContainer:', !!this.conversationsContainer);
    }

    async handleURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('user');
        const conversationId = urlParams.get('conversation');
        const isNew = urlParams.get('new') === 'true';
        
        if (conversationId) {
            // Find and select conversation by ID
            const conversation = this.conversations.find(c => c.id === parseInt(conversationId));
            if (conversation) {
                await this.selectConversation(conversation);
            }
        } else if (userId) {
            // Create new conversation or find existing one
            await this.createNewConversationContext(parseInt(userId), isNew);
        }
        
        // Clean URL
        if (userId || conversationId) {
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
    }

    async createNewConversationContext(otherUserId, isNew = false) {
        try {
            // Check if conversation already exists
            const existingConversation = this.conversations.find(c => 
                c.otherUser.userId === otherUserId
            );
            
            if (existingConversation) {
                await this.selectConversation(existingConversation);
                return;
            }
            
            // Fetch user profile information
            const otherUser = await this.fetchUserProfileInfo(otherUserId);
            if (!otherUser) {
                this.showError('User not found');
                return;
            }
            
            // Create new conversation context
            this.activeConversation = {
                id: null,
                isNew: true,
                otherUser: otherUser,
                messages: []
            };
            
            // ENABLE INPUT AND SEND BUTTON FOR NEW CONVERSATIONS
            if (this.chatInput) {
                this.chatInput.disabled = false;
                this.chatInput.placeholder = `Message ${otherUser.fullName}...`;
            }
            if (this.sendButton) {
                this.sendButton.disabled = false;
            }
            
            // Update UI
            this.updateChatHeader(otherUser);
            this.showNewConversationState();
            
        } catch (error) {
            console.error('Error creating new conversation context:', error);
            this.showError('Failed to start conversation');
        }
    }

    async fetchUserProfileInfo(userId) {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const userType = urlParams.get('type');
            console.log(`Fetching profile for user ID: ${userId}, type: ${userType}`);

            if (userType === 'company') {
                const response = await window.apiClient.getCompanyByUserId(userId);
                if (response && response.company) {
                    const company = response.company;
                    return {
                        userId: userId, type: 'company', fullName: company.companyName,
                        profileImageUrl: company.profileImageUrl, industry: company.industry, hq: company.hq
                    };
                }
            } else if (userType === 'candidate') {
                const response = await window.apiClient.getCandidateByUserId(userId);
                if (response && response.candidate) {
                    const candidate = response.candidate;
                    return {
                        userId: userId, type: 'candidate', fullName: candidate.fullName,
                        profileImageUrl: candidate.profileImageUrl, industry: candidate.industry, city: candidate.city
                    };
                }
            }

            // Fallback for old links without type
            try {
                let response = await window.apiClient.getCandidateByUserId(userId);
                if (response && response.candidate) return { /* ... candidate data ... */ };
            } catch (e) { /* ignore */ }

            try {
                let response = await window.apiClient.getCompanyByUserId(userId);
                if (response && response.company) return { /* ... company data ... */ };
            } catch (e) { /* ignore */ }

            console.error('No profile found for user ID:', userId);
            return null;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    }

    showNewConversationState() {
        if (this.chatMessages) {
            const otherUser = this.activeConversation.otherUser;
            const imageUrl = otherUser.profileImageUrl 
                ? `http://localhost:8080${otherUser.profileImageUrl}` 
                : 'img/default-profile.png';
                
            this.chatMessages.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-center p-8">
                    <div class="mb-6">
                        <img class="h-20 w-20 rounded-full object-cover mx-auto mb-4" 
                             src="${imageUrl}" 
                             alt="${otherUser.fullName}"
                             onerror="this.src='img/default-profile.png'">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            ${otherUser.fullName}
                        </h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            ${otherUser.type === 'candidate' 
                                ? `${otherUser.industry || ''} • ${otherUser.city || ''}` 
                                : `${otherUser.industry || ''} • ${otherUser.hq || ''}`}
                        </p>
                    </div>
                    <div class="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <p class="flex items-center justify-center"><i class="fas fa-comment-dots mr-2 text-lilac-500"></i>Start a new conversation</p>
                        <p class="flex items-center justify-center"><i class="fas fa-handshake mr-2 text-lilac-500"></i>Build professional connections</p>
                        <p class="flex items-center justify-center"><i class="fas fa-share mr-2 text-lilac-500"></i>Share opportunities and insights</p>
                    </div>
                </div>
            `;
        }
        
        // ENSURE INPUT IS ENABLED
        if (this.chatInput) {
            this.chatInput.disabled = false;
            this.chatInput.placeholder = `Message ${this.activeConversation.otherUser.fullName}...`;
        }
        if (this.sendButton) {
            this.sendButton.disabled = false;
        }
    }

    setupDOMElements() {
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.chatHeader = document.getElementById('chat-header');
        this.conversationsContainer = document.querySelector('.divide-y');
        
        // If elements don't exist, create them or handle gracefully
        if (!this.chatMessages) {
            console.warn('chat-messages element not found');
        }
        if (!this.chatInput) {
            console.warn('message-input element not found');
        }
        if (!this.sendButton) {
            console.warn('send-button element not found');
        }
    }

    async loadConversations() {
        try {
            console.log('Loading conversations for user:', this.currentUser.id);
            const conversations = await window.apiClient.getUserConversations(this.currentUser.id);
            console.log('Loaded conversations:', conversations);
            
            this.conversations = conversations || [];
            this.displayConversations();
            
            // Load first conversation if exists
            if (this.conversations.length > 0) {
                await this.selectConversation(this.conversations[0]);
            } else {
                this.showEmptyState();
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
            this.showError('Failed to load conversations');
        }
    }

    displayConversations() {
        if (!this.conversationsContainer) {
            console.error('Conversations container not found');
            return;
        }

        if (this.conversations.length === 0) {
            this.conversationsContainer.innerHTML = `
                <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                    <i class="fas fa-comments text-4xl mb-4"></i>
                    <p class="text-lg font-medium mb-2">No conversations yet</p>
                    <p class="text-sm">Start a conversation with someone from your network</p>
                </div>
            `;
            return;
        }

        this.conversationsContainer.innerHTML = this.conversations.map(conversation => {
            const otherUser = conversation.otherUser;
            const lastMessage = conversation.lastMessage;
            const imageUrl = otherUser.profileImageUrl 
                ? `http://localhost:8080${otherUser.profileImageUrl}` 
                : 'img/default-profile.png';

            const timeDisplay = lastMessage 
                ? this.formatTimeAgo(lastMessage.createdAt)
                : '';

            const isActive = this.activeConversation && 
                this.activeConversation.otherUser.userId === otherUser.userId;

            return `
                <div class="p-4 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${isActive ? 'bg-gray-100 dark:bg-gray-800 active-chat' : ''}" 
                     data-conversation-id="${conversation.id}" 
                     data-other-user-id="${otherUser.userId}">
                    <div class="flex items-center">
                        <img class="h-10 w-10 rounded-full object-cover mr-3" 
                             src="${imageUrl}" 
                             alt="${otherUser.fullName}"
                             onerror="this.src='img/default-profile.png'">
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-center">
                                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    ${otherUser.fullName}
                                </p>
                                <p class="text-xs text-gray-500 dark:text-gray-400">${timeDisplay}</p>
                            </div>
                            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                                ${lastMessage ? lastMessage.content : 'No messages yet'}
                            </p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add click listeners
        this.conversationsContainer.querySelectorAll('[data-conversation-id]').forEach(element => {
            element.addEventListener('click', () => {
                const conversationId = parseInt(element.dataset.conversationId);
                const conversation = this.conversations.find(c => c.id === conversationId);
                if (conversation) {
                    this.selectConversation(conversation);
                }
            });
        });
    }

    async selectConversation(conversation) {
        console.log('Selecting conversation:', conversation);
        
        this.activeConversation = conversation;
        
        // Enable input and send button
        if (this.chatInput) {
            this.chatInput.disabled = false;
            this.chatInput.placeholder = `Message ${conversation.otherUser.fullName}...`;
        }
        if (this.sendButton) {
            this.sendButton.disabled = false;
        }
        
        // Update active state in sidebar
        document.querySelectorAll('[data-conversation-id]').forEach(el => {
            el.classList.remove('active-chat', 'bg-gray-100', 'dark:bg-gray-800');
        });
        
        const activeElement = document.querySelector(`[data-conversation-id="${conversation.id}"]`);
        activeElement?.classList.add('active-chat', 'bg-gray-100', 'dark:bg-gray-800');

        // Update chat header
        this.updateChatHeader(conversation.otherUser);
        
        // Load messages
        await this.loadMessages(conversation.otherUser.userId);
        
        // Mark messages as read
        await this.markMessagesAsRead(conversation.otherUser.userId);
    }

    updateChatHeader(otherUser) {
        if (!this.chatHeader) return;

        const imageUrl = otherUser.profileImageUrl 
            ? `http://localhost:8080${otherUser.profileImageUrl}` 
            : 'img/default-profile.png';

        this.chatHeader.innerHTML = `
            <img class="h-10 w-10 rounded-full object-cover mr-3" 
                 src="${imageUrl}" 
                 alt="${otherUser.fullName}"
                 onerror="this.src='img/default-profile.png'">
            <div>
                <h3 class="font-medium text-gray-900 dark:text-white">${otherUser.fullName}</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                    ${otherUser.type === 'candidate' ? `${otherUser.industry || ''} • ${otherUser.city || ''}` : `${otherUser.industry || ''} • ${otherUser.hq || ''}`}
                </p>
            </div>
            <div class="ml-auto flex space-x-2">
                <button class="p-2 text-gray-500 dark:text-gray-400 hover:text-lilac-500 dark:hover:text-lilac-400 rounded-full hover:bg-lilac-50 dark:hover:bg-gray-700">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </div>
        `;
    }

    async loadMessages(otherUserId) {
        try {
            const response = await window.apiClient.getMessagesBetweenUsers(
                this.currentUser.id, 
                otherUserId,
                0, // page
                50 // size - load more messages
            );
            
            if (response && response.content) {
                this.messages = response.content;
                this.displayMessages();
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            this.showError('Failed to load messages');
        }
    }

    displayMessages() {
        if (!this.chatMessages) return;

        if (this.messages.length === 0) {
            this.chatMessages.innerHTML = `
                <div class="flex justify-center">
                    <span class="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 rounded-full">
                        Start your conversation
                    </span>
                </div>
            `;
            return;
        }

        // Group messages by date
        const messagesByDate = this.groupMessagesByDate(this.messages);
        
        this.chatMessages.innerHTML = '';

        Object.keys(messagesByDate).forEach(date => {
            // Add date divider
            const dateDivider = document.createElement('div');
            dateDivider.className = 'flex justify-center';
            dateDivider.innerHTML = `
                <span class="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 rounded-full">
                    ${date}
                </span>
            `;
            this.chatMessages.appendChild(dateDivider);

            // Add messages for this date
            messagesByDate[date].forEach(message => {
                this.addMessageToUI(message, false);
            });
        });

        this.scrollToBottom();
    }

    addMessageToUI(message, animate = true) {
        const isOwnMessage = message.sender.id === this.currentUser.id;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex justify-${isOwnMessage ? 'end' : 'start'} ${animate ? 'message-in' : ''}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = isOwnMessage 
            ? 'max-w-[70%] bg-lilac-500 text-white rounded-lg px-4 py-2'
            : 'max-w-[70%] bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-sm';
        
        const textColor = isOwnMessage ? '' : 'text-gray-800 dark:text-gray-200';
        const timeColor = isOwnMessage ? 'text-lilac-200' : 'text-gray-500 dark:text-gray-400';
        
        messageContent.innerHTML = `
            <p class="${textColor}">${this.escapeHtml(message.content)}</p>
            <p class="text-xs ${timeColor} mt-1 text-right">
                ${this.formatTime(message.createdAt)}
            </p>
        `;
        
        messageDiv.appendChild(messageContent);
        this.chatMessages.appendChild(messageDiv);
        
        if (animate) {
            this.scrollToBottom();
        }
    }

    async sendMessage() {
        if (!this.activeConversation || !this.chatInput.value.trim()) return;

        const content = this.chatInput.value.trim();
        this.chatInput.value = '';

        // Stop typing indicator
        this.handleTypingStop();

        try {
            const messageData = {
                sender: { id: this.currentUser.id },
                receiver: { id: this.activeConversation.otherUser.userId },
                content: content
            };
            
            console.log('Sending message:', messageData);
            const response = await window.apiClient.sendMessage(messageData);
            
            if (response) {
                // Handle first message in new conversation
                if (this.activeConversation.isNew || this.activeConversation.id === null) {
                    console.log('First message sent, reloading conversations...');
                    await this.loadConversations();
                    
                    // Find the new conversation
                    const newConversation = this.conversations.find(c => 
                        c.otherUser.userId === this.activeConversation.otherUser.userId
                    );
                    
                    if (newConversation) {
                        console.log('Found new conversation:', newConversation);
                        this.activeConversation = newConversation;
                        this.activeConversation.isNew = false;
                        
                        // Update active state in sidebar
                        document.querySelectorAll('[data-conversation-id]').forEach(el => {
                            el.classList.remove('active-chat', 'bg-gray-100', 'dark:bg-gray-800');
                        });
                        
                        const activeElement = document.querySelector(`[data-conversation-id="${newConversation.id}"]`);
                        activeElement?.classList.add('active-chat', 'bg-gray-100', 'dark:bg-gray-800');
                    }
                }
                
                // Add message to UI immediately (optimistic update)
                this.addMessageToUI(response, true);
                
                // Update the conversation in the sidebar
                await this.updateConversationLastMessage(response);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.showError('Failed to send message');
            // Restore the message in input
            this.chatInput.value = content;
        }
    }

    async updateConversationLastMessage(message) {
        // Update the conversation's last message in memory
        if (this.activeConversation) {
            this.activeConversation.lastMessage = {
                content: message.content,
                createdAt: message.createdAt,
                senderId: message.sender.id
            };
            
            // Update the conversation in the list
            const conversationIndex = this.conversations.findIndex(
                c => c.id === this.activeConversation.id
            );
            if (conversationIndex !== -1) {
                this.conversations[conversationIndex] = this.activeConversation;
                // Move to top and refresh display
                this.conversations.unshift(this.conversations.splice(conversationIndex, 1)[0]);
                this.displayConversations();
            }
        }
    }

    async markMessagesAsRead(otherUserId) {
        try {
            await window.apiClient.markMessagesAsRead(otherUserId, this.currentUser.id);
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }

    async searchConversations(searchTerm) {
        if (!searchTerm.trim()) {
            await this.loadConversations();
            return;
        }

        try {
            // Filter existing conversations
            const filteredConversations = this.conversations.filter(conversation => 
                conversation.otherUser.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                conversation.otherUser.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            this.conversations = filteredConversations;
            this.displayConversations();
        } catch (error) {
            console.error('Error searching conversations:', error);
        }
    }

    // Utility methods
    groupMessagesByDate(messages) {
        const groups = {};
        
        messages.forEach(message => {
            const date = this.formatDate(message.createdAt);
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(message);
        });
        
        return groups;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    }

    formatTime(dateString) {
        return new Date(dateString).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'now';
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        if (days === 1) return 'yesterday';
        if (days < 7) return `${days}d`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    scrollToBottom() {
        if (this.chatMessages) {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
    }

    showEmptyState() {
        if (this.chatMessages) {
            this.chatMessages.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-center p-8">
                    <div class="text-gray-400 dark:text-gray-500 mb-4">
                        <i class="fas fa-comments text-4xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No conversation selected
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Choose a conversation from the sidebar to start messaging
                    </p>
                </div>
            `;
        }
        
        // ONLY DISABLE IF NO ACTIVE CONVERSATION
        if (!this.activeConversation) {
            if (this.chatInput) {
                this.chatInput.disabled = true;
                this.chatInput.placeholder = 'Select a conversation to start messaging...';
            }
            if (this.sendButton) {
                this.sendButton.disabled = true;
            }
        }
    }

    showError(message) {
        if (this.chatMessages) {
            this.chatMessages.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-center p-8">
                    <div class="text-red-400 mb-4">
                        <i class="fas fa-exclamation-triangle text-4xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Error
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        ${message}
                    </p>
                </div>
            `;
        }
    }
}

// Request notification permission when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    window.chatManager = new ChatManager();
});