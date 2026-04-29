// API-backed portfolio database with Socket.IO realtime syncing
import { io, type Socket } from "socket.io-client";

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
  homeProfile: DBRecord[];
  homeAbout: DBRecord[];
  homeSkills: DBRecord[];
  homeLinks: DBRecord[];
  homeCollege: DBRecord[];
}

export interface DownloadStat {
  id: string;
  paperId: string;
  paperTitle: string;
  timestamp: string;
}

export type TableName = keyof Database;

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");
const DB_CHANGE_EVENT = "portfolio-api-updated";

let cache: Partial<Database & { downloadStats: DownloadStat[]; customizations: Record<string, Record<string, number>>; appearance: Record<string, any> }> = {};
let socket: Socket | null = null;
let socketStarted = false;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function emitChange(table?: string) {
  window.dispatchEvent(new CustomEvent(DB_CHANGE_EVENT, { detail: table }));
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function fetchRecords(table: TableName): Promise<DBRecord[]> {
  const rows = await apiRequest<DBRecord[]>(`/api/${table}`);
  cache[table] = rows;
  return rows;
}

export async function fetchAllData(): Promise<Database> {
  const data = await apiRequest<Database>("/api/data");
  cache = { ...cache, ...data };
  return data;
}

export function getAllRecords(table: TableName): DBRecord[] {
  return cache[table] || [];
}

export function getRecord(table: TableName, id: string): DBRecord | undefined {
  return getAllRecords(table).find((r) => r.id === id);
}

export async function addRecord(table: TableName, data: Omit<DBRecord, "id">): Promise<DBRecord> {
  const record = await apiRequest<DBRecord>(`/api/${table}`, { method: "POST", body: JSON.stringify(data) });
  cache[table] = [...(cache[table] || []), record];
  emitChange(table);
  return record;
}

export async function updateRecord(table: TableName, id: string, data: Partial<DBRecord>): Promise<DBRecord | null> {
  const record = await apiRequest<DBRecord>(`/api/${table}/${id}`, { method: "PUT", body: JSON.stringify(data) });
  cache[table] = (cache[table] || []).map((r) => (r.id === id ? record : r));
  emitChange(table);
  return record;
}

export async function deleteRecord(table: TableName, id: string): Promise<boolean> {
  await apiRequest<{ ok: boolean }>(`/api/${table}/${id}`, { method: "DELETE" });
  cache[table] = (cache[table] || []).filter((r) => r.id !== id);
  emitChange(table);
  return true;
}

export async function resetDatabase() {
  const data = await apiRequest<Database>("/api/admin/reset", { method: "POST" });
  cache = { ...cache, ...data };
  emitChange();
}

export async function exportDatabase(): Promise<string> {
  const data = await fetchAllData();
  return JSON.stringify(data, null, 2);
}

export async function importDatabase(json: string) {
  const data = JSON.parse(json);
  const imported = await apiRequest<Database>("/api/admin/import", { method: "POST", body: JSON.stringify(data) });
  cache = { ...cache, ...imported };
  emitChange();
}

export function subscribeToDatabaseChanges(callback: () => void) {
  const handler = () => callback();
  window.addEventListener(DB_CHANGE_EVENT, handler);
  startRealtimeSync();
  return () => window.removeEventListener(DB_CHANGE_EVENT, handler);
}

export function startRealtimeSync() {
  if (socketStarted) return;
  socketStarted = true;
  socket = io(API_BASE, { transports: ["websocket", "polling"] });
  socket.on("portfolio:update", async ({ table }: { table?: TableName }) => {
    try {
      if (table) await fetchRecords(table);
      else await fetchAllData();
      emitChange(table);
    } catch (error) {
      console.warn("Unable to sync portfolio update", error);
    }
  });
}

export async function getDownloadStats(): Promise<DownloadStat[]> {
  const stats = await apiRequest<DownloadStat[]>("/api/download-stats");
  cache.downloadStats = stats;
  return stats;
}

export async function addDownloadStat(paperId: string, paperTitle: string) {
  const stat = await apiRequest<DownloadStat>("/api/download-stats", {
    method: "POST",
    body: JSON.stringify({ paperId, paperTitle }),
  });
  cache.downloadStats = [...(cache.downloadStats || []), stat].slice(-200);
  return stat;
}

export async function getCustomizations(): Promise<Record<string, Record<string, number>>> {
  const data = await apiRequest<Record<string, Record<string, number>>>("/api/customizations");
  cache.customizations = data;
  return data;
}

export async function saveCustomizations(data: Record<string, Record<string, number>>) {
  const saved = await apiRequest<Record<string, Record<string, number>>>("/api/customizations", { method: "PUT", body: JSON.stringify(data) });
  cache.customizations = saved;
  emitChange("customizations");
  return saved;
}

export async function getAppearance(): Promise<Record<string, any>> {
  const data = await apiRequest<Record<string, any>>("/api/appearance");
  cache.appearance = data;
  return data;
}

export async function saveAppearance(data: Record<string, any>) {
  const saved = await apiRequest<Record<string, any>>("/api/appearance", { method: "PUT", body: JSON.stringify(data) });
  cache.appearance = saved;
  emitChange("appearance");
  return saved;
}

const projectStartup = "/seed-assets/project-startup.jpg";
const projectMediguardian = "/seed-assets/project-mediguardian.jpg";
const projectInterior = "/seed-assets/project-interior.jpg";
const projectEsp32 = "/seed-assets/project-esp32.jpg";
const projectShopping = "/seed-assets/project-shopping.jpg";
const internshipAiDesign = "/seed-assets/internship-ai-design.jpg";
const internshipAltruisty = "/seed-assets/internship-altruisty.jpg";
const hackathonIdeathon = "/seed-assets/hackathon-ideathon.jpg";
const hackathonInfosys = "/seed-assets/hackathon-infosys.jpg";
const hackathonXyntra = "/seed-assets/hackathon-xyntra.jpg";
const certNasscom = "/seed-assets/cert-nasscom.jpg";
const certAws = "/seed-assets/cert-aws.jpg";
const certNptel = "/seed-assets/cert-nptel.jpg";
const certOracle = "/seed-assets/cert-oracle.jpg";

export function getDefaultData(): Database {
  return {
    projects: [
      { id: "p1", title: "Start or Scrap? – Startup Validation Game", description: "An interactive startup idea-validation game that simulates real-world decision-making under time pressure. Users evaluate randomly generated startup ideas using structured validation questions.", tech: ["Python", "Django", "React", "MySQL"], image: projectStartup, projectUrl: "https://github.com/saisumanth-g", github: "https://github.com/saisumanth-g" },
      { id: "p2", title: "MediGuardian – AI Health Detection", description: "An AI-based healthcare solution that analyzes voice patterns to assist in the early detection of Parkinson's disease.", tech: ["Python", "Flask", "React", "ML"], image: projectMediguardian, projectUrl: "https://github.com/saisumanth-g", github: "https://github.com/saisumanth-g" },
      { id: "p3", title: "AI-Based Interior Design Generator", description: "An AI-powered interior design generator developed during internship.", tech: ["Python", "Stable Diffusion", "React"], image: projectInterior, projectUrl: "https://github.com/saisumanth-g", github: "https://github.com/saisumanth-g" },
      { id: "p4", title: "ESP32 Smart Air Quality Monitor", description: "A hardware project that monitors indoor air quality using ESP32, C programming, and environmental sensors.", tech: ["C", "ESP32", "Sensors"], image: projectEsp32, projectUrl: "https://github.com/saisumanth-g", github: "https://github.com/saisumanth-g" },
      { id: "p5", title: "Smart Shopping & Billing App", description: "A modern shopping website with online billing and invoice generation.", tech: ["HTML", "CSS", "JavaScript", "Django", "MySQL"], image: projectShopping, projectUrl: "https://github.com/saisumanth-g", github: "https://github.com/saisumanth-g" },
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
      { id: "pa1", title: "ESP32-Based Smart Air Quality Monitoring and Automation System with MANET Distress Alerts", description: "A comprehensive research paper on IoT-based air quality monitoring using ESP32 microcontrollers with MANET integration for emergency distress alerts.", pdf: "", file: "", image: "", previewImage: "", publicationUrl: "" },
      { id: "pa2", title: "Fingerprint-Based Gender Classification using IVMD-Attention EfficientNet-B1", description: "Research on applying deep learning models for gender classification using fingerprint biometrics with attention-enhanced EfficientNet architecture.", pdf: "", file: "", image: "", previewImage: "", publicationUrl: "" },
    ],
    certificates: [
      { id: "c1", title: "Data Science", issuer: "NASSCOM", valid: "2024–2027", image: certNasscom, previewImage: "", viewImage: "", file: "", credlyUrl: "", verificationUrl: "", urlPath: "" },
      { id: "c2", title: "AWS Cloud Practitioner Essentials", issuer: "AWS", valid: "2024–2027", image: certAws, previewImage: "", viewImage: "", file: "", credlyUrl: "", verificationUrl: "", urlPath: "" },
      { id: "c3", title: "Python for Data Science", issuer: "NPTEL", valid: "2024–2027", image: certNptel, previewImage: "", viewImage: "", file: "", credlyUrl: "", verificationUrl: "", urlPath: "" },
      { id: "c4", title: "Cloud Data Management 2023", issuer: "Oracle", valid: "2023–2026", image: certOracle, previewImage: "", viewImage: "", file: "", credlyUrl: "", verificationUrl: "", urlPath: "" },
    ],
    settings: [
      { id: "s1", key: "resumePdf", value: "" },
    ],
    homeProfile: [
      { id: "hp1", name: "Sai Sumanth G", subtitle: "Full Stack Developer · AI Enthusiast · Builder", image: "", logoImage: "", collegeImage: "", imageNudge: "", logoImageNudge: "", collegeImageNudge: "" },
    ],
    homeAbout: [
      { id: "ha1", content: "A passionate developer with a love for building innovative solutions. Experienced in Full Stack Development, Machine Learning, and Cloud technologies. Exploring the intersection of design and technology to create impactful products. Currently seeking opportunities to make a meaningful contribution in the tech industry." },
    ],
    homeSkills: [
      { id: "hs1", category: "Languages", skills: '["C","C++","Java (Intermediate)","Python (Intermediate)"]' },
      { id: "hs2", category: "Web Development", skills: '["HTML","CSS","JavaScript","Django"]' },
      { id: "hs3", category: "Database", skills: '["MySQL"]' },
      { id: "hs4", category: "Tools & Platforms", skills: '["GitHub","VS Code","Figma","Canva","MySQL"]' },
    ],
    homeLinks: [
      { id: "hl1", label: "GitHub", url: "https://github.com/saisumanth-g", icon: "github" },
      { id: "hl2", label: "LeetCode", url: "https://leetcode.com/u/saisumanth-g", icon: "leetcode" },
      { id: "hl3", label: "HackerRank", url: "https://www.hackerrank.com/profile/saisumanth_g", icon: "hackerrank" },
    ],
    homeCollege: [
      { id: "hc1", year: "1st Year", slideIndex: "0", title: "First Workshop", description: "Attended a hands-on workshop on Arduino and basic electronics, marking my first step into hardware.", image: "" },
      { id: "hc2", year: "1st Year", slideIndex: "1", title: "Intro to Programming", description: "Started learning C and Python fundamentals through college coursework.", image: "" },
      { id: "hc3", year: "1st Year", slideIndex: "2", title: "College Orientation", description: "Explored various departments and clubs during the first semester.", image: "" },
      { id: "hc4", year: "1st Year", slideIndex: "3", title: "Tech Fest", description: "Participated in first college tech fest and coding competition.", image: "" },
      { id: "hc5", year: "1st Year", slideIndex: "4", title: "Project Expo", description: "Presented a basic calculator app built with Python.", image: "" },
      { id: "hc6", year: "2nd Year", slideIndex: "0", title: "Web Development Bootcamp", description: "Built first web projects using HTML, CSS, and JavaScript.", image: "" },
      { id: "hc7", year: "2nd Year", slideIndex: "1", title: "Hackathon Debut", description: "Participated in first hackathon, building a prototype in 24 hours.", image: "" },
      { id: "hc8", year: "2nd Year", slideIndex: "2", title: "Database Course", description: "Learned MySQL and relational database design.", image: "" },
      { id: "hc9", year: "2nd Year", slideIndex: "3", title: "GitHub Journey", description: "Started using Git and GitHub for version control.", image: "" },
      { id: "hc10", year: "2nd Year", slideIndex: "4", title: "Mini Project", description: "Developed a student management system using Django.", image: "" },
      { id: "hc11", year: "3rd Year", slideIndex: "0", title: "AI/ML Exploration", description: "Explored machine learning concepts and built a disease detection model.", image: "" },
      { id: "hc12", year: "3rd Year", slideIndex: "1", title: "Internship at Altruisty", description: "Full Stack Development intern working on Django applications.", image: "" },
      { id: "hc13", year: "3rd Year", slideIndex: "2", title: "Paper Publication", description: "Started research on ESP32-based smart monitoring systems.", image: "" },
      { id: "hc14", year: "3rd Year", slideIndex: "3", title: "IDEATHON", description: "Won recognition at PECTEAM 2K24 ideation competition.", image: "" },
      { id: "hc15", year: "3rd Year", slideIndex: "4", title: "Cloud Certification", description: "Completed AWS Cloud Practitioner and Oracle certifications.", image: "" },
      { id: "hc16", year: "4th Year", slideIndex: "0", title: "Conference Paper", description: "Published research on ESP32-based smart air quality monitoring system.", image: "" },
      { id: "hc17", year: "4th Year", slideIndex: "1", title: "Capstone Project", description: "Developed Start or Scrap startup validation game as final year project.", image: "" },
      { id: "hc18", year: "4th Year", slideIndex: "2", title: "AI Internship", description: "Worked on AI-based interior design generator using Stable Diffusion.", image: "" },
      { id: "hc19", year: "4th Year", slideIndex: "3", title: "Portfolio Website", description: "Built this personal portfolio to showcase all projects and achievements.", image: "" },
      { id: "hc20", year: "4th Year", slideIndex: "4", title: "Placement Prep", description: "Preparing for campus placements and industry roles.", image: "" },
    ],
  };
}
