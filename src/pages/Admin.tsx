import { useState, useEffect, useRef, useCallback } from "react";
import { getAllRecords, addRecord, updateRecord, deleteRecord, type Database, type DBRecord } from "@/lib/database";
import { Upload, FileUp, ChevronDown, ChevronRight, BarChart3, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Check } from "lucide-react";

const contentTables: (keyof Database)[] = ["projects", "internships", "hackathons", "papers", "certificates", "settings"];
const homeTables: (keyof Database)[] = ["homeProfile", "homeAbout", "homeSkills", "homeLinks", "homeCollege"];

const homeTableLabels: Record<string, string> = {
  homeProfile: "Profile (Name, Subtitle, Image)",
  homeAbout: "About Me",
  homeSkills: "Skills",
  homeLinks: "Profile Links (GitHub, LeetCode, etc.)",
  homeCollege: "College Slides",
};

type AdminTab = "Home" | "Stats" | "Customize" | keyof Database;

const isFileField = (key: string) => {
  const lower = key.toLowerCase();
  return ["image", "pdf", "photo", "file", "logo", "avatar", "thumbnail"].some(
    (word) => lower.includes(word)
  );
};

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
  // Nudge offsets: stored as JSON string "x,y" in percentages
  const [nudgeOffsets, setNudgeOffsets] = useState<Record<string, { x: number; y: number }>>({});

  const refresh = () => {
    if (activeTab !== "Home" && activeTab !== "Stats" && activeTab !== "Customize") {
      setRecords(getAllRecords(activeTable));
    }
  };

  useEffect(() => {
    if (authenticated && activeTab !== "Home" && activeTab !== "Stats" && activeTab !== "Customize") refresh();
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
    // Load nudge offsets
    const offsets: Record<string, { x: number; y: number }> = {};
    Object.keys(flat).forEach(k => {
      if (isFileField(k) && flat[k + "Nudge"]) {
        try {
          const [x, y] = flat[k + "Nudge"].split(",").map(Number);
          offsets[k] = { x: x || 0, y: y || 0 };
        } catch { offsets[k] = { x: 0, y: 0 }; }
      }
    });
    setNudgeOffsets(offsets);
  };

  const saveEdit = (table?: keyof Database) => {
    if (!editingId) return;
    const t = table || activeTable;
    const parsed: Record<string, any> = {};
    // Save nudge offsets into editData
    const finalData = { ...editData };
    Object.entries(nudgeOffsets).forEach(([field, offset]) => {
      if (offset.x !== 0 || offset.y !== 0) {
        finalData[field + "Nudge"] = `${offset.x},${offset.y}`;
      }
    });
    Object.entries(finalData).forEach(([k, v]) => {
      try { parsed[k] = JSON.parse(v); } catch { parsed[k] = v; }
    });
    updateRecord(t, editingId, parsed);
    setEditingId(null);
    setNudgeOffsets({});
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
      Object.keys(sample).forEach((k) => { if (k !== "id" && !k.endsWith("Nudge")) blank[k] = ""; });
    }
    setEditData(blank);
    setNudgeOffsets({});
  };

  const saveNew = (table?: keyof Database) => {
    const t = table || activeTable;
    const parsed: Record<string, any> = {};
    const finalData = { ...editData };
    Object.entries(nudgeOffsets).forEach(([field, offset]) => {
      if (offset.x !== 0 || offset.y !== 0) {
        finalData[field + "Nudge"] = `${offset.x},${offset.y}`;
      }
    });
    Object.entries(finalData).forEach(([k, v]) => {
      try { parsed[k] = JSON.parse(v); } catch { parsed[k] = v; }
    });
    addRecord(t, parsed);
    setNewRecord(false);
    setNudgeOffsets({});
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

  const nudge = (field: string, dir: "up" | "down" | "left" | "right") => {
    setNudgeOffsets(prev => {
      const current = prev[field] || { x: 0, y: 0 };
      const step = 5;
      const next = { ...current };
      if (dir === "up") next.y = Math.max(-50, current.y - step);
      if (dir === "down") next.y = Math.min(50, current.y + step);
      if (dir === "left") next.x = Math.max(-50, current.x - step);
      if (dir === "right") next.x = Math.min(50, current.x + step);
      return { ...prev, [field]: next };
    });
  };

  const getPreviewShape = (field: string): "circle" | "rectangle" => {
    const lower = field.toLowerCase();
    if (lower === "image" && activeTable === "homeProfile") return "circle";
    if (lower === "collegeimage") return "circle";
    return "rectangle";
  };

  const FileUploadZone = ({ field, value, id }: { field: string; value: string; id: string }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const zoneId = `${id}-${field}`;
    const shape = getPreviewShape(field);
    const offset = nudgeOffsets[field] || { x: 0, y: 0 };

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/") || item.type === "application/pdf") {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) handleFileUpload(field, file);
          break;
        }
      }
    }, [field]);

    return (
      <div
        tabIndex={0}
        onPaste={handlePaste}
        onDragOver={(e) => { e.preventDefault(); setDragOver(zoneId); }}
        onDragLeave={() => setDragOver(null)}
        onDrop={(e) => handleDrop(e, field)}
        className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
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
            <p className="text-[10px] text-muted-foreground/60 absolute top-1 right-2">Live Preview</p>
            <div className="flex items-center justify-center">
              {value.startsWith("data:image") ? (
                <div
                  className={`overflow-hidden border-2 border-primary/30 ${
                    shape === "circle"
                      ? "w-28 h-28 rounded-full"
                      : "w-full max-w-xs h-36 rounded-lg"
                  }`}
                >
                  <img
                    src={value}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    style={{ objectPosition: `${50 + offset.x}% ${50 + offset.y}%` }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-emerald-400 py-4">
                  <FileUp className="w-5 h-5" />
                  <span className="text-sm font-medium">File uploaded</span>
                </div>
              )}
            </div>

            {/* Nudge Controls */}
            {value.startsWith("data:image") && (
              <div className="flex flex-col items-center gap-1">
                <p className="text-[10px] text-muted-foreground/50 mb-1">Position</p>
                <div className="flex flex-col items-center gap-0.5">
                  <button type="button" onClick={() => nudge(field, "up")} className="w-7 h-7 rounded-full bg-secondary/80 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex gap-0.5">
                    <button type="button" onClick={() => nudge(field, "left")} className="w-7 h-7 rounded-full bg-secondary/80 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => { setNudgeOffsets(prev => ({ ...prev, [field]: { x: 0, y: 0 } })); }} className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors" title="Reset">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </button>
                    <button type="button" onClick={() => nudge(field, "right")} className="w-7 h-7 rounded-full bg-secondary/80 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button type="button" onClick={() => nudge(field, "down")} className="w-7 h-7 rounded-full bg-secondary/80 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                {(offset.x !== 0 || offset.y !== 0) && (
                  <p className="text-[9px] text-primary/60">x:{offset.x}% y:{offset.y}%</p>
                )}
              </div>
            )}

            <div className="flex justify-center gap-2">
              <button type="button" onClick={() => inputRef.current?.click()} className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                Replace
              </button>
              <button type="button" onClick={() => setEditData(prev => ({ ...prev, [field]: "" }))} className="px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs hover:bg-destructive/20 transition-colors">
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-7 h-7 mx-auto text-muted-foreground/50" />
            <div>
              <p className="text-xs text-muted-foreground">Drag & drop, browse, or <span className="text-primary font-medium">Ctrl+V</span> to paste</p>
            </div>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                Browse Files
              </button>
            </div>
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
          {Object.entries(editData).filter(([k]) => k !== "id" && !k.endsWith("Nudge")).map(([key, val]) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground block mb-1">{key}</label>
              {isFileField(key) ? (
                <FileUploadZone field={key} value={val} id={record.id} />
              ) : key === "icon" ? (
                <div className="space-y-2">
                  <input value={val} onChange={(e) => setEditData({ ...editData, [key]: e.target.value })} className="w-full px-3 py-1.5 rounded-lg bg-input border border-border text-foreground text-xs focus:outline-none focus:border-primary" placeholder="Type icon name or upload image below" />
                  <FileUploadZone field={key} value={val.startsWith("data:") ? val : ""} id={record.id + "-icon"} />
                </div>
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
            {Object.entries(record).filter(([k]) => k !== "id" && !k.endsWith("Nudge")).map(([key, val]) => (
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

  // Settings tab - resume management
  const SettingsTab = () => {
    const settingsRecords = getAllRecords("settings");

    const setAsDownload = (id: string) => {
      // Mark all as not active, mark this one as active
      settingsRecords.forEach(r => {
        updateRecord("settings", r.id, { active: r.id === id ? "true" : "false" });
      });
      forceUpdate();
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-foreground">Resume Management</h3>
          <button onClick={() => startAdd("settings")} className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">+ Add Resume</button>
        </div>
        <p className="text-muted-foreground text-xs mb-4">Upload multiple resumes. Set one as the active download.</p>

        {newRecord && activeTable === "settings" && (
          <div className="glass-card p-4 mb-4 space-y-3 border border-primary/30">
            <h4 className="text-foreground text-xs font-heading font-semibold">New Resume</h4>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Label</label>
              <input value={editData.key || ""} onChange={(e) => setEditData({ ...editData, key: e.target.value })} className="w-full px-3 py-1.5 rounded-lg bg-input border border-border text-foreground text-xs focus:outline-none focus:border-primary" placeholder="e.g. Resume v2, SDE Resume" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">PDF File</label>
              <FileUploadZone field="value" value={editData.value || ""} id="new-resume" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { saveNew("settings"); }} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">Save</button>
              <button onClick={() => setNewRecord(false)} className="px-3 py-1.5 rounded-lg glass-pill text-muted-foreground text-xs">Cancel</button>
            </div>
          </div>
        )}

        {settingsRecords.map((record) => {
          if (editingId === record.id) {
            return (
              <div key={record.id} className="glass-card p-4 space-y-3 border border-primary/30">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Label</label>
                  <input value={editData.key || ""} onChange={(e) => setEditData({ ...editData, key: e.target.value })} className="w-full px-3 py-1.5 rounded-lg bg-input border border-border text-foreground text-xs focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">PDF File</label>
                  <FileUploadZone field="value" value={editData.value || ""} id={record.id} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit("settings")} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">Save</button>
                  <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg glass-pill text-muted-foreground text-xs">Cancel</button>
                </div>
              </div>
            );
          }

          const isActive = record.active === "true" || (settingsRecords.filter(r => r.active === "true").length === 0 && record.key === "resumePdf");

          return (
            <div key={record.id} className={`glass-card p-4 flex items-center justify-between ${isActive ? "border border-primary/40" : ""}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-foreground text-sm font-medium">{record.key || "Untitled"}</p>
                  {isActive && (
                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Active Download
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-xs mt-1">
                  {record.value && (record.value as string).startsWith("data:") ? "📎 PDF uploaded" : "No file"}
                </p>
              </div>
              <div className="flex gap-2">
                {!isActive && (
                  <button onClick={() => setAsDownload(record.id)} className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs hover:bg-emerald-500/20">
                    Set Active
                  </button>
                )}
                <button onClick={() => startEdit(record, "settings")} className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs hover:bg-primary/20">Edit</button>
                <button onClick={() => handleDelete(record.id, "settings")} className="px-3 py-1 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs hover:bg-destructive/20">Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const DownloadStats = () => {
    const db = JSON.parse(localStorage.getItem("portfolio_db") || "{}");
    const stats: { id: string; paperId: string; paperTitle: string; timestamp: string }[] = db.downloadStats || [];
    const grouped: Record<string, { title: string; count: number; lastDownload: string }> = {};
    stats.forEach((s) => {
      if (!grouped[s.paperId]) grouped[s.paperId] = { title: s.paperTitle, count: 0, lastDownload: s.timestamp };
      grouped[s.paperId].count++;
      if (s.timestamp > grouped[s.paperId].lastDownload) grouped[s.paperId].lastDownload = s.timestamp;
    });

    return (
      <div className="space-y-4">
        <div className="glass-card p-5">
          <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Download Statistics
          </h3>
          <p className="text-muted-foreground text-xs mb-4">Total downloads: <span className="text-primary font-bold">{stats.length}</span></p>
          {Object.keys(grouped).length === 0 ? (
            <p className="text-muted-foreground text-xs">No downloads recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(grouped).map(([id, data]) => (
                <div key={id} className="glass-card p-3 flex items-center justify-between">
                  <div>
                    <p className="text-foreground text-xs font-medium">{data.title}</p>
                    <p className="text-muted-foreground text-[10px]">Last: {new Date(data.lastDownload).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-primary font-heading font-bold text-lg">{data.count}</span>
                    <p className="text-muted-foreground text-[10px]">downloads</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Customization tab - box sizes per page
  const CustomizeTab = () => {
    const raw = localStorage.getItem("portfolio_customizations");
    const [customizations, setCustomizations] = useState<Record<string, Record<string, number>>>(() => {
      try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
    });

    const pages = [
      { key: "projects", label: "Projects", boxes: [{ key: "cardHeight", label: "Card Image Height (px)", min: 120, max: 400, default: 192 }] },
      { key: "internships", label: "Internships", boxes: [{ key: "imageHeight", label: "Image Box Height (px)", min: 80, max: 300, default: 160 }, { key: "cardPadding", label: "Card Padding (px)", min: 8, max: 40, default: 16 }] },
      { key: "hackathons", label: "Hackathons", boxes: [{ key: "cardHeight", label: "Card Image Height (px)", min: 120, max: 400, default: 192 }] },
      { key: "papers", label: "Papers", boxes: [{ key: "imageHeight", label: "Image Box Height (px)", min: 120, max: 400, default: 224 }] },
      { key: "certificates", label: "Certificates", boxes: [{ key: "imageHeight", label: "Certificate Image Height (px)", min: 120, max: 400, default: 224 }] },
      { key: "home", label: "Home", boxes: [{ key: "profileSize", label: "Profile Circle Size (px)", min: 100, max: 300, default: 192 }, { key: "collegeImageHeight", label: "College Slide Image Height (px)", min: 120, max: 400, default: 256 }] },
    ];

    const getValue = (page: string, box: string, def: number) => customizations[page]?.[box] ?? def;

    const setValue = (page: string, box: string, val: number) => {
      const next = { ...customizations, [page]: { ...customizations[page], [box]: val } };
      setCustomizations(next);
      localStorage.setItem("portfolio_customizations", JSON.stringify(next));
    };

    const resetAll = () => {
      setCustomizations({});
      localStorage.removeItem("portfolio_customizations");
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading font-semibold text-foreground">Box Size Customization</h3>
          <button onClick={resetAll} className="px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs hover:bg-destructive/20 transition-colors">Reset All</button>
        </div>
        <p className="text-muted-foreground text-xs mb-4">Adjust image box sizes for each page. Changes apply instantly.</p>

        {pages.map(page => (
          <div key={page.key} className="glass-card p-4 space-y-3">
            <h4 className="font-heading font-semibold text-foreground text-sm">{page.label}</h4>
            {page.boxes.map(box => {
              const val = getValue(page.key, box.key, box.default);
              return (
                <div key={box.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground">{box.label}</label>
                    <span className="text-xs text-primary font-medium">{val}px</span>
                  </div>
                  <input
                    type="range"
                    min={box.min}
                    max={box.max}
                    value={val}
                    onChange={(e) => setValue(page.key, box.key, Number(e.target.value))}
                    className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="mt-2 rounded-lg border border-border/30 overflow-hidden" style={{ height: Math.min(val, 120) }}>
                    <div className="w-full h-full bg-secondary/40 flex items-center justify-center text-muted-foreground/40 text-[10px]">
                      Preview: {val}px
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
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
    { label: "📊 Stats", value: "Stats" },
    ...contentTables.filter(t => t !== "settings").map(t => ({ label: t.charAt(0).toUpperCase() + t.slice(1), value: t as AdminTab })),
    { label: "Settings", value: "settings" as AdminTab },
    { label: "🎨 Customize", value: "Customize" },
  ];

  return (
    <div className="min-h-screen p-6" style={{ background: "linear-gradient(135deg, hsl(225, 45%, 8%) 0%, hsl(228, 40%, 12%) 100%)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading font-bold text-primary text-2xl">Admin Panel</h1>
          <button onClick={() => setAuthenticated(false)} className="glass-pill px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground">Logout</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {allTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setActiveTab(tab.value);
                if (tab.value !== "Home" && tab.value !== "Stats") setActiveTable(tab.value as keyof Database);
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

        {/* STATS TAB */}
        {activeTab === "Stats" && <DownloadStats />}

        {/* CUSTOMIZE TAB */}
        {activeTab === "Customize" && <CustomizeTab />}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && <SettingsTab />}

        {/* HOME TAB */}
        {activeTab === "Home" && (
          <div className="space-y-4">
            {homeTables.map((table) => {
              const tableRecords = getAllRecords(table);
              const isExpanded = expandedHomeSections[table] ?? true;

              return (
                <div key={table} className="glass-card overflow-hidden">
                  <div
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-primary/5 transition-colors cursor-pointer"
                    onClick={() => toggleSection(table)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      <h3 className="font-heading font-semibold text-foreground text-sm">{homeTableLabels[table] || table}</h3>
                      <span className="text-muted-foreground text-xs">({tableRecords.length} records)</span>
                    </div>
                    <span
                      onClick={(e) => { e.stopPropagation(); startAdd(table); }}
                      className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      + Add
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-4 space-y-3">
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

        {/* OTHER TABS (not Home, Stats, Settings) */}
        {activeTab !== "Home" && activeTab !== "Stats" && activeTab !== "settings" && activeTab !== "Customize" && (
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
