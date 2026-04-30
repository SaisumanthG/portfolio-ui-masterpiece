import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { getAllRecords, exportDatabase, importDatabase, resetDatabase, type Database } from "@/lib/database";

const tables: (keyof Database)[] = ["projects", "internships", "hackathons", "papers", "certificates", "settings"];

export default function DatabaseViewer() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [activeTable, setActiveTable] = useState<keyof Database>("projects");
  const [data, setData] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (authenticated) {
      setData(getAllRecords(activeTable));
    }
  }, [activeTable, authenticated, refreshKey]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin@123") {
      setAuthenticated(true);
    } else {
      setError("Invalid password");
    }
  };

  const handleExport = () => {
    const blob = new Blob([exportDatabase()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "portfolio_database.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importDatabase(reader.result as string);
        setRefreshKey((k) => k + 1);
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm("Reset database to defaults? This cannot be undone.")) {
      resetDatabase();
      setRefreshKey((k) => k + 1);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, hsl(225, 45%, 8%) 0%, hsl(228, 40%, 12%) 100%)" }}>
        <div className="glass-card p-8 w-full max-w-sm">
          <h1 className="font-heading font-bold text-primary text-xl mb-6 text-center">Database Access</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
            <button type="submit" className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">Access Database</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: "linear-gradient(135deg, hsl(225, 45%, 8%) 0%, hsl(228, 40%, 12%) 100%)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading font-bold text-primary text-2xl">Database Viewer</h1>
          <div className="flex gap-2">
            <button onClick={handleExport} className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">Export JSON</button>
            <label className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors cursor-pointer">
              Import JSON
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
            <button onClick={handleReset} className="px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors">Reset</button>
            <button onClick={() => setAuthenticated(false)} className="px-3 py-1.5 rounded-lg glass-pill text-muted-foreground text-xs hover:text-foreground">Logout</button>
          </div>
        </div>

        {/* Table tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {tables.map((t) => (
            <button key={t} onClick={() => setActiveTable(t)} className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTable === t ? "bg-primary/20 text-primary border border-primary/40" : "glass-card text-muted-foreground hover:text-foreground"}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Data table */}
        <div className="glass-card p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                {data.length > 0 && Object.keys(data[0]).map((key) => (
                  <th key={key} className="text-left py-2 px-3 text-primary text-xs font-heading font-semibold">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-b border-border/20 hover:bg-secondary/30">
                  {Object.values(row).map((val: any, j) => (
                    <td key={j} className="py-2 px-3 text-foreground text-xs max-w-[200px] truncate">
                      {typeof val === "object" ? JSON.stringify(val) : String(val || "—")}
                    </td>
                  ))}
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td className="py-4 text-center text-muted-foreground text-xs" colSpan={99}>No records</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
