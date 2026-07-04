import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import { UserCheck, UserPlus, FileText } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Profile Component.
 * Displays user profile statistics and their timeline of posts.
 */
const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, setUser: setCurrentUser } = useContext(AuthContext);

  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowSubmitting, setIsFollowSubmitting] = useState(false);

  const isOwnProfile = currentUser && (currentUser.id === userId || currentUser._id === userId);

  useEffect(() => {
    fetchProfileDetails();
  }, [userId]);

  const fetchProfileDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${API_URL}/users/${userId}`);
      if (res.data.success) {
        setProfileUser(res.data.user);
        setPosts(res.data.posts);

        // Determine if logged-in user is already following this profile
        const followersList = res.data.user.followers || [];
        const isFollowed = followersList.includes(currentUser?.id || currentUser?._id);
        setIsFollowing(isFollowed);
      }
    } catch (err) {
      console.error('Failed to load profile details:', err);
      setError('User profile not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser || isFollowSubmitting) return;

    try {
      setIsFollowSubmitting(true);
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      const res = await axios.post(`${API_URL}/users/${endpoint}/${userId}`);

      if (res.data.success) {
        // Toggle following state locally
        const newFollowingState = !isFollowing;
        setIsFollowing(newFollowingState);

        // Update target user's local followers count in state
        setProfileUser((prev) => {
          if (!prev) return prev;
          const updatedFollowers = newFollowingState
            ? [...(prev.followers || []), currentUser.id || currentUser._id]
            : (prev.followers || []).filter((f) => f !== (currentUser.id || currentUser._id));
          return { ...prev, followers: updatedFollowers };
        });

        // Sync logged-in user's context following list
        setCurrentUser((prev) => {
          if (!prev) return prev;
          const updatedFollowing = newFollowingState
            ? [...(prev.following || []), userId]
            : (prev.following || []).filter((f) => f !== userId);
          return { ...prev, following: updatedFollowing };
        });
      }
    } catch (err) {
      console.error('Follow action failed:', err);
    } finally {
      setIsFollowSubmitting(false);
    }
  };

  const handlePostDeleted = (deletedPostId) => {
    setPosts(posts.filter((p) => p._id !== deletedPostId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(posts.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <h2 className="text-xl font-bold text-gray-800">{error || 'Something went wrong'}</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700 transition-colors"
          >
            Go to Home Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      {/* Profile Header Banner */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-32 md:h-48"></div>

      <div className="mx-auto w-full max-w-2xl px-4 pb-12 sm:px-6 relative -mt-16 md:-mt-24 space-y-6">
        {/* User Card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            {/* Avatar & Basic Info */}
            <div className="flex items-end space-x-4">
              <div className="h-24 w-24 md:h-32 md:w-32 overflow-hidden rounded-full ring-4 ring-white shadow bg-white">
                <img
                  src={profileUser.avatar || `https://ui-avatars.com/api/?name=${profileUser.name}`}
                  alt={profileUser.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="pb-2">
                <h2 className="text-xl md:text-2xl font-black text-gray-900">{profileUser.name}</h2>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">{profileUser.email}</p>
              </div>
            </div>

            {/* Follow/Unfollow Button */}
            {!isOwnProfile && (
              <button
                onClick={handleFollowToggle}
                disabled={isFollowSubmitting}
                className={`flex items-center space-x-1.5 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  isFollowing
                    ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 border border-gray-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck size={14} />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={14} />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* User Stats Grid */}
          <div className="border-t border-gray-50 pt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <div className="bg-gray-50/50 p-2.5 rounded-xl">
              <span className="block text-lg font-black text-gray-900 leading-tight">
                {posts.length}
              </span>
              <span>Posts</span>
            </div>
            <div className="bg-gray-50/50 p-2.5 rounded-xl">
              <span className="block text-lg font-black text-gray-900 leading-tight">
                {profileUser.followers?.length || 0}
              </span>
              <span>Followers</span>
            </div>
            <div className="bg-gray-50/50 p-2.5 rounded-xl">
              <span className="block text-lg font-black text-gray-900 leading-tight">
                {profileUser.following?.length || 0}
              </span>
              <span>Following</span>
            </div>
          </div>
        </div>

        {/* User Timeline Header */}
        <div className="space-y-4">
          <h3 className="text-md font-extrabold text-gray-900 flex items-center space-x-1.5">
            <FileText size={18} className="text-indigo-500" />
            <span>Timeline</span>
          </h3>

          {posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
              <p className="text-sm text-gray-400 font-medium">No posts shared yet.</p>
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
    </div>
  );
};

export default Profile;
