import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { seedIfEmpty } from "./seed.js";
import { AppSetting, DownloadStat, TABLES, tableModels } from "./models.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const allowedOrigin = process.env.CLIENT_ORIGIN || "*";
const io = new Server(server, { cors: { origin: allowedOrigin, methods: ["GET", "POST", "PUT", "DELETE"] } });

app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

const clean = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  delete obj._id;
  return obj;
};
const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const emitUpdate = (table) => io.emit("portfolio:update", { table, updatedAt: Date.now() });

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/api/data", async (_req, res, next) => {
  try {
    const entries = await Promise.all(TABLES.map(async (table) => [table, (await tableModels[table].find({}).sort({ createdAt: 1 }).lean()).map(clean)]));
    res.json(Object.fromEntries(entries));
  } catch (error) { next(error); }
});

app.get("/api/:table", async (req, res, next) => {
  try {
    const Model = tableModels[req.params.table];
    if (!Model) return res.status(404).json({ error: "Unknown table" });
    res.json((await Model.find({}).sort({ createdAt: 1 }).lean()).map(clean));
  } catch (error) { next(error); }
});

app.post("/api/:table", async (req, res, next) => {
  try {
    const Model = tableModels[req.params.table];
    if (!Model) return res.status(404).json({ error: "Unknown table" });
    const record = await Model.create({ ...req.body, id: req.body.id || generateId() });
    emitUpdate(req.params.table);
    res.status(201).json(clean(record));
  } catch (error) { next(error); }
});

app.put("/api/:table/:id", async (req, res, next) => {
  try {
    const Model = tableModels[req.params.table];
    if (!Model) return res.status(404).json({ error: "Unknown table" });
    const record = await Model.findOneAndUpdate({ id: req.params.id }, { $set: req.body }, { new: true, upsert: false });
    if (!record) return res.status(404).json({ error: "Record not found" });
    emitUpdate(req.params.table);
    res.json(clean(record));
  } catch (error) { next(error); }
});

app.delete("/api/:table/:id", async (req, res, next) => {
  try {
    const Model = tableModels[req.params.table];
    if (!Model) return res.status(404).json({ error: "Unknown table" });
    await Model.deleteOne({ id: req.params.id });
    emitUpdate(req.params.table);
    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.get("/api/customizations", async (_req, res, next) => {
  try { res.json((await AppSetting.findOne({ key: "customizations" }).lean())?.value || {}); } catch (error) { next(error); }
});
app.put("/api/customizations", async (req, res, next) => {
  try {
    const saved = await AppSetting.findOneAndUpdate({ key: "customizations" }, { key: "customizations", value: req.body || {} }, { upsert: true, new: true });
    emitUpdate("customizations");
    res.json(saved.value || {});
  } catch (error) { next(error); }
});
app.get("/api/appearance", async (_req, res, next) => {
  try { res.json((await AppSetting.findOne({ key: "appearance" }).lean())?.value || {}); } catch (error) { next(error); }
});
app.put("/api/appearance", async (req, res, next) => {
  try {
    const saved = await AppSetting.findOneAndUpdate({ key: "appearance" }, { key: "appearance", value: req.body || {} }, { upsert: true, new: true });
    emitUpdate("appearance");
    res.json(saved.value || {});
  } catch (error) { next(error); }
});
app.get("/api/download-stats", async (_req, res, next) => {
  try { res.json((await DownloadStat.find({}).sort({ createdAt: -1 }).limit(200).lean()).map(clean)); } catch (error) { next(error); }
});
app.post("/api/download-stats", async (req, res, next) => {
  try {
    const stat = await DownloadStat.create({ id: generateId(), paperId: req.body.paperId, paperTitle: req.body.paperTitle, timestamp: new Date().toISOString() });
    emitUpdate("downloadStats");
    res.status(201).json(clean(stat));
  } catch (error) { next(error); }
});
app.post("/api/admin/import", async (req, res, next) => {
  try {
    for (const table of TABLES) {
      if (!Array.isArray(req.body[table])) continue;
      await tableModels[table].deleteMany({});
      if (req.body[table].length) await tableModels[table].insertMany(req.body[table], { ordered: false });
    }
    emitUpdate();
    res.redirect(307, "/api/data");
  } catch (error) { next(error); }
});
app.post("/api/admin/reset", async (_req, res, next) => {
  try { await seedIfEmpty(true); emitUpdate(); res.redirect(307, "/api/data"); } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: error.message || "Server error" });
});

const port = process.env.PORT || 4000;
await mongoose.connect(process.env.MONGODB_URI);
await seedIfEmpty(false);
server.listen(port, () => console.log(`Portfolio API listening on :${port}`));
