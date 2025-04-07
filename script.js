// API configuration
const API_KEY = 'AIzaSyDqjqnR1YDDln1nf1mHiKxuEBSLK3VVOI0';
const API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';

// DOM Elements
const travelForm = document.getElementById('travelForm');
const responseSection = document.getElementById('responseSection');
const responseContent = document.getElementById('responseContent');
const loadingIndicator = document.getElementById('loadingIndicator');
const copyButton = document.getElementById('copyButton');

// Tab elements
const newQueryTab = document.getElementById('newQueryTab');
const historyTab = document.getElementById('historyTab');
const favoritesTab = document.getElementById('favoritesTab');
const newQueryContent = document.getElementById('newQueryContent');
const historyContent = document.getElementById('historyContent');
const favoritesContent = document.getElementById('favoritesContent');
const historyList = document.getElementById('historyList');
const favoritesList = document.getElementById('favoritesList');

// State management
let chatHistory = [];
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

// Event Listeners
travelForm.addEventListener('submit', handleFormSubmit);
copyButton.addEventListener('click', copyResponse);

// Tab event listeners
newQueryTab.addEventListener('click', () => switchTab('newQuery'));
historyTab.addEventListener('click', () => switchTab('history'));
favoritesTab.addEventListener('click', () => switchTab('favorites'));

// Initialize the application
function init() {
    // Load saved preferences
    const savedPreferences = JSON.parse(localStorage.getItem('preferences') || '{}');
    if (savedPreferences.budget) document.getElementById('budget').value = savedPreferences.budget;
    if (savedPreferences.travelStyle) document.getElementById('travelStyle').value = savedPreferences.travelStyle;
    if (savedPreferences.tripDuration) document.getElementById('tripDuration').value = savedPreferences.tripDuration;
    
    // Load chat history
    loadChatHistory();
    
    // Add event listeners for saving preferences
    document.getElementById('budget').addEventListener('change', savePreferences);
    document.getElementById('travelStyle').addEventListener('change', savePreferences);
    document.getElementById('tripDuration').addEventListener('change', savePreferences);
    
    // Render history and favorites
    renderHistory();
    renderFavorites();
}

// Switch between tabs
function switchTab(tabName) {
    // Hide all content
    newQueryContent.classList.add('hidden');
    historyContent.classList.add('hidden');
    favoritesContent.classList.add('hidden');
    
    // Remove active state from all tabs
    newQueryTab.classList.remove('text-primary-600', 'border-primary-600');
    historyTab.classList.remove('text-primary-600', 'border-primary-600');
    favoritesTab.classList.remove('text-primary-600', 'border-primary-600');
    
    // Show selected content
    if (tabName === 'newQuery') {
        newQueryContent.classList.remove('hidden');
        newQueryTab.classList.add('text-primary-600', 'border-primary-600');
    } else if (tabName === 'history') {
        historyContent.classList.remove('hidden');
        historyTab.classList.add('text-primary-600', 'border-primary-600');
        renderHistory();
    } else if (tabName === 'favorites') {
        favoritesContent.classList.remove('hidden');
        favoritesTab.classList.add('text-primary-600', 'border-primary-600');
        renderFavorites();
    }
}

// Save user preferences
function savePreferences() {
    const preferences = {
        budget: document.getElementById('budget').value,
        travelStyle: document.getElementById('travelStyle').value,
        tripDuration: document.getElementById('tripDuration').value
    };
    localStorage.setItem('preferences', JSON.stringify(preferences));
}

// Format currency in Indian Rupees
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

// Format the AI response
function formatResponse(text) {
    if (!text) {
        return '<div class="text-red-600">No response received from the API.</div>';
    }
    
    // Remove asterisk symbols and replace with proper bullet points
    text = text.replace(/\*/g, '•');
    
    // Add proper spacing after periods
    text = text.replace(/\. /g, '.\n\n');
    
    // Format headings
    text = text.replace(/([A-Z][^.!?]*:)/g, '<h3>$1</h3>');
    
    // Format bullet points
    text = text.replace(/([•\-\*])\s*([^\n]+)/g, '<li>$2</li>');
    text = text.replace(/(<li>.*?<\/li>\n?)+/g, '<ul>$&</ul>');
    
    // Format numbered lists
    text = text.replace(/(\d+\.)\s*([^\n]+)/g, '<li>$2</li>');
    text = text.replace(/(<li>.*?<\/li>\n?)+/g, '<ol>$&</ol>');
    
    // Format monetary values
    text = text.replace(/₹(\d+(?:,\d+)*(?:\.\d{2})?)/g, '<span class="highlight">₹$1</span>');
    
    // Add emojis for common travel-related terms
    const emojiMap = {
        'flight': '✈️',
        'airplane': '✈️',
        'airport': '✈️',
        'hotel': '🏨',
        'accommodation': '🏨',
        'stay': '🏨',
        'resort': '🏨',
        'food': '🍽️',
        'restaurant': '🍽️',
        'cuisine': '🍽️',
        'dining': '🍽️',
        'beach': '🏖️',
        'sea': '🏖️',
        'ocean': '🏖️',
        'coast': '🏖️',
        'mountain': '⛰️',
        'hiking': '⛰️',
        'trek': '⛰️',
        'temple': '🕌',
        'church': '🕌',
        'mosque': '🕌',
        'religious': '🕌',
        'museum': '🏛️',
        'gallery': '🏛️',
        'art': '🏛️',
        'shopping': '🛍️',
        'market': '🛍️',
        'mall': '🛍️',
        'nightlife': '🌙',
        'party': '🌙',
        'club': '🌙',
        'nature': '🌳',
        'park': '🌳',
        'garden': '🌳',
        'adventure': '🎯',
        'exciting': '🎯',
        'thrill': '🎯',
        'relax': '😌',
        'peaceful': '😌',
        'tranquil': '😌',
        'budget': '💰',
        'cheap': '💰',
        'affordable': '💰',
        'luxury': '💎',
        'expensive': '💎',
        'premium': '💎',
        'culture': '🏺',
        'traditional': '🏺',
        'heritage': '🏺',
        'transport': '🚌',
        'bus': '🚌',
        'train': '🚌',
        'metro': '🚌',
        'weather': '☀️',
        'sunny': '☀️',
        'rainy': '☀️',
        'safety': '🛡️',
        'secure': '🛡️',
        'protected': '🛡️',
        'booking': '📅',
        'reservation': '📅',
        'recommend': '💡',
        'suggest': '💡',
        'advise': '💡'
    };
    
    for (const [term, emoji] of Object.entries(emojiMap)) {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        text = text.replace(regex, `${emoji} $&`);
    }
    
    // Add action buttons
    const responseId = Date.now().toString();
    text = `<div class="formatted-response" id="response-${responseId}">${text}</div>
            <div class="flex justify-end mt-4 space-x-2">
                <button onclick="toggleFavorite('${responseId}')" class="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md flex items-center">
                    <i class="fas fa-heart mr-1 text-red-500"></i>
                    Save
                </button>
                <button onclick="printResponse('${responseId}')" class="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md flex items-center">
                    <i class="fas fa-print mr-1"></i>
                    Print
                </button>
            </div>`;
    
    return text;
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Show loading indicator
    loadingIndicator.classList.remove('hidden');
    responseSection.classList.add('hidden');
    
    // Get form values
    const budget = document.getElementById('budget').value;
    const travelStyle = document.getElementById('travelStyle').value;
    const tripDuration = document.getElementById('tripDuration').value;
    const userInput = document.getElementById('userInput').value;
    
    try {
        // Create the prompt
        const prompt = `You are a budget travel assistant specializing in Indian travel. 
        The user's preferences are:
        - Budget: ${formatCurrency(budget)}
        - Travel Style: ${travelStyle}
        - Trip Duration: ${tripDuration} days

        Please provide a detailed response with:
        1. Clear headings for each section
        2. Bullet points for lists
        3. Specific budget breakdowns
        4. Local tips and recommendations
        5. Safety considerations
        6. Best time to visit
        7. Must-try local experiences

        Format your response to be engaging and easy to read.
        Use Indian Rupees (₹) for all monetary values.
        Include specific examples and personal touches.
        Make recommendations based on the user's budget and preferences.

        User's question: ${userInput}`;
        
        // Make API request with updated format
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            })
        });
        
        const data = await response.json();
        console.log('API Response:', data); // Log the full response for debugging
        
        // Check for API errors
        if (data.error) {
            throw new Error(`API Error: ${data.error.message || 'Unknown error'}`);
        }
        
        // Check for valid response format
        if (!data.candidates || !data.candidates.length || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0].text) {
            console.error('Invalid API response format:', data);
            throw new Error(`Invalid response format: ${JSON.stringify(data).substring(0, 100)}...`);
        }
        
        const formattedResponse = formatResponse(data.candidates[0].content.parts[0].text);
        responseContent.innerHTML = formattedResponse;
        responseSection.classList.remove('hidden');
        
        // Add to chat history
        const chatItem = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            userInput,
            budget,
            travelStyle,
            tripDuration,
            response: data.candidates[0].content.parts[0].text
        };
        
        chatHistory.unshift(chatItem);
        saveChatHistory();
        
        // Show success toast
        showToast('Recommendations generated successfully!');
    } catch (error) {
        console.error('Error:', error);
        
        // Create a more detailed error message
        let errorMessage = error.message;
        if (error.message.includes('API Error')) {
            errorMessage = `API Error: ${error.message.split('API Error:')[1].trim()}`;
        } else if (error.message.includes('Invalid response format')) {
            errorMessage = `Invalid response format. Please check your API key and try again.`;
        }
        
        responseContent.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="flex items-center mb-2">
                    <i class="fas fa-exclamation-circle text-red-500 mr-2"></i>
                    <h3 class="text-red-800 font-medium">Error</h3>
                </div>
                <p class="text-red-700">${errorMessage}</p>
                <div class="mt-4 text-sm text-red-600">
                    <p>Possible solutions:</p>
                    <ul class="list-disc pl-5 mt-1">
                        <li>Check if your API key is valid</li>
                        <li>Ensure you have sufficient quota</li>
                        <li>Try again in a few minutes</li>
                        <li>Check your internet connection</li>
                    </ul>
                </div>
            </div>
        `;
        responseSection.classList.remove('hidden');
        
        // Show error toast
        showToast('Error generating recommendations. Please try again.', 'error');
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

// Copy response to clipboard
function copyResponse() {
    const text = responseContent.innerText;
    navigator.clipboard.writeText(text).then(() => {
        // Show success message
        const originalHTML = copyButton.innerHTML;
        copyButton.innerHTML = `
            <i class="fas fa-check text-green-500 text-lg"></i>
        `;
        setTimeout(() => {
            copyButton.innerHTML = originalHTML;
        }, 2000);
        
        // Show toast
        showToast('Response copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        showToast('Failed to copy to clipboard', 'error');
    });
}

// Toggle favorite status
function toggleFavorite(responseId) {
    const responseElement = document.getElementById(`response-${responseId}`);
    if (!responseElement) return;
    
    const responseText = responseElement.innerText;
    const favoriteIndex = favorites.findIndex(fav => fav.text === responseText);
    
    if (favoriteIndex >= 0) {
        // Remove from favorites
        favorites.splice(favoriteIndex, 1);
        showToast('Removed from favorites');
    } else {
        // Add to favorites
        favorites.push({
            id: responseId,
            text: responseText,
            timestamp: new Date().toISOString()
        });
        showToast('Added to favorites');
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
}

// Print response
function printResponse(responseId) {
    const responseElement = document.getElementById(`response-${responseId}`);
    if (!responseElement) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Travel Recommendations</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
                h3 { color: #4f46e5; border-bottom: 1px solid #e0e7ff; padding-bottom: 5px; }
                .highlight { background-color: #fef3c7; padding: 2px 5px; border-radius: 3px; }
                @media print {
                    .highlight { border: 1px solid #92400e; background-color: transparent; }
                }
            </style>
        </head>
        <body>
            <h1>Travel Recommendations</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <hr>
            ${responseElement.innerHTML}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for resources to load
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

// Save chat history
function saveChatHistory() {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory.slice(0, 10))); // Keep only last 10 items
}

// Load chat history
function loadChatHistory() {
    const savedHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    chatHistory = savedHistory;
}

// Render history
function renderHistory() {
    if (chatHistory.length === 0) {
        historyList.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <p>No history yet. Your recent queries will appear here.</p>
            </div>
        `;
        return;
    }
    
    historyList.innerHTML = chatHistory.map(item => `
        <div class="history-item bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <h3 class="font-medium text-gray-800">${item.userInput}</h3>
                    <p class="text-sm text-gray-500">
                        Budget: ${formatCurrency(item.budget)} | Style: ${item.travelStyle} | Duration: ${item.tripDuration} days
                    </p>
                </div>
                <span class="text-xs text-gray-400">${new Date(item.timestamp).toLocaleString()}</span>
            </div>
            <div class="mt-2 flex space-x-2">
                <button onclick="viewHistoryItem('${item.id}')" class="text-primary-600 hover:text-primary-800 text-sm">
                    <i class="fas fa-eye mr-1"></i>View
                </button>
                <button onclick="deleteHistoryItem('${item.id}')" class="text-red-600 hover:text-red-800 text-sm">
                    <i class="fas fa-trash-alt mr-1"></i>Delete
                </button>
            </div>
        </div>
    `).join('');
}

// View history item
function viewHistoryItem(id) {
    const item = chatHistory.find(item => item.id === id);
    if (!item) return;
    
    // Switch to new query tab
    switchTab('newQuery');
    
    // Fill form with history data
    document.getElementById('budget').value = item.budget;
    document.getElementById('travelStyle').value = item.travelStyle;
    document.getElementById('tripDuration').value = item.tripDuration;
    document.getElementById('userInput').value = item.userInput;
    
    // Show response
    const formattedResponse = formatResponse(item.response);
    responseContent.innerHTML = formattedResponse;
    responseSection.classList.remove('hidden');
    
    // Scroll to response
    responseSection.scrollIntoView({ behavior: 'smooth' });
}

// Delete history item
function deleteHistoryItem(id) {
    chatHistory = chatHistory.filter(item => item.id !== id);
    saveChatHistory();
    renderHistory();
    showToast('Item removed from history');
}

// Render favorites
function renderFavorites() {
    if (favorites.length === 0) {
        favoritesList.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <p>No favorites yet. Save recommendations to see them here.</p>
            </div>
        `;
        return;
    }
    
    favoritesList.innerHTML = favorites.map(item => `
        <div class="favorite-item bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <h3 class="font-medium text-gray-800">Saved Recommendation</h3>
                    <p class="text-sm text-gray-500">
                        Saved on: ${new Date(item.timestamp).toLocaleString()}
                    </p>
                </div>
            </div>
            <div class="mt-2 prose max-w-none text-sm line-clamp-3">
                ${item.text.substring(0, 200)}...
            </div>
            <div class="mt-2 flex space-x-2">
                <button onclick="viewFavorite('${item.id}')" class="text-primary-600 hover:text-primary-800 text-sm">
                    <i class="fas fa-eye mr-1"></i>View
                </button>
                <button onclick="deleteFavorite('${item.id}')" class="text-red-600 hover:text-red-800 text-sm">
                    <i class="fas fa-trash-alt mr-1"></i>Delete
                </button>
            </div>
        </div>
    `).join('');
}

// View favorite
function viewFavorite(id) {
    const item = favorites.find(item => item.id === id);
    if (!item) return;
    
    // Switch to new query tab
    switchTab('newQuery');
    
    // Show response
    const formattedResponse = formatResponse(item.text);
    responseContent.innerHTML = formattedResponse;
    responseSection.classList.remove('hidden');
    
    // Scroll to response
    responseSection.scrollIntoView({ behavior: 'smooth' });
}

// Delete favorite
function deleteFavorite(id) {
    favorites = favorites.filter(item => item.id !== id);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
    showToast('Item removed from favorites');
}

// Show toast notification
function showToast(message, type = 'success') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>${message}</span>
    `;
    
    if (type === 'error') {
        toast.classList.add('error');
    }
    
    // Add to DOM
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', init); 