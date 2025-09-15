import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { globalErrorHandler } from "@/lib/errorHandler";
import Index from "./pages/Index";
import Spark from "./pages/Spark";
import Incubator from "./pages/Incubator";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
// Subscription and settings routes are removed for MVP
import DiscoverReadonly from "./pages/DiscoverReadonly";
import Profile from "./pages/Profile";
import Match from "./pages/Match";
import Onboarding from "./pages/Onboarding";
import { FEATURES } from "@/config/features";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('auth') || error?.message?.includes('unauthorized')) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/spark" element={<Spark />} />
                <Route path="/incubator" element={<Incubator />} />
                {FEATURES.DISCOVER && (
                  <Route path="/discover" element={<DiscoverReadonly />} />
                )}
                {FEATURES.PROFILE && (
                  <Route path="/profile" element={<Profile />} />
                )}
                {FEATURES.MATCH && (
                  <Route path="/match" element={<Match />} />
                )}
                <Route path="/onboarding" element={<Onboarding />} />
                {/* Non-core routes are removed for MVP */}
                <Route path="/auth" element={<Auth />} />
                {/* Settings route removed for MVP */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </I18nProvider>
  </ErrorBoundary>
);

export default App;
