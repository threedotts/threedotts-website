import { useOrganizationMemberChanges } from "@/hooks/useOrganizationMemberChanges";

interface OrganizationMemberListenerProps {
  children: React.ReactNode;
}

export const OrganizationMemberListener = ({ children }: OrganizationMemberListenerProps) => {
  // Hook for listening to organization member changes
  useOrganizationMemberChanges();
  
  return <>{children}</>;
};