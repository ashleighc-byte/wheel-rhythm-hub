import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import SurveyPage from "./pages/SurveyPage";
import NotFound from "./pages/NotFound";
import Leaderboards from "./pages/Leaderboards";
import Info from "./pages/Info";
import TeacherDashboard from "./pages/TeacherDashboard";
import OgImageDownload from "./pages/OgImageDownload";
import SetupInstructions from "./pages/SetupInstructions";
import SetupInstructionsPrint from "./pages/SetupInstructionsPrint";
import NfcTap from "./pages/NfcTap";
import ResetPassword from "./pages/ResetPassword";
import Webinar from "./pages/Webinar";
import StudentRegistration from "./pages/StudentRegistration";
import RaceGame from "./pages/RaceGame";


const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading, nfcSession } = useAuth();

  if (nfcSession) {
    return <>{children}</>;
  }

  if (loading) {
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

  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, role, loading } = useAuth();

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="font-display text-xl uppercase tracking-wider text-foreground animate-pulse">Loading...</div>
    </div>
  );
  if (!session) return <Navigate to="/auth" replace />;
  if (role !== 'admin') return <Navigate to="/" replace />;

  return <>{children}</>;
};

const SurveyRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, role, loading } = useAuth();

  if (loading) return null;
  if (!session) return <Navigate to="/auth" replace />;
  if (role === 'admin') return <Navigate to="/" replace />;

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
            <Route path="/survey" element={<SurveyRoute><SurveyPage /></SurveyRoute>} />
            <Route path="/" element={<Index />} />
            <Route path="/leaderboards" element={<ProtectedRoute><Leaderboards /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/info" element={<ProtectedRoute><Info /></ProtectedRoute>} />
             <Route path="/teacher-dashboard" element={<AdminRoute><TeacherDashboard /></AdminRoute>} />
             <Route path="/setup-instructions" element={<AdminRoute><SetupInstructions /></AdminRoute>} />
             <Route path="/setup-instructions/print" element={<AdminRoute><SetupInstructionsPrint /></AdminRoute>} />
              <Route path="/og-download" element={<ProtectedRoute><OgImageDownload /></ProtectedRoute>} />
               <Route path="/reset-password" element={<ResetPassword />} />
               <Route path="/webinar" element={<Webinar />} />
               <Route path="/studentregistration" element={<StudentRegistration />} />
             <Route path="/race" element={<ProtectedRoute><RaceGame /></ProtectedRoute>} />
             <Route path="/tap/:token" element={<NfcTap />} />
             <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
