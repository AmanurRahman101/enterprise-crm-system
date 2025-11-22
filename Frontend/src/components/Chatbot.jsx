import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../services/api';
import SocketService from '../services/socketService';

const Chatbot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Add welcome message
      setMessages([
        {
          id: 'welcome',
          type: 'bot',
          text: '👋 Hello! I\'m your CRM assistant. I can help you with:\n\n• Finding contacts\n• Checking deal status\n• Creating issues\n• Viewing activities\n• General information\n\nHow can I help you today?',
          timestamp: new Date()
        }
      ]);

      // Connect to WebSocket for real-time responses
      if (!SocketService.isConnected()) {
        SocketService.connect();
      }

      // Listen for chatbot messages
      const unsubscribe = SocketService.on('chatbot_message', (data) => {
        if (data.message) {
          addBotMessage(data.message);
        }
      });

      // Focus input
      if (inputRef.current) {
        inputRef.current.focus();
      }

      return () => {
        unsubscribe();
      };
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addBotMessage = (text) => {
    const newMessage = {
      id: `bot-${Date.now()}`,
      type: 'bot',
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    setLoading(false);
  };

  const addUserMessage = (text) => {
    const newMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    const message = inputMessage.trim();
    if (!message) return;

    // Add user message
    addUserMessage(message);
    setInputMessage('');
    setLoading(true);

    try {
      // Send to backend chatbot API
      const response = await ApiService.request('/api/chatbot/message', {
        method: 'POST',
        body: { message }
      });

      if (response.success && response.reply) {
        addBotMessage(response.reply);
      } else {
        throw new Error('No response from chatbot');
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      addBotMessage('Sorry, I encountered an error processing your request. Please try again.');
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const quickActions = [
    { label: 'Show my deals', value: 'Show me my deals' },
    { label: 'Recent activities', value: 'What are the recent activities?' },
    { label: 'Open issues', value: 'Show open issues' },
    { label: 'Contact list', value: 'Show all contacts' }
  ];

  const handleQuickAction = (value) => {
    setInputMessage(value);
    setTimeout(() => handleSendMessage(), 100);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all ${isMinimized ? 'w-80' : 'w-96'}`}>
      <div className={`bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col ${isMinimized ? 'h-16' : 'h-[600px]'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-xl">
              🤖
            </div>
            <div>
              <h3 className="font-semibold">CRM Assistant</h3>
              <p className="text-xs opacity-90">
                {SocketService.isConnected() ? '🟢 Online' : '🔴 Offline'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              title={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.type === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-indigo-200' : 'text-gray-500'
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 1 && (
              <div className="px-4 py-2 border-t border-gray-200 bg-white">
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.value)}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
              <div className="flex items-end space-x-2">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  rows={1}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  disabled={loading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Chatbot Toggle Button Component
export const ChatbotToggle = ({ onClick, hasUnread = false }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-40"
      title="Open Chat Assistant"
    >
      <span className="text-2xl">💬</span>
      {hasUnread && (
        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
      )}
    </button>
  );
};

export default Chatbot;

