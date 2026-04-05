import mongoose from "mongoose";
import { app } from "./app";
import { config } from "./config";
import { startExpiryJob } from "./utils/expiryJob";

async function start() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("✅ MongoDB connected");
    startExpiryJob();
    app.listen(config.port, () => {
      console.log(`🚀 BGMI backend listening on http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error("❌ Startup error", error);
    process.exit(1);
  }
}

start();
