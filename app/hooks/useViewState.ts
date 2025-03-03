import { useState, useEffect } from 'react';

export type TableMode = 'summary' | 'daily';

export function useViewState() {
  const [tableMode, setTableMode] = useState<TableMode>('summary');
  const [isComponentVisible, setIsComponentVisible] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Handle click outside for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && !(event.target as Element).closest('details')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeDropdown]);

  return {
    tableMode,
    setTableMode,
    isComponentVisible,
    setIsComponentVisible,
    activeDropdown,
    setActiveDropdown,
    isTransitioning,
    setIsTransitioning
  };
} 