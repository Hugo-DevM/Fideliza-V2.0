/**
 * Resend email client.
 *
 * Centralizes all outbound email in one place.
 * Each send function validates its required env vars at call time
 * so misconfiguration is caught early with a clear error.
 *
 * Required environment variables:
 *   RESEND_API_KEY  — from resend.com dashboard
 *   EMAIL_FROM      — verified sender address (e.g. "Fideliza+ <noreply@fideliza.app>")
 *   NEXT_PUBLIC_APP_URL — used to build reset links
 */

import { Resend } from 'resend';
import { passwordResetTemplate }    from './templates/password-reset';
import { emailConfirmationTemplate } from './templates/email-confirmation';

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
 *
 * @param to         Recipient email address
 * @param confirmUrl The action_link returned by admin.generateLink()
 * @param fullName   Optional full name for personalizing the greeting
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
    subject: 'Confirma tu correo electrónico — Fideliza+',
    html:    emailConfirmationTemplate(confirmUrl, fullName),
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}

/**
 * Sends a password-reset email with a one-time link.
 *
 * @param to       Recipient email address
 * @param token    The 64-char hex reset token
 */
export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;

  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from:    getFromAddress(),
    to,
    subject: 'Recupera tu contraseña — Fideliza+',
    html:    passwordResetTemplate(resetUrl),
  });

  if (error) throw new Error(`Resend: ${error.message}`);
}
