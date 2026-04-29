// Offline localStorage-based database with realtime broadcast syncing
import { supabase } from "@/integrations/supabase/client";

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

const DB_KEY = "portfolio_db";
const LARGE_FIELD_LIMIT = 50000;
const FALLBACK_FIELD_LIMIT = 12000;
const MIN_FIELD_LIMIT = 1000;
const DB_CHANGE_EVENT = "portfolio-db-updated";
const REALTIME_CHANNEL = "portfolio-db-live-sync";
const REALTIME_EVENT = "portfolio_db_update";

const CLIENT_ID = (() => {
  try {
    const existing = sessionStorage.getItem("portfolio_sync_client_id");
    if (existing) return existing;
    const next = generateId();
    sessionStorage.setItem("portfolio_sync_client_id", next);
    return next;
  } catch {
    return Math.random().toString(36).slice(2);
  }
})();

let applyingRemoteSync = false;
let realtimeReady = false;
let realtimeStarted = false;
let pendingRealtimeValue: string | null = null;
let realtimeTimer: number | null = null;
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

type StoredDatabase = Database & { downloadStats?: DownloadStat[] };

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getDB(): Database {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    const defaults = getDefaultData();
    let needsSave = false;

    // Ensure all tables exist (handles old DBs missing new tables)
    for (const key of Object.keys(defaults) as (keyof Database)[]) {
      if (!parsed[key]) {
        parsed[key] = defaults[key];
        needsSave = true;
      }
    }

    // Backfill papers fields
    if (Array.isArray(parsed.papers)) {
      parsed.papers = parsed.papers.map((paper: Record<string, any>) => {
        const next = {
          ...paper,
          previewImage: paper.previewImage ?? "",
          file: paper.file ?? paper.pdf ?? "",
          pdf: paper.pdf ?? paper.file ?? "",
          publicationUrl: paper.publicationUrl ?? "",
        };
        if (
          paper.previewImage === undefined ||
          paper.file === undefined ||
          paper.pdf === undefined ||
          paper.publicationUrl === undefined
        ) {
          needsSave = true;
        }
        return next;
      });
    }

    // Backfill projects with a separate live/demo URL for the View Project button.
    if (Array.isArray(parsed.projects)) {
      parsed.projects = parsed.projects.map((project: Record<string, any>) => {
        if (project.projectUrl === undefined) needsSave = true;
        return {
          ...project,
          projectUrl: project.projectUrl ?? project.viewProject ?? project.liveUrl ?? project.github ?? "",
        };
      });
    }

    // Backfill certificates fields
    if (Array.isArray(parsed.certificates)) {
      parsed.certificates = parsed.certificates.map((cert: Record<string, any>) => {
        const verification = cert.verificationUrl ?? cert.credlyUrl ?? cert.urlPath ?? "";
        const next = {
          ...cert,
          previewImage: cert.previewImage ?? "",
          viewImage: cert.viewImage ?? cert.previewImage ?? cert.image ?? "",
          file: cert.file ?? "",
          credlyUrl: cert.credlyUrl ?? verification,
          verificationUrl: verification,
          urlPath: cert.urlPath ?? verification,
        };
        if (
          cert.previewImage === undefined ||
          cert.viewImage === undefined ||
          cert.file === undefined ||
          cert.credlyUrl === undefined ||
          cert.verificationUrl === undefined ||
          cert.urlPath === undefined
        ) {
          needsSave = true;
        }
        return next;
      });
    }

    // Backfill home profile media fields for admin-managed hero and logo uploads.
    if (Array.isArray(parsed.homeProfile)) {
      parsed.homeProfile = parsed.homeProfile.map((profile: Record<string, any>) => {
        const next = {
          ...profile,
          image: profile.image ?? "",
          logoImage: profile.logoImage ?? profile.collegeImage ?? "",
          collegeImage: profile.collegeImage ?? "",
          imageNudge: profile.imageNudge ?? "",
          logoImageNudge: profile.logoImageNudge ?? "",
          collegeImageNudge: profile.collegeImageNudge ?? "",
        };
        if (
          profile.image === undefined ||
          profile.logoImage === undefined ||
          profile.collegeImage === undefined ||
          profile.imageNudge === undefined ||
          profile.logoImageNudge === undefined ||
          profile.collegeImageNudge === undefined
        ) {
          needsSave = true;
        }
        return next;
      });
    }

    if (needsSave) saveDB(parsed);
    return parsed;
  }
  const seed = getDefaultData();
  saveDB(seed);
  return seed;
}

function isQuotaError(error: unknown) {
  return error instanceof DOMException && (error.name === "QuotaExceededError" || error.code === 22);
}

function writeStorage(value: string, clearExisting = false) {
  try {
    if (clearExisting) localStorage.removeItem(DB_KEY);
    localStorage.setItem(DB_KEY, value);
    window.dispatchEvent(new StorageEvent("storage", { key: DB_KEY, newValue: value }));
    return true;
  } catch (error) {
    if (!isQuotaError(error)) console.warn("Unable to save portfolio database", error);
    return false;
  }
}

function stripLargeStorageFields(db: StoredDatabase, limit = LARGE_FIELD_LIMIT): StoredDatabase {
  const slim = JSON.parse(JSON.stringify(db));
  for (const table of Object.keys(slim)) {
    if (Array.isArray(slim[table])) {
      slim[table] = slim[table].map((rec: any) => {
        const cleaned = { ...rec };
        for (const [k, v] of Object.entries(cleaned)) {
          if (typeof v === "string" && v.length > limit) {
            cleaned[k] = "";
          }
        }
        return cleaned;
      });
    }
  }
  return slim;
}

function saveDB(db: StoredDatabase) {
  const attempts = [
    db,
    stripLargeStorageFields(db, LARGE_FIELD_LIMIT),
    stripLargeStorageFields(db, FALLBACK_FIELD_LIMIT),
    stripLargeStorageFields(db, MIN_FIELD_LIMIT),
  ];

  for (const attempt of attempts) {
    if (writeStorage(JSON.stringify(attempt))) return;
  }

  if (writeStorage(JSON.stringify(attempts[attempts.length - 1]), true)) return;
  console.warn("Portfolio database could not fit in localStorage; large uploaded file data was skipped.");
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

export function getDownloadStats(): DownloadStat[] {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredDatabase;
    return Array.isArray(parsed.downloadStats) ? parsed.downloadStats : [];
  } catch {
    return [];
  }
}

export function addDownloadStat(paperId: string, paperTitle: string) {
  const db = getDB() as StoredDatabase;
  const currentStats = Array.isArray(db.downloadStats) ? db.downloadStats : [];
  db.downloadStats = [
    ...currentStats,
    { id: generateId(), paperId, paperTitle, timestamp: new Date().toISOString() },
  ].slice(-200);
  saveDB(db);
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
