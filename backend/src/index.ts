import mongoose from "mongoose";
import { app } from "./app";
import { config, giftEmailReady } from "./config";
import { startExpiryJob } from "./utils/expiryJob";

async function start() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("✅ MongoDB connected");
    startExpiryJob();

    // Loud one-liner so misconfigured SMTP is immediately visible on boot.
    if (!giftEmailReady) {
      console.warn("⚠️  Email is DISABLED — no SMTP creds. Set SMTP_HOST, SMTP_USER, SMTP_PASS in env to enable.");
    } else {
      console.log("✉️  Email enabled via", config.smtpHost, "as", config.smtpUser);
    }

    app.listen(config.port, () => {
      console.log(`🚀 BGMI backend listening on http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error("❌ Startup error", error);
    process.exit(1);
  }
}

start();
