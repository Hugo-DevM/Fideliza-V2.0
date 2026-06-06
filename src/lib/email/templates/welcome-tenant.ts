export function welcomeTenantTemplate(businessName: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.fideliza.app';
  const year   = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenido a Fideliza+ — ${businessName}</title>
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

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <div style="width:56px;height:56px;background:#ede9fe;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;line-height:56px;text-align:center;">
                      🎯
                    </div>
                  </td>
                </tr>
              </table>

              <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;text-align:center;line-height:1.3;">
                ¡Bienvenido a Fideliza+, ${businessName}!
              </h1>
              <p style="margin:0 0 28px;font-size:14px;color:#64748b;text-align:center;line-height:1.6;">
                Tu cuenta está lista. En minutos puedes tener tu primer programa de fidelización activo — sin apps, sin complicaciones.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/dashboard" style="display:inline-block;background:#4F46E5;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;padding:14px 32px;">
                      Ir al panel →
                    </a>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#4F46E5;text-transform:uppercase;letter-spacing:0.8px;">
                      Primeros pasos
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;">
                          <span style="font-size:13px;color:#0f172a;line-height:1.5;">
                            <span style="color:#4F46E5;font-weight:700;">1.</span> Confirma tu correo electrónico con el enlace que te enviamos
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;">
                          <span style="font-size:13px;color:#0f172a;line-height:1.5;">
                            <span style="color:#4F46E5;font-weight:700;">2.</span> Crea tu primer programa — puntos, sellos o visitas
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;">
                          <span style="font-size:13px;color:#0f172a;line-height:1.5;">
                            <span style="color:#4F46E5;font-weight:700;">3.</span> Agrega tu primer cliente y compártele su código de acceso
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px;" />
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
                ¿Tienes alguna duda? Responde este correo y te ayudamos.
              </p>

            </td>
          </tr>

          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                © ${year} Fideliza+. Todos los derechos reservados.
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
