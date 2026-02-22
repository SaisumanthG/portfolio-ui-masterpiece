// Offline localStorage-based database

export interface DBRecord {
  id: string;
  [key: string]: any;
}

export interface DBTable {
  [id: string]: DBRecord;
}

export interface Database {
  projects: DBRecord[];
  internships: DBRecord[];
  hackathons: DBRecord[];
  papers: DBRecord[];
  certificates: DBRecord[];
  settings: DBRecord[];
}

const DB_KEY = "portfolio_db";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getDB(): Database {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) return JSON.parse(raw);
  // Initialize with seed data
  const seed = getDefaultData();
  localStorage.setItem(DB_KEY, JSON.stringify(seed));
  return seed;
}

function saveDB(db: Database) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function getAllRecords(table: keyof Database): DBRecord[] {
  const db = getDB();
  return db[table] || [];
}

export function getRecord(table: keyof Database, id: string): DBRecord | undefined {
  return getAllRecords(table).find((r) => r.id === id);
}

export function addRecord(table: keyof Database, data: Omit<DBRecord, "id">): DBRecord {
  const db = getDB();
  const record = { ...data, id: generateId() };
  db[table].push(record);
  saveDB(db);
  return record;
}

export function updateRecord(table: keyof Database, id: string, data: Partial<DBRecord>): DBRecord | null {
  const db = getDB();
  const idx = db[table].findIndex((r) => r.id === id);
  if (idx === -1) return null;
  db[table][idx] = { ...db[table][idx], ...data };
  saveDB(db);
  return db[table][idx];
}

export function deleteRecord(table: keyof Database, id: string): boolean {
  const db = getDB();
  const idx = db[table].findIndex((r) => r.id === id);
  if (idx === -1) return false;
  db[table].splice(idx, 1);
  saveDB(db);
  return true;
}

export function resetDatabase() {
  localStorage.setItem(DB_KEY, JSON.stringify(getDefaultData()));
}

export function exportDatabase(): string {
  return JSON.stringify(getDB(), null, 2);
}

export function importDatabase(json: string) {
  const data = JSON.parse(json);
  saveDB(data);
}

function getDefaultData(): Database {
  return {
    projects: [
      { id: "p1", title: "Start or Scrap? – Startup Validation Game", description: "An interactive startup idea-validation game that simulates real-world decision-making under time pressure. Users evaluate randomly generated startup ideas using structured validation questions.", tech: ["Python", "Django", "React", "MySQL"], image: "" },
      { id: "p2", title: "MediGuardian – AI Health Detection", description: "An AI-based healthcare solution that analyzes voice patterns to assist in the early detection of Parkinson's disease.", tech: ["Python", "Flask", "React", "ML"], image: "" },
      { id: "p3", title: "AI-Based Interior Design Generator", description: "An AI-powered interior design generator developed during internship.", tech: ["Python", "Stable Diffusion", "React"], image: "" },
      { id: "p4", title: "ESP32 Smart Air Quality Monitor", description: "A hardware project that monitors indoor air quality using ESP32, C programming, and environmental sensors.", tech: ["C", "ESP32", "Sensors"], image: "" },
      { id: "p5", title: "Smart Shopping & Billing App", description: "A modern shopping website with online billing and invoice generation.", tech: ["HTML", "CSS", "JavaScript", "Django", "MySQL"], image: "" },
    ],
    internships: [
      { id: "i1", company: "Generative AI Developer", role: "Intern", period: "AI-Based Interior Design Generator", description: "Developed an AI-powered interior design generator using Stable Diffusion models and React frontend.", image: "" },
      { id: "i2", company: "Altruisty", role: "Full Stack Development Intern", period: "Game-based Django Web Application", description: "Built a game-based Django web application with MySQL and interactive UI for enhanced user engagement.", image: "" },
    ],
    hackathons: [
      { id: "h1", title: "IDEATHON – PECTEAM 2K24", description: "Participated in an ideation competition focused on innovative problem-solving, presenting creative tech solutions.", image: "" },
      { id: "h2", title: "Infosys Springboard Ideathon", description: "Competed in the Infosys Springboard Ideathon, developing and pitching innovative tech solutions for real-world problems.", image: "" },
      { id: "h3", title: "Hackathon – XYNTRA (36 Hours)", description: "Built an AI-powered health monitoring system in 36 hours during the XYNTRA hackathon.", image: "" },
    ],
    papers: [
      { id: "pa1", title: "ESP32-Based Smart Air Quality Monitoring and Automation System with MANET Distress Alerts", description: "A comprehensive research paper on IoT-based air quality monitoring using ESP32 microcontrollers with MANET integration for emergency distress alerts.", pdf: "" },
      { id: "pa2", title: "Fingerprint-Based Gender Classification using IVMD-Attention EfficientNet-B1", description: "Research on applying deep learning models for gender classification using fingerprint biometrics with attention-enhanced EfficientNet architecture.", pdf: "" },
    ],
    certificates: [
      { id: "c1", title: "Data Science", issuer: "NASSCOM", valid: "2024–2027", image: "" },
      { id: "c2", title: "AWS Cloud Practitioner Essentials", issuer: "AWS", valid: "2024–2027", image: "" },
      { id: "c3", title: "Python for Data Science", issuer: "NPTEL", valid: "2024–2027", image: "" },
      { id: "c4", title: "Cloud Data Management 2023", issuer: "Oracle", valid: "2023–2026", image: "" },
    ],
    settings: [
      { id: "s1", key: "resumePdf", value: "" },
    ],
  };
}
