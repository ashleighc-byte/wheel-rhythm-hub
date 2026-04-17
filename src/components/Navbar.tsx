import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import brandLogo from "@/assets/fw-logo-oval.png";
import SessionFeedbackForm from "./SessionFeedbackForm";

const studentNavLinks = [
  { label: "ABOUT", path: "/info", tourId: "about" },
  { label: "LEADERBOARD", path: "/leaderboards", tourId: "leaderboards" },
  { label: "MY DASHBOARD", path: "/dashboard", tourId: "dashboard" },
  { label: "BOOK A BIKE", path: "/book", tourId: "book" },
];

const teacherNavLinks = [
  {
    label: "ABOUT THE PILOT",
    path: "/info",
    tourId: "about",
    dropdown: [
      { label: "About the Pilot", path: "/info" },
      { label: "Setup Instructions", path: "/setup-instructions" },
      { label: "Teacher Resources", path: "/teacher-resources" },
    ],
  },
  { label: "LEADERBOARD", path: "/leaderboards", tourId: "leaderboards" },
];

type NavLink = {
  label: string;
  path: string;
  tourId?: string;
  dropdown?: { label: string; path: string }[];
};

const DropdownNavItem = ({ link }: { link: NavLink }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isActive = location.pathname === link.path || link.dropdown?.some(d => d.path === location.pathname);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!link.dropdown) {
    return (
      <Link
        to={link.path}
        data-tour={link.tourId}
        className={`px-4 py-2 font-display text-sm font-semibold uppercase tracking-wider transition-colors hover:text-primary-foreground ${
          isActive ? "text-primary-foreground underline underline-offset-4" : "text-accent"
        }`}
      >
        {link.label}
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        data-tour={link.tourId}
        className={`flex items-center gap-1 px-4 py-2 font-display text-sm font-semibold uppercase tracking-wider transition-colors hover:text-primary-foreground ${
          isActive ? "text-primary-foreground underline underline-offset-4" : "text-accent"
        }`}
      >
        {link.label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 min-w-[180px] border-[2px] border-secondary bg-primary shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
          {link.dropdown.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 font-display text-xs font-semibold uppercase tracking-wider text-accent transition-colors hover:bg-primary/80 hover:text-primary-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const { signOut, role } = useAuth();
  const isAdmin = role === 'admin';
  const navLinks: NavLink[] = isAdmin ? teacherNavLinks : studentNavLinks;

  return (
    <>
      <nav className="bg-primary sticky top-0 z-50 border-b-4 border-secondary">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={brandLogo}
              alt="Freewheeler Bike League"
              className="h-12 w-auto object-contain rounded"
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden gap-1 md:flex items-center">
            {navLinks.map((link) => (
              <DropdownNavItem key={link.label} link={link} />
            ))}
            {!isAdmin && (
              <button
                onClick={() => setLogOpen(true)}
                data-tour="log-ride"
                className="px-4 py-2 font-display text-sm font-semibold uppercase tracking-wider text-accent transition-colors hover:text-primary-foreground"
              >
                LOG A RIDE
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={signOut}
              data-tour="signout"
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
              <div key={link.label}>
                {link.dropdown ? (
                  link.dropdown.map((sub) => (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      onClick={() => setOpen(false)}
                      className="block py-3 font-display text-sm font-semibold uppercase tracking-wider text-accent transition-colors hover:text-primary-foreground"
                    >
                      {sub.label}
                    </Link>
                  ))
                ) : (
                  <Link
                    to={link.path}
                    onClick={() => setOpen(false)}
                    className="block py-3 font-display text-sm font-semibold uppercase tracking-wider text-accent transition-colors hover:text-primary-foreground"
                  >
                    {link.label}
                  </Link>
                )}
              </div>
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
