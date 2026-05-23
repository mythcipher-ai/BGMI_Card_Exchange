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

function siteUrl(): string {
  return config.appPublicUrl.replace(/\/$/, "");
}

function renderHtml(p: GiftRequestEmailParams): string {
  const manageUrl = `${siteUrl()}/profile?tab=gifts`;
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
    <p style="margin:0 0 12px; color:#c9d1e3; font-size:13px;">This is a fan-community request only. No money is involved, and Blue Lock Exchange does not handle or track BGMI in-game popularity. The requester would transfer it directly to you in-game if you both agree. You are free to accept, decline, or ignore. Contact the requester using the email above if you'd like to proceed.</p>
    <p style="margin:0 0 20px;"><a href="${manageUrl}" style="display:inline-block; padding:10px 16px; background:#0066ff; color:#fff; border-radius:6px; text-decoration:none; font-weight:600;">Manage your gift requests</a></p>
    ${renderFooter()}
  </div>
</body></html>`;
}

function renderFooter(): string {
  const url = siteUrl();
  return `<hr style="border:none; border-top:1px solid #1b2548; margin:24px 0 12px;" />
    <p style="margin:0 0 6px; color:#8b95b3; font-size:12px;">Visit <a href="${url}" style="color:#3b82f6; text-decoration:none;">${url}</a></p>
    <p style="margin:0; color:#5a6585; font-size:11px;">Blue Lock Exchange is a fan-made community tool. Not affiliated with Krafton, BGMI, or any Blue Lock rights holder.</p>`;
}

function renderFooterText(): string {
  return `\nVisit ${siteUrl()}\n\nBlue Lock Exchange (fan community tool)\nNot affiliated with Krafton, BGMI, or any Blue Lock rights holder.`;
}

function renderText(p: GiftRequestEmailParams): string {
  const manageUrl = `${siteUrl()}/profile?tab=gifts`;
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
    "Blue Lock Exchange does not handle or track BGMI in-game popularity.",
    "The requester would transfer it directly to you in-game if you agree.",
    "You're free to accept, decline, or ignore. Contact the requester",
    "directly using the email above if you'd like to proceed.",
    "",
    `Manage your gift requests: ${manageUrl}`,
    renderFooterText()
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

// ==========================================================================
// Reward / Milestone emails
// ==========================================================================

function wrap(body: string): string {
  return `<!doctype html><html><body style="font-family: Arial, sans-serif; background:#0a0f1e; color:#fff; padding:24px; margin:0;">
  <div style="max-width:560px; margin:0 auto; background:#0e1530; border:1px solid #1b2548; border-radius:12px; padding:28px;">
    ${body}
    ${renderFooter()}
  </div>
</body></html>`;
}

export interface RewardClaimAdminParams {
  userName?: string;
  userEmail?: string;
  milestone: number;
  popularityAmount: number;
  bgmiUid: string;
  successfulTrades: number;
  submittedAt: Date;
}

export async function sendRewardClaimToAdmin(p: RewardClaimAdminParams): Promise<{ ok: boolean; error?: string }> {
  const t = getTransporter();
  if (!t) return { ok: false, error: "email_disabled" };
  const adminTo = config.adminEmail || config.emailFromAddress;
  const html = wrap(`
    <h1 style="margin:0 0 12px; font-size:20px; color:#3b82f6;">New Reward Claim</h1>
    <p style="margin:0 0 12px; color:#c9d1e3;">A user has reached a milestone and submitted a reward claim.</p>
    <table style="width:100%; border-collapse:collapse; margin:0 0 16px;">
      <tr><td style="padding:6px 0; color:#8b95b3; width:170px;">User</td><td style="padding:6px 0; color:#fff;">${escapeHtml(p.userName || "(no name)")} &lt;${escapeHtml(p.userEmail || "?")}&gt;</td></tr>
      <tr><td style="padding:6px 0; color:#8b95b3;">Milestone</td><td style="padding:6px 0; color:#fff;">${p.milestone} successful trade(s)</td></tr>
      <tr><td style="padding:6px 0; color:#8b95b3;">Reward</td><td style="padding:6px 0; color:#fff;">${p.popularityAmount} BGMI in-game popularity</td></tr>
      <tr><td style="padding:6px 0; color:#8b95b3;">BGMI UID</td><td style="padding:6px 0; color:#fff; font-family:monospace;">${escapeHtml(p.bgmiUid)}</td></tr>
      <tr><td style="padding:6px 0; color:#8b95b3;">Total trades</td><td style="padding:6px 0; color:#fff;">${p.successfulTrades}</td></tr>
      <tr><td style="padding:6px 0; color:#8b95b3;">Submitted</td><td style="padding:6px 0; color:#fff;">${p.submittedAt.toISOString()}</td></tr>
    </table>
    <p style="margin:0; color:#c9d1e3; font-size:13px;">Manage in the admin panel under User Management → Rewards.</p>`);
  const text = [
    `New reward claim`,
    `User:        ${p.userName || "(no name)"} <${p.userEmail || "?"}>`,
    `Milestone:   ${p.milestone} successful trade(s)`,
    `Reward:      ${p.popularityAmount} BGMI popularity`,
    `BGMI UID:    ${p.bgmiUid}`,
    `Total trades: ${p.successfulTrades}`,
    `Submitted:   ${p.submittedAt.toISOString()}`,
    renderFooterText()
  ].join("\n");
  try {
    await t.sendMail({
      from: config.emailFromAddress,
      to: adminTo,
      subject: `Reward claim — milestone ${p.milestone} (${p.popularityAmount} popularity)`,
      text, html
    });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "send_failed" };
  }
}

export interface RewardDeliveredUserParams {
  to: string;
  toName?: string;
  milestone: number;
  popularityAmount: number;
  bgmiUid: string;
}

export async function sendRewardDeliveredToUser(p: RewardDeliveredUserParams): Promise<{ ok: boolean; error?: string }> {
  const t = getTransporter();
  if (!t) return { ok: false, error: "email_disabled" };
  const html = wrap(`
    <h1 style="margin:0 0 12px; font-size:20px; color:#10b981;">Your reward has been delivered</h1>
    <p style="margin:0 0 12px; color:#c9d1e3;">Hi ${escapeHtml(p.toName || "trader")},</p>
    <p style="margin:0 0 12px; color:#c9d1e3;">Your reward for the <strong style="color:#fff;">${p.milestone}-trade milestone</strong> has been processed successfully.</p>
    <table style="width:100%; border-collapse:collapse; margin:0 0 16px;">
      <tr><td style="padding:6px 0; color:#8b95b3; width:170px;">Reward</td><td style="padding:6px 0; color:#fff;">${p.popularityAmount} BGMI in-game popularity</td></tr>
      <tr><td style="padding:6px 0; color:#8b95b3;">Sent to UID</td><td style="padding:6px 0; color:#fff; font-family:monospace;">${escapeHtml(p.bgmiUid)}</td></tr>
    </table>
    <p style="margin:0 0 12px; color:#c9d1e3; font-size:13px;">Please check your BGMI account using UID <strong style="color:#fff; font-family:monospace;">${escapeHtml(p.bgmiUid)}</strong>. If you don't see it within a few minutes, reply to this email and we'll investigate.</p>`);
  const text = [
    `Your reward has been delivered`,
    "",
    `Milestone:    ${p.milestone}-trade`,
    `Reward:       ${p.popularityAmount} BGMI in-game popularity`,
    `Sent to UID:  ${p.bgmiUid}`,
    "",
    `Check your BGMI account. Reply if you don't receive it within a few minutes.`,
    renderFooterText()
  ].join("\n");
  try {
    await t.sendMail({
      from: config.emailFromAddress,
      to: p.to,
      subject: `Reward delivered — ${p.popularityAmount} popularity (milestone ${p.milestone})`,
      text, html
    });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "send_failed" };
  }
}

export interface RewardRejectedUserParams {
  to: string;
  toName?: string;
  milestone: number;
  popularityAmount: number;
  rejectionReason?: string;
}

export async function sendRewardRejectedToUser(p: RewardRejectedUserParams): Promise<{ ok: boolean; error?: string }> {
  const t = getTransporter();
  if (!t) return { ok: false, error: "email_disabled" };
  const reasonHtml = p.rejectionReason
    ? `<p style="margin:0 0 12px; color:#c9d1e3; font-size:13px;">Reason: <em style="color:#fff;">${escapeHtml(p.rejectionReason)}</em></p>`
    : "";
  const html = wrap(`
    <h1 style="margin:0 0 12px; font-size:20px; color:#ef4444;">Your reward claim was not approved</h1>
    <p style="margin:0 0 12px; color:#c9d1e3;">Hi ${escapeHtml(p.toName || "trader")},</p>
    <p style="margin:0 0 12px; color:#c9d1e3;">Your reward claim for the ${p.milestone}-trade milestone (${p.popularityAmount} popularity) was not approved.</p>
    ${reasonHtml}
    <p style="margin:0; color:#c9d1e3; font-size:13px;">If you think this is a mistake, reply to this email and we'll take another look.</p>`);
  const text = [
    `Your reward claim was not approved`,
    "",
    `Milestone: ${p.milestone}-trade (${p.popularityAmount} popularity)`,
    p.rejectionReason ? `Reason: ${p.rejectionReason}` : "",
    "",
    `Reply to this email if you think this is a mistake.`,
    renderFooterText()
  ].filter(Boolean).join("\n");
  try {
    await t.sendMail({
      from: config.emailFromAddress,
      to: p.to,
      subject: `Reward claim — milestone ${p.milestone} not approved`,
      text, html
    });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "send_failed" };
  }
}

// ==========================================================================
// Trade outcome emails (post-claim confirmation flow)
// ==========================================================================

export interface ClaimNotifyOwnerParams {
  to: string;
  toName?: string;
  offeringCard: string;
  claimerName?: string;
}

// Tells the listing owner their code was just claimed and asks them to
// confirm receipt of the wanted card in-game once they've checked.
export async function sendClaimNotifyOwner(p: ClaimNotifyOwnerParams): Promise<{ ok: boolean; error?: string }> {
  const t = getTransporter();
  if (!t) return { ok: false, error: "email_disabled" };
  const profileUrl = `${siteUrl()}/profile`;
  const html = wrap(`
    <h1 style="margin:0 0 12px; font-size:20px; color:#3b82f6;">Your card was just traded</h1>
    <p style="margin:0 0 12px; color:#c9d1e3;">Hi ${escapeHtml(p.toName || "trader")},</p>
    <p style="margin:0 0 12px; color:#c9d1e3;">Someone just claimed the trade code for <strong style="color:#fff;">${escapeHtml(p.offeringCard)}</strong>${p.claimerName ? ` (player: ${escapeHtml(p.claimerName)})` : ""}.</p>
    <p style="margin:0 0 12px; color:#c9d1e3;">Please open BGMI and check whether the wanted card was actually transferred to you in-game.</p>
    <p style="margin:0 0 16px;"><a href="${profileUrl}" style="display:inline-block; padding:10px 16px; background:#0066ff; color:#fff; border-radius:6px; text-decoration:none; font-weight:600;">Confirm trade outcome</a></p>
    <p style="margin:0 0 6px; color:#c9d1e3; font-size:13px;">In your profile you can tap <strong style="color:#10b981;">Received</strong> if the trade went through (this counts toward your milestone rewards) or <strong style="color:#ef4444;">Not received</strong> if the claimer didn't follow through (the claimer will be flagged for review).</p>`);
  const text = [
    `Your card was just traded`,
    "",
    `Card:    ${p.offeringCard}`,
    p.claimerName ? `Player:  ${p.claimerName}` : "",
    "",
    "Open BGMI and check whether the wanted card was actually transferred to you in-game.",
    "Then visit your profile and pick:",
    "  • Received      — counts toward milestone rewards",
    "  • Not received  — flags the claimer for admin review",
    "",
    `Profile: ${profileUrl}`,
    renderFooterText()
  ].filter(Boolean).join("\n");
  try {
    await t.sendMail({
      from: config.emailFromAddress,
      to: p.to,
      subject: `Trade code claimed: "${p.offeringCard}" — please confirm receipt`,
      text, html
    });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "send_failed" };
  }
}

export interface TradeConfirmedClaimerParams {
  to: string;
  toName?: string;
  offeringCard: string;
}

// Soft "all clear" ping to the claimer once the owner confirmed the trade.
export async function sendTradeConfirmedToClaimer(p: TradeConfirmedClaimerParams): Promise<{ ok: boolean; error?: string }> {
  const t = getTransporter();
  if (!t) return { ok: false, error: "email_disabled" };
  const html = wrap(`
    <h1 style="margin:0 0 12px; font-size:20px; color:#10b981;">Trade marked as successful</h1>
    <p style="margin:0 0 12px; color:#c9d1e3;">Hi ${escapeHtml(p.toName || "trader")},</p>
    <p style="margin:0 0 12px; color:#c9d1e3;">The owner of <strong style="color:#fff;">${escapeHtml(p.offeringCard)}</strong> has confirmed they received their wanted card from you in-game. Thanks for trading fairly!</p>`);
  const text = [
    `Trade marked as successful`,
    "",
    `Card: ${p.offeringCard}`,
    "",
    "The owner confirmed they received their wanted card from you in-game.",
    "Thanks for trading fairly!",
    renderFooterText()
  ].join("\n");
  try {
    await t.sendMail({
      from: config.emailFromAddress,
      to: p.to,
      subject: `Trade confirmed: "${p.offeringCard}"`,
      text, html
    });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "send_failed" };
  }
}

export interface TradeDisputedClaimerParams {
  to: string;
  toName?: string;
  offeringCard: string;
  reason?: string;
  flagCount: number;
}

// Notifies the claimer that the owner reported the trade as not received.
// Includes their current flag count so they understand the stakes.
export async function sendTradeDisputedToClaimer(p: TradeDisputedClaimerParams): Promise<{ ok: boolean; error?: string }> {
  const t = getTransporter();
  if (!t) return { ok: false, error: "email_disabled" };
  const reasonHtml = p.reason
    ? `<p style="margin:0 0 12px; color:#c9d1e3; font-size:13px;">Reason given: <em style="color:#fff;">${escapeHtml(p.reason)}</em></p>`
    : "";
  const html = wrap(`
    <h1 style="margin:0 0 12px; font-size:20px; color:#ef4444;">A trade was marked as not received</h1>
    <p style="margin:0 0 12px; color:#c9d1e3;">Hi ${escapeHtml(p.toName || "trader")},</p>
    <p style="margin:0 0 12px; color:#c9d1e3;">The owner of <strong style="color:#fff;">${escapeHtml(p.offeringCard)}</strong> has reported that they did not receive their wanted card from you in-game.</p>
    ${reasonHtml}
    <p style="margin:0 0 12px; color:#c9d1e3; font-size:13px;">You now have <strong style="color:#fff;">${p.flagCount} flag${p.flagCount === 1 ? "" : "s"}</strong> on your account. Repeated flags can lead to suspension.</p>
    <p style="margin:0; color:#c9d1e3; font-size:13px;">If you believe this was a mistake, reply to this email and we will take another look.</p>`);
  const text = [
    `A trade was marked as not received`,
    "",
    `Card: ${p.offeringCard}`,
    p.reason ? `Reason: ${p.reason}` : "",
    "",
    `Your current flag count: ${p.flagCount}`,
    "Repeated flags can lead to suspension.",
    "Reply to this email if you believe this was a mistake.",
    renderFooterText()
  ].filter(Boolean).join("\n");
  try {
    await t.sendMail({
      from: config.emailFromAddress,
      to: p.to,
      subject: `Trade disputed: "${p.offeringCard}"`,
      text, html
    });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "send_failed" };
  }
}
