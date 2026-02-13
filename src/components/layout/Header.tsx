import { Trophy, Menu, X, LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navLinks = [
    { href: "/", label: "Torneos" },
    { href: "/create", label: "Crear Torneo" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-navy shadow-md transition-transform group-hover:scale-105">
            <Trophy className="h-5 w-5 text-accent" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            Mundo Exa
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.href} to={link.href}>
              <Button
                variant={location.pathname === link.href ? "secondary" : "ghost"}
                className="font-medium"
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-4 w-4" />
                {user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-1" />
                Salir
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="action" size="lg">
                <LogIn className="h-4 w-4 mr-1" />
                Ingresar
              </Button>
            </Link>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card animate-fade-in">
          <nav className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href} onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant={location.pathname === link.href ? "secondary" : "ghost"}
                  className="w-full justify-start font-medium"
                >
                  {link.label}
                </Button>
              </Link>
            ))}
            {user ? (
              <Button variant="ghost" className="w-full justify-start" onClick={() => { signOut(); setMobileMenuOpen(false); }}>
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesión
              </Button>
            ) : (
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="action" className="w-full mt-2">
                  <LogIn className="h-4 w-4 mr-1" />
                  Ingresar
                </Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
