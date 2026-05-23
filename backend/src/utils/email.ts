import nodemailer, { Transporter } from "nodemailer";
import { config, giftEmailReady } from "../config";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!giftEmailReady) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass
    }
  });
  return transporter;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface GiftRequestEmailParams {
  to: string;
  toName?: string;
  cardName: string;
  requesterName: string;
  requesterEmail: string;
  message: string;
  popularityOffered: number;
}

function renderHtml(p: GiftRequestEmailParams): string {
  const manageUrl = `${config.appPublicUrl.replace(/\/$/, "")}/profile?tab=gifts`;
  return `<!doctype html>
<html><body style="font-family: Arial, sans-serif; background:#0a0f1e; color:#fff; padding:24px; margin:0;">
  <div style="max-width:560px; margin:0 auto; background:#0e1530; border:1px solid #1b2548; border-radius:12px; padding:28px;">
    <h1 style="margin:0 0 12px; font-size:20px; color:#3b82f6;">New Gift Request</h1>
    <p style="margin:0 0 16px; color:#c9d1e3;">Hi ${escapeHtml(p.toName || "trader")},</p>
    <p style="margin:0 0 16px; color:#c9d1e3;">A community member has requested your card as a gift on Blue Lock Exchange.</p>
    <table style="width:100%; border-collapse:collapse; margin:0 0 20px;">
      <tr><td style="padding:6px 0; color:#8b95b3; width:120px;">Card</td><td style="padding:6px 0; color:#fff; font-weight:600;">${escapeHtml(p.cardName)}</td></tr>
      <tr><td style="padding:6px 0; color:#8b95b3;">From</td><td style="padding:6px 0; color:#fff;">${escapeHtml(p.requesterName)} &lt;${escapeHtml(p.requesterEmail)}&gt;</td></tr>
      <tr><td style="padding:6px 0; color:#8b95b3;">In-game popularity offered</td><td style="padding:6px 0; color:#fff;">${p.popularityOffered} (BGMI in-game)</td></tr>
    </table>
    <div style="background:#070b1d; border-left:3px solid #06b6d4; padding:12px 14px; border-radius:6px; margin:0 0 20px;">
      <p style="margin:0 0 4px; color:#8b95b3; font-size:12px; text-transform:uppercase;">Message</p>
      <p style="margin:0; color:#fff; white-space:pre-wrap;">${escapeHtml(p.message)}</p>
    </div>
    <p style="margin:0 0 12px; color:#c9d1e3; font-size:13px;">This is a fan-community request only. No money is involved, and Blue Lock Exchange does not handle or track BGMI in-game popularity — the requester would transfer it directly to you in-game if you both agree. You are free to accept, decline, or ignore. Contact the requester using the email above if you'd like to proceed.</p>
    <p style="margin:0 0 20px;"><a href="${manageUrl}" style="display:inline-block; padding:10px 16px; background:#0066ff; color:#fff; border-radius:6px; text-decoration:none; font-weight:600;">Manage your gift requests</a></p>
    <hr style="border:none; border-top:1px solid #1b2548; margin:24px 0 12px;" />
    <p style="margin:0; color:#5a6585; font-size:11px;">Blue Lock Exchange is a fan-made community tool. Not affiliated with Krafton, BGMI, or any Blue Lock rights holder.</p>
  </div>
</body></html>`;
}

function renderText(p: GiftRequestEmailParams): string {
  const manageUrl = `${config.appPublicUrl.replace(/\/$/, "")}/profile?tab=gifts`;
  return [
    `Hi ${p.toName || "trader"},`,
    "",
    "A community member has requested your card as a gift on Blue Lock Exchange.",
    "",
    `Card:               ${p.cardName}`,
    `From:               ${p.requesterName} <${p.requesterEmail}>`,
    `In-game popularity: ${p.popularityOffered} (BGMI in-game, transferred directly between players)`,
    `Message:            ${p.message}`,
    "",
    "This is a fan-community request only. No money is involved, and",
    "Blue Lock Exchange does not handle or track BGMI in-game popularity —",
    "the requester would transfer it directly to you in-game if you agree.",
    "You're free to accept, decline, or ignore. Contact the requester",
    "directly using the email above if you'd like to proceed.",
    "",
    `Manage your gift requests: ${manageUrl}`,
    "",
    "— Blue Lock Exchange (fan community tool)",
    "Not affiliated with Krafton, BGMI, or any Blue Lock rights holder."
  ].join("\n");
}

export async function sendGiftRequestEmail(params: GiftRequestEmailParams): Promise<{ ok: boolean; error?: string }> {
  const t = getTransporter();
  if (!t) return { ok: false, error: "email_disabled" };
  try {
    await t.sendMail({
      from: config.emailFromAddress,
      to: params.to,
      subject: `New Gift Request for "${params.cardName}"`,
      text: renderText(params),
      html: renderHtml(params)
    });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "send_failed" };
  }
}
