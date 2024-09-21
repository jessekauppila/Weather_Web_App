'use client';

import { useState } from 'react';

export default function LikeButton({ name }) {
  // Accept name as a prop
  // Initialize likes with zero
  const [likes, setLikes] = useState(0);

  function handleClick() {
    console.log('increment like count for', name);
    // Increment the likes
    setLikes(likes + 1);
  }

  return (
    <button onClick={handleClick}>
      {name} - Likes ({likes})
    </button>
  );
}
