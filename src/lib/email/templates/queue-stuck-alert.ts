/**
 * Internal operations alert — goes to ADMIN_EMAIL, never to a tenant.
 * Plain and dense on purpose: this is a page, not a marketing email.
 */
import { brandHeaderRow } from './brand';

export function queueStuckAlertTemplate(params: {
  stuck:         number;
  failed24h:     number;
  oldestMinutes: number | null;
}): string {
  const { stuck, failed24h, oldestMinutes } = params;

  const downFor = oldestMinutes === null
    ? 'desconocido'
    : oldestMinutes >= 60
      ? `${Math.floor(oldestMinutes / 60)} h ${oldestMinutes % 60} min`
      : `${oldestMinutes} min`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Alerta: cola de WhatsApp detenida</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          ${brandHeaderRow()}

          <tr>
            <td style="background:#ffffff;border-radius:16px;border:1px solid #fecaca;padding:36px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">

              <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#b91c1c;line-height:1.3;">
                ⚠️ La cola de WhatsApp está detenida
              </h1>

              <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
                Hay mensajes encolados que llevan más de 30 minutos sin salir. El despachador
                <code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;font-size:13px;">/api/cron/whatsapp-send</code>
                no los está procesando. <strong>Ningún cliente está recibiendo mensajes.</strong>
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#475569;">Mensajes atorados</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:700;color:#0f172a;text-align:right;">${stuck}</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#475569;">Sin enviarse desde hace</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:700;color:#0f172a;text-align:right;">${downFor}</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;font-size:14px;color:#475569;">Fallidos (últimas 24 h)</td>
                  <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#0f172a;text-align:right;">${failed24h}</td>
                </tr>
              </table>

              <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#0f172a;">Qué revisar, en orden:</p>
              <ol style="margin:0;padding-left:20px;font-size:14px;color:#475569;line-height:1.9;">
                <li>El job <strong>whatsapp-send</strong> en cron-job.org: ¿sigue activo y con ejecuciones recientes?</li>
                <li>Su historial de respuestas: un <strong>401</strong> significa que <code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;">CRON_SECRET</code> cambió y no se actualizó allá.</li>
                <li><code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;">whatsapp_quality_state.is_paused</code>: si está en <code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;">true</code>, la pausa global está frenando todo.</li>
                <li>Si hay muchos fallidos, revisa <code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;">error_message</code>: <code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;">meta_error:0</code> = falta un ContentSid de Twilio.</li>
              </ol>

            </td>
          </tr>

          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
                Alerta automática del monitor de cola · se revisa una vez al día
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
