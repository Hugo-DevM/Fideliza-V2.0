/**
 * Correo de ayuda que el administrador envía a un negocio desde /admin.
 *
 * Reusa la envoltura visual de welcome-tenant (logo, tarjeta blanca, botón
 * morado) para que llegue con la misma identidad que el resto del producto y
 * no como un correo suelto escrito a mano.
 *
 * El cuerpo lo escribe una persona en un textarea, así que se escapa antes de
 * inyectarlo: un `<` tecleado en el mensaje es texto, no marcado.
 */

import { brandHeaderRow } from './brand';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Texto plano → párrafos HTML. Una línea en blanco abre un párrafo nuevo;
 * un salto simple se convierte en <br>, que es como quien escribe espera que
 * se vea lo que tecleó.
 */
function toParagraphs(text: string): string {
  return escapeHtml(text.trim())
    .split(/\n{2,}/)
    .map((block) => block.replace(/\n/g, '<br />'))
    .map(
      (block) =>
        `<p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.7;">${block}</p>`,
    )
    .join('');
}

export function adminHelpTemplate(businessName: string, message: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fideliza.app';
  const year   = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Fideliza — ${escapeHtml(businessName)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          ${brandHeaderRow()}

          <tr>
            <td style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:40px 36px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">

              <p style="margin:0 0 20px;font-size:15px;font-weight:700;color:#0f172a;line-height:1.4;">
                Hola, ${escapeHtml(businessName)} 👋
              </p>

              ${toParagraphs(message)}

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/dashboard" style="display:inline-block;background:#4F46E5;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;padding:14px 32px;">
                      Ir al panel →
                    </a>
                  </td>
                </tr>
              </table>

              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px;" />
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
                Responde este correo y te ayudamos.
              </p>

            </td>
          </tr>

          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                © ${year} Fideliza. Todos los derechos reservados.
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
