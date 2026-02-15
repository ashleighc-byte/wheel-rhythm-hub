import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Bike } from "lucide-react";

const navLinks = [
  { label: "HOME", path: "/" },
  { label: "LEADERBOARDS", path: "/leaderboards" },
  { label: "CHALLENGE", path: "/challenge" },
  { label: "LOG SESSION", path: "/log" },
  { label: "INFO", path: "/info" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-primary sticky top-0 z-50 border-b-4 border-secondary">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Bike className="h-8 w-8 text-accent" />
            <div className="font-display text-lg font-bold uppercase leading-tight text-primary-foreground">
              <span className="text-accent">Free Wheeler</span>
              <br />
              <span className="text-xs tracking-widest text-primary-foreground/80">Bike League</span>
            </div>
          </div>
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
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="text-accent md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
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
        </div>
      )}
    </nav>
  );
};

export default Navbar;
