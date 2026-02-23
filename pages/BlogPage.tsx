import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../src/firebase';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  image: string;
}

const BlogPage: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const defaultPosts: BlogPost[] = [
    {
      id: '1',
      title: '10 Tips for Finding the Perfect Mentor',
      excerpt: 'Discover how to identify and connect with mentors who can truly accelerate your career growth and personal development.',
      author: 'Sarah Johnson',
      date: '2024-01-15',
      category: 'mentorship',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
    },
    {
      id: '2',
      title: 'Building a Resume That Gets Noticed',
      excerpt: 'Learn the secrets to crafting a resume that stands out to recruiters and lands you more interviews.',
      author: 'Michael Chen',
      date: '2024-01-12',
      category: 'career',
      readTime: '7 min read',
      image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800',
    },
    {
      id: '3',
      title: 'Navigating Cultural Differences in the Workplace',
      excerpt: 'Essential insights for international students entering diverse work environments.',
      author: 'Priya Patel',
      date: '2024-01-10',
      category: 'diversity',
      readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
    },
    {
      id: '4',
      title: 'The Power of Networking: A Student\'s Guide',
      excerpt: 'How to build meaningful professional relationships that will benefit your career for years to come.',
      author: 'David Martinez',
      date: '2024-01-08',
      category: 'networking',
      readTime: '8 min read',
      image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800',
    },
    {
      id: '5',
      title: 'Mastering the Virtual Interview',
      excerpt: 'Expert tips for acing your next video interview and making a great impression remotely.',
      author: 'Emily Rodriguez',
      date: '2024-01-05',
      category: 'career',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=800',
    },
    {
      id: '6',
      title: 'From Student to Professional: Making the Transition',
      excerpt: 'Navigate the journey from campus to career with confidence and clarity.',
      author: 'James Wilson',
      date: '2024-01-03',
      category: 'career',
      readTime: '10 min read',
      image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800',
    },
  ];

  useEffect(() => {
    setPosts(defaultPosts);
  }, []);

  const categories = [
    { id: 'all', name: 'All Posts' },
    { id: 'mentorship', name: 'Mentorship' },
    { id: 'career', name: 'Career' },
    { id: 'diversity', name: 'Diversity' },
    { id: 'networking', name: 'Networking' },
  ];

  const filteredPosts = selectedCategory === 'all'
    ? posts
    : posts.filter(post => post.category === selectedCategory);

  const featuredPost = posts[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-3xl mb-6 shadow-xl">
            <span className="material-symbols-outlined text-white text-4xl">article</span>
          </div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-4">
            Unity Blog
          </h1>
          <p className="text-gray-600 text-lg">Insights, tips, and stories from our community</p>
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <div
            className="relative bg-white rounded-3xl overflow-hidden shadow-2xl mb-12 cursor-pointer group"
            onClick={() => navigate(`/blog/${featuredPost.id}`)}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="relative h-64 lg:h-auto">
                <img
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-green-600 text-white px-4 py-2 rounded-full text-xs font-bold">
                  FEATURED
                </div>
              </div>
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">
                    {featuredPost.category}
                  </span>
                  <span>{featuredPost.readTime}</span>
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-4 group-hover:text-green-600 transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-gray-600 mb-6">{featuredPost.excerpt}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full"></div>
                  <div>
                    <p className="font-bold text-gray-900">{featuredPost.author}</p>
                    <p className="text-sm text-gray-500">{new Date(featuredPost.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-6 py-3 rounded-2xl font-bold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.slice(1).map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer group"
              onClick={() => navigate(`/blog/${post.id}`)}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">
                    {post.category}
                  </span>
                  <span>{post.readTime}</span>
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                  {post.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">{post.excerpt}</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-full"></div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">{post.author}</p>
                    <p className="text-xs text-gray-500">{new Date(post.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16 bg-gradient-to-br from-green-600 to-teal-600 rounded-3xl p-12 text-white text-center shadow-2xl">
          <h2 className="text-3xl font-black mb-4">Stay Updated</h2>
          <p className="text-green-100 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter and get the latest insights, tips, and stories delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 rounded-xl text-gray-900 focus:ring-4 focus:ring-white/50 outline-none"
            />
            <button className="bg-white text-green-600 px-8 py-4 rounded-xl font-bold hover:scale-105 transition-all whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
