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
import FourWeekCheckIn from "./pages/FourWeekCheckIn";
import NotFound from "./pages/NotFound";
import Leaderboards from "./pages/Leaderboards";
import Info from "./pages/Info";
import PostPilotSurvey from "./pages/PostPilotSurvey";
import TeacherDashboard from "./pages/TeacherDashboard";
import OgImageDownload from "./pages/OgImageDownload";
import SetupInstructions from "./pages/SetupInstructions";
import SetupInstructionsPrint from "./pages/SetupInstructionsPrint";
import NfcTap from "./pages/NfcTap";
import ResetPassword from "./pages/ResetPassword";
import Webinar from "./pages/Webinar";
import StudentRegistration from "./pages/StudentRegistration";


const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, user, role, loading, nfcSession } = useAuth();
  const [surveyChecked, setSurveyChecked] = useState(false);
  const [surveyDone, setSurveyDone] = useState(false);

  useEffect(() => {
    // NFC sessions skip the survey gate entirely
    if (nfcSession) {
      setSurveyDone(true);
      setSurveyChecked(true);
      return;
    }

    // Wait until role is resolved (not null AND not still loading)
    if (loading) return;
    if (!user?.email) return;
    // role is null while loading — only proceed once we have a definitive role
    if (role === null) return;

    // Admins (teachers) skip the survey entirely
    if (role === 'admin') {
      setSurveyDone(true);
      setSurveyChecked(true);
      return;
    }
    hasCompletedPrePilotSurvey(user.email)
      .then((done) => {
        setSurveyDone(done);
        setSurveyChecked(true);
      })
      .catch(() => {
        setSurveyDone(true);
        setSurveyChecked(true);
      });
  }, [user?.email, role, loading, nfcSession]);

  // NFC-authenticated students get through
  if (nfcSession) {
    return <>{children}</>;
  }

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
  // Admins should never see the survey — send them home
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
            <Route path="/survey" element={<SurveyRoute><PrePilotSurvey /></SurveyRoute>} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/leaderboards" element={<ProtectedRoute><Leaderboards /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/info" element={<ProtectedRoute><Info /></ProtectedRoute>} />
             <Route path="/post-pilot-survey" element={<ProtectedRoute><PostPilotSurvey /></ProtectedRoute>} />
             <Route path="/four-week-check-in" element={<SurveyRoute><FourWeekCheckIn /></SurveyRoute>} />
             <Route path="/teacher-dashboard" element={<AdminRoute><TeacherDashboard /></AdminRoute>} />
             <Route path="/setup-instructions" element={<AdminRoute><SetupInstructions /></AdminRoute>} />
             <Route path="/setup-instructions/print" element={<SetupInstructionsPrint />} />
              <Route path="/og-download" element={<OgImageDownload />} />
               <Route path="/reset-password" element={<ResetPassword />} />
               <Route path="/webinar" element={<Webinar />} />
               <Route path="/studentregistration" element={<StudentRegistration />} />
             <Route path="/tap/:token" element={<NfcTap />} />
             <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
