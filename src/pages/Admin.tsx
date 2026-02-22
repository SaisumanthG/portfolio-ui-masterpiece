import { useState } from "react";
import { Navigate } from "react-router-dom";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "admin@123") {
      setAuthenticated(true);
    } else {
      setError("Invalid credentials");
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4" style={{ background: "linear-gradient(135deg, hsl(235, 50%, 11%) 0%, hsl(240, 45%, 15%) 100%)" }}>
        <div className="glass-card p-8 w-full max-w-sm">
          <h1 className="font-heading font-bold text-primary text-xl mb-6 text-center">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:border-primary"
              />
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8" style={{ background: "linear-gradient(135deg, hsl(235, 50%, 11%) 0%, hsl(240, 45%, 15%) 100%)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading font-bold text-primary text-2xl">Admin Panel</h1>
          <button
            onClick={() => setAuthenticated(false)}
            className="glass-pill px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {["Home", "Projects", "Internships", "Hackathons", "Papers", "Certificates"].map((section) => (
            <div key={section} className="glass-card p-5">
              <h3 className="font-heading font-semibold text-foreground mb-2">{section}</h3>
              <p className="text-muted-foreground text-xs mb-3">Edit {section.toLowerCase()} content, images, and text.</p>
              <button className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                Edit Section
              </button>
            </div>
          ))}
        </div>

        <div className="glass-card p-5 mt-6">
          <h3 className="font-heading font-semibold text-foreground mb-2">Resume Management</h3>
          <p className="text-muted-foreground text-xs mb-3">Upload or replace the resume PDF file.</p>
          <label className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors cursor-pointer">
            Upload Resume PDF
            <input type="file" accept=".pdf" className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
}
