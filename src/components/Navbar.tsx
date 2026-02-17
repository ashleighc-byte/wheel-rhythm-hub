import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import brandLogo from "@/assets/fw-logo-new.png";
import SessionFeedbackForm from "./SessionFeedbackForm";

const studentNavLinks = [
  { label: "HOME", path: "/" },
  { label: "ABOUT THE PILOT", path: "/info" },
  { label: "LEADERBOARDS", path: "/leaderboards" },
  { label: "YOUR STATS", path: "/dashboard" },
];

const teacherNavLinks = [
  { label: "HOME", path: "/" },
  { label: "ABOUT THE PILOT", path: "/info" },
  { label: "LEADERBOARDS", path: "/leaderboards" },
  { label: "TEACHER DASHBOARD", path: "/teacher-dashboard" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const { signOut, role } = useAuth();
  const isAdmin = role === 'admin';
  const navLinks = isAdmin ? teacherNavLinks : studentNavLinks;

  return (
    <>
      <nav className="bg-primary sticky top-0 z-50 border-b-4 border-secondary">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={brandLogo}
              alt="Free Wheeler Bike League"
              className="h-12 w-auto object-contain rounded"
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className="px-4 py-2 font-display text-sm font-semibold uppercase tracking-wider text-accent transition-colors hover:text-primary-foreground"
              >
                {link.label}
              </Link>
            ))}
            {!isAdmin && (
              <button
                onClick={() => setLogOpen(true)}
                className="px-4 py-2 font-display text-sm font-semibold uppercase tracking-wider text-accent transition-colors hover:text-primary-foreground"
              >
                LOG A RIDE
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={signOut}
              className="hidden items-center gap-1 px-3 py-2 font-display text-xs font-semibold uppercase tracking-wider text-accent transition-colors hover:text-primary-foreground md:flex"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
            {/* Mobile toggle */}
            <button
              onClick={() => setOpen(!open)}
              className="text-accent md:hidden"
              aria-label="Toggle menu"
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="border-t-2 border-secondary/30 bg-primary px-4 pb-4 md:hidden">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                onClick={() => setOpen(false)}
                className="block py-3 font-display text-sm font-semibold uppercase tracking-wider text-accent transition-colors hover:text-primary-foreground"
              >
                {link.label}
              </Link>
            ))}
            {!isAdmin && (
              <button
                onClick={() => { setLogOpen(true); setOpen(false); }}
                className="block w-full text-left py-3 font-display text-sm font-semibold uppercase tracking-wider text-accent transition-colors hover:text-primary-foreground"
              >
                LOG A RIDE
              </button>
            )}
            <button
              onClick={() => { signOut(); setOpen(false); }}
              className="flex w-full items-center gap-2 py-3 font-display text-sm font-semibold uppercase tracking-wider text-accent transition-colors hover:text-primary-foreground"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        )}
      </nav>

      <SessionFeedbackForm open={logOpen} onOpenChange={setLogOpen} />
    </>
  );
};

export default Navbar;
