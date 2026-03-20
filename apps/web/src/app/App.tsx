import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toast';
import { AbilityProvider } from '@/components/providers/AbilityProvider';
import { AppRoutes } from './routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <AbilityProvider>
              <AppRoutes />
            </AbilityProvider>
            <Toaster />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
