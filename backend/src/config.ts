import dotenv from "dotenv";

dotenv.config();

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable ${key}`);
  }
  return value;
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
  awsBucket: getRequiredEnv("AWS_BUCKET_NAME")
};
