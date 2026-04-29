import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const looseRecord = new Schema({}, { strict: false, timestamps: true, versionKey: false });
looseRecord.index({ id: 1 }, { unique: true });

const settingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true, versionKey: false }
);

const downloadStatSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    paperId: String,
    paperTitle: String,
    timestamp: String,
  },
  { timestamps: true, versionKey: false }
);

export const TABLES = ["projects", "internships", "hackathons", "papers", "certificates", "settings", "homeProfile", "homeAbout", "homeSkills", "homeLinks", "homeCollege"];

export const tableModels = Object.fromEntries(
  TABLES.map((table) => [table, models[table] || model(table, looseRecord, table)])
);

export const AppSetting = models.AppSetting || model("AppSetting", settingSchema, "app_settings");
export const DownloadStat = models.DownloadStat || model("DownloadStat", downloadStatSchema, "download_stats");
