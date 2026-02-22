import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Home, FolderOpen, Building2, Trophy, FileText, Award } from "lucide-react";
import PingMe from "./PingMe";

const navItems = [
  { title: "Home", path: "/home", icon: Home },
  { title: "Projects", path: "/projects", icon: FolderOpen },
  { title: "Internships", path: "/internships", icon: Building2 },
  { title: "Hackathons", path: "/hackathons", icon: Trophy },
  { title: "Papers", path: "/papers", icon: FileText },
  { title: "Certificates", path: "/certificates", icon: Award },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/home";

  return (
    <div className="min-h-screen relative">
      {/* Header - always above sidebar blur */}
      <header className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="glass-pill p-2.5 rounded-lg hover:border-primary/50 transition-colors"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>

        {/* Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 md:left-16 md:translate-x-0 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center font-heading font-bold text-primary text-sm">
            S
          </div>
          <span className="text-sm font-heading font-semibold text-foreground hidden sm:block">
            Saisumanth_Portfolio
          </span>
        </div>

        <PingMe />
      </header>

      {/* Sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 backdrop-blur-md bg-background/40"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-[55] w-64 glass-card border-r border-border/50 p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-heading font-bold text-primary text-lg">Portfolio</span>
                <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                        active
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.title}
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="pt-16 px-4 md:px-8 pb-12 max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer - only on home */}
      {isHome && (
        <footer className="text-center py-6 text-muted-foreground text-xs border-t border-border/30">
          © 2026 Saisumanth @ ALL rights reserved
        </footer>
      )}
    </div>
  );
}
