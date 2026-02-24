import { useState, useEffect, useRef } from "react";
import { getAllRecords, addRecord, updateRecord, deleteRecord, type Database, type DBRecord } from "@/lib/database";
import { Upload, FileUp, ChevronDown, ChevronRight } from "lucide-react";

const contentTables: (keyof Database)[] = ["projects", "internships", "hackathons", "papers", "certificates", "settings"];
const homeTables: (keyof Database)[] = ["homeProfile", "homeAbout", "homeSkills", "homeLinks", "homeCollege"];

const homeTableLabels: Record<string, string> = {
  homeProfile: "Profile (Name, Subtitle, Image)",
  homeAbout: "About Me",
  homeSkills: "Skills",
  homeLinks: "Profile Links (GitHub, LeetCode, etc.)",
  homeCollege: "College Slides",
};

type AdminTab = "Home" | keyof Database;

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("Home");
  const [activeTable, setActiveTable] = useState<keyof Database>("projects");
  const [records, setRecords] = useState<DBRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [newRecord, setNewRecord] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [expandedHomeSections, setExpandedHomeSections] = useState<Record<string, boolean>>({
    homeProfile: true, homeAbout: true, homeSkills: true, homeLinks: true, homeCollege: false,
  });

  const refresh = () => {
    if (activeTab !== "Home") {
      setRecords(getAllRecords(activeTable));
    }
  };

  useEffect(() => {
    if (authenticated && activeTab !== "Home") refresh();
  }, [activeTable, authenticated, activeTab]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "admin@123") {
      setAuthenticated(true);
    } else {
      setError("Invalid credentials");
    }
  };

  const startEdit = (record: DBRecord, table?: keyof Database) => {
    setEditingId(record.id);
    if (table) setActiveTable(table);
    const flat: Record<string, string> = {};
    Object.entries(record).forEach(([k, v]) => {
      flat[k] = typeof v === "object" ? JSON.stringify(v) : String(v || "");
    });
    setEditData(flat);
  };

  const saveEdit = (table?: keyof Database) => {
    if (!editingId) return;
    const t = table || activeTable;
    const parsed: Record<string, any> = {};
    Object.entries(editData).forEach(([k, v]) => {
      try { parsed[k] = JSON.parse(v); } catch { parsed[k] = v; }
    });
    updateRecord(t, editingId, parsed);
    setEditingId(null);
    if (activeTab === "Home") forceUpdate();
    else refresh();
  };

  const startAdd = (table?: keyof Database) => {
    const t = table || activeTable;
    if (table) setActiveTable(t);
    setNewRecord(true);
    const recs = getAllRecords(t);
    const sample = recs[0];
    const blank: Record<string, string> = {};
    if (sample) {
      Object.keys(sample).forEach((k) => { if (k !== "id") blank[k] = ""; });
    }
    setEditData(blank);
  };

  const saveNew = (table?: keyof Database) => {
    const t = table || activeTable;
    const parsed: Record<string, any> = {};
    Object.entries(editData).forEach(([k, v]) => {
      try { parsed[k] = JSON.parse(v); } catch { parsed[k] = v; }
    });
    addRecord(t, parsed);
    setNewRecord(false);
    if (activeTab === "Home") forceUpdate();
    else refresh();
  };

  const handleDelete = (id: string, table?: keyof Database) => {
    const t = table || activeTable;
    if (confirm("Delete this record?")) {
      deleteRecord(t, id);
      if (activeTab === "Home") forceUpdate();
      else refresh();
    }
  };

  // Force re-render for home tab
  const [, setTick] = useState(0);
  const forceUpdate = () => setTick(t => t + 1);

  const handleFileUpload = (field: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setEditData((prev) => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleMultiFileUpload = (field: string, files: FileList) => {
    const file = files[0];
    if (file) handleFileUpload(field, file);
  };

  const handleDrop = (e: React.DragEvent, field: string) => {
    e.preventDefault();
    setDragOver(null);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleMultiFileUpload(field, files);
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
    };
    reader.readAsDataURL(file);
  };

  const isFileField = (key: string) => ["image", "pdf", "photo", "file", "logo", "avatar", "thumbnail"].includes(key.toLowerCase());

  const FileUploadZone = ({ field, value, id }: { field: string; value: string; id: string }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const zoneId = `${id}-${field}`;
    
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(zoneId); }}
        onDragLeave={() => setDragOver(null)}
        onDrop={(e) => handleDrop(e, field)}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
          dragOver === zoneId 
            ? "border-primary bg-primary/10 scale-[1.01]" 
            : "border-border/50 hover:border-primary/40"
        }`}
      >
        <input 
          ref={inputRef} 
          type="file" 
          accept="image/*,.pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.txt" 
          className="hidden" 
          onChange={(e) => e.target.files && handleMultiFileUpload(field, e.target.files)} 
        />
        
        {value && value.startsWith("data:") ? (
          <div className="space-y-3">
            {value.startsWith("data:image") ? (
              <img src={value} alt="Preview" className="max-h-32 mx-auto rounded-lg border border-border/30" />
            ) : (
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                <FileUp className="w-5 h-5" />
                <span className="text-sm font-medium">File uploaded</span>
              </div>
            )}
            <div className="flex justify-center gap-2">
              <button onClick={() => inputRef.current?.click()} className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                Replace
              </button>
              <button onClick={() => setEditData(prev => ({ ...prev, [field]: "" }))} className="px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs hover:bg-destructive/20 transition-colors">
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="w-8 h-8 mx-auto text-muted-foreground/50" />
            <div>
              <p className="text-sm text-muted-foreground">Drag & drop files here</p>
              <p className="text-xs text-muted-foreground/60 mt-1">or</p>
            </div>
            <button 
              onClick={() => inputRef.current?.click()} 
              className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
            >
              Browse Files
            </button>
            <p className="text-[10px] text-muted-foreground/40">Supports: JPG, PNG, GIF, WebP, PDF, DOC</p>
          </div>
        )}
      </div>
    );
  };

  const RecordCard = ({ record, table }: { record: DBRecord; table: keyof Database }) => {
    if (editingId === record.id) {
      return (
        <div className="glass-card p-4 space-y-2">
          {Object.entries(editData).filter(([k]) => k !== "id").map(([key, val]) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground block mb-1">{key}</label>
              {isFileField(key) ? (
                <FileUploadZone field={key} value={val} id={record.id} />
              ) : (
                <input value={val} onChange={(e) => setEditData({ ...editData, [key]: e.target.value })} className="w-full px-3 py-1.5 rounded-lg bg-input border border-border text-foreground text-xs focus:outline-none focus:border-primary" />
              )}
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <button onClick={() => saveEdit(table)} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">Save</button>
            <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg glass-pill text-muted-foreground text-xs">Cancel</button>
          </div>
        </div>
      );
    }

    return (
      <div className="glass-card p-4">
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
            <button onClick={() => startEdit(record, table)} className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs hover:bg-primary/20">Edit</button>
            <button onClick={() => handleDelete(record.id, table)} className="px-3 py-1 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs hover:bg-destructive/20">Delete</button>
          </div>
        </div>
      </div>
    );
  };

  const toggleSection = (key: string) => {
    setExpandedHomeSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

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

  const allTabs: { label: string; value: AdminTab }[] = [
    { label: "Home", value: "Home" },
    ...contentTables.map(t => ({ label: t.charAt(0).toUpperCase() + t.slice(1), value: t as AdminTab })),
  ];

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

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {allTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setActiveTab(tab.value);
                if (tab.value !== "Home") setActiveTable(tab.value as keyof Database);
                setEditingId(null);
                setNewRecord(false);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.value
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "glass-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* HOME TAB - grouped sections */}
        {activeTab === "Home" && (
          <div className="space-y-4">
            {homeTables.map((table) => {
              const tableRecords = getAllRecords(table);
              const isExpanded = expandedHomeSections[table] ?? true;

              return (
                <div key={table} className="glass-card overflow-hidden">
                  {/* Section header */}
                  <button
                    onClick={() => toggleSection(table)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      <h3 className="font-heading font-semibold text-foreground text-sm">{homeTableLabels[table] || table}</h3>
                      <span className="text-muted-foreground text-xs">({tableRecords.length} records)</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); startAdd(table); }}
                      className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                    >
                      + Add
                    </button>
                  </button>

                  {/* Section content */}
                  {isExpanded && (
                    <div className="px-5 pb-4 space-y-3">
                      {/* New record form if adding to this table */}
                      {newRecord && activeTable === table && (
                        <div className="glass-card p-4 space-y-3 border border-primary/30">
                          <h4 className="text-foreground text-xs font-heading font-semibold">New Record</h4>
                          {Object.entries(editData).map(([key, val]) => (
                            <div key={key}>
                              <label className="text-xs text-muted-foreground block mb-1">{key}</label>
                              {isFileField(key) ? (
                                <FileUploadZone field={key} value={val} id="new" />
                              ) : (
                                <input value={val} onChange={(e) => setEditData({ ...editData, [key]: e.target.value })} className="w-full px-3 py-1.5 rounded-lg bg-input border border-border text-foreground text-xs focus:outline-none focus:border-primary" />
                              )}
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <button onClick={() => saveNew(table)} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">Save</button>
                            <button onClick={() => setNewRecord(false)} className="px-3 py-1.5 rounded-lg glass-pill text-muted-foreground text-xs">Cancel</button>
                          </div>
                        </div>
                      )}

                      {tableRecords.map((record) => (
                        <RecordCard key={record.id} record={record} table={table} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* OTHER TABS - standard CRUD */}
        {activeTab !== "Home" && (
          <>
            <button onClick={() => startAdd()} className="mb-4 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">+ Add Record</button>

            {newRecord && (
              <div className="glass-card p-4 mb-4 space-y-3">
                <h3 className="text-foreground text-sm font-heading font-semibold">New Record</h3>
                {Object.entries(editData).map(([key, val]) => (
                  <div key={key}>
                    <label className="text-xs text-muted-foreground block mb-1">{key}</label>
                    {isFileField(key) ? (
                      <FileUploadZone field={key} value={val} id="new" />
                    ) : (
                      <input value={val} onChange={(e) => setEditData({ ...editData, [key]: e.target.value })} className="w-full px-3 py-1.5 rounded-lg bg-input border border-border text-foreground text-xs focus:outline-none focus:border-primary" />
                    )}
                  </div>
                ))}
                <div className="flex gap-2">
                  <button onClick={() => saveNew()} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">Save</button>
                  <button onClick={() => setNewRecord(false)} className="px-3 py-1.5 rounded-lg glass-pill text-muted-foreground text-xs">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {records.map((record) => (
                <RecordCard key={record.id} record={record} table={activeTable} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
