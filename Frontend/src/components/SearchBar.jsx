import React, { useState, useEffect, useRef } from 'react';

const SearchBar = ({
  placeholder = 'Search...',
  value = '',
  onChange,
  onSearch,
  debounceMs = 300,
  showClearButton = true,
  filters = [], // Array of filter objects: { id, label, active }
  onFilterToggle = null,
  className = ''
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Clear existing debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce timer
    debounceRef.current = setTimeout(() => {
      if (onChange) onChange(newValue);
      if (onSearch) onSearch(newValue);
    }, debounceMs);
  };

  const handleClear = () => {
    setLocalValue('');
    if (onChange) onChange('');
    if (onSearch) onSearch('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && onSearch) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      onSearch(localValue);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Search Input */}
      <div className={`
        relative flex items-center
        bg-gray-800/50 backdrop-blur-sm
        border rounded-lg
        transition-all duration-300
        ${isFocused 
          ? 'border-teal-500 shadow-lg shadow-teal-500/20 bg-gray-800/70' 
          : 'border-gray-700/50 hover:border-gray-600/50'
        }
      `}>
        {/* Search Icon */}
        <div className={`
          pl-4 flex items-center justify-center
          transition-colors duration-300
          ${isFocused ? 'text-teal-400' : 'text-gray-400'}
        `}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="
            flex-1 px-4 py-2.5 
            bg-transparent border-none outline-none
            text-white placeholder-gray-400
            text-sm
          "
        />

        {/* Clear Button */}
        {showClearButton && localValue && (
          <button
            onClick={handleClear}
            className="
              pr-4 text-gray-400 hover:text-white
              transition-all duration-200
              animate-fade-in
            "
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter Chips */}
      {filters && filters.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onFilterToggle && onFilterToggle(filter.id)}
              className={`
                inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium
                transition-all duration-200
                ${filter.active
                  ? 'bg-gradient-to-r from-teal-500/30 to-emerald-500/30 text-teal-400 border border-teal-500/50 shadow-md shadow-teal-500/20'
                  : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:border-gray-600 hover:text-gray-300'
                }
              `}
            >
              {filter.label}
              {filter.active && (
                <svg className="w-3 h-3 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;

