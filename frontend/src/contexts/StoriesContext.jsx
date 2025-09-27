import React, { createContext, useContext, useState } from "react";

const StoriesContext = createContext();

export function StoriesProvider({ children }) {
  const [stories, setStories] = useState([]); // Placeholder, should fetch from API

  // Placeholder functions
  const addStory = (story) => setStories(prev => [story, ...prev]);
  const likeStory = (id) => {};
  const addComment = (storyId, comment) => {};

  return (
    <StoriesContext.Provider value={{ stories, addStory, likeStory, addComment }}>
      {children}
    </StoriesContext.Provider>
  );
}

export function useStories() {
  return useContext(StoriesContext);
} 