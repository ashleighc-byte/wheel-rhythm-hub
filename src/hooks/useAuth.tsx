import { useState, useEffect, useRef, createContext, useContext, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { validateUserApproval, fetchUserRole, setActiveNfcToken, clearActiveNfcToken } from "@/lib/airtable";

type AppRole = 'admin' | 'student' | null;

export interface NfcSession {
  studentId: string;
  fullName: string;
  firstName: string;
  nfcToken: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: AppRole;
  loading: boolean;
  signOut: () => Promise<void>;
  nfcSession: NfcSession | null;
  setNfcSession: (s: NfcSession | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
  nfcSession: null,
  setNfcSession: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);
  const [nfcSession, setNfcSessionState] = useState<NfcSession | null>(null);

  const setNfcSession = (s: NfcSession | null) => {
    setNfcSessionState(s);
    if (s?.nfcToken) {
      setActiveNfcToken(s.nfcToken);
    } else {
      clearActiveNfcToken();
    }
  };
  const checkedEmails = useRef<Set<string>>(new Set());

  const checkApprovalAndAssignRole = async (userSession: Session | null) => {
    if (!userSession?.user?.email) return;
    const email = userSession.user.email;
    if (email === "demo@freewheeler.nz") {
      const userRole = await fetchUserRole(userSession);
      setRole(userRole);
      return;
    }
    if (checkedEmails.current.has(email)) return;
    checkedEmails.current.add(email);

    try {
      const { approved } = await validateUserApproval(email);
      if (!approved) {
        await supabase.auth.signOut();
        setSession(null);
        setRole(null);
        return;
      }
      // Assign/fetch role via edge function
      const userRole = await fetchUserRole(userSession);
      setRole(userRole);
    } catch {
      console.error("Approval/role check failed on auth state change");
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (_event === 'SIGNED_IN') {
          setLoading(true);
          checkApprovalAndAssignRole(session).finally(() => setLoading(false));
        }
        if (_event === 'SIGNED_OUT') {
          setRole(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkApprovalAndAssignRole(session).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setNfcSession(null); // also clears sessionStorage via wrapper
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, role, loading, signOut, nfcSession, setNfcSession }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
