import { useState } from 'react';
import { useOrganizationMemberChanges } from "@/hooks/useOrganizationMemberChanges";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface OrganizationMemberListenerProps {
  children: React.ReactNode;
}

export const OrganizationMemberListener = ({ children }: OrganizationMemberListenerProps) => {
  const [showRefreshDialog, setShowRefreshDialog] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');

  const handleShowRefreshDialog = (message: string) => {
    setRefreshMessage(message);
    setShowRefreshDialog(true);
  };

  const handleRefresh = () => {
    console.log('User confirmed page refresh');
    window.location.reload();
  };

  // Hook for listening to organization member changes
  useOrganizationMemberChanges(handleShowRefreshDialog);
  
  return (
    <>
      {children}
      <AlertDialog open={showRefreshDialog} onOpenChange={setShowRefreshDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alteração Detectada</AlertDialogTitle>
            <AlertDialogDescription>
              {refreshMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleRefresh}>
              Atualizar Página
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};