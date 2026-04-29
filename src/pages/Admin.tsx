import { useState, useEffect, useRef, useCallback } from "react";
import { getAllRecords, fetchRecords, addRecord, updateRecord, deleteRecord, getDownloadStats, getCustomizations, saveCustomizations, getAppearance, saveAppearance, type Database, type DBRecord } from "@/lib/database";
import { Upload, FileUp, ChevronDown, ChevronRight, BarChart3, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Check, ZoomIn, ZoomOut, RotateCcw, Palette, Type, History, LayoutTemplate } from "lucide-react";
import { applyLayoutTemplate, applyThemeColors, applyThemeFont, applyThemeRadius, loadFontIfNeeded } from "@/lib/theme";
import { professionalThemes, type ProfessionalTheme } from "@/lib/professional-themes";

const contentTables: (keyof Database)[] = ["projects", "internships", "hackathons", "papers", "certificates", "settings"];
const homeTables: (keyof Database)[] = ["homeProfile", "homeAbout", "homeSkills", "homeLinks", "homeCollege"];

const homeTableLabels: Record<string, string> = {
  homeProfile: "Home Hero & Logo (Name, Subtitle, Hero Image, Logo)",
  homeAbout: "About Me",
  homeSkills: "Skills",
  homeLinks: "Profile Links (GitHub, LeetCode, etc.)",
  homeCollege: "College Slides",
};

const fieldLabels: Record<string, string> = {
  image: "Hero Image",
  logoImage: "Logo Image",
  collegeImage: "College Image",
  previewImage: "Preview Image",
  projectUrl: "View Project Link",
  github: "GitHub Link",
};

type AdminTab = "Home" | "Stats" | "Customize" | "Colours" | "Fonts" | "Themes" | keyof Database;

const isFileField = (key: string) => {
  const lower = key.toLowerCase();
  return ["image", "pdf", "photo", "file", "logo", "avatar", "thumbnail", "previewimage"].some(
    (word) => lower.includes(word)
  );
};

// Generate 100+ professional dark color palettes
const generatePalettes = () => {
  const palettes: { name: string; colors: Record<string, string> }[] = [];
  
  const themes: { name: string; hue: number; sat: number }[] = [
    // Blues
    { name: "Ocean Night", hue: 225, sat: 45 }, { name: "Deep Navy", hue: 230, sat: 50 }, { name: "Arctic Blue", hue: 210, sat: 40 },
    { name: "Steel Blue", hue: 215, sat: 35 }, { name: "Royal Blue", hue: 240, sat: 55 }, { name: "Midnight Blue", hue: 235, sat: 48 },
    { name: "Cobalt", hue: 220, sat: 52 }, { name: "Sapphire", hue: 228, sat: 58 }, { name: "Navy Storm", hue: 232, sat: 42 },
    { name: "Ice Blue", hue: 200, sat: 38 },
    // Greens
    { name: "Emerald Dark", hue: 160, sat: 40 }, { name: "Forest Green", hue: 145, sat: 35 }, { name: "Jade", hue: 155, sat: 42 },
    { name: "Mint Night", hue: 165, sat: 38 }, { name: "Pine Green", hue: 150, sat: 45 }, { name: "Sage Dark", hue: 140, sat: 30 },
    { name: "Sea Green", hue: 170, sat: 40 }, { name: "Olive Night", hue: 90, sat: 25 }, { name: "Moss", hue: 120, sat: 28 },
    { name: "Fern", hue: 135, sat: 32 },
    // Reds & Pinks
    { name: "Rose Noir", hue: 340, sat: 35 }, { name: "Crimson Pro", hue: 0, sat: 30 }, { name: "Ruby Dark", hue: 350, sat: 40 },
    { name: "Cherry Night", hue: 345, sat: 38 }, { name: "Burgundy", hue: 335, sat: 32 }, { name: "Wine", hue: 330, sat: 28 },
    { name: "Coral Night", hue: 15, sat: 35 }, { name: "Magenta Dark", hue: 320, sat: 40 }, { name: "Blush Noir", hue: 355, sat: 25 },
    { name: "Scarlet", hue: 5, sat: 38 },
    // Oranges & Ambers
    { name: "Amber Dusk", hue: 30, sat: 35 }, { name: "Sunset", hue: 25, sat: 40 }, { name: "Burnt Orange", hue: 20, sat: 38 },
    { name: "Gold Rush", hue: 45, sat: 42 }, { name: "Copper", hue: 28, sat: 35 }, { name: "Tangerine Night", hue: 18, sat: 40 },
    { name: "Bronze", hue: 35, sat: 30 }, { name: "Caramel", hue: 32, sat: 28 }, { name: "Honey", hue: 40, sat: 36 },
    { name: "Peach Dark", hue: 22, sat: 32 },
    // Purples & Violets
    { name: "Violet Storm", hue: 270, sat: 40 }, { name: "Grape", hue: 280, sat: 35 }, { name: "Plum", hue: 290, sat: 30 },
    { name: "Lavender Night", hue: 260, sat: 38 }, { name: "Indigo", hue: 250, sat: 45 }, { name: "Amethyst", hue: 275, sat: 42 },
    { name: "Orchid Dark", hue: 295, sat: 35 }, { name: "Mauve", hue: 285, sat: 28 }, { name: "Heather", hue: 265, sat: 32 },
    { name: "Iris", hue: 255, sat: 40 },
    // Teals & Cyans
    { name: "Teal Matrix", hue: 180, sat: 35 }, { name: "Cyan Dark", hue: 185, sat: 40 }, { name: "Turquoise Night", hue: 175, sat: 38 },
    { name: "Aqua", hue: 190, sat: 42 }, { name: "Petrol", hue: 195, sat: 35 }, { name: "Ocean Teal", hue: 172, sat: 36 },
    { name: "Deep Cyan", hue: 188, sat: 44 }, { name: "Lagoon", hue: 178, sat: 38 }, { name: "Seafoam Dark", hue: 168, sat: 30 },
    { name: "Glacier", hue: 192, sat: 32 },
    // Neutrals & Grays
    { name: "Slate Minimal", hue: 220, sat: 20 }, { name: "Charcoal", hue: 210, sat: 15 }, { name: "Graphite", hue: 200, sat: 12 },
    { name: "Obsidian", hue: 230, sat: 18 }, { name: "Onyx", hue: 0, sat: 5 }, { name: "Pewter", hue: 215, sat: 10 },
    { name: "Storm Gray", hue: 225, sat: 14 }, { name: "Smoke", hue: 205, sat: 8 }, { name: "Iron", hue: 210, sat: 10 },
    { name: "Ash", hue: 195, sat: 6 },
    // Warm tones
    { name: "Warm Earth", hue: 25, sat: 25 }, { name: "Terra Cotta", hue: 15, sat: 30 }, { name: "Sienna", hue: 20, sat: 28 },
    { name: "Clay", hue: 18, sat: 22 }, { name: "Sandstone Night", hue: 38, sat: 20 }, { name: "Mocha", hue: 30, sat: 18 },
    { name: "Espresso", hue: 25, sat: 20 }, { name: "Cinnamon", hue: 15, sat: 25 }, { name: "Walnut", hue: 22, sat: 15 },
    { name: "Umber", hue: 28, sat: 22 },
    // Specialty
    { name: "Neon Blue", hue: 220, sat: 70 }, { name: "Neon Green", hue: 150, sat: 70 }, { name: "Neon Pink", hue: 330, sat: 70 },
    { name: "Neon Purple", hue: 270, sat: 70 }, { name: "Neon Cyan", hue: 185, sat: 70 }, { name: "Neon Orange", hue: 25, sat: 70 },
    { name: "Sunset Beach", hue: 20, sat: 45 }, { name: "Summer Ocean", hue: 200, sat: 50 }, { name: "Black & Gold", hue: 45, sat: 55 },
    { name: "Cool Coastal", hue: 195, sat: 45 },
  ];

  themes.forEach(({ name, hue, sat }) => {
    const priSat = Math.min(85, sat + 35);
    palettes.push({
      name,
      colors: {
        background: `${hue} ${sat}% 8%`,
        foreground: `${hue} ${Math.max(10, sat - 25)}% 92%`,
        primary: `${hue} ${priSat}% ${sat > 50 ? 58 : 55}%`,
        secondary: `${hue} ${Math.max(15, sat - 10)}% 16%`,
        accent: `${(hue + 20) % 360} ${Math.min(75, priSat - 5)}% 50%`,
        muted: `${hue} ${Math.max(12, sat - 15)}% 18%`,
        card: `${hue} ${Math.max(15, sat - 5)}% 12%`,
        border: `${hue} ${Math.max(15, sat - 10)}% 20%`,
      },
    });
  });

  return palettes;
};

const colorPalettes = generatePalettes();

// Popular Google Fonts
const googleFonts = [
  "Inter", "Poppins", "Roboto", "Open Sans", "Lato", "Montserrat", "Raleway", "Nunito",
  "Source Sans Pro", "Ubuntu", "Playfair Display", "Merriweather", "Oswald", "PT Sans",
  "Noto Sans", "Quicksand", "Work Sans", "Rubik", "Karla", "Mulish",
  "Fira Sans", "Barlow", "DM Sans", "Manrope", "Space Grotesk",
  "IBM Plex Sans", "Cabin", "Exo 2", "Outfit", "Plus Jakarta Sans",
  "Sora", "Lexend", "Albert Sans", "Figtree", "Geist",
  "Josefin Sans", "Comfortaa", "Overpass", "Archivo", "Titillium Web",
  "Urbanist", "Red Hat Display", "Jost", "Nunito Sans", "Hind",
  "Crimson Pro", "Libre Baskerville", "Lora", "EB Garamond", "Cormorant Garamond",
  "Spectral", "Bitter", "Noto Serif", "Domine", "Vollkorn",
  "PT Serif", "Zilla Slab", "Cardo", "Gelasio", "Literata",
  "Abril Fatface", "Bebas Neue", "Anton", "Fjalla One", "Black Ops One",
  "Permanent Marker", "Alfa Slab One", "Righteous", "Bungee", "Monoton",
  "Pacifico", "Dancing Script", "Satisfy", "Great Vibes", "Sacramento",
  "Lobster", "Caveat", "Kalam", "Indie Flower", "Patrick Hand",
  "Architects Daughter", "Shadows Into Light", "Amatic SC", "Handlee", "Reenie Beanie",
  "Courier Prime", "JetBrains Mono", "Fira Code", "Source Code Pro", "IBM Plex Mono",
  "Roboto Mono", "Space Mono", "Ubuntu Mono", "Anonymous Pro", "Inconsolata",
  "Abel", "Acme", "Actor", "Adamina", "Advent Pro",
  "ABeeZee", "Abhaya Libre", "Antic", "Asap", "Assistant",
];

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
  const [nudgeOffsets, setNudgeOffsets] = useState<Record<string, { x: number; y: number; zoom: number }>>({});

  const refresh = async () => {
    if (activeTab !== "Home" && activeTab !== "Stats" && activeTab !== "Customize" && activeTab !== "Colours" && activeTab !== "Fonts" && activeTab !== "Themes") {
      setRecords(await fetchRecords(activeTable));
    }
  };

  useEffect(() => {
    if (authenticated && activeTab !== "Home" && activeTab !== "Stats" && activeTab !== "Customize" && activeTab !== "Colours" && activeTab !== "Fonts" && activeTab !== "Themes") refresh();
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
    const offsets: Record<string, { x: number; y: number; zoom: number }> = {};
    Object.keys(flat).forEach(k => {
      if (isFileField(k) && flat[k + "Nudge"]) {
        try {
          const parts = flat[k + "Nudge"].split(",").map(Number);
          offsets[k] = { x: parts[0] || 0, y: parts[1] || 0, zoom: parts[2] || 1 };
        } catch { offsets[k] = { x: 0, y: 0, zoom: 1 }; }
      }
    });
    setNudgeOffsets(offsets);
  };

  const saveEdit = (table?: keyof Database) => {
    if (!editingId) return;
    const t = table || activeTable;
    const parsed: Record<string, any> = {};
    const finalData = { ...editData };
    Object.entries(nudgeOffsets).forEach(([field, offset]) => {
      finalData[field + "Nudge"] = `${offset.x},${offset.y},${offset.zoom}`;
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
      finalData[field + "Nudge"] = `${offset.x},${offset.y},${offset.zoom}`;
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
      const current = prev[field] || { x: 0, y: 0, zoom: 1 };
      const step = 5;
      const next = { ...current };
      if (dir === "up") next.y = current.y - step;
      if (dir === "down") next.y = current.y + step;
      if (dir === "left") next.x = current.x - step;
      if (dir === "right") next.x = current.x + step;
      return { ...prev, [field]: next };
    });
  };

  const zoom = (field: string, dir: "in" | "out") => {
    setNudgeOffsets(prev => {
      const current = prev[field] || { x: 0, y: 0, zoom: 1 };
    const step = 0.1;
      const next = { ...current };
      if (dir === "in") next.zoom = +(current.zoom + step).toFixed(2);
      if (dir === "out") next.zoom = Math.max(0.1, +(current.zoom - step).toFixed(2));
      return { ...prev, [field]: next };
    });
  };

  const getPreviewShape = (field: string): "circle" | "rectangle" => {
    const lower = field.toLowerCase();
    if (lower === "image" && activeTable === "homeProfile") return "circle";
    if (lower === "logoimage" || lower === "collegeimage") return "circle";
    return "rectangle";
  };

    const shouldContainImage = (field: string) => ["logoimage", "previewimage"].includes(field.toLowerCase()) || activeTable === "homeCollege";

  const FileUploadZone = ({ field, value, id }: { field: string; value: string; id: string }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const zoneId = `${id}-${field}`;
    const shape = getPreviewShape(field);
    const offset = nudgeOffsets[field] || { x: 0, y: 0, zoom: 1 };
    const isPdf = value && (value.startsWith("data:application/pdf") || field.toLowerCase().includes("pdf") || field.toLowerCase() === "file");

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

    const isImage = value && value.startsWith("data:image");

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
          accept={field.toLowerCase().includes("pdf") || field.toLowerCase() === "file" ? ".pdf,.doc,.docx" : "image/*,.pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.txt"}
          className="hidden"
          onChange={(e) => e.target.files && handleMultiFileUpload(field, e.target.files)}
        />

        {value && value.startsWith("data:") ? (
          <div className="space-y-3">
            <p className="text-[10px] text-muted-foreground/60 absolute top-1 right-2">Live Preview</p>
            <div className="flex items-center justify-center">
              {isImage ? (
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
                    className={`w-full h-full ${shouldContainImage(field) ? "object-contain" : "object-cover"}`}
                    style={{
                      objectPosition: `${50 + offset.x}% ${50 + offset.y}%`,
                      transform: `scale(${offset.zoom})`,
                      transformOrigin: `${50 + offset.x}% ${50 + offset.y}%`,
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-emerald-400 py-4">
                  <FileUp className="w-5 h-5" />
                  <span className="text-sm font-medium">{isPdf ? "PDF uploaded" : "File uploaded"}</span>
                </div>
              )}
            </div>

            {isImage && (
              <div className="flex flex-col items-center gap-1">
                <p className="text-[10px] text-muted-foreground/50 mb-1">Position & Scale</p>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => zoom(field, "out")} className="w-8 h-8 rounded-full bg-secondary/80 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex flex-col items-center gap-0.5">
                    <button type="button" onClick={() => nudge(field, "up")} className="w-7 h-7 rounded-full bg-secondary/80 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex gap-0.5">
                      <button type="button" onClick={() => nudge(field, "left")} className="w-7 h-7 rounded-full bg-secondary/80 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => { setNudgeOffsets(prev => ({ ...prev, [field]: { x: 0, y: 0, zoom: 1 } })); }} className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors" title="Reset">
                        <RotateCcw className="w-3 h-3" />
                      </button>
                      <button type="button" onClick={() => nudge(field, "right")} className="w-7 h-7 rounded-full bg-secondary/80 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button type="button" onClick={() => nudge(field, "down")} className="w-7 h-7 rounded-full bg-secondary/80 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button type="button" onClick={() => zoom(field, "in")} className="w-8 h-8 rounded-full bg-secondary/80 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[9px] text-primary/60 mt-1">x:{offset.x}%  y:{offset.y}%  zoom:{offset.zoom.toFixed(2)}x</p>
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
              <label className="text-xs text-muted-foreground block mb-1">{fieldLabels[key] || key}</label>
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
                  <span className="text-primary font-medium">{fieldLabels[key] || key}:</span>{" "}
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
    const stats = getDownloadStats();
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

  // Customization tab with LIVE updates
  const CustomizeTab = () => {
    const [customizations, setCustomizations] = useState<Record<string, Record<string, number>>>(() => {
      try {
        const raw = localStorage.getItem("portfolio_customizations");
        return raw ? JSON.parse(raw) : {};
      } catch { return {}; }
    });

    const pages = [
      { key: "projects", label: "Projects", boxes: [
        { key: "cardHeight", label: "Card Image Height (px)", min: 120, max: 400, default: 192 },
        { key: "cardPadding", label: "Card Padding (px)", min: 4, max: 40, default: 16 },
      ]},
      { key: "internships", label: "Internships", boxes: [
        { key: "imageHeight", label: "Image Box Height (px)", min: 80, max: 300, default: 160 },
        { key: "cardPadding", label: "Card Padding (px)", min: 4, max: 40, default: 16 },
      ]},
      { key: "hackathons", label: "Hackathons", boxes: [
        { key: "cardHeight", label: "Card Image Height (px)", min: 120, max: 400, default: 192 },
        { key: "cardPadding", label: "Card Padding (px)", min: 4, max: 40, default: 16 },
      ]},
      { key: "papers", label: "Conference Papers", boxes: [
        { key: "imageHeight", label: "Image Box Height (px)", min: 120, max: 800, default: 224 },
        { key: "cardPadding", label: "Card Padding (px)", min: 0, max: 160, default: 24 },
      ]},
      { key: "certificates", label: "Certificates", boxes: [
        { key: "imageHeight", label: "Certificate Image Height (px)", min: 120, max: 400, default: 224 },
        { key: "cardPadding", label: "Card Padding (px)", min: 4, max: 40, default: 20 },
      ]},
      { key: "home", label: "Home", boxes: [
        { key: "profileSize", label: "Profile Circle Size (px)", min: 80, max: 300, default: 192 },
        { key: "collegeImageHeight", label: "College Slide Image Height (px)", min: 120, max: 800, default: 256 },
        { key: "cardPadding", label: "Section Padding (px)", min: 0, max: 160, default: 20 },
      ]},
    ];

    const getValue = (page: string, box: string, def: number) => customizations[page]?.[box] ?? def;

    const setValue = (page: string, box: string, val: number) => {
      const next = { ...customizations, [page]: { ...customizations[page], [box]: val } };
      setCustomizations(next);
      localStorage.setItem("portfolio_customizations", JSON.stringify(next));
      // Dispatch storage event for same-tab listeners
      window.dispatchEvent(new StorageEvent("storage", { key: "portfolio_customizations", newValue: JSON.stringify(next) }));
    };

    const resetAll = () => {
      setCustomizations({});
      localStorage.removeItem("portfolio_customizations");
      window.dispatchEvent(new StorageEvent("storage", { key: "portfolio_customizations", newValue: "{}" }));
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading font-semibold text-foreground">Box Size Customization</h3>
          <button onClick={resetAll} className="px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs hover:bg-destructive/20 transition-colors">Reset All</button>
        </div>
        <p className="text-muted-foreground text-xs mb-4">Adjust image box sizes and padding for each page. Changes apply live.</p>

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

  // Colours tab - 100+ palettes with full preview
  const ColoursTab = () => {
    const [customTheme, setCustomTheme] = useState<Record<string, string>>(() => {
      try {
        const saved = localStorage.getItem("portfolio_theme");
        return saved ? JSON.parse(saved) : {};
      } catch { return {}; }
    });
    const [activePalette, setActivePalette] = useState<string>("");
    const [previewPalette, setPreviewPalette] = useState<typeof colorPalettes[0] | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const themeKeys = [
      { key: "background", label: "Background" },
      { key: "foreground", label: "Text" },
      { key: "primary", label: "Primary (Accent)" },
      { key: "secondary", label: "Secondary" },
      { key: "accent", label: "Accent" },
      { key: "muted", label: "Muted" },
      { key: "card", label: "Card Background" },
      { key: "border", label: "Border" },
    ];

    const applyThemeToDOM = (colors: Record<string, string>) => {
      applyThemeColors(colors);
    };

    const applyPalette = (palette: typeof colorPalettes[0]) => {
      setCustomTheme(palette.colors);
      setActivePalette(palette.name);
      setPreviewPalette(null);
      localStorage.setItem("portfolio_theme", JSON.stringify(palette.colors));
      applyThemeToDOM(palette.colors);
    };

    const previewTheme = (palette: typeof colorPalettes[0]) => {
      setPreviewPalette(palette);
      applyThemeToDOM(palette.colors);
    };

    const cancelPreview = () => {
      if (previewPalette) {
        setPreviewPalette(null);
        if (Object.keys(customTheme).length > 0) {
          applyThemeToDOM(customTheme);
          document.body.style.background = `linear-gradient(135deg, hsl(${customTheme.background}) 0%, hsl(${customTheme.card || customTheme.background}) 100%)`;
        } else {
          // Reset to defaults
          const root = document.documentElement;
          themeKeys.forEach(({ key }) => root.style.removeProperty(`--${key}`));
          root.style.removeProperty("--glass-bg");
          root.style.removeProperty("--glass-border");
          root.style.removeProperty("--glow-color");
          document.body.style.background = "";
        }
      }
    };

    const resetTheme = () => {
      setCustomTheme({});
      setActivePalette("");
      setPreviewPalette(null);
      localStorage.removeItem("portfolio_theme");
      const root = document.documentElement;
      [...themeKeys.map(t => t.key), "glass-bg", "glass-border", "glow-color", "ring", "card-foreground", "popover", "popover-foreground", "sidebar-background", "sidebar-foreground", "sidebar-primary", "input"].forEach(key => root.style.removeProperty(`--${key}`));
      document.body.style.background = "";
    };

    const updateSingleColor = (key: string, value: string) => {
      const next = { ...customTheme, [key]: value };
      setCustomTheme(next);
      localStorage.setItem("portfolio_theme", JSON.stringify(next));
      applyThemeToDOM(next);
    };

    useEffect(() => {
      if (Object.keys(customTheme).length > 0) {
        applyThemeToDOM(customTheme);
      }
    }, []);

    const filteredPalettes = searchQuery
      ? colorPalettes.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : colorPalettes;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Theme Colours ({colorPalettes.length} palettes)
          </h3>
          <button onClick={resetTheme} className="px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs hover:bg-destructive/20 transition-colors">Reset to Default</button>
        </div>
        <p className="text-muted-foreground text-xs mb-2">Hover to preview, click to apply. Changes affect entire website including backgrounds.</p>

        {/* Search */}
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search palettes... (e.g. ocean, emerald, neon)"
          className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-xs focus:outline-none focus:border-primary mb-3"
        />

        {/* Preview banner */}
        {previewPalette && (
          <div className="glass-card p-3 border border-primary/40 flex items-center justify-between">
            <p className="text-xs text-foreground">Previewing: <span className="text-primary font-bold">{previewPalette.name}</span></p>
            <div className="flex gap-2">
              <button onClick={() => applyPalette(previewPalette)} className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium">Apply</button>
              <button onClick={cancelPreview} className="px-3 py-1 rounded-lg glass-pill text-muted-foreground text-xs">Cancel</button>
            </div>
          </div>
        )}

        {/* Palette grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[500px] overflow-y-auto pr-1">
          {filteredPalettes.map((palette) => (
            <button
              key={palette.name}
              onClick={() => applyPalette(palette)}
              onMouseEnter={() => previewTheme(palette)}
              onMouseLeave={() => cancelPreview()}
              className={`glass-card p-2.5 text-left transition-all hover:border-primary/40 ${activePalette === palette.name ? "border-primary/60 ring-1 ring-primary/30" : ""}`}
            >
              <div className="flex gap-0.5 mb-1.5">
                {["background", "card", "primary", "accent"].map(k => (
                  <div key={k} className="flex-1 h-5 rounded-sm border border-border/20" style={{ background: `hsl(${palette.colors[k]})` }} />
                ))}
              </div>
              <p className="text-[9px] text-foreground font-medium truncate">{palette.name}</p>
            </button>
          ))}
        </div>

        {/* Individual color editors */}
        <div className="glass-card p-4 space-y-3 mt-4">
          <h4 className="font-heading font-semibold text-foreground text-sm">Custom Colors (HSL)</h4>
          <p className="text-muted-foreground text-[10px]">Format: hue saturation% lightness% (e.g. 230 80% 62%)</p>
          {themeKeys.map(({ key, label }) => {
            const currentVal = customTheme[key] || "";
            return (
              <div key={key} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border border-border/30 flex-shrink-0" style={{ background: currentVal ? `hsl(${currentVal})` : `hsl(var(--${key}))` }} />
                <label className="text-xs text-muted-foreground w-28 flex-shrink-0">{label}</label>
                <input
                  value={currentVal}
                  onChange={(e) => updateSingleColor(key, e.target.value)}
                  placeholder={`e.g. 230 80% 62%`}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-input border border-border text-foreground text-xs focus:outline-none focus:border-primary"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Fonts tab
  const FontsTab = () => {
    const [activeFont, setActiveFont] = useState(() => localStorage.getItem("portfolio_font") || "Inter, Poppins, sans-serif");
    const [searchQuery, setSearchQuery] = useState("");
    const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set(["Inter", "Poppins"]));

    const loadFont = (fontName: string) => {
      if (loadedFonts.has(fontName)) return;
      const link = document.createElement("link");
      link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, "+")}:wght@300;400;500;600;700&display=swap`;
      link.rel = "stylesheet";
      document.head.appendChild(link);
      setLoadedFonts(prev => new Set([...prev, fontName]));
    };

    const applyFont = (fontName: string) => {
      loadFont(fontName);
      const fontValue = `"${fontName}", sans-serif`;
      setActiveFont(fontValue);
      localStorage.setItem("portfolio_font", fontValue);
      document.documentElement.style.setProperty("--font-family", fontValue);
      document.body.style.fontFamily = fontValue;
    };

    const resetFont = () => {
      setActiveFont("Inter, Poppins, sans-serif");
      localStorage.removeItem("portfolio_font");
      document.documentElement.style.removeProperty("--font-family");
      document.body.style.fontFamily = "";
    };

    const filteredFonts = searchQuery
      ? googleFonts.filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()))
      : googleFonts;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <Type className="w-5 h-5 text-primary" />
            Font Selection ({googleFonts.length} fonts)
          </h3>
          <button onClick={resetFont} className="px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs hover:bg-destructive/20 transition-colors">Reset to Default</button>
        </div>
        <p className="text-muted-foreground text-xs">Current: <span className="text-primary font-medium">{activeFont}</span></p>

        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search fonts..."
          className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-xs focus:outline-none focus:border-primary"
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[600px] overflow-y-auto pr-1">
          {filteredFonts.map((font) => {
            const isActive = activeFont.includes(font);
            return (
              <button
                key={font}
                onClick={() => applyFont(font)}
                onMouseEnter={() => loadFont(font)}
                className={`glass-card p-3 text-left transition-all hover:border-primary/40 ${isActive ? "border-primary/60 ring-1 ring-primary/30" : ""}`}
              >
                <p className="text-foreground text-sm mb-1 truncate" style={{ fontFamily: `"${font}", sans-serif` }}>{font}</p>
                <p className="text-muted-foreground text-[10px]" style={{ fontFamily: `"${font}", sans-serif` }}>Aa Bb Cc 123</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const ThemesTab = () => {
    const [previewingTheme, setPreviewingTheme] = useState<ProfessionalTheme | null>(null);
    const [activeThemeName, setActiveThemeName] = useState(() => localStorage.getItem("portfolio_active_theme") || "Default Dark Navy");
    const [brightness, setBrightness] = useState(() => {
      try { return Number(localStorage.getItem("portfolio_theme_brightness")) || 0; } catch { return 0; }
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [history, setHistory] = useState<(ProfessionalTheme & { appliedAt: string })[]>(() => {
      try {
        const raw = localStorage.getItem("portfolio_theme_history");
        return raw ? JSON.parse(raw) : [];
      } catch { return []; }
    });

    const adjustBrightness = (colors: Record<string, string>, level: number): Record<string, string> => {
      if (level === 0) return colors;
      const adjusted: Record<string, string> = {};
      Object.entries(colors).forEach(([key, val]) => {
        const match = val.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
        if (!match) { adjusted[key] = val; return; }
        const h = Number(match[1]);
        const s = Number(match[2]);
        let l = Number(match[3]);
        l = Math.max(0, Math.min(100, l + level));
        adjusted[key] = `${h} ${s}% ${l}%`;
      });
      return adjusted;
    };

    const applyThemeToDOM = (theme: ProfessionalTheme, brightnessLevel = brightness) => {
      const colors = adjustBrightness(theme.colors, brightnessLevel);
      applyThemeColors(colors);
      loadFontIfNeeded(theme.font);
      applyThemeFont(theme.font);
      applyThemeRadius(theme.radius);
      applyLayoutTemplate(theme.template);
    };

    const getStoredThemeAsEntry = (): (ProfessionalTheme & { appliedAt: string }) | null => {
      try {
        const colorsRaw = localStorage.getItem("portfolio_theme");
        if (!colorsRaw) return null;
        return {
          name: localStorage.getItem("portfolio_active_theme") || "Current",
          category: "Custom",
          description: "Previously applied",
          colors: JSON.parse(colorsRaw),
          font: localStorage.getItem("portfolio_font") || '"Inter", sans-serif',
          radius: localStorage.getItem("portfolio_theme_radius") || "0.75rem",
          template: localStorage.getItem("portfolio_layout_template") || "default",
          appliedAt: new Date().toISOString(),
        };
      } catch { return null; }
    };

    const saveHistory = (next: (ProfessionalTheme & { appliedAt: string })[]) => {
      setHistory(next);
      localStorage.setItem("portfolio_theme_history", JSON.stringify(next));
    };

    const applyTheme = (theme: ProfessionalTheme, trackHistory = true) => {
      if (trackHistory && activeThemeName !== theme.name) {
        const prev = getStoredThemeAsEntry();
        if (prev) saveHistory([prev, ...history.filter(h => h.name !== prev.name)].slice(0, 12));
      }
      applyThemeToDOM(theme);
      setActiveThemeName(theme.name);
      setPreviewingTheme(null);
      const colors = adjustBrightness(theme.colors, brightness);
      localStorage.setItem("portfolio_theme", JSON.stringify(colors));
      localStorage.setItem("portfolio_font", theme.font);
      localStorage.setItem("portfolio_theme_radius", theme.radius);
      localStorage.setItem("portfolio_layout_template", theme.template);
      localStorage.setItem("portfolio_active_theme", theme.name);
    };

    const handleBrightnessChange = (val: number) => {
      setBrightness(val);
      localStorage.setItem("portfolio_theme_brightness", String(val));
      const theme = professionalThemes.find(t => t.name === activeThemeName) || professionalThemes[0];
      const colors = adjustBrightness(theme.colors, val);
      applyThemeColors(colors);
      localStorage.setItem("portfolio_theme", JSON.stringify(colors));
    };

    const cancelPreview = () => {
      if (!previewingTheme) return;
      setPreviewingTheme(null);
      const active = professionalThemes.find(t => t.name === activeThemeName);
      if (active) applyThemeToDOM(active);
    };

    const resetToDefault = () => {
      setBrightness(0);
      localStorage.removeItem("portfolio_theme_brightness");
      applyTheme(professionalThemes[0]);
    };

    const restoreFromHistory = (entry: ProfessionalTheme & { appliedAt: string }, index: number) => {
      applyTheme(entry, false);
      saveHistory(history.filter((_, i) => i !== index));
    };

    useEffect(() => {
      const active = professionalThemes.find(t => t.name === activeThemeName);
      if (active) applyThemeToDOM(active);
    }, []);

    const filtered = searchQuery
      ? professionalThemes.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase()))
      : professionalThemes;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-primary" />
            Professional Themes ({professionalThemes.length})
          </h3>
          <button onClick={resetToDefault} className="px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs hover:bg-destructive/20 transition-colors">Reset Default</button>
        </div>

        <p className="text-xs text-primary/70">Active: <span className="font-bold text-primary">{activeThemeName}</span></p>

        {/* Brightness slider */}
        <div className="glass-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground font-medium">Brightness Level</label>
            <span className="text-xs text-primary font-bold">{brightness > 0 ? `+${brightness}` : brightness}%</span>
          </div>
          <input
            type="range"
            min={-20}
            max={20}
            value={brightness}
            onChange={(e) => handleBrightnessChange(Number(e.target.value))}
            className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>Darker</span>
            <span>Default</span>
            <span>Brighter</span>
          </div>
        </div>

        {/* Search */}
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search themes... (e.g. navy, white, emerald, corporate)"
          className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-xs focus:outline-none focus:border-primary"
        />

        {previewingTheme && (
          <div className="glass-card p-3 border border-primary/40 flex items-center justify-between">
            <p className="text-xs text-foreground">Previewing: <span className="text-primary font-bold">{previewingTheme.name}</span></p>
            <div className="flex gap-2">
              <button onClick={() => applyTheme(previewingTheme)} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">Apply</button>
              <button onClick={cancelPreview} className="px-3 py-1.5 rounded-lg glass-pill text-muted-foreground text-xs">Cancel</button>
            </div>
          </div>
        )}

        {/* Theme grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[600px] overflow-y-auto pr-1">
          {filtered.map((theme) => {
            const isActive = activeThemeName === theme.name;
            return (
              <button
                key={theme.name}
                onMouseEnter={() => { setPreviewingTheme(theme); applyThemeToDOM(theme); }}
                onMouseLeave={cancelPreview}
                onClick={() => applyTheme(theme)}
                className={`glass-card p-3 text-left transition-all hover:border-primary/40 ${isActive ? "border-primary/60 ring-1 ring-primary/30" : ""}`}
              >
                <div className="flex gap-0.5 mb-2">
                  {["background", "card", "primary", "accent", "foreground"].map(k => (
                    <div key={k} className="flex-1 h-5 rounded-sm border border-border/20" style={{ background: `hsl(${theme.colors[k]})` }} />
                  ))}
                </div>
                <p className="text-foreground text-xs font-bold truncate">{theme.name}</p>
                <p className="text-muted-foreground text-[9px] truncate">{theme.description}</p>
                {isActive && <span className="mt-1 inline-block bg-primary/20 text-primary text-[9px] px-1.5 py-0.5 rounded-full">Active</span>}
              </button>
            );
          })}
        </div>

        {/* History */}
        <div className="glass-card p-4 space-y-2">
          <h4 className="font-heading font-semibold text-foreground text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            Theme History
          </h4>
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground">No previous themes yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map((item, index) => (
                <div key={`${item.name}-${index}`} className="rounded-lg border border-border/40 bg-secondary/20 px-3 py-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-foreground font-medium">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(item.appliedAt).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => restoreFromHistory(item, index)}
                    className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/30 text-primary text-[10px] font-medium hover:bg-primary/20 transition-colors"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--card)) 100%)" }}>
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
    { label: "🎨 Colours", value: "Colours" },
    { label: "🔤 Fonts", value: "Fonts" },
    { label: "🎭 Themes", value: "Themes" },
  ];

  return (
    <div className="min-h-screen p-6" style={{ background: "linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--card)) 100%)" }}>
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
                if (tab.value !== "Home" && tab.value !== "Stats" && tab.value !== "Customize" && tab.value !== "Colours" && tab.value !== "Fonts" && tab.value !== "Themes") setActiveTable(tab.value as keyof Database);
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

        {activeTab === "Stats" && <DownloadStats />}
        {activeTab === "Customize" && <CustomizeTab />}
        {activeTab === "Colours" && <ColoursTab />}
        {activeTab === "Fonts" && <FontsTab />}
        {activeTab === "Themes" && <ThemesTab />}
        {activeTab === "settings" && <SettingsTab />}

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
                              <label className="text-xs text-muted-foreground block mb-1">{fieldLabels[key] || key}</label>
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

        {activeTab !== "Home" && activeTab !== "Stats" && activeTab !== "settings" && activeTab !== "Customize" && activeTab !== "Colours" && activeTab !== "Fonts" && activeTab !== "Themes" && (
          <>
            <button onClick={() => startAdd()} className="mb-4 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">+ Add Record</button>

            {newRecord && (
              <div className="glass-card p-4 mb-4 space-y-3">
                <h3 className="text-foreground text-sm font-heading font-semibold">New Record</h3>
                {Object.entries(editData).map(([key, val]) => (
                  <div key={key}>
                    <label className="text-xs text-muted-foreground block mb-1">{fieldLabels[key] || key}</label>
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
