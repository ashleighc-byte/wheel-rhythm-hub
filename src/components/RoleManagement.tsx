import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ArrowRightLeft, Loader2, Users, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserRole {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

const RoleManagement = () => {
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; email: string; currentRole: string; newRole: string } | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("update-role", {
        body: { action: "list" },
      });
      if (error) throw error;
      setUsers(data.users ?? []);
    } catch (err: any) {
      console.error("Failed to load users:", err);
      toast({ title: "Failed to load users", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async () => {
    if (!confirmTarget) return;
    setUpdating(confirmTarget.id);
    setConfirmTarget(null);

    try {
      const { data, error } = await supabase.functions.invoke("update-role", {
        body: {
          action: "update",
          target_user_id: confirmTarget.id,
          new_role: confirmTarget.newRole,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Role updated",
        description: `${confirmTarget.email} changed from ${confirmTarget.currentRole} to ${confirmTarget.newRole}`,
      });

      // Refresh list
      setUsers((prev) =>
        prev.map((u) =>
          u.id === confirmTarget.id ? { ...u, role: confirmTarget.newRole } : u
        )
      );
    } catch (err: any) {
      console.error("Role update failed:", err);
      toast({ title: "Failed to update role", description: err.message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const getRoleBadgeClass = (role: string) =>
    role === "admin"
      ? "bg-accent text-accent-foreground"
      : "bg-primary/20 text-primary";

  return (
    <div className="border-[3px] border-secondary bg-card p-5 shadow-[6px_6px_0px_hsl(var(--brand-dark))]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
            Role Management
          </h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadUsers}
          disabled={loading}
          className="font-display text-xs uppercase tracking-wider"
        >
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <div className="py-8 text-center">
          <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="font-body text-sm text-muted-foreground">No users found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full font-body text-sm">
            <thead className="bg-secondary text-secondary-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-display text-xs font-bold uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-center font-display text-xs font-bold uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-center font-display text-xs font-bold uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary/40">
              <AnimatePresence>
                {users.map((u) => {
                  const newRole = u.role === "admin" ? "student" : "admin";
                  return (
                    <motion.tr
                      key={u.id}
                      layout
                      className="hover:bg-secondary/20 transition-colors"
                    >
                      <td className="px-4 py-3 text-foreground">{u.email}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block rounded-none px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider ${getRoleBadgeClass(u.role)}`}>
                          {u.role === "admin" ? "Teacher" : "Student"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={updating === u.id}
                          onClick={() =>
                            setConfirmTarget({
                              id: u.id,
                              email: u.email,
                              currentRole: u.role,
                              newRole,
                            })
                          }
                          className="font-display text-[10px] uppercase tracking-wider"
                        >
                          {updating === u.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <ArrowRightLeft className="mr-1 h-3 w-3" />
                              → {newRole === "admin" ? "Teacher" : "Student"}
                            </>
                          )}
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation dialog */}
      <AlertDialog open={!!confirmTarget} onOpenChange={() => setConfirmTarget(null)}>
        <AlertDialogContent className="border-[3px] border-secondary shadow-[6px_6px_0px_hsl(var(--brand-dark))]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 font-display uppercase tracking-wider">
              <AlertTriangle className="h-5 w-5 text-accent" />
              Confirm Role Change
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              Change <strong>{confirmTarget?.email}</strong> from{" "}
              <strong>{confirmTarget?.currentRole === "admin" ? "Teacher" : "Student"}</strong> to{" "}
              <strong>{confirmTarget?.newRole === "admin" ? "Teacher" : "Student"}</strong>?
              <br />
              <span className="mt-2 block text-xs text-muted-foreground">
                This will take effect immediately. The change will be logged.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-display text-xs uppercase tracking-wider">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRoleChange}
              className="tape-element font-display text-xs uppercase tracking-wider"
            >
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RoleManagement;
