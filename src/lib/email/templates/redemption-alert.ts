export function redemptionAlertTemplate(
  tenantName: string,
  customerName: string,
  rewardName: string,
  redemptionCode: string,
): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recompensa canjeada — ${tenantName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:22px;font-weight:700;color:#4F46E5;letter-spacing:-0.5px;">Fideliza</span>
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:40px 36px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <div style="width:56px;height:56px;background:#ede9fe;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;line-height:56px;text-align:center;">
                      🎁
                    </div>
                  </td>
                </tr>
              </table>

              <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;text-align:center;line-height:1.3;">
                ¡Recompensa canjeada!
              </h1>
              <p style="margin:0 0 24px;font-size:14px;color:#64748b;text-align:center;line-height:1.6;">
                <strong style="color:#0f172a;">${customerName}</strong> canjeó una recompensa en <strong style="color:#0f172a;">${tenantName}</strong>.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#faf5ff;border-radius:10px;border:1px solid #e9d5ff;padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#7c3aed;text-transform:uppercase;letter-spacing:0.05em;">Recompensa</p>
                    <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#0f172a;">${rewardName}</p>
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#7c3aed;text-transform:uppercase;letter-spacing:0.05em;">Código de canje</p>
                    <p style="margin:0;font-size:20px;font-weight:700;color:#4F46E5;letter-spacing:0.15em;font-family:monospace;">${redemptionCode}</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#fef9c3;border-radius:8px;padding:12px 16px;">
                    <p style="margin:0;font-size:12px;color:#854d0e;line-height:1.5;">
                      <strong>⚡ Acción requerida:</strong> Cuando el cliente presente este código en tu negocio, márcalo como usado desde el panel Registro rápido → Verificar voucher.
                    </p>
                  </td>
                </tr>
              </table>

              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px;" />
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
                Puedes desactivar estas notificaciones en Configuración → Notificaciones.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                © ${new Date().getFullYear()} Fideliza. Todos los derechos reservados.
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
