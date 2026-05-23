import dotenv from "dotenv";

dotenv.config();

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

export const config = {
  port: Number(process.env.PORT || 4000),
  mongoUri: getRequiredEnv("MONGODB_URI"),
  auth0Audience: getRequiredEnv("AUTH0_AUDIENCE"),
  auth0Issuer: getRequiredEnv("AUTH0_ISSUER"),
  encryptionKey: getRequiredEnv("ENCRYPTION_KEY"),
  claimCooldownSeconds: Number(process.env.CLAIM_COOLDOWN_SECONDS || 30),
  dailyClaimLimit: Number(process.env.DAILY_CLAIM_LIMIT || 5),
  reportThreshold: Number(process.env.REPORT_THRESHOLD || 3),
  awsAccessKeyId: getRequiredEnv("AWS_ACCESS_KEY_ID"),
  awsSecretAccessKey: getRequiredEnv("AWS_SECRET_ACCESS_KEY"),
  awsRegion: getRequiredEnv("AWS_REGION"),
  awsBucket: getRequiredEnv("AWS_BUCKET_NAME"),

  // ---- Blue Lock additions ----
  appPublicUrl: getOptionalEnv("APP_PUBLIC_URL", "https://bgmi-card.netlify.app"),

  // Nodemailer SMTP — gift request emails.
  // Optional: feature can be disabled via ENABLE_GIFTS=false or missing SMTP vars.
  enableGifts: process.env.ENABLE_GIFTS !== "false",
  smtpHost: getOptionalEnv("SMTP_HOST"),
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: getOptionalEnv("SMTP_USER"),
  smtpPass: getOptionalEnv("SMTP_PASS"),
  emailFromAddress: getOptionalEnv("EMAIL_FROM_ADDRESS", "Blue Lock Exchange <no-reply@gmail.com>"),

  // Address that gets notified when a user submits a reward claim.
  // Falls back to the from-address so the maintainer at least sees it.
  adminEmail: getOptionalEnv("ADMIN_EMAIL")
};

export const giftEmailReady = Boolean(
  config.enableGifts && config.smtpHost && config.smtpUser && config.smtpPass
);
