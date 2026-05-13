/**
 * Password reset email template.
 *
 * Inline styles are used intentionally — email clients strip <style> tags.
 * Colors match the Fideliza+ UI (indigo-600 = #4F46E5).
 * Link expires in 15 minutes; expiry message is prominently displayed.
 */

export function passwordResetTemplate(resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recupera tu contraseña — Fideliza+</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:22px;font-weight:700;color:#4F46E5;letter-spacing:-0.5px;">
                Fideliza+
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:40px 36px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">

              <!-- Icon -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <div style="width:56px;height:56px;background:#ede9fe;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;">
                      <img src="https://em-content.zobj.net/source/apple/354/locked-with-key_1f510.png"
                           alt="🔐" width="28" height="28"
                           style="display:block;" />
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;text-align:center;line-height:1.3;">
                Recupera tu contraseña
              </h1>
              <p style="margin:0 0 28px;font-size:14px;color:#64748b;text-align:center;line-height:1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta en Fideliza+.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}"
                       style="display:inline-block;background-color:#4F46E5;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;letter-spacing:0.1px;">
                      Restablecer contraseña
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#fef9c3;border-radius:8px;padding:12px 16px;">
                    <p style="margin:0;font-size:12px;color:#854d0e;line-height:1.5;">
                      <strong>⏱ Este enlace expira en 15 minutos.</strong>
                      Si no lo usas a tiempo, deberás solicitar uno nuevo.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Fallback URL -->
              <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;line-height:1.5;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="margin:0 0 24px;font-size:11px;word-break:break-all;color:#6366f1;">
                ${resetUrl}
              </p>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px;" />

              <!-- Security note -->
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
                Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña no será modificada.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                © ${new Date().getFullYear()} Fideliza+. Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
