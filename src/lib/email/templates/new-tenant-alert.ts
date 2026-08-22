/**
 * Aviso interno de alta — va a ADMIN_EMAIL, nunca al negocio.
 * Denso y sin adornos a propósito: es una notificación de operación, no un
 * correo de producto.
 */

import { brandHeaderRow } from './brand';

const PLAN_LABELS: Record<string, string> = {
  free:       'Gratis',
  starter:    'Starter',
  pro:        'Pro',
  enterprise: 'Enterprise',
};

export function newTenantAlertTemplate(params: {
  businessName: string;
  subdomain:    string;
  email:        string;
  plan:         string;
  createdAt:    string;
}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fideliza.app';
  const { businessName, subdomain, email, plan, createdAt } = params;

  const fecha = new Date(createdAt).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const row = (label: string, value: string, last = false) => `
                <tr>
                  <td style="padding:12px 16px;${last ? '' : 'border-bottom:1px solid #e2e8f0;'}font-size:14px;color:#475569;">${label}</td>
                  <td style="padding:12px 16px;${last ? '' : 'border-bottom:1px solid #e2e8f0;'}font-size:14px;font-weight:600;color:#0f172a;text-align:right;">${value}</td>
                </tr>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nuevo negocio registrado</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          ${brandHeaderRow()}

          <tr>
            <td style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:36px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">

              <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;line-height:1.3;">
                🎉 Nuevo negocio registrado
              </h1>
              <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
                <strong>${businessName}</strong> acaba de crear su cuenta en Fideliza.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
                ${row('Negocio', businessName)}
                ${row('Subdominio', subdomain)}
                ${row('Correo', email)}
                ${row('Plan', PLAN_LABELS[plan] ?? plan)}
                ${row('Alta', fecha, true)}
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/admin" style="display:inline-block;background:#4F46E5;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;padding:14px 32px;">
                      Ver en el panel →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.5;">
                Aviso automático de altas · se envía una vez por cada negocio nuevo
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
