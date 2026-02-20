import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../src/firebase';
import { useAuth } from '../App';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

interface SearchResult {
  id: string;
  type: 'mentor' | 'resource' | 'community' | 'user';
  title: string;
  description: string;
  icon: string;
  color: string;
  metadata?: Record<string, any>;
}

const Search: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const searchParams = new URLSearchParams(location.search);
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'all' | 'mentor' | 'resource' | 'community'>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches on mount
  useEffect(() => {
    const stored = localStorage.getItem('unity_recent_searches');
    if (stored) {
      setRecentSearches(JSON.parse(stored).slice(0, 5));
    }
  }, []);

  // Perform search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    performSearch();
  }, [searchQuery, searchType]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const searchLower = searchQuery.toLowerCase();
      const combinedResults: SearchResult[] = [];

      // Search mentors
      if (searchType === 'all' || searchType === 'mentor') {
        try {
          const mentorsSnap = await getDocs(collection(db, 'users'));
          mentorsSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.displayName?.toLowerCase().includes(searchLower) ||
                data.role?.toLowerCase().includes(searchLower) ||
                data.offerTags?.some((tag: string) => tag.toLowerCase().includes(searchLower))) {
              combinedResults.push({
                id: doc.id,
                type: 'mentor',
                title: data.displayName || data.email,
                description: data.role || 'Mentor',
                icon: 'person',
                color: 'blue',
                metadata: data
              });
            }
          });
        } catch (err) {
          console.error('Error searching mentors:', err);
        }
      }

      // Search resources (mock data for now)
      if (searchType === 'all' || searchType === 'resource') {
        const mockResources = [
          { title: 'Resume Building Guide', description: 'Learn how to craft an ATS-friendly resume', icon: 'description' },
          { title: 'Interview Preparation', description: 'Mock interviews and tips for success', icon: 'assignment' },
          { title: 'Career Pathways', description: 'Explore different career paths in tech', icon: 'trending_up' },
          { title: 'Financial Aid Resources', description: 'Scholarships and funding opportunities', icon: 'paid' },
          { title: 'Academic Support', description: 'Tutoring and study groups', icon: 'school' },
          { title: 'DEI Initiatives', description: 'Diversity, equity, and inclusion resources', icon: 'favorite' }
        ];

        mockResources.forEach(resource => {
          if (resource.title.toLowerCase().includes(searchLower) ||
              resource.description.toLowerCase().includes(searchLower)) {
            combinedResults.push({
              id: resource.title,
              type: 'resource',
              title: resource.title,
              description: resource.description,
              icon: resource.icon,
              color: 'green'
            });
          }
        });
      }

      // Search communities (mock data for now)
      if (searchType === 'all' || searchType === 'community') {
        const mockCommunities = [
          { title: 'Tech & Innovation', description: 'For students interested in technology', icon: 'computer' },
          { title: 'Business Leaders', description: 'Entrepreneurship and business discussion', icon: 'business_center' },
          { title: 'Global Community', description: 'International students network', icon: 'public' },
          { title: 'Arts & Culture', description: 'Creative pursuits and cultural exchange', icon: 'palette' }
        ];

        mockCommunities.forEach(community => {
          if (community.title.toLowerCase().includes(searchLower) ||
              community.description.toLowerCase().includes(searchLower)) {
            combinedResults.push({
              id: community.title,
              type: 'community',
              title: community.title,
              description: community.description,
              icon: community.icon,
              color: 'purple'
            });
          }
        });
      }

      setResults(combinedResults);

      // Save to recent searches
      const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('unity_recent_searches', JSON.stringify(updated));

    } catch (err) {
      console.error('Error performing search:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'mentor') {
      navigate(`/mentorship/match?mentor=${result.id}`);
    } else if (result.type === 'resource') {
      navigate(`/resources?query=${result.title}`);
    } else if (result.type === 'community') {
      navigate(`/community`);
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
      rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 md:py-12 px-4 sm:px-6 space-y-8">
      {/* Search Header */}
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">Search UnityMentor</h1>
        <p className="text-gray-600 text-sm sm:text-base">Find mentors, resources, and communities</p>
      </div>

      {/* Search Bar */}
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mentors, resources, communities..."
            className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all pl-12"
          />
          <span className="material-symbols-outlined absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', 'mentor', 'resource', 'community'] as const).map(type => (
            <button
              key={type}
              onClick={() => setSearchType(type)}
              className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                searchType === type
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Results or Empty State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            <span className="text-sm font-bold text-gray-600">Searching...</span>
          </div>
        </div>
      ) : searchQuery.trim() ? (
        <div>
          {results.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </p>
              <div className="space-y-3">
                {results.map(result => {
                  const colors = getColorClasses(result.color);
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className={`w-full p-4 rounded-xl border-2 ${colors.border} ${colors.bg} text-left hover:shadow-md transition-all group`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`size-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.text}`}>
                          <span className="material-symbols-outlined">{result.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-black text-gray-900 truncate">{result.title}</h3>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white px-2 py-0.5 rounded flex-shrink-0">
                              {result.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{result.description}</p>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors flex-shrink-0">arrow_forward</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <span className="material-symbols-outlined text-4xl text-gray-300 mx-auto block">search_off</span>
              <div>
                <p className="text-lg font-black text-gray-900">No results found</p>
                <p className="text-sm text-gray-600">Try a different search query or browse our categories</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-gray-900">Recent Searches</h2>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map(search => (
                  <button
                    key={search}
                    onClick={() => setSearchQuery(search)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full text-sm transition-all"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Categories */}
          <div className="space-y-4">
            <h2 className="text-lg font-black text-gray-900">Browse Categories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { title: 'Mentorship', icon: 'people', query: 'mentor' },
                { title: 'Resume Help', icon: 'description', query: 'resume' },
                { title: 'Career Resources', icon: 'trending_up', query: 'career' },
                { title: 'Financial Aid', icon: 'paid', query: 'financial' },
                { title: 'Community Events', icon: 'event', query: 'event' },
                { title: 'Interview Prep', icon: 'assignment', query: 'interview' }
              ].map(category => (
                <button
                  key={category.title}
                  onClick={() => setSearchQuery(category.query)}
                  className="p-6 rounded-xl border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl text-gray-400 group-hover:text-primary transition-colors">{category.icon}</span>
                    <span className="font-bold text-sm text-gray-900">{category.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
