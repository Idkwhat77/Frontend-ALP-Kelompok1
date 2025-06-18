/**
 * RuangKerja Chatbot Integration with Google Gemini API
 * This file handles the chatbot functionality for the RuangKerja platform
 */

class RuangKerjaChatbot {
    constructor() {
        this.apiEndpoint = 'http://localhost:8080/api/chatbot/chat'; // Backend endpoint
        this.isTyping = false;
        this.conversationHistory = [];
        this.init();
    }

    init() {
        this.setupDOMElements();
        this.setupEventListeners();
        this.addWelcomeMessage();
    }

    setupDOMElements() {
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendButton = document.getElementById('send-message');
        this.suggestionButtons = document.querySelectorAll('.suggestion-btn');
        this.helpTopics = document.querySelectorAll('.help-topic');
    }

    setupEventListeners() {
        // Send message on Enter key
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Send message on button click
        this.sendButton.addEventListener('click', () => this.sendMessage());

        // Handle suggestion buttons
        this.suggestionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const question = e.target.textContent.trim();
                this.sendMessage(question);
            });
        });

        // Handle help topics
        this.helpTopics.forEach(topic => {
            topic.addEventListener('click', (e) => {
                const question = e.target.textContent.trim();
                this.sendMessage(question);
            });
        });
    }

    addWelcomeMessage() {
        const welcomeMessage = `Hello! I'm your RuangKerja assistant powered by AI. I can help you with:

• Job search and applications
• Career advice and tips
• Company information
• Resume and interview guidance
• Profile optimization
• And much more!

How can I assist you today?`;

        this.addMessage(welcomeMessage, 'bot');
    }

    async sendMessage(predefinedMessage = null) {
        const message = predefinedMessage || this.chatInput.value.trim();
        
        if (message === '' || this.isTyping) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input if it wasn't a predefined message
        if (!predefinedMessage) {
            this.chatInput.value = '';
        }

        // Add to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: message
        });

        // Show typing indicator
        this.showTypingIndicator();
        this.isTyping = true;

        try {
            // Send message to backend (which will call Gemini API)
            const response = await this.callChatbotAPI(message);
            
            if (response.success) {
                this.removeTypingIndicator();
                this.addMessage(response.message, 'bot');
                
                // Add to conversation history
                this.conversationHistory.push({
                    role: 'assistant',
                    content: response.message
                });
            } else {
                throw new Error(response.error || 'Failed to get response from chatbot');
            }
        } catch (error) {
            console.error('Chatbot error:', error);
            this.removeTypingIndicator();
            this.addMessage(
                "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.", 
                'bot',
                true
            );
        } finally {
            this.isTyping = false;
        }
    }

    async callChatbotAPI(message) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    conversationHistory: this.conversationHistory.slice(-10) // Send last 10 messages for context
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    addMessage(text, sender, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex justify-${sender === 'user' ? 'end' : 'start'}`;
        
        const messageContent = document.createElement('div');
        const baseClasses = 'max-w-[80%] rounded-lg px-3 py-2';
        
        if (sender === 'user') {
            messageContent.className = `${baseClasses} bg-lilac-500 text-white`;
        } else {
            messageContent.className = isError 
                ? `${baseClasses} bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700`
                : `${baseClasses} bg-lilac-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200`;
        }
        
        // Format message text (preserve line breaks)
        const formattedText = this.formatMessage(text);
        
        messageContent.innerHTML = `
            <div class="message-text">${formattedText}</div>
            <p class="text-xs ${this.getTimestampClass(sender, isError)} mt-1">
                ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
        `;
        
        messageDiv.appendChild(messageContent);
        messageDiv.classList.add(sender === 'user' ? 'message-out' : 'message-in');
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatMessage(text) {
        // Convert line breaks to HTML
        return text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
            .replace(/`(.*?)`/g, '<code class="bg-gray-200 dark:bg-gray-600 px-1 rounded">$1</code>'); // Code text
    }

    getTimestampClass(sender, isError) {
        if (sender === 'user') {
            return 'text-lilac-200';
        } else if (isError) {
            return 'text-red-500 dark:text-red-400';
        } else {
            return 'text-gray-500 dark:text-gray-400';
        }
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'flex justify-start';
        typingDiv.id = 'typing-indicator';
        
        const typingContent = document.createElement('div');
        typingContent.className = 'bg-lilac-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2';
        
        typingContent.innerHTML = `
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        typingDiv.appendChild(typingContent);
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    // Method to clear conversation history
    clearHistory() {
        this.conversationHistory = [];
        this.chatMessages.innerHTML = '';
        this.addWelcomeMessage();
    }

    // Method to get conversation history for debugging
    getHistory() {
        return this.conversationHistory;
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the chatbot page
    if (document.getElementById('chat-messages')) {
        window.ruangKerjaChatbot = new RuangKerjaChatbot();
    }
});

// Export for use in other scripts if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RuangKerjaChatbot;
}
