export interface WeeklyDigestStats {
  newCustomers: number;
  transactions: number;
  redemptions: number;
  activeCustomers: number;
  weekLabel: string; // e.g. "2 – 8 jun. 2025"
}

export function weeklyDigestTemplate(tenantName: string, stats: WeeklyDigestStats): string {
  function statBlock(emoji: string, value: number, label: string) {
    return `
      <td align="center" style="padding:16px 12px;">
        <div style="font-size:24px;margin-bottom:6px;">${emoji}</div>
        <div style="font-size:28px;font-weight:700;color:#0f172a;line-height:1;">${value}</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px;">${label}</div>
      </td>`;
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tu resumen semanal — ${tenantName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:22px;font-weight:700;color:#4F46E5;letter-spacing:-0.5px;">Fideliza+</span>
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:40px 36px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">

              <h1 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#0f172a;text-align:center;line-height:1.3;">
                Tu resumen de la semana
              </h1>
              <p style="margin:0 0 28px;font-size:13px;color:#94a3b8;text-align:center;">
                ${stats.weekLabel} · ${tenantName}
              </p>

              <!-- Stats grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
                <tr>
                  ${statBlock('🧑', stats.newCustomers, 'nuevos clientes')}
                  ${statBlock('⚡', stats.transactions, 'transacciones')}
                  ${statBlock('🎁', stats.redemptions, 'canjes')}
                  ${statBlock('✨', stats.activeCustomers, 'clientes activos')}
                </tr>
              </table>

              ${stats.newCustomers === 0 && stats.transactions === 0 ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#eff6ff;border-radius:8px;padding:12px 16px;text-align:center;">
                    <p style="margin:0;font-size:13px;color:#1d4ed8;line-height:1.6;">
                      Semana tranquila. Comparte el enlace de tu portal con más clientes para activar tu programa. 🚀
                    </p>
                  </td>
                </tr>
              </table>` : `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;padding:12px 16px;text-align:center;">
                    <p style="margin:0;font-size:13px;color:#166534;line-height:1.6;">
                      ¡Buen trabajo esta semana! Tu programa de lealtad está funcionando. 💪
                    </p>
                  </td>
                </tr>
              </table>`}

              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px;" />
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
                Puedes desactivar este resumen en Configuración → Notificaciones.
              </p>
            </td>
          </tr>

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
