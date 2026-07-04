import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Discover Component.
 * Global Feed showing posts from all users across VibeGrid.
 */
const Discover = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGlobalPosts();
  }, []);

  const fetchGlobalPosts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/posts`);
      if (res.data.success) {
        setPosts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load global posts:', err);
      setError('Could not retrieve global posts. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostDeleted = (deletedPostId) => {
    setPosts(posts.filter((p) => p._id !== deletedPostId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(posts.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="mx-auto w-full max-w-2xl flex-grow px-4 py-8 sm:px-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Explore Discover</h1>
          <p className="text-xs text-gray-400 font-semibold mt-1">Explore what's happening around the VibeGrid community</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : error ? (
          <p className="text-center text-sm font-semibold text-red-500 py-6">{error}</p>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
            <p className="text-sm text-gray-400 font-medium">No posts have been shared yet.</p>
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
    </div>
  );
};

export default Discover;
