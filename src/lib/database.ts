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
  localStorage.removeItem(DB_KEY);
}

export function exportDatabase(): string {
  return JSON.stringify(getDB(), null, 2);
}

export function importDatabase(json: string) {
  const data = JSON.parse(json);
  saveDB(data);
}

// Import images as modules
import projectStartup from "@/assets/project-startup.jpg";
import projectMediguardian from "@/assets/project-mediguardian.jpg";
import projectInterior from "@/assets/project-interior.jpg";
import projectEsp32 from "@/assets/project-esp32.jpg";
import projectShopping from "@/assets/project-shopping.jpg";
import internshipAiDesign from "@/assets/internship-ai-design.jpg";
import internshipAltruisty from "@/assets/internship-altruisty.jpg";
import hackathonIdeathon from "@/assets/hackathon-ideathon.jpg";
import hackathonInfosys from "@/assets/hackathon-infosys.jpg";
import hackathonXyntra from "@/assets/hackathon-xyntra.jpg";
import certNasscom from "@/assets/cert-nasscom.jpg";
import certAws from "@/assets/cert-aws.jpg";
import certNptel from "@/assets/cert-nptel.jpg";
import certOracle from "@/assets/cert-oracle.jpg";

function getDefaultData(): Database {
  return {
    projects: [
      { id: "p1", title: "Start or Scrap? – Startup Validation Game", description: "An interactive startup idea-validation game that simulates real-world decision-making under time pressure. Users evaluate randomly generated startup ideas using structured validation questions.", tech: ["Python", "Django", "React", "MySQL"], image: projectStartup, github: "https://github.com/saisumanth-g" },
      { id: "p2", title: "MediGuardian – AI Health Detection", description: "An AI-based healthcare solution that analyzes voice patterns to assist in the early detection of Parkinson's disease.", tech: ["Python", "Flask", "React", "ML"], image: projectMediguardian, github: "https://github.com/saisumanth-g" },
      { id: "p3", title: "AI-Based Interior Design Generator", description: "An AI-powered interior design generator developed during internship.", tech: ["Python", "Stable Diffusion", "React"], image: projectInterior, github: "https://github.com/saisumanth-g" },
      { id: "p4", title: "ESP32 Smart Air Quality Monitor", description: "A hardware project that monitors indoor air quality using ESP32, C programming, and environmental sensors.", tech: ["C", "ESP32", "Sensors"], image: projectEsp32, github: "https://github.com/saisumanth-g" },
      { id: "p5", title: "Smart Shopping & Billing App", description: "A modern shopping website with online billing and invoice generation.", tech: ["HTML", "CSS", "JavaScript", "Django", "MySQL"], image: projectShopping, github: "https://github.com/saisumanth-g" },
    ],
    internships: [
      { id: "i1", company: "Generative AI Developer", role: "Intern", period: "AI-Based Interior Design Generator", description: "Developed an AI-powered interior design generator using Stable Diffusion models and React frontend. Created intelligent room layout suggestions and style recommendations using generative AI techniques.", image: internshipAiDesign, website: "https://github.com/saisumanth-g", github: "https://github.com/saisumanth-g" },
      { id: "i2", company: "Altruisty", role: "Full Stack Development Intern", period: "Game-based Django Web Application", description: "Built a game-based Django web application with MySQL and interactive UI for enhanced user engagement. Developed RESTful APIs, implemented authentication systems, and optimized database queries for performance.", image: internshipAltruisty, website: "https://github.com/saisumanth-g", github: "https://github.com/saisumanth-g" },
    ],
    hackathons: [
      { id: "h1", title: "IDEATHON – PECTEAM 2K24", description: "Participated in an ideation competition focused on innovative problem-solving, presenting creative tech solutions.", image: hackathonIdeathon, github: "https://github.com/saisumanth-g" },
      { id: "h2", title: "Infosys Springboard Ideathon", description: "Competed in the Infosys Springboard Ideathon, developing and pitching innovative tech solutions for real-world problems.", image: hackathonInfosys, github: "https://github.com/saisumanth-g" },
      { id: "h3", title: "Hackathon – XYNTRA (36 Hours)", description: "Built an AI-powered health monitoring system in 36 hours during the XYNTRA hackathon.", image: hackathonXyntra, github: "https://github.com/saisumanth-g" },
    ],
    papers: [
      { id: "pa1", title: "ESP32-Based Smart Air Quality Monitoring and Automation System with MANET Distress Alerts", description: "A comprehensive research paper on IoT-based air quality monitoring using ESP32 microcontrollers with MANET integration for emergency distress alerts.", pdf: "" },
      { id: "pa2", title: "Fingerprint-Based Gender Classification using IVMD-Attention EfficientNet-B1", description: "Research on applying deep learning models for gender classification using fingerprint biometrics with attention-enhanced EfficientNet architecture.", pdf: "" },
    ],
    certificates: [
      { id: "c1", title: "Data Science", issuer: "NASSCOM", valid: "2024–2027", image: certNasscom },
      { id: "c2", title: "AWS Cloud Practitioner Essentials", issuer: "AWS", valid: "2024–2027", image: certAws },
      { id: "c3", title: "Python for Data Science", issuer: "NPTEL", valid: "2024–2027", image: certNptel },
      { id: "c4", title: "Cloud Data Management 2023", issuer: "Oracle", valid: "2023–2026", image: certOracle },
    ],
    settings: [
      { id: "s1", key: "resumePdf", value: "" },
    ],
  };
}
