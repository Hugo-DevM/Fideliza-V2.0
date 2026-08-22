/**
 * Encabezado de marca compartido por todas las plantillas de correo.
 *
 * Antes cada plantilla repetía el mismo <span>Fideliza</span> en texto. Ahora
 * las once comparten esta fila para que el logo se cambie en un solo lugar.
 *
 * Por qué PNG y no el SVG de /public: Gmail, Outlook y Apple Mail no renderizan
 * SVG en correo. `public/email-logo.png` se genera desde logofidelizalight.svg
 * con fondo blanco horneado — un PNG transparente con texto casi negro
 * desaparece cuando Gmail pinta el correo en modo oscuro.
 *
 * La URL es absoluta y fija a producción a propósito: NEXT_PUBLIC_APP_URL vale
 * http://localhost:3000 en desarrollo y un cliente de correo jamás podría
 * resolver esa dirección, así que los correos de prueba saldrían sin logo.
 */

const LOGO_URL = 'https://fideliza.app/email-logo.png';

/**
 * Fila <tr> con el logo centrado, lista para insertarse en la tabla exterior
 * de cualquier plantilla.
 *
 * El `alt` no es decorativo: cuando el cliente bloquea imágenes —el
 * comportamiento por defecto en varios— es lo único que se ve, y por eso lleva
 * el mismo estilo tipográfico que tenía el encabezado de texto original.
 */
export function brandHeaderRow(): string {
  return `<tr>
            <td align="center" style="padding-bottom:24px;">
              <img src="${LOGO_URL}" width="180" height="36" alt="Fideliza"
                   style="display:block;width:180px;height:36px;border:0;outline:none;text-decoration:none;font-size:22px;font-weight:700;color:#4F46E5;letter-spacing:-0.5px;" />
            </td>
          </tr>`;
}
