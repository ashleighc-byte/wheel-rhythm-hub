import { useState, useEffect, useRef, createContext, useContext, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { validateStudentApproval } from "@/lib/airtable";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const checkedEmails = useRef<Set<string>>(new Set());

  const checkApprovalAndSignOut = async (userSession: Session | null) => {
    if (!userSession?.user?.email) return;
    const email = userSession.user.email;
    // Only check once per email per session
    if (checkedEmails.current.has(email)) return;
    checkedEmails.current.add(email);

    try {
      const { approved } = await validateStudentApproval(email);
      if (!approved) {
        await supabase.auth.signOut();
        setSession(null);
      }
    } catch {
      // If check fails, allow access
      console.error("Approval check failed on auth state change");
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
        if (_event === 'SIGNED_IN') {
          // Defer to avoid blocking auth state
          setTimeout(() => checkApprovalAndSignOut(session), 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, loading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
