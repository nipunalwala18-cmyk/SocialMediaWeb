import React, { useState } from 'react';
import axios from 'axios';
import { Image, Send } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * CreatePostBox Component.
 * Form allowing authenticated users to publish updates with optional image links.
 */
const CreatePostBox = ({ onPostCreated }) => {
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const characterLimit = 500;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      setIsSubmitting(true);
      setError('');

      const res = await axios.post(`${API_URL}/posts`, {
        text: text.trim(),
        image: imageUrl.trim() || null,
      });

      if (res.data.success) {
        setText('');
        setImageUrl('');
        setShowImageInput(false);
        if (onPostCreated) {
          onPostCreated(res.data.data); // Notify parent component to update feed
        }
      }
    } catch (err) {
      console.error('Post creation error:', err);
      setError(err.response?.data?.error || 'Failed to publish post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTextChange = (e) => {
    if (e.target.value.length <= characterLimit) {
      setText(e.target.value);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Text Input */}
        <div>
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="Share your vibe... What's on your mind?"
            rows={3}
            className="w-full resize-none rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-shadow focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Optional Image URL Input */}
        {showImageInput && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
              Add Image URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {/* Error Banner */}
        {error && <p className="text-xs font-semibold text-red-500">{error}</p>}

        {/* Actions & Submit */}
        <div className="flex items-center justify-between border-t border-gray-50 pt-3">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowImageInput(!showImageInput)}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                showImageInput
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <Image size={16} />
              <span>{showImageInput ? 'Hide Image' : 'Add Image'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-400">
              {characterLimit - text.length} / {characterLimit}
            </span>

            <button
              type="submit"
              disabled={isSubmitting || !text.trim()}
              className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              {isSubmitting ? (
                <span>Publishing...</span>
              ) : (
                <>
                  <Send size={14} />
                  <span>Post</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreatePostBox;
