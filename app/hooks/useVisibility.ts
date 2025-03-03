import { useState, useTransition } from 'react';

export function useVisibility() {
  const [isComponentVisible, setIsComponentVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const showContent = isComponentVisible && !isLoading && !isPending;

  const getVisibilityClass = () => 
    `transition-opacity duration-200 ${showContent ? 'opacity-100' : 'opacity-0'}`;

  return {
    isComponentVisible,
    setIsComponentVisible,
    isLoading,
    setIsLoading,
    isPending,
    startTransition,
    showContent,
    getVisibilityClass
  };
}