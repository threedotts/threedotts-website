import { useEffect } from 'react';

export const usePageTitle = (title: string) => {
  useEffect(() => {
    const originalTitle = document.title;
    
    if (title === 'Threedotts') {
      document.title = title;
    } else {
      document.title = `Threedotts | ${title}`;
    }
    
    return () => {
      document.title = originalTitle;
    };
  }, [title]);
};