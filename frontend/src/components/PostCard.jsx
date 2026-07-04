import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Heart, MessageSquare, Trash2, Edit3, X, Check, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * PostCard Component.
 * Displays user posts with editing, deleting, liking, and comment systems.
 */
const PostCard = ({ post, onPostDeleted, onPostUpdated }) => {
  const { user } = useContext(AuthContext);
  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [isLiked, setIsLiked] = useState(post.likes.includes(user?.id || user?._id));
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Author details shortcut
  const author = post.user;
  const isPostOwner = author && (author._id === user?.id || author._id === user?._id || author === user?.id || author === user?._id);

  // Sync likes state if props change
  useEffect(() => {
    setLikesCount(post.likes.length);
    setIsLiked(post.likes.includes(user?.id || user?._id));
  }, [post, user]);

  // Load comments when drawer is opened
  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  const fetchComments = async () => {
    try {
      const res = await axios.get(`${API_URL}/posts/${post._id}/comments`);
      if (res.data.success) {
        setComments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  const handleLikeToggle = async () => {
    try {
      const res = await axios.post(`${API_URL}/posts/like/${post._id}`);
      if (res.data.success) {
        setIsLiked(res.data.isLiked);
        setLikesCount(res.data.likesCount);
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleUpdate = async () => {
    if (!editText.trim()) return;
    try {
      const res = await axios.put(`${API_URL}/posts/${post._id}`, { text: editText.trim() });
      if (res.data.success) {
        setIsEditing(false);
        if (onPostUpdated) {
          onPostUpdated(res.data.data);
        }
      }
    } catch (err) {
      console.error('Failed to update post:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await axios.delete(`${API_URL}/posts/${post._id}`);
      if (res.data.success) {
        if (onPostDeleted) {
          onPostDeleted(post._id);
        }
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmittingComment(true);
      const res = await axios.post(`${API_URL}/posts/${post._id}/comments`, {
        text: newComment.trim(),
      });

      if (res.data.success) {
        setNewComment('');
        setComments([...comments, res.data.data]);
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await axios.delete(`${API_URL}/comments/${commentId}`);
      if (res.data.success) {
        setComments(comments.filter((c) => c._id !== commentId));
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            to={`/profile/${author?._id || author}`}
            className="block h-10 w-10 overflow-hidden rounded-full ring-2 ring-indigo-500/10"
          >
            <img
              src={author?.avatar || `https://ui-avatars.com/api/?name=${author?.name || 'User'}`}
              alt={author?.name || 'User'}
              className="h-full w-full object-cover"
            />
          </Link>
          <div>
            <Link
              to={`/profile/${author?._id || author}`}
              className="block text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors"
            >
              {author?.name || 'User'}
            </Link>
            <span className="flex items-center text-xs text-gray-400 mt-0.5 space-x-1">
              <Calendar size={12} />
              <span>{formatDate(post.createdAt)}</span>
            </span>
          </div>
        </div>

        {/* Ownership Controls */}
        {isPostOwner && (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
              title="Edit Post"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={handleDelete}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Delete Post"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Content body */}
      <div className="space-y-3">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-500"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditText(post.text);
                }}
                className="flex items-center space-x-1 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100"
              >
                <X size={14} />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleUpdate}
                className="flex items-center space-x-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                <Check size={14} />
                <span>Save</span>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {post.text}
          </p>
        )}

        {/* Post Image attachment */}
        {post.image && (
          <div className="overflow-hidden rounded-xl border border-gray-50 bg-gray-50 max-h-[350px] flex items-center justify-center">
            <img
              src={post.image}
              alt="Post attachment"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'; // Hide if URL is broken
              }}
            />
          </div>
        )}
      </div>

      {/* Footer Stats & Actions */}
      <div className="flex items-center space-x-6 border-t border-gray-50 pt-3 text-gray-500 text-xs font-semibold">
        {/* Like Button */}
        <button
          onClick={handleLikeToggle}
          className={`flex items-center space-x-1.5 transition-colors ${
            isLiked ? 'text-rose-500' : 'hover:text-rose-500'
          }`}
        >
          <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
          <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
        </button>

        {/* Comments Toggle */}
        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center space-x-1.5 hover:text-indigo-600 transition-colors ${
            showComments ? 'text-indigo-600' : ''
          }`}
        >
          <MessageSquare size={18} />
          <span>Comment</span>
        </button>
      </div>

      {/* Expandable Comments Section */}
      {showComments && (
        <div className="border-t border-gray-50 pt-4 space-y-4">
          {/* Comments List */}
          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-2">No comments yet. Start the conversation!</p>
            ) : (
              comments.map((comment) => {
                const isCommentOwner = comment.user && (comment.user._id === user?.id || comment.user._id === user?._id || comment.user === user?.id || comment.user === user?._id);
                return (
                  <div key={comment._id} className="flex items-start justify-between bg-gray-50/50 rounded-xl p-3">
                    <div className="flex items-start space-x-2.5">
                      <Link
                        to={`/profile/${comment.user?._id || comment.user}`}
                        className="block h-7 w-7 overflow-hidden rounded-full ring-1 ring-indigo-500/10 mt-0.5"
                      >
                        <img
                          src={comment.user?.avatar || `https://ui-avatars.com/api/?name=${comment.user?.name || 'User'}`}
                          alt={comment.user?.name || 'User'}
                          className="h-full w-full object-cover"
                        />
                      </Link>
                      <div>
                        <Link
                          to={`/profile/${comment.user?._id || comment.user}`}
                          className="text-xs font-bold text-gray-900 hover:text-indigo-600 transition-colors"
                        >
                          {comment.user?.name || 'User'}
                        </Link>
                        <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{comment.text}</p>
                      </div>
                    </div>

                    {isCommentOwner && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete Comment"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Add Comment Input */}
          <form onSubmit={handleAddComment} className="flex items-center space-x-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
            />
            <button
              type="submit"
              disabled={isSubmittingComment || !newComment.trim()}
              className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PostCard;
