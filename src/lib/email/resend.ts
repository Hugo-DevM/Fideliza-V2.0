/**
 * Resend email client.
 *
 * Centralizes all outbound email in one place.
 * Each send function validates its required env vars at call time
 * so misconfiguration is caught early with a clear error.
 *
 * Required environment variables:
 *   RESEND_API_KEY  — from resend.com dashboard
 *   EMAIL_FROM      — verified sender address (e.g. "Fideliza <noreply@fideliza.app>")
 *   NEXT_PUBLIC_APP_URL — used to build reset links
 */

import { Resend } from 'resend';
import { passwordResetTemplate }    from './templates/password-reset';
import { emailConfirmationTemplate } from './templates/email-confirmation';
import { milestoneTemplate } from './templates/new-customer';
import { redemptionAlertTemplate }   from './templates/redemption-alert';
import { weeklyDigestTemplate, type WeeklyDigestStats } from './templates/weekly-digest';
import { welcomeTenantTemplate }     from './templates/welcome-tenant';
import { queueStuckAlertTemplate }   from './templates/queue-stuck-alert';
import { adminHelpTemplate }         from './templates/admin-help';
import { newTenantAlertTemplate }    from './templates/new-tenant-alert';

function getResendClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  return new Resend(key);
}

function getFromAddress(): string {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error('EMAIL_FROM is not set');
  return from;
}

/**
 * Sends an email-confirmation link to a newly registered user.
 */
export async function sendConfirmationEmail(
  to: string,
  confirmUrl: string,
  fullName?: string,
): Promise<void> {
  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from:    getFromAddress(),
    to,
    subject: 'Confirma tu correo electrónico — Fideliza',
    html:    emailConfirmationTemplate(confirmUrl, fullName),
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}

/**
 * Sends a password-reset email with a one-time link.
 */
export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;

  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from:    getFromAddress(),
    to,
    subject: 'Recupera tu contraseña — Fideliza',
    html:    passwordResetTemplate(resetUrl),
  });

  if (error) throw new Error(`Resend: ${error.message}`);
}

/**
 * Notifies the tenant owner when a customer milestone is reached (1, 50, 300).
 * Non-blocking — call with void, failures are silent.
 */
export async function sendMilestoneNotification(
  to: string,
  tenantName: string,
  total: number,
): Promise<void> {
  const milestoneMessages: Record<number, { emoji: string; headline: string; body: string }> = {
    1:   { emoji: '🎉', headline: '¡Tu primer cliente!',         body: 'Acabas de registrar a tu primer cliente en Fideliza. Tu programa de lealtad ya está en marcha.' },
    50:  { emoji: '🚀', headline: '¡50 clientes registrados!',   body: 'Has llegado a 50 clientes en tu programa de lealtad. ¡Tu base de clientes sigue creciendo!' },
    300: { emoji: '🏆', headline: '¡300 clientes registrados!',  body: '¡Increíble! Has alcanzado los 300 clientes en Fideliza. Ya tienes una base sólida para trabajar la retención.' },
    1000:{ emoji: '👑', headline: '¡1,000 clientes registrados!', body: '¡Mil clientes en tu programa de lealtad! Estás construyendo algo grande con Fideliza.' },
  };

  const msg = milestoneMessages[total];
  if (!msg) return;

  try {
    const resend = getResendClient();
    await resend.emails.send({
      from:    getFromAddress(),
      to,
      subject: `${msg.emoji} ${msg.headline} — ${tenantName}`,
      html:    milestoneTemplate(tenantName, total, msg.emoji, msg.headline, msg.body),
    });
  } catch { /* best-effort — never blocks core operations */ }
}

/**
 * Notifies the tenant owner when a program milestone is reached (1st or 3rd program).
 */
export async function sendProgramMilestoneNotification(
  to: string,
  tenantName: string,
  total: number,
  programName: string,
): Promise<void> {
  const messages: Record<number, { emoji: string; headline: string; body: string }> = {
    1: { emoji: '🎯', headline: '¡Creaste tu primer programa!', body: `Tu programa <strong>${programName}</strong> ya está activo en <strong>${tenantName}</strong>. Comparte el código de acceso con tus clientes y empieza a fidelizarlos.` },
    3: { emoji: '🚀', headline: '¡Tienes 3 programas activos!', body: `Has llegado al límite del Plan Starter con tu programa <strong>${programName}</strong>. Actualiza a Pro para crear programas ilimitados.` },
  };

  const msg = messages[total];
  if (!msg) return;

  try {
    const resend = getResendClient();
    await resend.emails.send({
      from:    getFromAddress(),
      to,
      subject: `${msg.emoji} ${msg.headline} — ${tenantName}`,
      html:    milestoneTemplate(tenantName, total, msg.emoji, msg.headline, msg.body),
    });
  } catch { /* best-effort */ }
}

/**
 * Notifies the tenant owner when a customer redeems a reward.
 * Non-blocking — call with void.
 */
export async function sendRedemptionNotification(
  to: string,
  tenantName: string,
  customerName: string,
  rewardName: string,
  redemptionCode: string,
): Promise<void> {
  try {
    const resend = getResendClient();
    await resend.emails.send({
      from:    getFromAddress(),
      to,
      subject: `Recompensa canjeada — ${tenantName}`,
      html:    redemptionAlertTemplate(tenantName, customerName, rewardName, redemptionCode),
    });
  } catch { /* best-effort */ }
}

/**
 * Sends the weekly activity digest to a tenant owner.
 */
export async function sendWeeklyDigest(
  to: string,
  tenantName: string,
  stats: WeeklyDigestStats,
): Promise<void> {
  try {
    const resend = getResendClient();
    await resend.emails.send({
      from:    getFromAddress(),
      to,
      subject: `Tu resumen semanal — ${tenantName}`,
      html:    weeklyDigestTemplate(tenantName, stats),
    });
  } catch { /* best-effort */ }
}

/**
 * Sends a welcome email to a newly created tenant.
 * Non-blocking — never throws; tenant creation must not depend on this.
 */
export async function sendWelcomeTenantEmail(
  to: string,
  businessName: string,
  /** true para altas por OAuth: el correo ya viene verificado por el proveedor. */
  emailVerified = false,
): Promise<void> {
  try {
    const resend = getResendClient();
    await resend.emails.send({
      from:    getFromAddress(),
      to,
      subject: `¡Bienvenido a Fideliza, ${businessName}!`,
      html:    welcomeTenantTemplate(businessName, emailVerified),
    });
  } catch { /* best-effort — never blocks account creation */ }
}

/**
 * Correo de ayuda que el administrador escribe desde /admin hacia un negocio.
 *
 * A diferencia de casi todo lo demás en este archivo, ESTE LANZA en caso de
 * error: lo dispara una persona que está mirando la pantalla y necesita saber
 * si salió o no. Fallar en silencio la dejaría creyendo que ya contactó a un
 * negocio que nunca recibió nada.
 *
 * replyTo apunta a ADMIN_EMAIL — el remitente es un noreply, así que sin esto
 * el "Responde este correo y te ayudamos" del pie sería mentira.
 */
export async function sendAdminHelpEmail(
  to: string,
  businessName: string,
  subject: string,
  message: string,
): Promise<void> {
  const resend = getResendClient();
  const adminEmail = process.env.ADMIN_EMAIL;

  const { error } = await resend.emails.send({
    from:    getFromAddress(),
    to,
    subject,
    html:    adminHelpTemplate(businessName, message),
    ...(adminEmail ? { replyTo: adminEmail } : {}),
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}

/**
 * Avisa a ADMIN_EMAIL cuando se da de alta un negocio nuevo.
 * Best-effort — el alta jamás debe depender de que este correo salga.
 */
export async function sendNewTenantAlert(params: {
  businessName: string;
  subdomain:    string;
  email:        string;
  plan:         string;
  createdAt:    string;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  try {
    const resend = getResendClient();
    await resend.emails.send({
      from:    getFromAddress(),
      to:      adminEmail,
      subject: `🎉 Nuevo negocio en Fideliza: ${params.businessName}`,
      html:    newTenantAlertTemplate(params),
      replyTo: params.email,
    });
  } catch { /* best-effort — never blocks account creation */ }
}

/**
 * Operations alert to ADMIN_EMAIL when the WhatsApp queue stops draining.
 *
 * Unlike the other senders here, this one THROWS on failure. It is the alert of
 * last resort: if it fails silently we are blind to an outage that is itself
 * silent. The caller (checkQueueHealth) catches and logs it.
 */
export async function sendQueueStuckAlert(
  to: string,
  params: { stuck: number; failed24h: number; oldestMinutes: number | null },
): Promise<void> {
  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from:    getFromAddress(),
    to,
    subject: `⚠️ Fideliza: ${params.stuck} mensajes de WhatsApp atorados en la cola`,
    html:    queueStuckAlertTemplate(params),
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}

export type { WeeklyDigestStats };
