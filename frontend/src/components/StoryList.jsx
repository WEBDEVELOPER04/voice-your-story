import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const API_URL = process.env.REACT_APP_API_URL;

function StoryList() {
  const [stories, setStories] = useState([]);
  const [likedStory, setLikedStory] = useState(null);

  const fetchStories = () => {
    fetch(`${API_URL}/stories`)
      .then((res) => res.json())
      .then((data) => {
        const numbered = data.map((story, index) => ({
          ...story,
          label: `Story #${index + 1}`,
        }));
        setStories(numbered);
      });
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleDelete = async (story) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this story?"
    );
    if (!confirmDelete) return;

    const token = localStorage.getItem(`delete_${story.id}`);
    if (!token) {
      alert("You don't have permission to delete this story.");
      return;
    }

    try {
      await fetch(`${API_URL}/stories/${story.id}?delete_token=${token}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delete_token: token }),
      });
      fetchStories();
    } catch (err) {
      console.error("Error deleting story:", err);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const diff = Math.floor((Date.now() - new Date(timestamp)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleLike = async (storyId) => {
    setLikedStory(storyId);
    await fetch(`${API_URL}/stories/${storyId}/like`, {
      method: "POST",
    });
    fetchStories();
    setTimeout(() => setLikedStory(null), 1000); // reset after animation
  };

  return (
    <div className="space-y-4">
      {stories.map((story, index) => (
        <motion.div
          key={story.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-5 rounded-2xl shadow-md bg-white border border-gray-200 flex flex-col gap-3"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg text-indigo-700">{story.label}</h3>
              <p className="text-sm text-gray-500">
                {story.timestamp ? formatTimeAgo(story.timestamp) : "just now"}
              </p>
            </div>
            <button
              onClick={() => handleDelete(story)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              🗑️ Delete
            </button>
          </div>
          <audio
            controls
            src={story.filename}
            className="w-full rounded-lg"
          />
          {/* Reaction Button */}
      <button
        onClick={() => handleLike(story.id)}
        className="flex items-center gap-1 px-2 py-1 rounded-full 
             bg-transparent border-none cursor-pointer 
             hover:text-pink-600 focus:outline-none"
      >
        <motion.span
          animate={
            likedStory === story.id
              ? { scale: [1, 1.5, 1] } // pop effect
              : {}
          }
          transition={{ duration: 0.3 }}
          className="text-xl"
        >
          ❤️
        </motion.span>
        <span className="text-sm text-gray-700">{story.likes}</span>
      </button>
    </motion.div>
      ))}
    </div>
  );
}

export default StoryList;