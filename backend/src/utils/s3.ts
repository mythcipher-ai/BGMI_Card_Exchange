import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { config } from "../config";
import crypto from "crypto";
import path from "path";

const s3 = new S3Client({
  region: config.awsRegion,
  credentials: {
    accessKeyId: config.awsAccessKeyId,
    secretAccessKey: config.awsSecretAccessKey,
  },
});

export function getS3ImageUrl(key: string): string {
  return `https://${config.awsBucket}.s3.${config.awsRegion}.amazonaws.com/${key}`;
}

export async function uploadToS3(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<{ key: string; url: string }> {
  const ext = path.extname(originalName) || ".png";
  const key = `bgmi/cards/${crypto.randomUUID()}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: config.awsBucket,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    })
  );

  return { key, url: getS3ImageUrl(key) };
}
