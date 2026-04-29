import dotenv from "dotenv";
import mongoose from "mongoose";
import { getDefaultData } from "./seedData.js";
import { AppSetting, DownloadStat, TABLES, tableModels } from "./models.js";

dotenv.config();

export async function seedIfEmpty(force = false) {
  const defaults = getDefaultData();
  for (const table of TABLES) {
    const Model = tableModels[table];
    const count = await Model.countDocuments();
    if (force || count === 0) {
      if (force) await Model.deleteMany({});
      await Model.insertMany(defaults[table], { ordered: false });
    }
  }
  await AppSetting.updateOne({ key: "customizations" }, { $setOnInsert: { key: "customizations", value: {} } }, { upsert: true });
  await AppSetting.updateOne({ key: "appearance" }, { $setOnInsert: { key: "appearance", value: {} } }, { upsert: true });
  if (force) await DownloadStat.deleteMany({});
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await mongoose.connect(process.env.MONGODB_URI);
  await seedIfEmpty(process.argv.includes("--force"));
  await mongoose.disconnect();
  console.log("MongoDB seed complete");
}
