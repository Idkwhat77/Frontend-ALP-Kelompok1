class ChatManager {
    constructor() {
        this.currentUser = null;
        this.activeConversation = null;
        this.conversations = [];
        this.messages = [];
        this.init();
    }

    async init() {
        this.currentUser = window.apiClient.getCurrentUser();
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }
        
        this.setupDOMElements();
        this.setupEventListeners();
        await this.loadConversations();
        
        // Check for URL parameters to auto-select conversation
        await this.handleURLParameters();
    }

    async handleURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('user');
        const conversationId = urlParams.get('conversation');
        const isNew = urlParams.get('new') === 'true';
        
        if (conversationId) {
            // Find and select specific conversation
            const conversation = this.conversations.find(c => c.id == conversationId);
            if (conversation) {
                await this.selectConversation(conversation);
            }
        } else if (userId) {
            // Find conversation with specific user
            const conversation = this.conversations.find(c => 
                c.otherUser.userId == userId
            );
            
            if (conversation) {
                await this.selectConversation(conversation);
            } else {
                // **ENHANCED: Create a new conversation context with better user info**
                await this.createNewConversationContext(userId, isNew);
            }
        }
        
        // Clean URL
        if (userId || conversationId) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    async createNewConversationContext(otherUserId, isNew = false) {
        try {
            // **ENHANCED: Get user profile data from candidate or company endpoints**
            let otherUserProfile = await this.fetchUserProfileInfo(otherUserId);
            
            if (otherUserProfile) {
                // Create a temporary conversation object
                this.activeConversation = {
                    id: null,
                    isNew: isNew,
                    otherUser: otherUserProfile
                };
                
                this.updateChatHeader(this.activeConversation.otherUser);
                this.showNewConversationState();
            }
        } catch (error) {
            console.error('Error creating new conversation context:', error);
            this.showError('Unable to load user information');
        }
    }

    // Add new method to fetch user profile information
    async fetchUserProfileInfo(userId) {
        try {
            // Try to get candidate info first
            try {
                const candidateResponse = await window.apiClient.getCandidateByUserId(userId);
                if (candidateResponse && candidateResponse.candidate) {
                    const candidate = candidateResponse.candidate;
                    return {
                        userId: userId,
                        fullName: candidate.fullName,
                        profileImageUrl: candidate.profileImageUrl,
                        type: 'candidate',
                        industry: candidate.industry,
                        city: candidate.city,
                        email: candidate.email
                    };
                }
            } catch (candidateError) {
                console.log('Not a candidate, trying company...');
            }

            // Try to get company info
            try {
                const companyResponse = await window.apiClient.getCompanyByUserId(userId);
                if (companyResponse && companyResponse.company) {
                    const company = companyResponse.company;
                    return {
                        userId: userId,
                        fullName: company.companyName,
                        profileImageUrl: company.profileImageUrl,
                        type: 'company',
                        industry: company.industry,
                        hq: company.hq,
                        email: company.email
                    };
                }
            } catch (companyError) {
                console.log('Not a company either...');
            }

            // Fallback to basic user info
            return {
                userId: userId,
                fullName: 'Unknown User',
                profileImageUrl: null,
                type: 'user',
                industry: 'Unknown',
                city: 'Unknown',
                email: 'Unknown'
            };

        } catch (error) {
            console.error('Error fetching user profile info:', error);
            return null;
        }
    }

    // Add new method to show empty conversation state with better messaging
    showNewConversationState() {
        if (this.chatMessages) {
            const otherUser = this.activeConversation.otherUser;
            this.chatMessages.innerHTML = `
                <div class="flex items-center justify-center h-full text-center">
                    <div class="text-gray-500 dark:text-gray-400 max-w-md">
                        <div class="mb-6">
                            <img class="h-16 w-16 rounded-full object-cover mx-auto mb-4" 
                                 src="${otherUser.profileImageUrl ? `http://localhost:8080${otherUser.profileImageUrl}` : 'img/default-profile.png'}" 
                                 alt="${otherUser.fullName}"
                                 onerror="this.src='img/default-profile.png'">
                            <h3 class="text-xl font-medium mb-2 text-gray-900 dark:text-white">
                                Start a conversation with ${otherUser.fullName}
                            </h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                ${otherUser.type === 'candidate' 
                                    ? `${otherUser.industry} • ${otherUser.city}` 
                                    : `${otherUser.industry} • ${otherUser.hq}`}
                            </p>
                        </div>
                        <div class="space-y-2 text-sm">
                            <p>💬 Send your first message below</p>
                            <p>🤝 Start building a professional connection</p>
                            <p>📋 Share opportunities or insights</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    setupDOMElements() {
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.chatHeader = document.getElementById('chat-header');
        this.conversationsContainer = document.querySelector('.divide-y');
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

        // Search conversations
        const searchInput = document.querySelector('input[placeholder="Search conversations..."]');
        searchInput?.addEventListener('input', (e) => this.searchConversations(e.target.value));
    }

    async loadConversations() {
        try {
            const response = await window.apiClient.getUserConversations(this.currentUser.id);
            this.conversations = response || [];
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
        if (!this.conversationsContainer) return;

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
                                <span class="text-xs text-gray-500 dark:text-gray-400">
                                    ${timeDisplay}
                                </span>
                            </div>
                            <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
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
                const conversationId = element.dataset.conversationId;
                const conversation = this.conversations.find(c => c.id == conversationId);
                if (conversation) {
                    this.selectConversation(conversation);
                }
            });
        });
    }

    async selectConversation(conversation) {
        this.activeConversation = conversation;
        
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
                    ${otherUser.type === 'candidate' ? `${otherUser.industry} • ${otherUser.city}` : `${otherUser.industry} • ${otherUser.hq}`}
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

        try {
            const messageData = {
                sender: { id: this.currentUser.id },
                receiver: { id: this.activeConversation.otherUser.userId },
                content: content
            };
            
            const response = await window.apiClient.sendMessage(messageData);
            if (response) {
                // **ENHANCED: Handle first message in new conversation**
                if (this.activeConversation.isNew || this.activeConversation.id === null) {
                    // This is the first message - reload conversations to get the new conversation
                    await this.loadConversations();
                    
                    // Find the newly created conversation
                    const newConversation = this.conversations.find(c => 
                        c.otherUser.userId === this.activeConversation.otherUser.userId
                    );
                    
                    if (newConversation) {
                        this.activeConversation = newConversation;
                        this.activeConversation.isNew = false;
                    }
                }
                
                // Add message to UI immediately
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
                <div class="flex items-center justify-center h-full text-center">
                    <div class="text-gray-500 dark:text-gray-400">
                        <i class="fas fa-comments text-6xl mb-4"></i>
                        <h3 class="text-xl font-medium mb-2">No conversation selected</h3>
                        <p>Choose a conversation from the sidebar to start messaging</p>
                    </div>
                </div>
            `;
        }
        
        if (this.chatHeader) {
            this.chatHeader.innerHTML = `
                <div class="text-gray-500 dark:text-gray-400">
                    <h3 class="font-medium">Select a conversation</h3>
                </div>
            `;
        }
    }

    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 z-50 p-4 rounded-md text-white bg-red-500 shadow-lg';
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-exclamation-circle mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatManager = new ChatManager();
});