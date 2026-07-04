import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import CreatePostBox from '../components/CreatePostBox';
import PostCard from '../components/PostCard';
import { Users, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Dashboard Component.
 * Home Feed page showing posts of users the current user follows.
 */
const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/posts/feed`);
      if (res.data.success) {
        setPosts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load feed:', err);
      setError('Could not retrieve feed. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost) => {
    // Append the newly created post to the top of the feed array
    setPosts([newPost, ...posts]);
  };

  const handlePostDeleted = (deletedPostId) => {
    // Filter out the deleted post from state
    setPosts(posts.filter((p) => p._id !== deletedPostId));
  };

  const handlePostUpdated = (updatedPost) => {
    // Swap out old post reference with updated post reference in state
    setPosts(posts.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="mx-auto w-full max-w-5xl flex-grow px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Main Feed Column */}
          <div className="md:col-span-2 space-y-6">
            <h1 className="text-xl font-black text-gray-900">Your Feed</h1>
            
            <CreatePostBox onPostCreated={handlePostCreated} />

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : error ? (
              <p className="text-center text-sm font-semibold text-red-500 py-6">{error}</p>
            ) : posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
                <p className="text-sm text-gray-400 font-medium">Your feed is empty.</p>
                <p className="text-xs text-gray-400 mt-1">Follow users in the <Link to="/discover" className="text-indigo-600 font-bold hover:underline">Discover</Link> tab to see their posts!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onPostDeleted={handlePostDeleted}
                    onPostUpdated={handlePostUpdated}
                  />
                ))}
              </div>
            )}
          </div>

          {/* User Profile Summary Sidebar */}
          {user && (
            <div className="hidden md:block">
              <div className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-5">
                <div className="flex flex-col items-center text-center">
                  <Link
                    to={`/profile/${user.id || user._id}`}
                    className="h-20 w-20 overflow-hidden rounded-full ring-4 ring-indigo-500/10 mb-3"
                  >
                    <img
                      src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  </Link>
                  <Link
                    to={`/profile/${user.id || user._id}`}
                    className="text-lg font-black text-gray-900 hover:text-indigo-600 transition-colors"
                  >
                    {user.name}
                  </Link>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">{user.email}</p>
                </div>

                <div className="border-t border-gray-50 pt-4 grid grid-cols-2 gap-4 text-center">
                  <Link to={`/profile/${user.id || user._id}`} className="hover:bg-gray-50 p-2 rounded-xl transition-colors">
                    <span className="block text-lg font-extrabold text-gray-900">
                      {user.followers?.length || 0}
                    </span>
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                      Followers
                    </span>
                  </Link>
                  <Link to={`/profile/${user.id || user._id}`} className="hover:bg-gray-50 p-2 rounded-xl transition-colors">
                    <span className="block text-lg font-extrabold text-gray-900">
                      {user.following?.length || 0}
                    </span>
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                      Following
                    </span>
                  </Link>
                </div>

                <div className="border-t border-gray-50 pt-4 flex flex-col space-y-2.5 text-xs font-semibold text-gray-500">
                  <Link to="/discover" className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-xl transition-colors">
                    <Users size={16} className="text-indigo-500" />
                    <span>Find Users to Follow</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
