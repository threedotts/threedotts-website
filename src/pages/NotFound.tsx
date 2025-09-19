import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";

const NotFound = () => {
  const location = useLocation();
  
  usePageTitle("Página não encontrada");

  useEffect(() => {
    // User attempting to access non-existent route
    
    // Load ThreeDotts widget script
    const script = document.createElement('script');
    script.src = 'https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/widget-script?organizationId=1e926240-b303-444b-9f8c-57abd9fa657b';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector(`script[src="${script.src}"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Página não encontrada</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Voltar ao Início
        </a>
      </div>
    </div>
  );
};

export default NotFound;
