import React, { useState, useEffect, useRef } from 'react';

interface SearchOption {
  id: string;
  label: string;
  category?: string;
}

interface EnhancedSearchProps {
  placeholder?: string;
  options: SearchOption[];
  onSearch: (query: string, filters: string[]) => void;
  onAddNew?: (value: string) => void;
  categories?: string[];
  showFilters?: boolean;
}

const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  placeholder = 'Search...',
  options,
  onSearch,
  onAddNew,
  categories = [],
  showFilters = true,
}) => {
  const [query, setQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<SearchOption[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length > 0) {
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(query.toLowerCase()) &&
        (selectedFilters.length === 0 || selectedFilters.includes(option.category || ''))
      );
      setFilteredOptions(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredOptions([]);
      setShowSuggestions(false);
    }
  }, [query, options, selectedFilters]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    onSearch(query, selectedFilters);
    setShowSuggestions(false);
  };

  const handleFilterToggle = (filter: string) => {
    setSelectedFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  const handleAddNew = () => {
    if (onAddNew && query.trim()) {
      onAddNew(query.trim());
      setQuery('');
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={placeholder}
          className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-2xl py-4 pl-12 pr-12 text-sm font-medium text-gray-900 dark:text-white shadow-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => handleFilterToggle(category)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                selectedFilters.includes(category)
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl max-h-80 overflow-y-auto z-50">
          {filteredOptions.length > 0 ? (
            <div className="p-2">
              {filteredOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => {
                    setQuery(option.label);
                    handleSearch();
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{option.label}</span>
                    {option.category && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                        {option.category}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No results found for "{query}"</p>
              {onAddNew && (
                <button
                  onClick={handleAddNew}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Add "{query}"
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedSearch;
