import { useState, useEffect, useCallback } from "react";
import { getAllRecords, addRecord, updateRecord, deleteRecord, type Database, type DBRecord } from "@/lib/database";
import { Upload } from "lucide-react";

const tables: (keyof Database)[] = ["projects", "internships", "hackathons", "papers", "certificates", "settings"];

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [activeTable, setActiveTable] = useState<keyof Database>("projects");
  const [records, setRecords] = useState<DBRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [newRecord, setNewRecord] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const refresh = () => setRecords(getAllRecords(activeTable));

  useEffect(() => {
    if (authenticated) refresh();
  }, [activeTable, authenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "admin@123") {
      setAuthenticated(true);
    } else {
      setError("Invalid credentials");
    }
  };

  const startEdit = (record: DBRecord) => {
    setEditingId(record.id);
    const flat: Record<string, string> = {};
    Object.entries(record).forEach(([k, v]) => {
      flat[k] = typeof v === "object" ? JSON.stringify(v) : String(v || "");
    });
    setEditData(flat);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const parsed: Record<string, any> = {};
    Object.entries(editData).forEach(([k, v]) => {
      try { parsed[k] = JSON.parse(v); } catch { parsed[k] = v; }
    });
    updateRecord(activeTable, editingId, parsed);
    setEditingId(null);
    refresh();
  };

  const startAdd = () => {
    setNewRecord(true);
    const sample = records[0];
    const blank: Record<string, string> = {};
    if (sample) {
      Object.keys(sample).forEach((k) => { if (k !== "id") blank[k] = ""; });
    }
    setEditData(blank);
  };

  const saveNew = () => {
    const parsed: Record<string, any> = {};
    Object.entries(editData).forEach(([k, v]) => {
      try { parsed[k] = JSON.parse(v); } catch { parsed[k] = v; }
    });
    addRecord(activeTable, parsed);
    setNewRecord(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this record?")) {
      deleteRecord(activeTable, id);
      refresh();
    }
  };

  const handleFileUpload = (field: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setEditData((prev) => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent, field: string) => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(field, file);
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const settingsRecords = getAllRecords("settings");
      const resumeSetting = settingsRecords.find((r) => r.key === "resumePdf");
      if (resumeSetting) {
        updateRecord("settings", resumeSetting.id, { value: reader.result as string });
      } else {
        addRecord("settings", { key: "resumePdf", value: reader.result as string });
      }
      alert("Resume uploaded!");
      refresh();
    };
    reader.readAsDataURL(file);
  };

  const isFileField = (key: string) => ["image", "pdf", "photo", "file", "logo", "avatar", "thumbnail"].includes(key);

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, hsl(225, 45%, 8%) 0%, hsl(228, 40%, 12%) 100%)" }}>
        <div className="glass-card p-8 w-full max-w-sm">
          <h1 className="font-heading font-bold text-primary text-xl mb-6 text-center">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
            <button type="submit" className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: "linear-gradient(135deg, hsl(225, 45%, 8%) 0%, hsl(228, 40%, 12%) 100%)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading font-bold text-primary text-2xl">Admin Panel</h1>
          <button onClick={() => setAuthenticated(false)} className="glass-pill px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground">Logout</button>
        </div>

        {/* Resume upload */}
        <div className="glass-card p-5 mb-6">
          <h3 className="font-heading font-semibold text-foreground mb-2">Resume Management</h3>
          <p className="text-muted-foreground text-xs mb-3">Upload or replace the resume PDF file.</p>
          <label className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors cursor-pointer">
            Upload Resume PDF
            <input type="file" accept=".pdf" className="hidden" onChange={handleResumeUpload} />
          </label>
        </div>

        {/* Table tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {tables.map((t) => (
            <button key={t} onClick={() => { setActiveTable(t); setEditingId(null); setNewRecord(false); }} className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTable === t ? "bg-primary/20 text-primary border border-primary/40" : "glass-card text-muted-foreground hover:text-foreground"}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <button onClick={startAdd} className="mb-4 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">+ Add Record</button>

        {/* New record form */}
        {newRecord && (
          <div className="glass-card p-4 mb-4 space-y-3">
            <h3 className="text-foreground text-sm font-heading font-semibold">New Record</h3>
            {Object.entries(editData).map(([key, val]) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground block mb-1">{key}</label>
                {isFileField(key) ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(`new-${key}`); }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={(e) => handleDrop(e, key)}
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${dragOver === `new-${key}` ? "border-primary bg-primary/10" : "border-border"}`}
                  >
                    <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground mb-2">Drag & drop or click to upload</p>
                    <label className="px-3 py-1 rounded bg-primary/10 border border-primary/30 text-primary text-xs cursor-pointer hover:bg-primary/20">
                      Choose File
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(key, e.target.files[0])} />
                    </label>
                    {val && <p className="text-xs text-emerald-400 mt-2">✓ File loaded</p>}
                  </div>
                ) : (
                  <input value={val} onChange={(e) => setEditData({ ...editData, [key]: e.target.value })} className="w-full px-3 py-1.5 rounded-lg bg-input border border-border text-foreground text-xs focus:outline-none focus:border-primary" />
                )}
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={saveNew} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">Save</button>
              <button onClick={() => setNewRecord(false)} className="px-3 py-1.5 rounded-lg glass-pill text-muted-foreground text-xs">Cancel</button>
            </div>
          </div>
        )}

        {/* Records */}
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record.id} className="glass-card p-4">
              {editingId === record.id ? (
                <div className="space-y-2">
                  {Object.entries(editData).filter(([k]) => k !== "id").map(([key, val]) => (
                    <div key={key}>
                      <label className="text-xs text-muted-foreground block mb-1">{key}</label>
                      {isFileField(key) ? (
                        <div
                          onDragOver={(e) => { e.preventDefault(); setDragOver(`${record.id}-${key}`); }}
                          onDragLeave={() => setDragOver(null)}
                          onDrop={(e) => handleDrop(e, key)}
                          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${dragOver === `${record.id}-${key}` ? "border-primary bg-primary/10" : "border-border"}`}
                        >
                          <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground mb-2">Drag & drop or click to upload</p>
                          <label className="px-3 py-1 rounded bg-primary/10 border border-primary/30 text-primary text-xs cursor-pointer hover:bg-primary/20">
                            Choose File
                            <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(key, e.target.files[0])} />
                          </label>
                          {val && val.startsWith("data:") && <p className="text-xs text-emerald-400 mt-2">✓ File loaded</p>}
                        </div>
                      ) : (
                        <input value={val} onChange={(e) => setEditData({ ...editData, [key]: e.target.value })} className="w-full px-3 py-1.5 rounded-lg bg-input border border-border text-foreground text-xs focus:outline-none focus:border-primary" />
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <button onClick={saveEdit} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">Save</button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg glass-pill text-muted-foreground text-xs">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    {Object.entries(record).filter(([k]) => k !== "id").map(([key, val]) => (
                      <p key={key} className="text-xs">
                        <span className="text-primary font-medium">{key}:</span>{" "}
                        <span className="text-foreground/80">
                          {typeof val === "string" && val.startsWith("data:") ? "📎 File uploaded" : typeof val === "object" ? JSON.stringify(val) : String(val || "—")}
                        </span>
                      </p>
                    ))}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => startEdit(record)} className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs hover:bg-primary/20">Edit</button>
                    <button onClick={() => handleDelete(record.id)} className="px-3 py-1 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs hover:bg-destructive/20">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
