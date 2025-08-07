import { useEffect } from 'react';

export const useOrganizationMemberChanges = (
  onShowRefreshDialog: (message: string) => void
) => {
  useEffect(() => {
    console.log('Organization member changes listener initialized (real-time disabled)');
    
    // Real-time functionality disabled due to connection issues
    // Users will need to manually refresh the page to see changes
    
    return () => {
      console.log('Organization member changes listener cleaned up');
    };
  }, [onShowRefreshDialog]);
};