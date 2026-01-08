import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';

const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentItems, setRecentItems] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation items
  const navigationItems = [
    // Organization pages
    { id: 'org-overview', title: 'Organization Overview', path: '/dashboard/organization', category: 'Organization', icon: '🏢' },
    { id: 'org-deals', title: 'Deals', path: '/dashboard/organization/deals', category: 'Organization', icon: '💼' },
    { id: 'org-contacts', title: 'Contacts', path: '/dashboard/organization/contacts', category: 'Organization', icon: '👥' },
    { id: 'org-activities', title: 'Activities', path: '/dashboard/organization/activities', category: 'Organization', icon: '📋' },
    { id: 'org-issues', title: 'Issues', path: '/dashboard/organization/issues', category: 'Organization', icon: '🎫' },
    { id: 'org-team', title: 'Team', path: '/dashboard/organization/team', category: 'Organization', icon: '👥' },
    { id: 'org-calls', title: 'Call History', path: '/dashboard/organization/calls', category: 'Organization', icon: '📞' },
    { id: 'org-telegram', title: 'Telegram Link', path: '/dashboard/organization/telegram', category: 'Organization', icon: '✈️' },
    
    // Client portal pages
    { id: 'client-overview', title: 'Client Portal', path: '/dashboard/client', category: 'Client', icon: '🏠' },
    { id: 'client-deals', title: 'My Deals', path: '/dashboard/client/deals', category: 'Client', icon: '💼' },
    { id: 'client-issues', title: 'My Issues', path: '/dashboard/client/issues', category: 'Client', icon: '🎫' }
  ];

  // Action items
  const actionItems = [
    { id: 'new-deal', title: 'Create New Deal', action: 'create-deal', category: 'Actions', icon: '➕' },
    { id: 'new-contact', title: 'Add Contact', action: 'create-contact', category: 'Actions', icon: '➕' },
    { id: 'new-issue', title: 'Report Issue', action: 'create-issue', category: 'Actions', icon: '➕' }
  ];

  // Fuzzy search function
  const fuzzySearch = (items, searchQuery) => {
    if (!searchQuery) return items;
    
    const lowerQuery = searchQuery.toLowerCase();
    return items.filter(item => {
      const title = item.title.toLowerCase();
      const category = item.category.toLowerCase();
      
      // Check if query matches title or category
      if (title.includes(lowerQuery) || category.includes(lowerQuery)) return true;
      
      // Fuzzy match - check if all characters in query appear in order
      let queryIndex = 0;
      for (let i = 0; i < title.length && queryIndex < lowerQuery.length; i++) {
        if (title[i] === lowerQuery[queryIndex]) queryIndex++;
      }
      return queryIndex === lowerQuery.length;
    });
  };

  // Get filtered results
  const getFilteredResults = useCallback(() => {
    const allItems = [...navigationItems, ...actionItems];
    const filtered = fuzzySearch(allItems, query);
    
    // Group by category
    const grouped = {};
    filtered.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });
    
    return grouped;
  }, [query]);

  const filteredResults = getFilteredResults();
  const flatResults = Object.values(filteredResults).flat();

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, flatResults.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (flatResults[selectedIndex]) {
            handleSelect(flatResults[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, flatResults, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when opened/closed
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      loadRecentItems();
    }
  }, [isOpen]);

  const loadRecentItems = () => {
    const recent = JSON.parse(localStorage.getItem('commandPaletteRecent') || '[]');
    setRecentItems(recent.slice(0, 5));
  };

  const saveRecentItem = (item) => {
    const recent = JSON.parse(localStorage.getItem('commandPaletteRecent') || '[]');
    const filtered = recent.filter(r => r.id !== item.id);
    const updated = [item, ...filtered].slice(0, 10);
    localStorage.setItem('commandPaletteRecent', JSON.stringify(updated));
  };

  const handleSelect = (item) => {
    saveRecentItem(item);
    
    if (item.path) {
      navigate(item.path);
    } else if (item.action) {
      // Trigger action (would need to be implemented)
      console.log('Action:', item.action);
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="relative w-full max-w-2xl bg-gray-900/95 backdrop-blur-xl border border-teal-500/30 rounded-xl shadow-2xl shadow-black/50 animate-scale-in">
        {/* Search Input */}
        <div className="flex items-center border-b border-gray-700/50 px-4 py-3">
          <svg className="w-5 h-5 text-teal-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages and actions... (or use Cmd+K)"
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400 text-sm"
          />
          <kbd className="hidden sm:block px-2 py-1 text-xs text-gray-400 bg-gray-800/50 rounded border border-gray-700">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {query === '' && recentItems.length > 0 && (
            <div className="mb-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Recent
              </div>
              {recentItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-left transition-all ${
                    selectedIndex === index
                      ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                      : 'text-gray-300 hover:bg-gray-800/50'
                  }`}
                >
                  <span className="mr-3 text-xl">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.category}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {Object.keys(filteredResults).length === 0 && query !== '' ? (
            <div className="px-3 py-12 text-center text-gray-400 text-sm">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              No results found for "{query}"
            </div>
          ) : (
            Object.entries(filteredResults).map(([category, items]) => (
              <div key={category} className="mb-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {category}
                </div>
                {items.map((item, index) => {
                  const globalIndex = flatResults.indexOf(item);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`w-full flex items-center px-3 py-2.5 rounded-lg text-left transition-all ${
                        selectedIndex === globalIndex
                          ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                          : 'text-gray-300 hover:bg-gray-800/50'
                      }`}
                    >
                      <span className="mr-3 text-xl">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.title}</div>
                        {item.path && (
                          <div className="text-xs text-gray-500">{item.path}</div>
                        )}
                      </div>
                      {selectedIndex === globalIndex && (
                        <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700/50 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-800/50 rounded border border-gray-700">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-800/50 rounded border border-gray-700">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-800/50 rounded border border-gray-700">↵</kbd>
              Select
            </span>
          </div>
          <span>{flatResults.length} results</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;

