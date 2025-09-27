import React, { useState } from "react";
import { FaHeart, FaRegHeart, FaShareAlt, FaComment } from "react-icons/fa";

export default function StoryCard({ story }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(story.likes);
  const [showComments, setShowComments] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    setLikes(likes + (liked ? -1 : 1));
  };

  return (
    <div className="bg-white/80 rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-4 mb-2">
        {story.avatar && (
          <img src={story.avatar} alt={story.author} className="w-10 h-10 rounded-full object-cover border-2 border-[#00faf3]" />
        )}
        <div className="w-10 h-10 rounded-full bg-[#00faf3] flex items-center justify-center text-white font-bold text-lg">
          {story.author[0]}
        </div>
        <span className="font-semibold text-gray-700">{story.author}</span>
      </div>
      <p className="mb-4 text-gray-800">{story.content}</p>
      <div className="flex items-center gap-6">
        <button onClick={handleLike} className="flex items-center gap-1 text-[#00faf3] hover:scale-110 transition-transform">
          {liked ? <FaHeart /> : <FaRegHeart />} {likes}
        </button>
        <button onClick={() => setShowComments(v => !v)} className="flex items-center gap-1 text-gray-600 hover:text-[#00faf3]">
          <FaComment /> {story.comments.length}
        </button>
        <button className="flex items-center gap-1 text-gray-600 hover:text-[#00faf3]">
          <FaShareAlt /> Share
        </button>
      </div>
      {showComments && (
        <div className="mt-4 bg-white/60 rounded p-3">
          <h4 className="font-semibold mb-2 text-[#00faf3]">Comments</h4>
          {story.comments.length === 0 ? (
            <p className="text-gray-500">No comments yet.</p>
          ) : (
            <ul className="space-y-2">
              {story.comments.map(c => (
                <li key={c.id} className="text-gray-700"><span className="font-semibold">{c.author}:</span> {c.text}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
} 