function formatMarkdown(message) {
    return message
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')   // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>')               // Italic
        .replace(/__(.*?)__/g, '<u>$1</u>')                 // Underline
        .replace(/`(.*?)`/g, '<code>$1</code>')             // Inline code
        .replace(/\n/g, '<br>');                            // Line breaks
}

function typeOutMessage(element, message, typingSpeed) {
    element.innerText = '';
    let words = message.split(/\s+/); // split by any whitespace
    let index = 0;

    function typeNextWord() {
        if (index < words.length) {
            const currentText = words.slice(0, index + 1).join(' ');
            element.innerHTML = formatMarkdown(currentText);

            index++;

            chatMessages.scrollTop = chatMessages.scrollHeight;

            setTimeout(typeNextWord, typingSpeed);
        }
    }

    typeNextWord();
}

  

document.addEventListener('DOMContentLoaded', () => {
    // Grab the overall chat container element too.
    const chatContainer = document.getElementById('chatContainer');
    const chatButton = document.getElementById('chatButton');
    const chatWindow = document.getElementById('chatWindow');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const closeChat = document.getElementById('closeChat');
    
    let suggestionsDisplayed = false; // Only show suggestions once.

    const suggestions = [
        "What's your professional background?",
        "What tools and technologies do you work with?",
        "How can I get in touch with you?"
    ];

    // Initially hide the chat window and input.
    chatInput.style.display = 'none';
    chatWindow.style.display = 'none';

    if (chatButton && chatWindow && chatInput && chatMessages) {
        // Open chat: add the chat-open class to the chat container.
        chatButton.addEventListener('click', () => {
            chatContainer.classList.add('chat-open');
            chatWindow.style.display = 'flex'; // Changed to flex to work with the column layout
            chatInput.style.display = 'block';
            chatButton.style.display = 'none';

            // Add this line to update the layout when chat toggles
            setClipPath(currentState !== STATE_HOME);

            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Show suggestions only once when the chat is opened for the first time
            if (!suggestionsDisplayed) {
                displaySuggestions();
                suggestionsDisplayed = true;
            }
        });

        // Close chat: remove the chat-open class.
        closeChat.addEventListener('click', () => {
            chatContainer.classList.remove('chat-open');
            chatWindow.style.display = 'none';
            chatInput.style.display = 'none';
            chatButton.style.display = 'flex';
            
            // Add this line to update the layout when chat closes
            setClipPath(currentState !== STATE_HOME);
        });

        // Automatically expand the input field as the user types, up to 3 lines.
        chatInput.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight <= 60 ? this.scrollHeight : 60) + 'px';
        });

        // Send the user's message when pressing Enter.
        chatInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && chatInput.value.trim() !== "") {
                e.preventDefault(); // Prevent newline insertion.
                const message = chatInput.value;
                addMessageToChat(message, "user-message");
                chatInput.value = ''; // Clear the input.
                chatInput.style.height = 'auto'; // Reset height.
                removeSuggestions(); // Remove suggestions after a message is sent.
                sendMessageToChatbot(message); // Simulate sending the message.
            }
        });

        // Display suggestion messages.
        function displaySuggestions() {
            suggestions.forEach(text => {
                const suggestionElement = document.createElement('div');
                suggestionElement.className = 'suggestion';
                suggestionElement.textContent = text;
                suggestionElement.addEventListener('click', () => {
                    addMessageToChat(text, "user-message");
                    removeSuggestions(); // Remove suggestions once one is clicked.
                    sendMessageToChatbot(text); // Simulate sending the message.
                });
                chatMessages.appendChild(suggestionElement);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Remove suggestions from the chat.
        function removeSuggestions() {
            const suggestionsElements = document.querySelectorAll('.suggestion');
            suggestionsElements.forEach(el => el.remove());
        }

        // Add a message to the chat window.
        function addMessageToChat(message, messageType) {
            if (messageType === "bot-message") {
                const container = document.createElement('div');
                container.className = 'bot-message-container';
        
                // Create the avatar element.
                const avatar = document.createElement('img');
                avatar.src = './assets/images/chatbot_avatar.jpg';
                avatar.alt = 'Chatbot Avatar';
                avatar.className = 'bot-avatar';
        
                // Create the text container.
                const messageText = document.createElement('div');
                messageText.className = 'bot-message-bubble';
                // Do not set textContent immediately—use typewriter animation.
        
                // Append avatar and text to the container.
                container.appendChild(avatar);
                container.appendChild(messageText);
        
                // Append container to chat messages.
                chatMessages.appendChild(container);
                
                // Start typewriter animation.
                typeOutMessage(messageText, message, 30);
            } else {
                // For user messages, continue using your existing markup.
                const messageElement = document.createElement('div');
                messageElement.className = 'message ' + messageType;
                messageElement.textContent = message;
                chatMessages.appendChild(messageElement);
            }
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        

        // Send the message to a chatbot server.
        function sendMessageToChatbot(message) {
            const BASE_URL = window.location.hostname === "localhost"
            ? "http://127.0.0.1:8081"
            : "https://baltha-studio.onrender.com";

            fetch(`${BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                addMessageToChat(data.response, "bot-message");
            })
            .catch(error => {
                console.error('Error:', error);
                addMessageToChat("Oops! Something went wrong.", "bot-message");
            });
        }
    } else {
        console.error("Chatbot elements not found in the DOM.");
    }
});
