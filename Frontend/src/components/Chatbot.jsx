import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../services/api';

// HudHud Chatbot - Named after the Hoopoe bird
const Chatbot = ({ isOpen, onClose, currentOrganization, isClientPortal }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [currentMode, setCurrentMode] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const isListeningRef = useRef(false); // Ref to track listening state for callbacks
  const pendingMessageRef = useRef(''); // Ref to store message to send after silence
  const sendMessageRef = useRef(null); // Ref to the send function for voice callbacks

  // Speech Recognition setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const hasSpeechSupport = !!SpeechRecognition;

  // Determine current mode from route (isClientPortal) passed from DashboardLayout
  const getCurrentMode = useCallback(() => {
    // Client mode when on /dashboard/client/* routes
    if (isClientPortal) {
      return {
        mode: 'client',
        name: 'Client Portal'
      };
    }
    // Organization mode when on /dashboard/organization/* routes
    if (currentOrganization && currentOrganization.id) {
      return {
        mode: 'organization',
        name: currentOrganization.name || 'Organization'
      };
    }
    // Default to client mode if no organization selected
    return {
      mode: 'client',
      name: 'Client Portal'
    };
  }, [currentOrganization, isClientPortal]);

  // Initialize speech recognition (only once)
  useEffect(() => {
    if (!hasSpeechSupport) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }

      if (finalTranscript) {
        // Accumulate the transcript
        pendingMessageRef.current += finalTranscript;
        setInputMessage(pendingMessageRef.current);
        setInterimTranscript('');
        
        // Reset silence timer on final result
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        
        // Start silence detection timer (1.5 seconds) - send message but keep listening
        silenceTimerRef.current = setTimeout(() => {
          if (isListeningRef.current && pendingMessageRef.current.trim()) {
            // Send the message via ref
            if (sendMessageRef.current) {
              sendMessageRef.current(pendingMessageRef.current.trim());
            }
            // Clear for next message but keep listening
            pendingMessageRef.current = '';
            setInputMessage('');
            setInterimTranscript('');
          }
        }, 1500);
      } else {
        setInterimTranscript(interim);
        
        // Reset silence timer on interim results too
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        silenceTimerRef.current = setTimeout(() => {
          if (isListeningRef.current && pendingMessageRef.current.trim()) {
            // Send the message via ref
            if (sendMessageRef.current) {
              sendMessageRef.current(pendingMessageRef.current.trim());
            }
            // Clear for next message but keep listening
            pendingMessageRef.current = '';
            setInputMessage('');
            setInterimTranscript('');
          }
        }, 1500);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        toast.error('Voice recognition error. Please try again.');
      }
      isListeningRef.current = false;
      setIsListening(false);
      setInterimTranscript('');
      pendingMessageRef.current = '';
    };

    recognition.onend = () => {
      // Only restart if we're still supposed to be listening (use ref to avoid stale closure)
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch (e) {
          isListeningRef.current = false;
          setIsListening(false);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [hasSpeechSupport]); // Only depend on hasSpeechSupport - initialize once

  // Update mode when chatbot opens or organization changes
  useEffect(() => {
    if (isOpen) {
      const mode = getCurrentMode();
      setCurrentMode(mode);
      
      // Only set welcome message on first open (not on org change)
      if (messages.length === 0) {
        setMessages([
          {
            id: 'welcome',
            type: 'bot',
            text: `Hello! I'm HudHud, your CRM assistant.\n\nI can help you with:\n• Finding and managing contacts\n• Checking deal status and pipeline\n• Creating and tracking issues\n• Viewing activities and insights\n\nCurrently in ${mode.name} mode. How can I help you today?`,
            timestamp: new Date()
          }
        ]);
      }

      // Focus input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } else {
      // Clean up when closing
      isListeningRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      setIsListening(false);
      setInterimTranscript('');
    }
  }, [isOpen, getCurrentMode, currentOrganization, isClientPortal]);

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

  const startListening = () => {
    if (!hasSpeechSupport) {
      toast.error('Voice input is not supported in this browser');
      return;
    }

    try {
      pendingMessageRef.current = ''; // Clear pending message
      recognitionRef.current?.start();
      isListeningRef.current = true; // Update ref
      setIsListening(true);
      setInterimTranscript('');
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      toast.error('Failed to start voice input');
    }
  };

  const stopListening = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    
    isListeningRef.current = false; // Update ref first
    pendingMessageRef.current = ''; // Clear pending
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    setIsListening(false);
    setInterimTranscript('');
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Core send function - used by both manual and voice sends
  const sendMessage = async (messageText) => {
    if (!messageText || !messageText.trim()) return;
    
    const message = messageText.trim();

    // Add user message
    addUserMessage(message);
    setInputMessage('');
    setLoading(true);

    try {
      // Send to backend chatbot API with explicit mode flag
      const response = await ApiService.request('/api/chatbot/message', {
        method: 'POST',
        body: { 
          message,
          isClientMode: isClientPortal  // Explicitly tell backend which mode
        }
      });

      if (response.success && response.response) {
        addBotMessage(response.response);
      } else {
        throw new Error('No response from HudHud');
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      addBotMessage('I apologize, but I encountered an error processing your request. Please try again.');
      toast.error('Failed to send message');
    }
  };

  // Assign send function to ref for voice callbacks
  sendMessageRef.current = sendMessage;

  const handleSendMessage = async () => {
    const message = inputMessage.trim();
    if (!message) return;

    // Stop listening if active (manual send stops voice)
    if (isListening) {
      stopListening();
    }

    await sendMessage(message);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = async () => {
    try {
      await ApiService.request('/api/chatbot/reset', { 
        method: 'POST',
        body: { isClientMode: isClientPortal }
      });
      const mode = getCurrentMode();
      setMessages([
        {
          id: 'welcome-reset',
          type: 'bot',
          text: `Chat history cleared. I'm ready for a fresh conversation!\n\nCurrently in ${mode.name} mode.`,
          timestamp: new Date()
        }
      ]);
      toast.success('Chat reset successfully');
    } catch (error) {
      console.error('Failed to reset chat:', error);
      toast.error('Failed to reset chat');
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const quickActions = currentMode?.mode === 'organization' 
    ? [
        { label: '📊 Show deals', value: 'Show me all deals' },
        { label: '👥 List contacts', value: 'Show all contacts' },
        { label: '🎫 Open issues', value: 'What are the open issues?' },
        { label: '📈 Stats overview', value: 'Give me an overview of our stats' }
      ]
    : [
        { label: '💼 My deals', value: 'Show me my deals' },
        { label: '🎫 My issues', value: 'What are my open issues?' },
        { label: '📊 Overview', value: 'Give me an overview' },
        { label: '🏢 Organizations', value: 'List organizations I can contact' }
      ];

  const handleQuickAction = (value) => {
    setInputMessage(value);
    setTimeout(() => handleSendMessage(), 100);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${isMinimized ? 'w-80' : 'w-[420px]'}`}>
      <div className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-amber-500/20 flex flex-col overflow-hidden ${isMinimized ? 'h-16' : 'h-[650px]'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* HudHud Bird Avatar */}
            <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/30">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
                <path d="M12 2C9.5 2 7.5 4 7.5 6.5c0 .5.1 1 .2 1.5C5.5 8.5 4 10.5 4 13c0 3.5 2.5 6 6 7v2h4v-2c3.5-1 6-3.5 6-7 0-2.5-1.5-4.5-3.7-5-.1-.5-.2-1-.2-1.5C16.5 4 14.5 2 12 2zm0 2c1.4 0 2.5 1.1 2.5 2.5 0 .3 0 .5-.1.8-.8-.2-1.6-.3-2.4-.3s-1.6.1-2.4.3c-.1-.3-.1-.5-.1-.8C9.5 5.1 10.6 4 12 4zm-4 9c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1-1-.4-1-1zm6 0c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1-1-.4-1-1zm-2 3c-1.1 0-2-.4-2.5-1h5c-.5.6-1.4 1-2.5 1z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white text-lg tracking-tight">HudHud</h3>
              <p className="text-xs text-white/80 font-medium">
                {currentMode?.mode === 'organization' 
                  ? `🏢 ${currentMode.name}`
                  : '👤 Client Portal'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleResetChat}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Reset Chat"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Close"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-800/50 to-slate-900/50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  {message.type === 'bot' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center mr-2 flex-shrink-0 shadow-lg">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                        <path d="M12 2C9.5 2 7.5 4 7.5 6.5c0 .5.1 1 .2 1.5C5.5 8.5 4 10.5 4 13c0 3.5 2.5 6 6 7v2h4v-2c3.5-1 6-3.5 6-7 0-2.5-1.5-4.5-3.7-5-.1-.5-.2-1-.2-1.5C16.5 4 14.5 2 12 2z"/>
                      </svg>
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-lg ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                        : 'bg-slate-700/80 backdrop-blur-sm text-gray-100 border border-slate-600/50'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                    <p
                      className={`text-xs mt-2 ${
                        message.type === 'user' ? 'text-amber-100' : 'text-slate-400'
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start animate-fadeIn">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center mr-2 flex-shrink-0">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                      <path d="M12 2C9.5 2 7.5 4 7.5 6.5c0 .5.1 1 .2 1.5C5.5 8.5 4 10.5 4 13c0 3.5 2.5 6 6 7v2h4v-2c3.5-1 6-3.5 6-7 0-2.5-1.5-4.5-3.7-5-.1-.5-.2-1-.2-1.5C16.5 4 14.5 2 12 2z"/>
                    </svg>
                  </div>
                  <div className="bg-slate-700/80 backdrop-blur-sm border border-slate-600/50 rounded-2xl px-4 py-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                      <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 1 && (
              <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-800/50">
                <p className="text-xs text-slate-400 mb-2 font-medium">Quick actions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.value)}
                      className="px-3 py-1.5 text-xs bg-slate-700/50 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 rounded-full transition-all border border-slate-600/50 hover:border-amber-500/50"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-slate-700/50 bg-slate-800/80 backdrop-blur-sm">
              {/* Voice Recording Indicator */}
              {isListening && (
                <div className="mb-3 flex items-center justify-center space-x-2 text-amber-400">
                  <div className="flex space-x-1">
                    <div className="w-1 h-4 bg-amber-400 rounded-full animate-pulse"></div>
                    <div className="w-1 h-6 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-3 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1 h-5 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                    <div className="w-1 h-4 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-sm font-medium">Listening... (pause to send)</span>
                </div>
              )}

              <div className="flex items-end space-x-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputMessage + (interimTranscript ? ` ${interimTranscript}` : '')}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isListening ? 'Listening...' : 'Type your message or use voice...'}
                    rows={1}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 resize-none text-gray-100 placeholder-slate-400 transition-all"
                    disabled={loading}
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                  {interimTranscript && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                      ...
                    </span>
                  )}
                </div>

                {/* Voice Input Button */}
                {hasSpeechSupport && (
                  <button
                    onClick={toggleListening}
                    disabled={loading}
                    className={`p-3 rounded-xl transition-all ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                        : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-amber-400 border border-slate-600/50'
                    }`}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                  >
                    {isListening ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    )}
                  </button>
                )}

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || loading}
                  className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-amber-500/25"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>

              {/* Voice support hint */}
              {!hasSpeechSupport && (
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Voice input not supported in this browser
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Styles for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

// HudHud Toggle Button Component
export const ChatbotToggle = ({ onClick, hasUnread = false }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl shadow-lg flex items-center justify-center transition-all hover:scale-110 hover:shadow-amber-500/40 z-40 border border-amber-400/30"
      title="Chat with HudHud"
    >
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M12 2C9.5 2 7.5 4 7.5 6.5c0 .5.1 1 .2 1.5C5.5 8.5 4 10.5 4 13c0 3.5 2.5 6 6 7v2h4v-2c3.5-1 6-3.5 6-7 0-2.5-1.5-4.5-3.7-5-.1-.5-.2-1-.2-1.5C16.5 4 14.5 2 12 2zm0 2c1.4 0 2.5 1.1 2.5 2.5 0 .3 0 .5-.1.8-.8-.2-1.6-.3-2.4-.3s-1.6.1-2.4.3c-.1-.3-.1-.5-.1-.8C9.5 5.1 10.6 4 12 4zm-4 9c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1-1-.4-1-1zm6 0c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1-1-.4-1-1zm-2 3c-1.1 0-2-.4-2.5-1h5c-.5.6-1.4 1-2.5 1z"/>
      </svg>
      {hasUnread && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
      )}
    </button>
  );
};

export default Chatbot;
