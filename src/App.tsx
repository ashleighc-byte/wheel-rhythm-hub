import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { hasCompletedPrePilotSurvey } from "@/lib/airtable";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import PrePilotSurvey from "./pages/PrePilotSurvey";
import NotFound from "./pages/NotFound";
import Leaderboards from "./pages/Leaderboards";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, user, loading } = useAuth();
  const [surveyChecked, setSurveyChecked] = useState(false);
  const [surveyDone, setSurveyDone] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    hasCompletedPrePilotSurvey(user.email)
      .then((done) => {
        setSurveyDone(done);
        setSurveyChecked(true);
      })
      .catch(() => {
        // If check fails, allow access
        setSurveyDone(true);
        setSurveyChecked(true);
      });
  }, [user?.email]);

  if (loading || (!surveyChecked && session)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="font-display text-xl uppercase tracking-wider text-foreground animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!surveyDone) {
    return <Navigate to="/survey" replace />;
  }

  return <>{children}</>;
};

const SurveyRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (!session) return <Navigate to="/auth" replace />;

  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (session) return <Navigate to="/" replace />;

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
            <Route path="/survey" element={<SurveyRoute><PrePilotSurvey /></SurveyRoute>} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/leaderboards" element={<ProtectedRoute><Leaderboards /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
