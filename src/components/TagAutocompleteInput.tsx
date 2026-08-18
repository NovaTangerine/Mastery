import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useGameTags } from '../hooks/useGameTags';

interface TagAutocompleteInputProps {
  gameId: string | null;
  value: string;
  onChange: (val: string) => void;
  onAddTag: (tag: string) => void;
  onRemoveLastTag?: () => void;
  onBlur?: () => void;
  onEscape?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  existingTags: string[];
  additionalSuggestions?: string[];
  mode?: 'tags' | 'generic';
  triggerOnEnterOnly?: boolean;
}

export const TagAutocompleteInput: React.FC<TagAutocompleteInputProps> = ({
  gameId,
  value,
  onChange,
  onAddTag,
  onRemoveLastTag,
  onBlur,
  onEscape,
  placeholder = "Add tags...",
  className = "",
  autoFocus = false,
  existingTags,
  additionalSuggestions = [],
  mode = 'tags',
  triggerOnEnterOnly = false,
}) => {
  const { tags: allGameTags, addTagToCache } = useGameTags(mode === 'tags' ? gameId : null);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  
  const [isHovered, setIsHovered] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 100);
  }, []);

  const wakeUpFromTyping = useCallback(() => {
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  }, []);

  const showFully = isHovered || isTyping;

  // Filter tags to suggest
  const combinedTags = Array.from(new Set([...allGameTags, ...additionalSuggestions]));
  const availableTags = combinedTags.filter(tag => !existingTags.includes(tag.toLowerCase()));
  
  let suggestions = availableTags;
  if (value.trim()) {
    const search = value.toLowerCase().trim();
    suggestions = availableTags.filter(tag => tag.toLowerCase().includes(search));
  }

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [value, suggestions.length]);

  const updateDropdownPosition = useCallback(() => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      const dropdownHeight = 192; // max-h-48 (12rem)
      let top = rect.bottom + 4;
      let bottom = 'auto';
      
      // If there's not enough space below, and there is more space above, render it above
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        top = rect.top - 4; // This will actually mean we set "bottom" via css relative to window
      }

      setDropdownStyle({
        top: spaceBelow < dropdownHeight && spaceAbove > spaceBelow ? 'auto' : `${rect.bottom + 4}px`,
        bottom: spaceBelow < dropdownHeight && spaceAbove > spaceBelow ? `${window.innerHeight - rect.top + 4}px` : 'auto',
        left: `${rect.left}px`,
        width: `${Math.max(rect.width, 192)}px`, // At least 12rem or match input
      });
    }
  }, []);

  useEffect(() => {
    if (isFocused && suggestions.length > 0) {
      updateDropdownPosition();
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
      return () => {
        window.removeEventListener('scroll', updateDropdownPosition, true);
        window.removeEventListener('resize', updateDropdownPosition);
      };
    }
  }, [isFocused, suggestions.length, updateDropdownPosition]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (wrapperRef.current && !wrapperRef.current.contains(target) &&
          (!dropdownRef.current || !dropdownRef.current.contains(target))) {
        setIsFocused(false);
        if (onBlur) onBlur();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onBlur]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    wakeUpFromTyping();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' || (!triggerOnEnterOnly && e.key === ',')) {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        const suggestion = suggestions[selectedIndex];
        onAddTag(suggestion);
        if (mode === 'tags') addTagToCache(suggestion.toLowerCase());
      } else if (value.trim()) {
        const trimmed = value.trim().toLowerCase();
        onAddTag(value.trim());
        if (mode === 'tags') addTagToCache(trimmed);
      }
    } else if (e.key === 'Backspace' && !value && existingTags.length > 0 && onRemoveLastTag) {
      onRemoveLastTag();
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      if (onEscape) onEscape();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onAddTag(suggestion);
    if (mode === 'tags') addTagToCache(suggestion.toLowerCase());
    setIsFocused(false); 
    const input = wrapperRef.current?.querySelector('input');
    if (input) input.focus();
  };

  return (
    <div 
      className="relative inline-block" 
      ref={wrapperRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => {
          wakeUpFromTyping();
          onChange(e.target.value);
        }}
        onClick={() => {
          wakeUpFromTyping();
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          setIsFocused(true);
          wakeUpFromTyping();
        }}
        className={className}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      {isFocused && suggestions.length > 0 && createPortal(
        <div 
          ref={dropdownRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`tag-autocomplete-dropdown fixed z-[9999] max-h-48 overflow-y-auto bg-zinc-800 border border-zinc-700/50 rounded-xl shadow-xl p-1 custom-scrollbar transition-opacity duration-700 ease-in-out ${showFully ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={dropdownStyle}
        >
          {suggestions.map((suggestion, idx) => (
            <div
              key={suggestion}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wide cursor-pointer rounded-lg transition-colors truncate ${
                idx === selectedIndex 
                  ? 'bg-zinc-700 text-zinc-100' 
                  : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700/50'
              }`}
              onMouseEnter={() => setSelectedIndex(idx)}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};
